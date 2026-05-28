# Wave 7: SuperAgent Orchestrator Implementation

## ✅ Completed

### 1. SuperAgent Orchestrator (`src/agents/superAgent.ts`)

**Purpose**: 
- Intent classification: Convert user tasks into predefined intents
- Agent chain routing: Select appropriate agents based on intent
- Workflow orchestration: Run agents in sequence with state tracking
- Human-in-loop approval gate: Allow users to review/reject action plans before execution
- Full audit trail: Save all steps and results to AgentTask MongoDB documents

### 2. Intent Classification

**Supported Intents**:
```typescript
'find_leads'        → search for new customers/business leads
'track_competitors' → monitor and analyze competitors
'generate_campaign' → create marketing campaigns or content
'weekly_summary'    → generate periodic reports or summaries
'brand_mentions'    → find and track brand mentions online
'general_chat'      → general conversation (no agents used)
```

**Classification Process**:
- LLM analyzes user task
- Returns structured output: `{ intent, confidence: 0.0-1.0, context: {...} }`
- Example confidence scores: 0.95 (find_leads), 0.87 (track_competitors)

### 3. Agent Chain Routing

**Intent → Agent Chain Mapping**:
```typescript
{
  find_leads:        ['research', 'strategy', 'execution'],    // 3-agent pipeline
  track_competitors: ['research'],                              // research-only
  generate_campaign: ['strategy', 'execution'],                 // no research
  weekly_summary:    ['strategy'],                              // strategy-only
  brand_mentions:    ['research'],                              // research-only
  general_chat:      [],                                        // no agents
}
```

**Execution Flow**:
```
Task Input
    ↓
[Classifier] → Intent Classification
    ↓
[Research Agent] → Market data + findings (if in chain)
    ↓
[Strategy Agent] → Recommendations + action plan (if in chain)
    ↓
[User Approval Gate] → Confirm action plan (if skipConfirmation=false)
    ↓
[Execution Agent] → Create records (if in chain + approved)
    ↓
[Summary Generator] → Generate final summary
    ↓
Result (agentTaskId, steps, records_created)
```

### 4. Workflow Phases

#### Phase 1: Create AgentTask Document
- Initialize MongoDB AgentTask with `status: 'running'`
- Store business_id, task, timestamp

#### Phase 2: Intent Classification
- Call LLM with classification prompt
- Extract intent and confidence level
- Log classifier step

#### Phase 3: Fetch Business Context
- Query Business model by ID
- Use for research/strategy prompts

#### Phase 4: Execute Agent Chain
**Research Agent** (if in chain):
- Scan for market data + findings
- Save Opportunities to MongoDB
- Track step: action + findings count

**Strategy Agent** (if in chain):
- Fetch recent Leads/Opportunities for context
- Generate recommendations + action_plan
- Track step: action + recommendations count

#### Phase 5: User Approval Gate
- If `skipConfirmation=true`: skip gate
- If `skipConfirmation=false`: call `onConfirm(actionPlan)` callback
- Allowed responses:
  - `true` → proceed to execution
  - `false` → reject, save to AgentTask, return with `status: 'rejected'`

#### Phase 6: Execution Agent
- Execute action_plan from Strategy Agent
- Create Campaign/Lead/SocialPost records
- Track step: action + results count
- Collect all record IDs in `records_created`

#### Phase 7: Generate Summary
- Call LLM to summarize workflow
- Include: intent, steps, records count
- Return as `final_summary`

#### Phase 8: Update AgentTask with Results
- Save all steps + records_created
- Update status: `'running'` → `'completed'/'rejected'/'failed'`
- Store final_summary

### 5. Callback Patterns

**onStep Callback**:
```typescript
onStep?.({
  agent: 'Research Agent' | 'Strategy Agent' | 'Execution Agent' | 'SuperAgent',
  action: 'Scanning live web data via Bright Data…',
  status: 'running' | 'complete' | 'error'
})
```
**Used by**: Frontend SSE/WebSocket to show real-time progress

**onConfirm Callback**:
```typescript
const approved = await onConfirm?.(actionPlan);
// actionPlan = [
//   { action_type: 'create_campaign', description: '...', entity_data: {...} },
//   { action_type: 'draft_post', description: '...', entity_data: {...} }
// ]
// Returns: true (proceed) | false (reject)
```
**Used by**: Frontend approval gate modal/dialog

### 6. Data Structures

**AgentStep**:
```typescript
{
  agent: 'Research Agent' | 'Strategy Agent' | 'Execution Agent' | 'Classifier',
  action: 'Description of what was done',
  result?: 'JSON stringified result data',
  status: 'running' | 'completed' | 'failed' | 'awaiting_approval' | 'approved' | 'rejected',
  error?: 'Error message if status=failed'
}
```

