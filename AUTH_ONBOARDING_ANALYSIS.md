# Orion SuperAgent Platform — Authentication & Onboarding Architecture

## 🎯 Current State Analysis

### What Exists
- ✅ Onboarding.jsx (4-step wizard: phone → business → voice → value)
- ✅ Frontend pages (all 9 pages + 2 modals)
- ✅ Backend APIs (REST + WebSocket)
- ✅ MongoDB models (11 entities)

### What's Missing
- ❌ User authentication (auth, login, signup)
- ❌ Session management
- ❌ JWT tokens
- ❌ Password hashing
- ❌ Role-based access control (RBAC)
- ❌ Protected routes
- ❌ Onboarding completion tracking
- ❌ Multi-user support (currently hardcoded: business_id = 'demo')

---

## 🏗️ Proposed Architecture

### Option 1: Lightweight (DIY) — 2-3 hours
✅ Best for: MVP, hackathon, quick iteration
- Email + password login
- JWT tokens (no refresh tokens)
- MongoDB User model
- Protected API routes via middleware
- React Context for auth state

❌ Trade-offs:
- No social login (GitHub, Google)
- No password reset flow
- Manual RBAC implementation
- Basic security (no 2FA, rate limiting)

### Option 2: Third-Party (Clerk) — 30 min setup
✅ Best for: Production, scalable, enterprise
- Clerk.com auth (email, OAuth, TOTP)
- Auto session management
- Built-in RBAC
- Webhook support for onboarding
- Production security hardened

❌ Trade-offs:
- External dependency
- Cost at scale ($0.07/user after 10k)
- Vendor lock-in

### Option 3: Hybrid (Clerk + Fallback) — 1 hour
✅ Best for: Flexibility + production readiness
- Clerk for primary auth
- Custom JWT for agent API calls
- Webhook sync to MongoDB
- Fallback to local auth if Clerk down

❌ Trade-offs:
- More complex setup
- Two auth systems to maintain

---

## 🔐 Recommended: Option 1 (DIY Lightweight)

Why: Aligns with hackathon scope, teaches authentication patterns, maintains code ownership.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
├─────────────────────────────────────────────────────────────┤
│  AuthContext (token, user, login, logout, signup)           │
│    ↓                                                         │
│  Protected Routes (check token in AuthContext)              │
│    ↓                                                         │
│  Onboarding Flow (4 steps → create User + Business)         │
│    ↓                                                         │
│  Dashboard (all data filtered by current user)              │
└─────────────────────────────────────────────────────────────┘
              ↓                                ↑
        POST /api/auth/signup          HTTP (JWT Bearer)
        POST /api/auth/login                  ↑
        POST /api/auth/logout          GET /api/auth/me
              ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                      │
├─────────────────────────────────────────────────────────────┤
│  POST /api/auth/signup                                      │
│    - Validate email (unique, format)                        │
│    - Hash password (bcrypt)                                 │
│    - Create User + Business (demo)                          │
│    - Return JWT token                                       │
│                                                              │
│  POST /api/auth/login                                       │
│    - Validate email + password                              │
│    - Generate JWT token                                     │
│    - Return token + user                                    │
│                                                              │
│  POST /api/auth/logout                                      │
│    - Invalidate token (blacklist in Redis)                  │
│                                                              │
│  GET /api/auth/me                                           │
│    - Verify JWT                                             │
│    - Return current user profile                            │
│                                                              │
│  Middleware: verifyToken(req, res, next)                    │
│    - Check Authorization: Bearer {token}                    │
│    - Decode JWT                                             │
│    - Attach user_id to req.user                             │
└─────────────────────────────────────────────────────────────┘
         ↓
    MongoDB
    ├─ User { _id, email, password_hash, name, created_at }
    ├─ Business { _id, user_id, name, city, ... }
    └─ [All other models] → add user_id field
```

---

## 📋 Implementation Plan (3-4 hours)

### Phase 1: Backend Auth (1 hour)

#### 1.1 User Model
```typescript
// server/src/db/models/User.ts
interface IUser {
  _id: ObjectId;
  email: string;              // unique
  password_hash: string;      // bcrypt($password, 10)
  name: string;               // from onboarding
  created_at: Date;
  verified_at?: Date;         // email verification (optional)
  role: 'user' | 'admin';    // RBAC
}
```

#### 1.2 Auth Routes
```typescript
// server/src/routes/auth.ts
POST   /api/auth/signup       { email, password, name }
POST   /api/auth/login        { email, password }
POST   /api/auth/logout       { }
GET    /api/auth/me           { }
POST   /api/auth/refresh      { refreshToken }  // optional
```

#### 1.3 JWT Middleware
```typescript
// server/src/middleware/verifyToken.ts
- Extract token from Authorization header
- Verify JWT signature
- Attach user_id to req.user
- Return 401 if invalid
```

#### 1.4 Password Utils
```typescript
// server/src/utils/password.ts
- hash(password): string
- verify(password, hash): boolean
```

### Phase 2: Frontend Auth Context (30 min)

#### 2.1 AuthContext
```typescript
// src/contexts/AuthContext.tsx
interface AuthState {
  token: string | null;
  user: { id, email, name } | null;
  loading: boolean;
  error: string | null;
}

