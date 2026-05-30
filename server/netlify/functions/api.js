const serverless = require('aws-serverless-express');
const express = require('express');
const app = express();

app.use(express.json());

// Auth routes
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Auth routes need real implementation' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Auth routes need real implementation' });
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json({ message: 'Dashboard routes need real implementation' });
});

// Entity routes
const entities = ['Business', 'Lead', 'Campaign', 'Opportunity', 'SocialPost', 'AgentRun', 'ChatSession', 'AgentTask', 'ScheduledTask'];
entities.forEach(name => {
  app.get(`/api/entities/${name}`, (req, res) => {
    res.json({ message: `${name} routes need real implementation` });
  });
  app.post(`/api/entities/${name}`, (req, res) => {
    res.json({ message: `${name} POST routes need real implementation` });
  });
});

// Agent routes
app.post('/api/agents/super', (req, res) => {
  res.json({ message: 'Agent routes need real implementation' });
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = serverless.createServer(app);
exports.handler = (event, context) => {
  server(event, context);
};