**Result Record**:
```typescript
{
  entity_type: 'Campaign' | 'Lead' | 'SocialPost',
  entity_id: 'MongoDB ObjectId as string',
  description: 'Human-readable summary'
}
```

**SuperAgent Return Value**:
```typescript
{
  agentTaskId: 'MongoDB ObjectId',
  intent: 'find_leads' | 'track_competitors' | ...,
  steps: [
    { agent, action, status, result?, error? }
  ],
  final_summary: 'LLM-generated summary of workflow',
  records_created: [
    { entity_type, entity_id, description }
  ]
}
```

### 7. Error Handling

**Catches and Logs**:
- Research Agent failures → save error step + fail workflow
- Strategy Agent failures → save error step + fail workflow
- Execution Agent failures → save error step + fail workflow
- LLM classification failures → propagate error

**Recovery**:
- Attempts to update AgentTask with error status
- Returns error via `onStep` callback
- Throws error to caller (frontend can show error notification)

### 8. Integration Tests

**5/5 Tests Passing**:
```
✓ classifies "find leads" intent and executes full chain
✓ handles user rejection of action plan
✓ tracks all steps in AgentTask document
✓ routes intents correctly (research-only)
✓ creates records in MongoDB via AgentTask
```

---

## 🏗 Architecture Patterns

### Single Responsibility
- **Classifier**: Intent classification only
- **Research Agent**: Market research only
- **Strategy Agent**: Recommendations only
- **Execution Agent**: Record creation only
- **SuperAgent**: Orchestration only

### Composition Over Inheritance
- Agent functions composed into chains
- No base class needed (pure functions)
- Easy to add new agents or intents

### Audit Trail
- Every step saved to AgentTask
- Preserves action sequence for debugging
- Records exactly which entities were created

### Human-in-Loop
- Approval gate before risky operations (record creation)
- User can review action_plan before execution
- Can reject without side effects (only strategy phase executed)

---

## 🔗 Integration Points

### From Frontend
```typescript
// Call SuperAgent with user task
const result = await fetch('/api/agents/run', {
  method: 'POST',
  body: JSON.stringify({
    task: 'Find 10 leads in tech industry',
    business_id: 'demo'
  })
});
```

### To Database
- Creates AgentTask document with full workflow history
- Research Agent creates Opportunity documents
- Execution Agent creates Campaign/Lead/SocialPost documents

### To Next Waves
**Wave 8 (API Routes)**:
- Wraps SuperAgent in REST endpoints
- `/api/agents/run` → stream via SSE or return full result
- `/api/agents/approve` → resumes execution after user approval
- `/api/agents/reject` → rejects without execution

**Wave 9 (Frontend Wiring)**:
- Agents page calls `/api/agents/run`
- Shows step progress via SSE/WebSocket
- Displays action plan approval dialog
- Shows final results + created records

**Wave 10 (Scheduler)**:
- ScheduledTask runner calls SuperAgent with `skipConfirmation=true`
- Runs agents unattended on schedule
- Saves AgentTask for audit trail

---

## 💡 Example Usage

### Find Leads (Full Chain)
```typescript
const result = await runSuperAgent({
  task: 'Find 20 tech startups in SF as potential leads',
  businessId: 'demo',
  options: { skipConfirmation: false },
  onStep: (step) => console.log(`[${step.agent}] ${step.action}`),
  onConfirm: async (actionPlan) => {
    console.log('Action plan:', actionPlan);
    return userClickedApprove(); // User confirms
  }
});
// Result: {
//   intent: 'find_leads',
//   steps: [Classifier, Research, Strategy, UserGate, Execution, Summary],
//   records_created: [Campaign, Lead, Lead, ...],
//   final_summary: '...'
// }
```

### Track Competitors (Research Only)
```typescript
const result = await runSuperAgent({
  task: 'What are our competitors doing this week?',
  businessId: 'demo',
  options: { skipConfirmation: true },
  onStep: (step) => {}
});
// Result: {
//   intent: 'track_competitors',
//   steps: [Classifier, Research, Summary],
//   records_created: [], // No execution
//   final_summary: '...'
// }
```

### Scheduled Task (Auto-Execute)
```typescript
const result = await runSuperAgent({
  task: taskDescription,
  businessId,
  options: { skipConfirmation: true }, // Skip approval gate
  onStep: () => {} // Silent
});
// Saved to MongoDB for audit trail
```

---

## 📋 Next Steps (Wave 8: API Routes)

- [ ] Create `src/routes/agents.ts`
- [ ] `POST /api/agents/run` → Stream SuperAgent steps via SSE
- [ ] `POST /api/agents/approve` → Resume execution after approval
- [ ] `POST /api/agents/reject` → Reject action plan
- [ ] `POST /api/agents/chat` → Direct LLM chat (no agents)
- [ ] `GET /api/agents/runs` → List recent AgentTask records
- [ ] Mount routes in `src/index.ts`
