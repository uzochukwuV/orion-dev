# Netlify Deployment Guide for Orion Dev

## Overview

This guide covers deploying Orion Dev (frontend + backend) to Netlify. The configuration supports:
- React + Vite frontend served as static files
- Node.js serverless functions for API endpoints
- Environment variable management
- Database connectivity

## Architecture

```
Frontend (React + Vite)
├── Served as static site
├── Built to: /dist
└── SPA routing handled by index.html redirect

Backend (Express)
├── Compiled to TypeScript
├── Wrapped in serverless function
├── Health check and API routes
└── Location: /netlify/functions/server.js
```

## Quick Start

### 1. Connect to Netlify

```bash
# Option A: Via Netlify CLI
netlify init

# Option B: Via Netlify Dashboard
# - Connect your GitHub repository
# - Netlify will auto-detect the netlify.toml
```

### 2. Configure Environment Variables

Add these to your Netlify dashboard (Settings → Build & Deploy → Environment):

```
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_whatsapp_token
WHATSAPP_API_KEY=your_whatsapp_api_key
NODE_ENV=production
VITE_API_URL=https://your-netlify-domain.netlify.app
FRONTEND_URL=https://your-netlify-domain.netlify.app
```

### 3. Deploy

```bash
# Deploy to production
netlify deploy --prod

# Or push to GitHub and Netlify will auto-deploy
git push origin main
```

## Build Configuration

The `netlify.toml` file configures:

```toml
[build]
  command = "npm install && npm --prefix server run build && npm run build"
  functions = "netlify/functions"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "20"
```

**Build Steps:**
1. Install root dependencies
2. Build server (TypeScript → JavaScript)
3. Build frontend (Vite)
4. Upload dist/ as static files
5. Deploy functions from netlify/functions

## Routing

### Frontend Routes
All frontend routes (SPA) are handled by Vite and index.html redirect.

```
/ → /index.html
/dashboard → /index.html (React Router handles)
/settings → /index.html (React Router handles)
```

### API Routes
Backend API routes are proxied to serverless functions:

```
/health → /.netlify/functions/server
/api/* → /.netlify/functions/server
```

### Static Assets
All files in `dist/` are served as static content:

```
/assets/*.js → dist/assets/
/assets/*.css → dist/assets/
/images/* → dist/images/
```

## Serverless Functions

### Function Location
`netlify/functions/server.js` - Handles all API requests

### Current Capabilities
- Health check endpoint (`/health`)
- API endpoint routing
- Error handling
- CORS support

### Adding More Routes

To add routes, modify `netlify/functions/server.js`:

```javascript
if (path === '/api/custom-endpoint') {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'your response' }),
  };
}
```

For database-connected routes, you need to:
1. Connect MongoDB in the function
2. Import models from compiled server
3. Handle async/await properly

## Database Connection

### Option 1: Serverless with Direct MongoDB

Modify `netlify/functions/server.js` to connect:

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

