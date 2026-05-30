# Wave 13: Email/Password Auth + Sample Data

## Auth Endpoints

### POST /api/auth/register
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
Returns: user object + JWT token + creates default business

### POST /api/auth/login
```json
{
  "email": "demo@lacucina.pl",
  "password": "password123"
}
```
Returns: user + business + JWT token

### POST /api/auth/logout
Clears auth cookie

### GET /api/auth/me
Returns current authenticated user + business

## JWT Auth

- Token stored in HTTP-only cookie OR Authorization header
- 7-day expiry
- Middleware `verifyJWT` protects agent routes

## Updated Routes

All `/api/agents/*` routes now require auth:
- POST /api/agents/run
- POST /api/agents/chat
- GET /api/agents/runs
- etc.

Business ID automatically comes from user's linked business.

## Sample Data

Restaurant: **La Cucina** (Kraków, Poland)

Test credentials:
- Email: demo@lacucina.pl
- Password: password123

Data created:
- User (Maria Kowalski)
- Business (La Cucina - restaurant)
- 5 Leads
- 4 Campaigns
- 5 Opportunities
- 4 Social Posts

## Files Created

- `src/auth/jwt.ts` — JWT utilities
- `src/auth/routes.ts` — Auth endpoints
- `src/auth/middleware.ts` — JWT middleware
- `src/db/models/User.ts` — User model (replaces ClerkUser)
- `src/seed.ts` — Sample data seeder

## Next: WhatsApp Integration

Auth is ready. Next up: Wave 14 WhatsApp integration with the restaurant data as test case.