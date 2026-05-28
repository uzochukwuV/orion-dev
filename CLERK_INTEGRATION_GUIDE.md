# Clerk Authentication Integration for Orion

## 🚀 Quick Start (30 minutes)

### Step 1: Clerk Setup (5 min)

1. Go to https://clerk.com
2. Sign up (use your email)
3. Create new application
4. Choose: Email + Social (GitHub, Google optional)
5. Copy your keys:
   - `REACT_APP_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Step 2: Environment Variables

**Frontend (.env):**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Backend (.env):**
```bash
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx  # From Clerk webhook settings
```

### Step 3: Install Packages

**Frontend:**
```bash
npm install @clerk/clerk-react
```

**Backend:**
```bash
npm install @clerk/backend
```

### Step 4: Wrap React App

**src/main.jsx:**
```javascript
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

root.render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <App />
  </ClerkProvider>
);
```

### Step 5: Protect Routes

**src/components/ProtectedRoute.jsx:**
```javascript
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;
  
  return children;
}
```

### Step 6: Login Page

**src/pages/Login.jsx:**
```javascript
import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-cloud-canvas flex items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn path="/login" routing="path" signUpUrl="/signup" />
      </div>
    </div>
  );
}
```

### Step 7: Signup Page

**src/pages/Signup.jsx:**
```javascript
import { SignUp } from '@clerk/clerk-react';

export default function Signup() {
  return (
    <div className="min-h-screen bg-cloud-canvas flex items-center justify-center">
      <div className="w-full max-w-md">
        <SignUp path="/signup" routing="path" signInUrl="/login" />
      </div>
    </div>
  );
}
```

---

## 🔌 Backend Integration

### Step 1: Verify Clerk Tokens

**server/src/middleware/verifyClerk.ts:**
```typescript
import { verifyToken } from '@clerk/backend';

export async function verifyClerkToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    req.user = { id: decoded.sub };  // Clerk user ID
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Step 2: Link Clerk User to Database

**server/src/db/models/ClerkUser.ts:**
```typescript
import mongoose from 'mongoose';

const clerkUserSchema = new mongoose.Schema({
  clerk_id: String,              // From Clerk
  email: String,
  name: String,
  business_id: mongoose.Schema.Types.ObjectId,  // Default business
  created_at: { type: Date, default: Date.now },
});

clerkUserSchema.index({ clerk_id: 1 });

export const ClerkUserModel = mongoose.model('ClerkUser', clerkUserSchema);
```

### Step 3: Webhook for User Creation

**server/src/routes/webhooks.ts:**
```typescript
import { Webhook } from 'svix';
import { ClerkUserModel } from '../db/models/ClerkUser';
import { BusinessModel } from '../db/models/Business';

export async function handleClerkWebhook(req, res) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  
  try {
    const evt = wh.verify(JSON.stringify(req.body), req.headers);
    
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      // Create user in database
      const user = await ClerkUserModel.create({
        clerk_id: id,
        email: email_addresses[0]?.email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
      });

      // Create default business
      const business = await BusinessModel.create({
        user_id: user._id,
        name: `${user.name}'s Business`,
        city: 'Austin, TX',
      });

      // Link business to user
      user.business_id = business._id;
      await user.save();

      res.json({ ok: true });
    } else if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      await ClerkUserModel.findOneAndUpdate(
        { clerk_id: id },
        {
          email: email_addresses[0]?.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
        }
      );

      res.json({ ok: true });
    } else if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      await ClerkUserModel.findOneAndDelete({ clerk_id: id });
      res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
}
```

### Step 4: Mount Webhook

**server/src/index.ts:**
```typescript
import { handleClerkWebhook } from './routes/webhooks';

// Important: This must be BEFORE express.json()
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

// Everything else after
app.use(express.json());
```

### Step 5: Update All API Routes

**Before:**
```typescript
app.get('/api/entities/Lead', (req, res) => {
  const leads = await Lead.find({ business_id: 'demo' });
});
```

**After:**
```typescript
app.get('/api/entities/Lead', verifyClerkToken, async (req, res) => {
  const user = await ClerkUserModel.findOne({ clerk_id: req.user.id });
  const leads = await Lead.find({ user_id: user._id });
  res.json(leads);
});
```

---

## 🎨 Frontend Integration

### Step 1: Update API Client

**src/api/entities.ts:**
```typescript
import { useAuth } from '@clerk/clerk-react';

