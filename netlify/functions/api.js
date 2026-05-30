const serverless = require('aws-serverless-express');
const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const server = serverless.createServer(app);
exports.handler = (event, context) => {
  server(event, context);
};
