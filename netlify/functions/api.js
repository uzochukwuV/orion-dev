const serverless = require('aws-serverless-express');
const express = require('express');
const app = express();

app.use(express.json());

// Simple entity router factory
function createEntityRouter(modelName) {
  const router = express.Router();
  
  router.get('/', async (req, res) => {
    res.json({ message: `${modelName} router placeholder - needs auth` });
  });
  
  return router;
}

// Routes
app.use('/api/auth', (req, res) => {
  res.json({ message: 'Auth routes placeholder' });
});

app.use('/api/dashboard', (req, res) => {
  res.json({ message: 'Dashboard routes placeholder' });
});

app.use('/api/entities/Campaign', createEntityRouter('Campaign'));
app.use('/api/entities/Lead', createEntityRouter('Lead'));
app.use('/api/entities/Business', createEntityRouter('Business'));

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
