// Vercel entry point - handles both API routes and WebSocket upgrades
import 'dotenv/config';
import { createServer } from 'http';

// For Vercel serverless, we need to handle the request differently
export default async function handler(req, res) {
  const httpServer = createServer();

  // Import and setup Express app
  const { default: app } = await import('./dist/index.js');

  // Let Express handle the request
  return app(req, res);
}