export function createApiClient() {
  const { getToken } = useAuth();

  return {
    async request(method, path, data) {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:3001${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // Clerk token
        },
        body: data ? JSON.stringify(data) : null,
      });

      if (response.status === 401) {
        window.location.href = '/login';
      }

      return response.json();
    },

    async list(entity, sort = '-created_at', limit = 50) {
      return this.request('GET', `/api/entities/${entity}?sort=${sort}&limit=${limit}`);
    },

    async create(entity, data) {
      return this.request('POST', `/api/entities/${entity}`, data);
    },

    async update(entity, id, data) {
      return this.request('PATCH', `/api/entities/${entity}/${id}`, data);
    },
  };
}
```

### Step 2: Create User Context

**src/contexts/UserContext.jsx:**
```javascript
import { createContext, useContext } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <UserContext.Provider value={{ user, isSignedIn }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
```

### Step 3: Update App Layout

**src/components/AppLayout.jsx:**
```javascript
import { SignOutButton } from '@clerk/clerk-react';
import { useUserContext } from '../contexts/UserContext';

export default function AppLayout({ children }) {
  const { user } = useUserContext();

  return (
    <div>
      {/* Header with user info */}
      <header className="flex items-center justify-between px-8 py-4 border-b">
        <div>Orion</div>
        <div className="flex items-center gap-4">
          <span>{user?.emailAddresses[0]?.emailAddress}</span>
          <SignOutButton>
            <button>Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

### Step 4: Update Router

**src/App.jsx:**
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}
```

---

## 📊 Data Model Updates

### Add User Linking

All models now get `user_id`:

```typescript
// src/db/models/Lead.ts
const leadSchema = new mongoose.Schema({
  user_id: ObjectId,        // NEW: Link to ClerkUser
  name: String,
  email: String,
  source: String,
  status: String,
  // ... rest unchanged
});

// src/db/models/Campaign.ts
const campaignSchema = new mongoose.Schema({
  user_id: ObjectId,        // NEW
  name: String,
  type: String,
  // ... rest unchanged
});

// Same for: Opportunity, SocialPost, ChatSession, AgentRun, AgentTask, ScheduledTask
```

---

## 🔄 Migration: Update All Routes

**Template for updating all routes:**

```typescript
// OLD
app.get('/api/entities/Lead', async (req, res) => {
  const leads = await Lead.find({ business_id: 'demo' });
  res.json(leads);
});

// NEW
app.get('/api/entities/Lead', verifyClerkToken, async (req, res) => {
  const clerkUser = await ClerkUserModel.findOne({ clerk_id: req.user.id });
  if (!clerkUser) return res.status(404).json({ error: 'User not found' });

  const leads = await Lead.find({ user_id: clerkUser._id });
  res.json(leads);
});
```

Apply this pattern to:
- ✅ GET /api/entities/{entity}
- ✅ POST /api/entities/{entity}
- ✅ PATCH /api/entities/{entity}/{id}
- ✅ DELETE /api/entities/{entity}/{id}
- ✅ POST /api/agents/run
- ✅ POST /api/agents/chat
- ✅ POST /api/intelligence/scan

---

## ✅ Setup Checklist

- [ ] Create Clerk account at clerk.com
- [ ] Create application (Email + Social)
- [ ] Copy publishable key to frontend .env
- [ ] Copy secret key to backend .env
- [ ] `npm install @clerk/clerk-react` (frontend)
- [ ] `npm install @clerk/backend` (backend)
- [ ] Create webhook in Clerk dashboard
- [ ] Copy webhook secret to backend .env
- [ ] Wrap React app with ClerkProvider
- [ ] Create Login/Signup pages
- [ ] Add ProtectedRoute component
- [ ] Create ClerkUser model
- [ ] Add webhook endpoint
- [ ] Update API client with getToken()
- [ ] Add verifyClerkToken middleware
- [ ] Update all API routes (apply template above)
- [ ] Add user_id to all MongoDB models
- [ ] Test: Sign up → see your own leads
- [ ] Test: Sign up with different account → see different data

---

## 🧪 Testing

**Test 1: Sign Up**
```
1. Go to http://localhost:5173/signup
2. Create account with email
3. You should be redirected to /dashboard
4. Should say "Welcome, [your name]"
```

**Test 2: Create Lead**
```
1. Click "Add Lead" on Leads page
2. Create a lead with your data
3. Go to /login in incognito
4. Sign up with different email
5. Go to Leads page
6. Should NOT see the first lead
7. ✅ Data isolation working!
```

**Test 3: Sign Out**
```
1. Click "Sign Out"
2. Should redirect to /login
3. ✅ Session cleared
```

**Test 4: Webhook**
```
1. In Clerk dashboard, go to Webhooks
2. You should see delivery logs
3. Check backend logs: Should see "User created in database"
4. ✅ Webhook working
```

---

## 🐛 Troubleshooting

**Error: "publishableKey is required"**
- Check VITE_CLERK_PUBLISHABLE_KEY in frontend .env
- Restart frontend: `npm run dev`

**Error: "Invalid token"**
- Make sure CLERK_SECRET_KEY is in backend .env
- Restart backend: `npm run dev`

**Webhook not firing**
- Go to Clerk dashboard → Webhooks
- Create new endpoint: `http://YOUR_DOMAIN/api/webhooks/clerk`
- Copy secret to CLERK_WEBHOOK_SECRET

**User not found error**
- Check: Is webhook triggering? (See logs)
- Check: Does ClerkUser exist in MongoDB?
- Check: Is user_id being set in requests?

**Sign up redirects to wrong page**
- Make sure signUpUrl in Login/Signup pages match your routes
- Check ProtectedRoute is wrapping correct pages

---

## 📱 Onboarding Flow (Updated)

**Old Flow (Before Auth):**
```
Step 1: Phone signup
Step 2: Business info
Step 3: Voice setup
Step 4: Value prop
```

**New Flow (With Clerk):**
```
Step 0: Clerk signup (email + password or social login)
Step 1: Business info (Clerk provides name)
Step 2: Voice setup
Step 3: Value prop
Step 4: Done!
```

**src/pages/Onboarding.jsx (updated):**
```javascript
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Skip phone step (handled by Clerk)
  // Start from business info

  return (
    <div>
      {/* Only show: Business, Voice, Value (3 steps instead of 4) */}
    </div>
  );
}
```

---

## 🎯 Next Steps

1. **Today:**
   - [ ] Create Clerk account
   - [ ] Get API keys
   - [ ] Add to .env files

2. **Tomorrow:**
   - [ ] Install packages
   - [ ] Setup frontend (ClerkProvider, Login/Signup)
   - [ ] Setup backend (verifyClerkToken middleware)
   - [ ] Create ClerkUser model

3. **Day 3:**
   - [ ] Add webhook
   - [ ] Update all routes
   - [ ] Add user_id to models
   - [ ] Test signup + data isolation

4. **Day 4:**
   - [ ] Polish onboarding
   - [ ] Test all pages
   - [ ] Ready for Wave 10!

---

## 💾 Key Files to Create/Update

**New files:**
- `server/src/db/models/ClerkUser.ts`
- `server/src/middleware/verifyClerk.ts`
- `server/src/routes/webhooks.ts`
- `src/pages/Login.jsx`
- `src/pages/Signup.jsx`
- `src/contexts/UserContext.jsx`

**Update files:**
- `src/main.jsx` (wrap with ClerkProvider)
- `src/App.jsx` (add protected routes)
- `src/api/entities.ts` (add getToken)
- All route files (add verifyClerkToken)
- All model files (add user_id)

---

## ✨ Result

After completing this setup:
- ✅ Real user authentication (Clerk)
- ✅ Multi-tenant data isolation
- ✅ Secure API with JWT verification
- ✅ User-scoped agents + tasks
- ✅ Ready for Wave 10 scheduler
- ✅ Production-ready auth
- ✅ Easy team/invite support later

Total time: ~2-3 hours integration + testing

Ready to start? Let me know and I'll build the implementation files!
