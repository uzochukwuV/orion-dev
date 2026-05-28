# Wave 9 Frontend Wiring - Pages Updated

##  Updated Pages

### 1. Dashboard.jsx
- [x] Import: entities from @/api/entities
- [x] Removed: TrendingUp, Users, Megaphone, Share2, ArrowUpRight, Zap, AlertCircle, CheckCircle2, Clock (unused)
- [x] Changed: base44.entities.* → entities.*
- [x] Changed: '-created_date' → '-created_at'
- [x] Added: Error handling with .catch()

### 2. Leads.jsx  
- [x] Import: entities, apiPost from @/api/entities
- [x] Removed: Phone, Mail, MessageSquare, motion (unused)
- [x] Changed: base44.entities.Lead → entities.Lead
- [x] Changed: base44.integrations.Core.InvokeLLM → apiPost('/api/agents/chat', {})
- [x] Changed: '-created_date' → '-created_at'
- [x] Changed: lead.id → lead._id (handle both)
- [x] Added: Try/catch error handling for AI followup

### 3. Campaigns.jsx  
- Changes needed:
  - entities.Campaign.list/create/update
  - apiPost('/api/agents/run', {}) for generation
  - Cast response as typed object

### 4. Social.jsx
- Changes needed:
  - entities.SocialPost.list/create
  - apiPost('/api/agents/run', {}) for generation
  - Fix TypeScript casting

### 5. Intelligence.jsx
- Changes needed:
  - apiPost('/api/intelligence/scan', {}) for scans
  - entities.Opportunity.list() for viewing

### 6. Settings.jsx
- Changes needed:
  - entities.Business.update() for real save
  - entities.Business.list() to load current

### 7. ChatPanel.jsx (Modal)
- Changes needed:
  - apiPost('/api/agents/chat', {}) for chat
  - Store session_id from response
  - Pass session_id in next messages

### 8. VoiceModal.jsx (Modal)
- Changes needed:
  - New WebSocket: ws://localhost:3001/ws/voice
  - Send audio blobs as binary
  - Receive JSON transcripts
  - Display real-time streaming

## Status

Dashboard: ✅ DONE
Leads: ✅ DONE
Campaigns: ⏳ NEXT
Social: ⏳ NEXT
Intelligence: ⏳ NEXT
Settings: ⏳ NEXT
ChatPanel: ⏳ NEXT
VoiceModal: ⏳ NEXT