Methods:
  - login(email, password)
  - signup(email, password, name)
  - logout()
  - refresh()    // auto-refresh token on expiry
```

#### 2.2 Protected Routes
```typescript
// src/components/ProtectedRoute.tsx
- Check token in AuthContext
- Redirect to /login if missing
- Render component if present
```

#### 2.3 API Client Update
```typescript
// src/api/entities.ts (update)
- Add Authorization header to all requests
- Handle 401 → redirect to /login
- Auto-refresh token on expiry
```

### Phase 3: Onboarding Integration (1 hour)

#### 3.1 Onboarding Steps
```
Step 1: Phone (email signup)
  - Email + password form
  - POST /api/auth/signup
  - Create User + initial Business
  
Step 2: Business Info
  - Business name, city, phone, website
  - POST /api/entities/Business/{id}
  - Update Business record

Step 3: Voice Setup (optional)
  - Test voice transcription
  - Save preference

Step 4: Value Prop
  - What problems to solve
  - Create first Lead/Opportunity (demo)
```

#### 3.2 Business Model Link
```typescript
// server/src/db/models/Business.ts (update)
- Add user_id field (required, indexed)
- business.user_id = auth.user_id
```

#### 3.3 Data Filtering
```typescript
// All routes: filter by user_id
- GET /api/entities/Lead → { business_id, user_id: req.user.id }
- GET /api/entities/Opportunity → { business_id, user_id }
- All CRUD operations scoped to authenticated user
```

### Phase 4: Multi-User Support (1 hour)

#### 4.1 Database Schema Update
```
All Models (Lead, Campaign, Opportunity, etc):
  - Add user_id field (indexed)
  - Filter queries by user_id
  - Migrate existing 'demo' records to user_1
```

#### 4.2 API Route Changes
```typescript
// OLD: All routes assume business_id = 'demo'
GET /api/entities/Lead?business_id=demo

// NEW: Scoped to authenticated user
GET /api/entities/Lead  // filtered by req.user.id
```

#### 4.3 Frontend Changes
```typescript
// OLD: Hardcoded business_id: 'demo'
apiPost('/api/agents/run', { task, business_id: 'demo' })

