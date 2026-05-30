// Simple health check handler for Netlify
exports.handler = async (event) => {
  try {
    const method = event.httpMethod || 'GET';
    const path = event.path || '/';
    
    console.log(`[Netlify] ${method} ${path}`);

    // Health endpoints
    if (path === '/health' || path === '/api/health') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          platform: 'netlify'
        }),
      };
    }

    // API endpoints placeholder
    if (path.startsWith('/api/')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'API endpoint - full implementation requires database connection',
          path,
          note: 'For full functionality, deploy the server as a Node.js runtime or use environment with database access'
        }),
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('[Netlify Handler Error]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
