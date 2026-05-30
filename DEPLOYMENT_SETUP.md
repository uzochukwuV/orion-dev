# Orion Dev - Deployment Setup Guide

## Project Structure
- **Backend**: Express API server with TypeScript (`/server`)
- **Frontend**: Vite + React application (`/src`)

## Backend Server Configuration

### Fixed Issues in `/server/vercel.json`
✅ **Updated Vercel Configuration** - v0/uuzor-bd4becad e572c06

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": "dist/**"
      }
    }
  ],
  "routes": [
    { "src": "/health", "dest": "dist/index.js" },
    { "src": "/api/(.*)", "dest": "dist/index.js" },
    { "src": "/ws/(.*)", "dest": "dist/index.js" },
    { "src": "/(.*)", "dest": "dist/index.js" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Key Changes Made:
1. ✅ Build from pre-compiled TypeScript (`dist/index.js`) instead of source files
2. ✅ Set explicit output directory for Vercel builds
3. ✅ Added comprehensive route handling (health, API, WebSocket, fallback)
4. ✅ Configure NODE_ENV=production for optimal performance
5. ✅ Include compiled files in build output

## Backend API Endpoints (Tested)

### ✅ Health Check
- **Endpoint**: `GET /health`
- **Status**: Working
- **Response**: `{"status":"ok"}`

### API Routes Available
- **Auth**: `/api/auth` - Authentication endpoints
- **Agents**: `/api/agents` - AI agent management
- **Intelligence**: `/api/intelligence` - Intelligence/AI features
- **Dashboard**: `/api/dashboard` - Dashboard statistics
- **Entities**: `/api/entities/*` - CRUD operations for entities (Business, Lead, Campaign, etc.)
- **WhatsApp**: `/api/whatsapp` - WhatsApp integration endpoints

### Authentication
- Routes require authentication via JWT tokens
- Auth module validates credentials
- Returns `{"error":"Not authenticated"}` when not authenticated

## Deployment Status

### Backend
- ✅ Server builds successfully
- ✅ All TypeScript compiles without errors
- ✅ Vercel configuration fixed for Express API
- ⚠️ Free tier deployment limit reached (100+ deployments/day)
  - **Solution**: Wait 24 hours or upgrade to Pro

### Frontend
- Ready for deployment via `vercel deploy`

## Local Testing (Verified)

To test locally:

```bash
# Terminal 1 - Start Backend
cd server
npm run build
npm start
# Server runs on http://localhost:3001

# Terminal 2 - Start Frontend
cd ..
npx vite --host 0.0.0.0 --port 5173
# Frontend runs on http://localhost:5173
```

### Test Commands
```bash
# Health check
curl http://localhost:3001/health

# Auth (requires token)
curl http://localhost:3001/api/auth/me

# Dashboard
curl http://localhost:3001/api/dashboard

# Entities
curl http://localhost:3001/api/entities/Business
```

## Environment Variables Required

### Backend (`server/.env`)
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk authentication
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - WhatsApp webhook verification
- `SPEECHMATICS_API_KEY` - Voice features (optional)
- `PORT` - Server port (default: 3001)

### Frontend (`.env`)
- `VITE_API_URL` - Backend API URL

## Next Steps for Deployment

1. **Wait 24 hours** for free tier deployment reset, or
2. **Upgrade to Vercel Pro** for unlimited deployments

Once deployment is available:

### Deploy Backend
```bash
cd server
vercel deploy --prod --yes
```

### Deploy Frontend
```bash
cd ..
vercel deploy --prod --yes
```

## Verification Checklist

- ✅ Backend vercel.json fixed
- ✅ Server builds successfully  
- ✅ All TypeScript compiles
- ✅ Health endpoint working
- ✅ API routes responding
- ✅ Authentication checks in place
- ✅ WebSocket routes configured
- ✅ Ready for production deployment

---

**Last Updated**: 2026-05-30
**Status**: Ready for Deployment (awaiting free tier reset)
