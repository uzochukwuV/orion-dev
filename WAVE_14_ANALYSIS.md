# Wave 14: Frontend-Backend Integration Analysis

## Executive Summary

The frontend is well-structured but has several issues that need to be addressed:

1. **Auth is still using Clerk** - `App.jsx`, `Login.jsx`, `AuthContext.jsx` all use `@clerk/clerk-react`
2. **Some pages use base44 directly** - `Analytics.jsx`, `Agents.jsx`, `Intelligence.jsx` import from `@/api/base44Client`
3. **Hardcoded `business_id: 'demo'`** - Every page that calls agents uses demo
4. **Hardcoded sample data** - Fallback arrays show salon/hair data (should be restaurant)
5. **Missing auth token handling** - API client doesn't include JWT

---

## Part 1: Hardcoded Data vs Backend (Issues Found)

### 1. Dashboard.jsx

**Backend-connected (working):**
- `entities.Opportunity.list()` ✅
- `entities.Lead.list()` ✅  
- `entities.Campaign.list()` ✅
- `entities.AgentRun.list()` ✅

**Hardcoded fallbacks (will show if API fails):**
```javascript
// Line 39-43 - Stats
{ label: 'Revenue This Month', value: '$8,140', change: '+23%' }
{ label: 'Active Leads', value: '12', change: '+5 this week' }
{ label: 'Campaigns Running', value: '3', change: '2 pending review' }
{ label: 'Opportunities Found', value: '7', change: 'New this week' }

// Line 67-83 - Revenue chart data
const revenueData = [
  { week: 'W1', revenue: 4200 }, ...
]

// Line 99-111 - Agent activity fallback
{ agent: 'Market Intelligence', status: 'completed', note: 'Found 3 new opportunities' }
{ agent: 'Sales Agent', status: 'completed', note: 'Sent 4 follow-ups' }
{ agent: 'Social Media', status: 'running', note: 'Generating posts…' }

// Line 129-133 - Opportunities fallback (SALON data!)
{ title: 'Competitor raised prices 15%', category: 'pricing', impact_score: 8, urgency: 'high' }
{ title: '"Hair extensions" trending locally', category: 'trend', impact_score: 7, urgency: 'medium' }
{ title: 'Nearby salon closed — gap in market', category: 'gap', impact_score: 9, urgency: 'high' }

// Line 148-152 - Leads fallback (SALON data!)
{ name: 'Sarah Johnson', service_interest: 'Haircut & Color', status: 'new', ai_score: 92 }
{ name: 'Mike Torres', service_interest: 'Deep Tissue Massage', status: 'contacted', ai_score: 75 }
{ name: 'Emma Chen', service_interest: 'Highlights', status: 'qualified', ai_score: 88 }
```

### 2. Intelligence.jsx

**Uses base44 directly (not our API):**
```javascript
import { base44 } from '@/api/base44Client';  // Line 2 - WRONG
```

**API calls to our backend:**
```javascript
apiPost('/api/intelligence/scan', { business_id: 'demo', ... })  // Line 33
```

**Needs fixing:**
- Remove base44 import
- API client doesn't include JWT token

### 3. Analytics.jsx

**Uses base44 entirely:**
```javascript
import { base44 } from '@/api/base44Client';  // Line 2
base44.entities.Lead.list()  // Line 29
base44.entities.Campaign.list()  // Line 30
```

**Hardcoded data:**
```javascript
// Revenue chart
{ month: 'Jan', revenue: 18200, target: 20000 }, ...

// Channel breakdown
{ name: 'Google Ads', value: 35 }, ...

// Campaign names fallback
{ name: 'Summer Haircut Promo', pct: 78 }, ...
```

### 4. Agents.jsx

**Uses base44 entirely:**
```javascript
import { base44 } from '@/api/base44Client';
base44.entities.AgentRun.list()
base44.integrations.Core.InvokeLLM({ prompt: ... })  // Line 35 - Uses base44 LLM
```

**Hardcoded prompts for SALON:**
```javascript
{ prompt: 'Run a comprehensive market intelligence scan for a local hair salon...' }
{ prompt: 'Create a complete marketing strategy for a local hair salon...' }
```

### 5. Campaigns.jsx

**Backend-connected (working):**
```javascript
entities.Campaign.list()
entities.Campaign.create()
entities.Campaign.update()
```

**Hardcoded prompt for SALON:**
```javascript
// Line 42-44
task: 'Generate a high-converting marketing campaign for a local hair salon targeting women 25-45...'
```

### 6. Leads.jsx

**Backend-connected (working):**
```javascript
entities.Lead.list()
entities.Lead.update()
```

**Hardcoded prompt for SALON:**
```javascript
// Line 36-38
message: `Write a brief, warm, personalized follow-up message for a local hair salon...`
```

### 7. Social.jsx

