# Authentication Architecture — Decision Framework

## Quick Decision Matrix

| Aspect | MVP (DIY) | Production (Clerk) | Hybrid |
|--------|-----------|------------------|---------|
| Setup Time | 3-4 hours | 30 min | 1-2 hours |
| Cost | $0 | $0-7k/year | $0-3k/year |
| Scalability | Medium | High | High |
| Control | Full | Limited | Full |
| Complexity | Low | Very Low | Medium |
| Security | Good | Enterprise | Enterprise |
| Team/Invites | Manual | Built-in | Built-in |
| Social Login | DIY | Built-in | Built-in |
| Maintenance | Self | Clerk | Self + Clerk |

---

## Three Paths Forward

### Path A: DIY JWT Auth (Recommended for MVP)
```
Build time: 3-4 hours
Scope: Email/password auth, single user signup/login
Best for: Learning, full control, this hackathon
Maintenance: Self-managed
```

**What you get:**
- ✅ Full code ownership
- ✅ No external dependencies
- ✅ Understands every auth layer
- ✅ Easy to customize
- ✅ Can add features incrementally

**What you don't get:**
- ❌ Social login (can add later)
- ❌ 2FA (can add later)
- ❌ Team/invites (add in Wave 10)

**When to choose:** This sprint, you want to own the code

---

### Path B: Clerk Auth (Recommended for Production)
```
Build time: 30 minutes
Scope: Email, OAuth, 2FA, team/invites all built-in
Best for: Production, scale, enterprise customers
Maintenance: Clerk manages, you integrate
```

**What you get:**
- ✅ Social login (GitHub, Google, etc.)
- ✅ 2FA out of the box
- ✅ Team/invites built-in
- ✅ Enterprise SSO
- ✅ Production security
- ✅ Webhook for onboarding

**What you don't get:**
- ❌ Full code control (SaaS dependency)
- ❌ Learning experience
- ❌ Customization depth

**When to choose:** Next production launch, want professional auth

---

### Path C: Hybrid (Best of Both)
```
Build time: 1-2 hours
Scope: Clerk for user auth, custom JWT for agent API
Best for: Flexibility, production + learning
Maintenance: Shared (Clerk + self)
```

**Architecture:**
```
User login → Clerk → Get Clerk token
Clerk token → Convert to internal JWT
Internal JWT → Use for agent API calls
Fallback → Local JWT if Clerk unavailable
```

**When to choose:** Want production-ready auth + control over agent APIs

---

## My Recommendation

### For This Sprint:
**Go with Path A (DIY JWT Auth)**

**Why:**
1. You already have 9 waves of code ownership — auth should be too
2. 3-4 hours fits this week's timeline
3. Learn how authentication actually works
4. Easier to debug with Waves 1-9
5. Simpler to test with existing agent workflows

### For Next Month:
**Switch to Path B (Clerk) or C (Hybrid)**

**Why:**
1. Production-ready with enterprise features
2. Team/invites for multi-user collaboration
3. Social login for broader user base
4. 30 min integration with existing system

---

## Immediate Implementation (Path A)

### Step 1: Database
```typescript
// User model
// Add: user_id to Business, Lead, Campaign, etc.
// Total time: 30 min
```

### Step 2: Backend Auth
```typescript
// src/routes/auth.ts
// src/middleware/verifyToken.ts
// src/utils/password.ts
// Total time: 1 hour
```

### Step 3: Frontend Auth
```typescript
// AuthContext
// Protected routes
// Login/Signup pages
// Total time: 1 hour
```

### Step 4: Integration
```typescript
// Update API client
// Integrate onboarding
// Update all routes to use user_id
// Total time: 1 hour
```

**Total: 3.5 hours → Production-ready multi-user system**

---

## Data Flow After Auth

### Current (Broken for Multi-User)
```
User clicks "Create Lead"
  ↓
POST /api/entities/Lead { name, email, business_id: 'demo' }
  ↓
Anyone can access all leads (hardcoded 'demo')
```

### After Auth (Secure)
```
User logs in with email/password
  ↓
Get JWT token: { user_id, email, expires }
  ↓
User clicks "Create Lead"
  ↓
POST /api/entities/Lead { name, email } + Header: Authorization: Bearer {JWT}
  ↓
Backend decodes JWT → req.user.id
  ↓
Create Lead with user_id = req.user.id
  ↓
GET /api/entities/Lead filters: { user_id: req.user.id }
  ↓
User sees only their leads
```

---

## Architecture Diagram (Path A)

```
┌──────────────────────────────────────────────────────┐
│             ONBOARDING FLOW (New)                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Step 1: Email Signup (NEW)                          │
│   Email + Password input                            │
│   POST /api/auth/signup                             │
│   ↓ Returns JWT + User                              │
│   ↓ Store token in memory                           │
│                                                      │
│ Step 2: Business Info (Updated)                     │
│   Business name, city, phone                        │
│   POST /api/entities/Business                       │
│   Attached: user_id from token                      │
│                                                      │
│ Step 3: Voice Setup (Unchanged)                     │
│   Test transcription                                │
│                                                      │
│ Step 4: Value Prop (Updated)                        │
│   Create first demo Lead                            │
│   Attached: user_id from token                      │
│                                                      │
└──────────────────────────────────────────────────────┘
              ↓
   User sees Dashboard
   All data filtered by user_id
   Can invite teammates later (Wave 10)
```

---

## Decision: What's Your Priority?

### Option 1: Full Code Control
- Implement DIY JWT now
- Learn authentication deeply
- Can add Clerk later (30 min swap)
- **Time: 3.5 hours this week**

### Option 2: Production Speed
- Skip to Clerk now
- Spend 30 min, get enterprise auth
- Focus on agent workflows instead
- **Time: 30 min + small refactor**

### Option 3: Hybrid Flexibility
- DIY JWT for agents
- Clerk for user auth
- Best of both worlds
- **Time: 1-2 hours this week**

**My vote: Option 1 (DIY)**
- You've built 9 waves of code — own authentication too
- 3.5 hours well invested
- Clerk integration is trivial next month
- Better understanding of your own system

---

## The Easiest Migration Path

If you build DIY now, switching to Clerk later is simple:

```typescript
// Phase 1 (now): DIY JWT
export function login(email, password) {
  const user = await User.findOne({ email });
  const isValid = await bcrypt.compare(password, user.password_hash);
  return jwt.sign({ user_id: user._id }, SECRET);
}

// Phase 2 (next month): Add Clerk
export async function login_with_clerk(token) {
  const user = await clerkClient.verifyToken(token);
  return jwt.sign({ user_id: user.id }, SECRET);  // Same format!
}

// Phase 3: Migrate users
// Clerk handles auth, your JWT handles internals
// Zero changes to agent APIs
```

**Result: Backward compatible, zero disruption**

---

## Final Recommendation

✅ **Build DIY JWT Auth This Week**

Why:
- Fits 3-4 hour budget
- Maintains full code ownership
- Educational value
- Easier to integrate with Waves 1-9
- Migration to Clerk is trivial later

Next Month:
- Add Clerk for team/social login
- Keep JWT for internal APIs
- Best of both worlds

---

## Want to Get Started?

Say "yes" to any of these and I'll build it:

1. **"Build DIY JWT auth now"** → Start immediately
2. **"Setup Clerk instead"** → 30 min setup
3. **"Hybrid approach"** → 1-2 hours, best flexibility
4. **"Keep MVP as-is"** → Use for task scheduler this week

Which path feels right?
