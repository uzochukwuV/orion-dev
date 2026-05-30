import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connection.js';
import {
  BusinessModel,
  LeadModel,
  CampaignModel,
  OpportunityModel,
  SocialPostModel,
  AgentRunModel,
  ChatSessionModel,
  AgentTaskModel,
  ScheduledTaskModel,
} from './db/index.js';
import { createEntityRouter } from './routes/entities.js';
import { createAgentRoutes } from './routes/agents.js';
import { createIntelligenceRoutes } from './routes/intelligence.js';
import dashboardRoutes from './routes/dashboard.js';
import { handleClerkWebhook } from './routes/webhooks.js';
import authRoutes from './auth/routes.js';
import whatsappRoutes from './whatsapp/routes.js';
import { setupVoiceWebSocket } from './voice/index.js';
import { closeBrightDataClient } from './tools/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(cookieParser());  // Parse cookies for JWT auth

// IMPORTANT: Webhooks must use raw body for signature verification
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);
app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
  // WhatsApp webhook verification (GET)
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;
  
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'orion-whatsapp-verify-token';
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
app.post('/api/whatsapp/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  // WhatsApp incoming messages (POST)
  res.status(200).send('OK');  // Acknowledge immediately
  
  try {
    const rawBody = JSON.parse(req.body.toString());
    const { parseIncomingMessage } = await import('./whatsapp/webhookHandler.js');
    const { routeMessage } = await import('./whatsapp/messageRouter.js');
    
    const message = parseIncomingMessage(rawBody);
    if (!message) return;
    
    console.log(`[WhatsApp] Message from ${message.from}`);
    
    // Find business and route message
    const business = await BusinessModel.findOne({ whatsapp_connected: true }).lean();
    if (!business) {
      console.warn('[WhatsApp] No connected business');
      return;
    }
    
    await routeMessage(message, business._id.toString());
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
  }
});

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (no protection - these are login/register)
app.use('/api/auth', authRoutes);

// WhatsApp routes
app.use('/api/whatsapp', whatsappRoutes);

// Entity CRUD routes
app.use('/api/entities/Business', createEntityRouter(BusinessModel));
app.use('/api/entities/Lead', createEntityRouter(LeadModel));
app.use('/api/entities/Campaign', createEntityRouter(CampaignModel));
app.use('/api/entities/Opportunity', createEntityRouter(OpportunityModel));
app.use('/api/entities/SocialPost', createEntityRouter(SocialPostModel));
app.use('/api/entities/AgentRun', createEntityRouter(AgentRunModel));
app.use('/api/entities/ChatSession', createEntityRouter(ChatSessionModel));
app.use('/api/entities/AgentTask', createEntityRouter(AgentTaskModel));
app.use('/api/entities/ScheduledTask', createEntityRouter(ScheduledTaskModel));

// Wave 8: Agent API routes
app.use('/api/agents', createAgentRoutes());
app.use('/api/intelligence', createIntelligenceRoutes());

// Dashboard stats route
app.use('/api/dashboard', dashboardRoutes);

// Global error handler
// Must have 4 parameters so Express recognises it as an error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);

  // Invalid ObjectId (e.g. /api/entities/Lead/not-an-id)
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(
      (err as mongoose.Error.ValidationError).errors
    ).map((e) => e.message);
    res.status(400).json({ error: messages.join(', ') });
    return;
  }

  // Generic server error
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

let server: ReturnType<typeof app.listen>;

(async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Setup voice WebSocket relay
    setupVoiceWebSocket(server);
  });
})();

export { app, server };

// Graceful shutdown — close MCP child process
process.on('SIGTERM', async () => {
  await closeBrightDataClient();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await closeBrightDataClient();
  process.exit(0);
});
