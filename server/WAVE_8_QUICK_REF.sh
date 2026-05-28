#!/usr/bin/env bash
# Wave 8: REST API + WebSocket Quick Reference

# =============================================================================
#                          AGENT ENDPOINTS
# =============================================================================

# Run SuperAgent (JSON response)
echo "1. Run SuperAgent (JSON):"
curl -X POST http://localhost:3001/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Find 10 leads in tech",
    "business_id": "demo",
    "skip_confirmation": false
  }'

# Run SuperAgent (SSE stream)
echo "2. Run SuperAgent (SSE Stream):"
curl -X POST http://localhost:3001/api/agents/run \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Find 10 leads in tech",
    "business_id": "demo"
  }'

# Approve action plan
echo "3. Approve Action Plan:"
curl -X POST http://localhost:3001/api/agents/approve \
  -H "Content-Type: application/json" \
  -d '{
    "agent_task_id": "507f1f77bcf86cd799439011"
  }'

# Reject action plan
echo "4. Reject Action Plan:"
curl -X POST http://localhost:3001/api/agents/reject \
  -H "Content-Type: application/json" \
  -d '{
    "agent_task_id": "507f1f77bcf86cd799439011",
    "reason": "Need more information"
  }'

# Chat with LLM
echo "5. Chat with LLM:"
curl -X POST http://localhost:3001/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are good ways to attract customers?",
    "business_id": "demo"
  }'

# List recent workflows
echo "6. List Recent Workflows:"
curl "http://localhost:3001/api/agents/runs?business_id=demo&limit=10&status=completed"

# =============================================================================
#                       INTELLIGENCE ENDPOINTS
# =============================================================================

# Market intelligence scan
echo "7. Market Intelligence Scan:"
curl -X POST http://localhost:3001/api/intelligence/scan \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "demo",
    "focus": "market_trends",
    "competitors": ["CompanyA", "CompanyB"]
  }'

# Check scan status (single)
echo "8. Check Scan Status (Single):"
curl "http://localhost:3001/api/intelligence/status?agent_run_id=507f1f77bcf86cd799439013"

# List scans for business
echo "9. List Scans for Business:"
curl "http://localhost:3001/api/intelligence/status?business_id=demo&limit=10"

# =============================================================================
#                        VOICE WEBSOCKET
# =============================================================================

# Connect to voice relay (browser JavaScript)
cat << 'VOICE'

// Browser: Connect to voice relay
const ws = new WebSocket('ws://localhost:3001/ws/voice?session=user123&business=demo');

ws.onopen = () => {
  console.log('Voice connection established');
};

// Get user's audio stream
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  const mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    ws.send(event.data);  // Send audio blob to server
  };
  
  mediaRecorder.start(100);  // Send 100ms chunks
});

// Receive transcripts
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connected':
      console.log('Voice ready');
      break;
    case 'partial':
      console.log('Partial:', message.text);
      break;
    case 'final':
      console.log('Final:', message.text);
      // Maybe send to agent here
      break;
    case 'error':
      console.error('Error:', message.error);
      break;
  }
};

ws.onclose = () => {
  console.log('Voice connection closed');
  mediaRecorder.stop();
};

VOICE

# =============================================================================
#                          FOCUS AREAS
# =============================================================================

# Intelligence scan focus options:
cat << 'FOCUS'

Focus Areas for /api/intelligence/scan:

1. "market_trends" (default)
   - Current market trends
   - Emerging technologies
   - Industry shifts

2. "competitors"
   - Competitor strategies
   - Marketing approaches
   - Recent activities

3. "customer_insights"
   - Customer pain points
   - Unmet needs
   - Buying behavior

4. "opportunities"
   - Business growth areas
   - Expansion markets
   - Untapped segments

5. "general"
   - Comprehensive scan
   - All of the above

FOCUS

# =============================================================================
#                        RESPONSE FORMATS
# =============================================================================

# Agent run response
cat << 'AGENT_RUN'

POST /api/agents/run response:
{
  "agentTaskId": "507f1f77bcf86cd799439011",
  "intent": "find_leads",
  "steps": [
    {
      "agent": "Classifier",
      "action": "Classified: find_leads",
      "status": "completed"
    },
    {
      "agent": "Research Agent",
      "action": "Scanning web data",
      "status": "completed"
    }
  ],
  "final_summary": "Found 20 tech leads...",
  "records_created": [
    {
      "entity_type": "Campaign",
      "entity_id": "507f...",
      "description": "Tech outreach campaign"
    }
  ]
}

AGENT_RUN

# Chat response
cat << 'CHAT'

POST /api/agents/chat response:
{
  "reply": "Here are some effective customer acquisition strategies...",
  "session_id": "507f1f77bcf86cd799439012",
  "messages": [
    {
      "role": "user",
      "content": "What are good ways to attract customers?"
    },
    {
      "role": "assistant",
      "content": "Here are some effective..."
    }
  ]
}

CHAT

# Intelligence response
cat << 'INTELLIGENCE'

POST /api/intelligence/scan response:
{
  "agentRunId": "507f1f77bcf86cd799439013",
  "business_id": "demo",
  "scan_type": "market_intelligence",
  "opportunities": [
    {
      "title": "AI Automation Trend",
      "description": "Growing demand for AI automation...",
      "category": "trend",
      "urgency": "high",
      "impact_score": 8,
      "source": "Market Research",
      "suggested_action": "Launch AI feature"
    }
  ],
  "summary": "Key market insights...",
  "data_freshness": "2026-05-28",
  "created_at": "2026-05-28T03:15:00.000Z"
}

INTELLIGENCE

echo "✓ Wave 8 Quick Reference Ready"