// NEW: Get from user context
apiPost('/api/agents/run', { task, business_id: user.business_id })
```

---

## 🔑 Security Considerations

### Password Security
- ✅ Hash with bcrypt (cost = 10)
- ✅ Never log passwords
- ✅ Min 8 chars, require mix of: upper + lower + number + symbol
- ✅ Rate limit login attempts (5 per 15 min per IP)

### JWT Security
- ✅ Sign with RS256 (not HS256) → use private key
- ✅ Set short expiry (15 min)
- ✅ Refresh token with longer expiry (7 days)
- ✅ Store token in memory (not localStorage) → XSS safe
- ✅ Send refresh token in httpOnly cookie → CSRF safe

### API Security
- ✅ All routes require valid JWT
- ✅ Validate user_id matches token
- ✅ Rate limit: 100 requests/min per user
- ✅ CORS: whitelist domain only
- ✅ HTTPS only in production

---

## 📅 Timeline

### MVP (4-5 hours)
- [x] Wave 1-9: Core platform (DONE)
- [ ] Auth backend: ~1 hour
  - User model
  - JWT signup/login/logout
  - Middleware
- [ ] Auth frontend: ~30 min
  - AuthContext
  - Protected routes
  - Login/signup pages
- [ ] Onboarding update: ~1 hour
  - Step 1: Email signup
  - Connect to auth
  - Create User + Business
- [ ] Data filtering: ~1 hour
  - Add user_id to all models
  - Update all queries
  - Test multi-user

**Total: 9-10 hours from cold start**  
**For you: ~4-5 hours (foundation exists)**

### Post-MVP (Optional)
- [ ] Email verification
- [ ] Password reset flow
- [ ] 2FA (TOTP)
- [ ] Social login (GitHub, Google) via Clerk
- [ ] API keys for programmatic access
- [ ] Team/invite flow
- [ ] Audit logging

---

## 🚦 Decision Points

### 1. Where to Store Tokens?
**Option A: Memory (recommended)**
- ✅ Secure (no XSS attack surface)
- ❌ Lost on page reload
- Solution: Store refresh token in httpOnly cookie, use it to get new JWT

**Option B: LocalStorage**
- ✅ Persists on reload
- ❌ Vulnerable to XSS
- Use if you trust your frontend code

**Decision: Memory + httpOnly refresh cookie**

### 2. Single Business per User or Multiple?
**Option A: 1 business per user (MVP)**
- Simpler data model
- Suits solo entrepreneurs
- Migration path: one user_id per business

**Option B: Multiple businesses per user**
- User has array of business_ids
- More complex RBAC (user_id + business_id)
- Better for agencies/consultants

**Decision: Option A for MVP → migrate to B later**

### 3. Email Verification Required?
**Option A: Yes (recommended for production)**
- Prevents typos/fake emails
- Reduces spam
- Adds signup step

**Option B: No (for MVP)**
- Faster onboarding
- Less friction

**Decision: No for MVP, add later in Wave 10**

### 4. Password Reset?
**Option A: Yes (recommended)**
- Email link with time-limited token
- Generate reset token, store in DB, send via email

**Option B: No (for MVP)**
- Users message support

**Decision: No for MVP, add as Wave 10 feature**

---

## 📝 Phased Rollout

### Sprint 1 (This Week) — Auth Core
- User model + DB migration
- JWT signup/login/logout
- Protected routes
- Onboarding integration
- **Status: ✅ Users can sign up and log in**

### Sprint 2 (Next Week) — Multi-Tenant Data
- Add user_id to all models
- Filter all queries by user
- Update frontend to use authenticated user context
- **Status: ✅ Each user sees only their data**

### Sprint 3 (Week After) — Polish
- Email verification
- Password reset
- 2FA (optional)
- User profile page
- **Status: ✅ Production-ready auth**

---

## 🎯 What Gets Built This Week

### Backend (1.5 hours)
1. User model (50 lines)
2. JWT middleware (80 lines)
3. Auth routes (150 lines)
4. Password utils (40 lines)
5. Tests (100 lines)

**Total: ~420 lines backend**

### Frontend (1 hour)
1. AuthContext (120 lines)
2. Protected routes (60 lines)
3. Login page (180 lines)
4. Signup page (180 lines)
5. Update Onboarding (50 lines)

**Total: ~590 lines frontend**

### Integration (1 hour)
1. Update API client (50 lines)
2. Update onboarding flow (80 lines)
3. Add auth to routes (150 lines)
4. E2E tests (100 lines)

**Total: ~3.5 hours for full implementation**

---

## 🤔 Recommendations

### For This MVP:
✅ **Do:**
- Implement DIY JWT auth (simple, maintains control)
- Single business per user
- Protected routes + AuthContext
- Integration with existing onboarding

❌ **Don't:**
- Add email verification (MVP friction)
- Add password reset (support via email for now)
- Use Clerk (adds external dependency)
- Try to do multi-tenant yet

### For Production (Wave 10):
✅ **Add:**
- Email verification
- Password reset
- 2FA
- Consider Clerk for team/invite flow

---

## 📊 Data Model Changes

### New: User
```javascript
{
  _id: ObjectId,
  email: "user@example.com",     // unique, indexed
  password_hash: "$2b$10$...",   // bcrypt
  name: "Alice Chen",
  created_at: ISODate,
  verified_at: null,             // optional
  role: "user"                   // enum: user | admin
}
```

### Updated: Business
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,             // NEW: link to User
  name: "Luxe Hair Studio",
  city: "Austin, TX",
  // ... rest unchanged
}
```

### All Other Models
```javascript
// Add to: Lead, Campaign, Opportunity, SocialPost, ChatSession, AgentRun, AgentTask, ScheduledTask
{
  _id: ObjectId,
  user_id: ObjectId,             // NEW: scope to user
  business_id: ObjectId,         // existing
  // ... rest unchanged
}
```

---

## ✅ Ready to Build?

**Recommendation: Let's do this!**

Proposed approach:
1. **Today (30 min):** Design finalized, build backend auth
2. **Tomorrow (1 hour):** Frontend auth context + login/signup
3. **Day 3 (30 min):** Integrate onboarding + test
4. **Day 4 (optional):** Polish + add email verification

**Result: Fully multi-tenant platform with real authentication**

---

## Questions for You

1. **JWT vs Sessions?** 
   - JWT recommended (stateless, easier to scale)
   - Sessions OK if running single backend instance

2. **Social login in MVP?**
   - No: Start with email/password
   - Yes: Use Clerk (30 min setup)

3. **Multi-business per user later?**
   - Yes: Design for it now (easy migration)
   - No: Keep simple, one business per user

4. **When to launch?**
   - This week? Build auth now
   - Next sprint? Keep using demo mode for testing

Let me know which path you prefer and I'll build it!
