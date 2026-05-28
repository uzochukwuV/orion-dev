import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
import { handleClerkWebhook } from './routes/webhooks.js';
import { setupVoiceWebSocket } from './voice/index.js';
import { closeBrightDataClient } from './tools/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));

// IMPORTANT: Webhook must be BEFORE express.json()
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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