exports.handler = async (event) => {
  await connectDB();
  // Handle request
};
```

### Option 2: Proxy to Separate Server

Point VITE_API_URL to your backend server:
```
VITE_API_URL=https://your-server.herokuapp.com
```

Then update `netlify/functions/server.js` to proxy:

```javascript
const forwardRequest = async (method, path, body) => {
  const res = await fetch(`${process.env.BACKEND_URL}${path}`, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
};
```

## Environment Variables

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLERK_SECRET_KEY` | Authentication | Your Clerk secret key |
| `NODE_ENV` | Environment | `production` |
| `VITE_API_URL` | Frontend API endpoint | `https://your-site.netlify.app` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | WhatsApp webhook verification | `orion-whatsapp-verify-token` |
| `WHATSAPP_API_KEY` | WhatsApp API key | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### How to Set

1. Via Dashboard:
   - Go to Site settings → Build & deploy → Environment
   - Click "Edit variables"
   - Add variables

2. Via Netlify CLI:
   ```bash
   netlify env:set MONGODB_URI "your_connection_string"
   netlify env:set CLERK_SECRET_KEY "your_secret"
   ```

3. Via netlify.toml (not for secrets):
   ```toml
   [build.environment]
   NODE_VERSION = "20"
   ```

## Troubleshooting

### Build Fails: "vite: command not found"
- Ensure `npm install` runs before `npm run build`
- Check Node version is 18+

### Functions Return 404
- Verify netlify.toml has correct functions path
- Check function file is in `netlify/functions/`
- Ensure file ends with `.js` or `.ts`

### API Requests Return 500
- Check function logs: Netlify Dashboard → Functions
- Verify environment variables are set
- Check MongoDB connection string

### CORS Errors
- Add frontend URL to CORS whitelist in functions
- Set VITE_API_URL in frontend env

### Cold Start Delays
- First request to function may take 5-10 seconds
- Subsequent requests are faster
- Consider keepalive requests to minimize cold starts

## Monitoring & Debugging

### View Logs
```bash
# Stream live logs
netlify logs:function server --tail

# View past deployments
netlify deploy:list
```

### Check Function Execution
1. Go to Netlify Dashboard
2. Click "Functions" tab
3. Select "server" function
4. View invocation logs

### Local Testing
```bash
# Run locally with netlify-cli
netlify dev

# Test function locally
curl http://localhost:8888/.netlify/functions/server
```

## Advanced Configuration

### Custom Domain
1. Go to Site settings → Domain management
2. Add custom domain
3. Update DNS records
4. Update `FRONTEND_URL` and `VITE_API_URL` in env vars

### Caching
Control cache headers in netlify.toml:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

### Rate Limiting
Netlify provides DDoS protection. For API-specific limits, use middleware in functions:

```javascript
const requestCounts = new Map();

const rateLimit = (handler) => {
  return async (event) => {
    const ip = event.headers['client-ip'];
    const count = (requestCounts.get(ip) || 0) + 1;
    
    if (count > 100) {
      return { statusCode: 429, body: 'Too many requests' };
    }
    
    requestCounts.set(ip, count);
    return handler(event);
  };
};
```

## Deployment Checklist

- [ ] Environment variables set in Netlify
- [ ] `netlify.toml` configured correctly
- [ ] Frontend builds: `npm run build` succeeds
- [ ] Server builds: `npm --prefix server run build` succeeds
- [ ] Functions folder exists with server.js
- [ ] GitHub repository connected
- [ ] Deploy button shows green
- [ ] Health check responds: `https://your-site.netlify.app/health`
- [ ] Frontend loads and serves correctly
- [ ] API routes working (if database configured)

## Common Deployment Errors

| Error | Solution |
|-------|----------|
| `Command exited with non-zero status` | Check build logs, ensure all deps installed |
| `Function not found` | Verify file in netlify/functions/ and extension is .js |
| `ENOENT: no such file or directory` | Check build output directory paths |
| `Cannot find module` | Ensure npm install runs in build command |
| `Timeout` | Function took too long; check for infinite loops or hanging connections |

## Performance Tips

1. **Minimize cold starts** - Use keepalive connections
2. **Optimize bundle size** - Run `npm run build && ls -lh dist/`
3. **Cache static assets** - Set proper Cache-Control headers
4. **Monitor function execution** - Use Netlify's function analytics
5. **Use edge functions** - For simple routing/authentication

## Support & Resources

- **Netlify Docs**: https://docs.netlify.com
- **Vite Docs**: https://vitejs.dev
- **Express Docs**: https://expressjs.com
- **MongoDB**: https://www.mongodb.com
- **GitHub Issues**: Report issues with setup

## Next Steps

1. Push code to GitHub
2. Connect to Netlify via dashboard
3. Set environment variables
4. Deploy and test
5. Monitor function performance
6. Scale as needed

---

**Last Updated**: May 30, 2026
**Tested On**: Netlify, Node.js 20
