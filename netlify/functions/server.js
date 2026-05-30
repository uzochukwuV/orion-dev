// Netlify Function - Full Express server integration with MongoDB
const serverless = require('serverless-http');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY || 'orion-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || MONGODB_URI;

// User schema for auth
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String },
  name: { type: String, default: '' },
  plan: { type: String, default: 'starter' },
  business_id: { type: mongoose.Schema.Types.ObjectId },
  email_verified: { type: Boolean, default: false },
  last_login: { type: Date },
  settings: {
    notifications_enabled: { type: Boolean, default: true },
    email_digest: { type: String, default: 'weekly' }
  }
}, { timestamps: true });

// Business schema
const businessSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'restaurant' },
  owner_email: { type: String },
  city: { type: String, default: '' },
  plan_status: { type: String, default: 'active' },
  onboarding_complete: { type: Boolean, default: false },
  whatsapp_connected: { type: Boolean, default: false },
  instagram_access_token: { type: String },
  instagram_user_id: { type: String }
}, { timestamps: true });

let UserModel, BusinessModel;

async function initModels() {
  if (!MONGODB_URI) {
    console.warn('[Netlify] MONGODB_URI not set - auth will not work');
    return null;
  }
  
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, { 
        tls: true, 
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 5000
      });
    }
    
    if (!UserModel) {
      UserModel = mongoose.model('User', userSchema);
    }
    if (!BusinessModel) {
      BusinessModel = mongoose.model('Business', businessSchema);
    }
    
    return { UserModel, BusinessModel };
  } catch (error) {
    console.error('[Netlify] MongoDB connection error:', error.message);
    return null;
  }
}

// JWT functions
function createToken(userId, email, businessId) {
  return jwt.sign({ userId, email, businessId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'orion',
    audience: 'orion-client'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: 'orion', audience: 'orion-client' });
  } catch {
    return null;
  }
}

// Create Express app for Netlify
function createNetlifyApp(models) {
  const app = express();
  
  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });
  
  app.use(express.json());
  app.use(cookieParser());
  
  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', platform: 'netlify' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'netlify' }));
  
  // Demo login endpoint - creates session for demo user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      
      if (!models) {
        // Demo mode - no database
        if (email === 'demo@lacucina.pl' && password === 'password123') {
          const demoToken = createToken('demo-user-id', email, 'demo-business-id');
          res.cookie('auth_token', demoToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
          res.json({
            message: 'Login successful (demo mode)',
            user: { id: 'demo-user-id', email, name: 'Demo User', plan: 'starter' },
            business: { id: 'demo-business-id', name: "La Cucina", type: 'restaurant' },
            token: demoToken
          });
          return;
        }
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      
      // Real login with database
      const user = await models.UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      
      // For demo user, skip password check if in demo mode
      if (email === 'demo@lacucina.pl' && password === 'password123') {
        const token = createToken(user._id.toString(), user.email, user.business_id?.toString());
        res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
        res.json({
          message: 'Login successful',
          user: { id: user._id, email: user.email, name: user.name, plan: user.plan },
          token
        });
        return;
      }
      
      // Password verification would go here
      res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
      console.error('[Login Error]', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      if (!models) {
        res.status(503).json({ error: 'Registration not available - database not configured' });
        return;
      }
      
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      
      const existingUser = await models.UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      
      const user = await models.UserModel.create({
        email: email.toLowerCase(),
        password_hash: password,
        name: name || '',
        plan: 'starter',
        email_verified: true
      });
      
      const business = await models.BusinessModel.create({
        user_id: user._id,
        name: name ? `${name}'s Business` : 'My Business',
        type: 'restaurant'
      });
      
      user.business_id = business._id;
      await user.save();
      
      const token = createToken(user._id.toString(), user.email, business._id.toString());
      res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
      
      res.status(201).json({
        message: 'Account created',
        user: { id: user._id, email: user.email, name: user.name },
        token
      });
    } catch (error) {
      console.error('[Register Error]', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  // Get current user
  app.get('/api/auth/me', async (req, res) => {
    try {
      let token = req.cookies?.auth_token;
      if (!token) {
        token = req.headers.authorization?.replace('Bearer ', '');
      }
      
      if (!token) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      
      if (!models) {
        // Demo mode - return demo user if token matches
        if (payload.email === 'demo@lacucina.pl') {
          res.json({
            user: { id: 'demo-user-id', email: 'demo@lacucina.pl', name: 'Demo User', plan: 'starter' },
            business: { id: 'demo-business-id', name: "La Cucina", type: 'restaurant' }
          });
          return;
        }
        res.status(401).json({ error: 'User not found' });
        return;
      }
      
      const user = await models.UserModel.findById(payload.userId).select('-password_hash');
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      
      const business = user.business_id ? await models.BusinessModel.findById(user.business_id) : null;
      
      res.json({
        user: { id: user._id, email: user.email, name: user.name, plan: user.plan },
        business: business ? { id: business._id, name: business.name, type: business.type } : null
      });
    } catch (error) {
      console.error('[Get User Error]', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out' });
  });
  
  // Entity routes - dynamic based on model
  app.get('/api/entities/:model', async (req, res) => {
    try {
      const { model } = req.params;
      const validModels = ['Business', 'Lead', 'Campaign', 'Opportunity', 'SocialPost'];
      
      if (!validModels.includes(model)) {
        res.status(400).json({ error: 'Invalid model' });
        return;
      }
      
      if (!models) {
        res.status(503).json({ error: 'Database not configured' });
        return;
      }
      
      const Model = models[`${model}Model`];
      if (!Model) {
        res.status(400).json({ error: 'Model not found' });
        return;
      }
      
      const items = await Model.find().limit(100);
      res.json({ data: items });
    } catch (error) {
      console.error('[Entity Error]', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });
  
  // Dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      if (!models) {
        res.json({ 
          stats: { total_leads: 0, active_campaigns: 0, opportunities: 0 },
          message: 'Demo mode - no database'
        });
        return;
      }
      
      const [leads, campaigns, opportunities] = await Promise.all([
        models.BusinessModel.countDocuments(),
        models.BusinessModel.countDocuments({ 'campaigns.status': 'active' }),
        models.BusinessModel.countDocuments({ 'opportunities.status': 'open' })
      ]);
      
      res.json({ stats: { total_leads: leads, active_campaigns: campaigns, opportunities } });
    } catch (error) {
      console.error('[Dashboard Error]', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });
  
  return app;
}

let app = null;
let models = null;

exports.handler = async (event, context) => {
  try {
    // Initialize once
    if (!models) {
      models = await initModels();
    }
    
    if (!app) {
      app = createNetlifyApp(models);
    }
    
    const handler = serverless(app);
    return await handler(event, context);
  } catch (error) {
    console.error('[Netlify Handler Error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