**Backend-connected (working):**
```javascript
entities.SocialPost.list()
entities.SocialPost.create()
entities.SocialPost.update()
```

**Hardcoded prompt for SALON:**
```javascript
// Line 38-40
task: `Generate 3 engaging social media posts for a local hair salon about: "${topic}"...`
```

---

## Part 2: Missing Backend Features

### Critical (Blockers)

| Feature | Status | Notes |
|---------|--------|-------|
| **Auth Context** | ❌ Missing | Frontend still expects Clerk, need to replace with JWT-based auth |
| **User Model Sync** | ❌ Missing | Frontend needs `useAuth()` hook pointing to our `/api/auth/me` |
| **Token in API Calls** | ❌ Missing | `client.ts` doesn't include JWT in headers |

### Important (Should Have)

| Feature | Status | Notes |
|---------|--------|-------|
| **Notifications** | ❌ Missing | Real-time alerts for new leads, campaign status, etc. |
| **Scheduled Tasks Cron** | ⚠️ Model exists | `ScheduledTask` model exists but no cron execution engine |
| **WhatsApp Campaigns UI** | ⚠️ API exists | Need frontend UI to send WhatsApp campaigns |
| **Voice Integration** | ⚠️ API exists | Need frontend "Ask AI" button to actually work |
| **Onboarding Flow** | ⚠️ Partial | Page exists but doesn't connect to our backend |

### Nice to Have

| Feature | Status | Notes |
|---------|--------|-------|
| **Email Digests** | ❌ Missing | Weekly/daily email summaries |
| **Browser Notifications** | ❌ Missing | Push notifications for actions |
| **Multi-business Support** | ❌ Missing | Users can only have one business |
| **Team/Collaboration** | ❌ Missing | Invite team members |

---

## Part 3: Recommendations

### Quick Wins (This Wave)

1. **Replace Auth in App.jsx** - Use our JWT auth instead of Clerk
2. **Add JWT to API client** - Include token in all requests
3. **Fix base44 imports** - Replace with our `client.ts`
4. **Remove hardcoded salon data** - Replace with generic placeholders or fetch from backend
5. **Add business context** - Fetch user's business and use real `business_id`

### For Wave 15 (After Core Auth)

1. **Notifications System**
   - Backend: Create `Notification` model + SSE endpoint
   - Frontend: Real-time toast notifications
   - Triggers: New lead, opportunity found, campaign complete

2. **Scheduling Engine**
   - Backend: Cron job to check `ScheduledTask` collection
   - Execute agents on schedule
   - Store results back

3. **WhatsApp Campaign UI**
   - Frontend: Campaign creation form with WhatsApp options
   - Select leads, choose template, preview, send

### Architectural Improvements

1. **Create a `useOrionAuth()` hook** that fetches `/api/auth/me` and provides:
   - `user` object
   - `business` object
   - `loading`, `error` states
   - `logout()` function

2. **Create API context** that:
   - Attaches JWT to all requests
   - Handles 401 redirects
   - Refreshes expired tokens

3. **Business context hook** that:
   - Fetches business on mount
   - Provides vertical-specific templates
   - Caches for dashboard use

---

## Implementation Plan

### Step 1: Replace Auth (2 hours)
- Create `src/lib/useOrionAuth.jsx` hook
- Update `App.jsx` to use our auth
- Remove Clerk dependencies

### Step 2: Fix API Client (1 hour)
- Add JWT header to all requests
- Handle auth errors

### Step 3: Replace base44 Usage (2 hours)
- `Analytics.jsx` → use our entities API
- `Agents.jsx` → use `/api/agents/run`
- `Intelligence.jsx` → remove base44 import

### Step 4: Remove Hardcoded Data (1 hour)
- Replace salon fallbacks with generic placeholders
- Or fetch from backend when available

### Total: ~6 hours

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/useOrionAuth.jsx` | **NEW** - Auth hook |
| `src/App.jsx` | Remove Clerk, use our auth |
| `src/api/client.ts` | Add JWT header |
| `src/pages/Analytics.jsx` | Replace base44 |
| `src/pages/Agents.jsx` | Replace base44 + LLM call |
| `src/pages/Intelligence.jsx` | Replace base44 |
| `src/pages/Dashboard.jsx` | Fix fallbacks |
| `src/pages/Leads.jsx` | Fix hardcoded prompts |
| `src/pages/Campaigns.jsx` | Fix hardcoded prompts |
| `src/pages/Social.jsx` | Fix hardcoded prompts |

---

## Questions/Decisions Needed

1. **Fallback data style**: Should fallbacks be generic or show the restaurant data we seeded?
2. **Vertical prompts**: Should we make prompts vertical-aware or keep generic?
3. **Auth persistence**: JWT in memory + cookie, or localStorage?
4. **Multi-business**: Plan for future or keep single-business for now?