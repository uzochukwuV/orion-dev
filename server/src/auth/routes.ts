/**
 * Auth Router — Email/password authentication endpoints
 * 
 * POST /auth/register - Create new account
 * POST /auth/login - Login and get JWT
 * POST /auth/logout - Clear session
 * GET /auth/me - Get current user
 */

import { Router, Request, Response } from 'express';
import { UserModel } from '../db/models/User.js';
import { BusinessModel } from '../db/models/Business.js';
import { createToken, verifyToken, extractToken, getTokenExpiry } from './jwt.js';

const router = Router();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * POST /auth/register
 * Create a new user account with email and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Password strength (min 8 chars)
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Create user
    const user = await UserModel.create({
      email: email.toLowerCase(),
      password_hash: password,  // Will be hashed by pre-save hook
      name: name || '',
      plan: 'starter',
      email_verified: true,  // Skip email verification for MVP
      settings: {
        notifications_enabled: true,
        email_digest: 'weekly',
      },
    });

    // Create a default business for this user
    const business = await BusinessModel.create({
      user_id: user._id,
      name: name ? `${name}'s Business` : 'My Business',
      type: 'restaurant',  // Default type
      owner_email: email.toLowerCase(),
      city: '',
      plan_status: 'trialing',
    });

    // Link business to user
    user.business_id = business._id;
    await user.save();

    // Create JWT token (include businessId for dashboard stats)
    const token = createToken(user._id.toString(), user.email, business._id.toString());

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpiry() * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        business_id: business._id,
      },
      token,  // Also return token for API usage
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Get user's business
    const business = user.business_id 
      ? await BusinessModel.findById(user.business_id)
      : null;

    // Create JWT token (include businessId for dashboard stats)
    const token = createToken(user._id.toString(), user.email, business?._id.toString());

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpiry() * 1000,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        business_id: user.business_id,
      },
      business: business ? {
        id: business._id,
        name: business.name,
        type: business.type,
        city: business.city,
      } : null,
      token,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /auth/logout
 * Clear the auth cookie
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Check for token in cookie or Authorization header
    let token = req.cookies?.auth_token;
    
    if (!token) {
      token = extractToken(req.headers.authorization);
    }

    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Get user
    const user = await UserModel.findById(payload.userId).select('-password_hash');
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Get business
    const business = user.business_id 
      ? await BusinessModel.findById(user.business_id)
      : null;

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        business_id: user.business_id,
      },
      business: business ? {
        id: business._id,
        name: business.name,
        type: business.type,
        city: business.city,
        onboarding_complete: business.onboarding_complete,
      } : null,
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;