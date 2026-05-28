# Wave 6: Agent Modules Implementation

## ✅ Completed

### 1. Research Agent (`src/agents/researchAgent.ts`)
- **Purpose**: Scans web data and generates structured market research findings
- **Inputs**: task, businessContext, onStep callback
- **Process**:
  - Calls LLM with research prompt (business context + task)
  - Structures output into findings with title, description, category, urgency, impact_score, source, suggested_action
  - Saves each finding as an Opportunity in MongoDB
- **Outputs**: `{ findings: [...], summary, data_freshness }`
- **Features**:
  - ✓ Graceful fallback when Bright Data tools unavailable
  - ✓ Structured output via Zod + `withStructuredOutput()`
  - ✓ Step callbacks for frontend progress tracking

### 2. Strategy Agent (`src/agents/strategyAgent.ts`)
- **Purpose**: Analyzes business data + research findings, generates strategic recommendations
- **Inputs**: task, businessContext, researchFindings, onStep callback
- **Process**:
  - Fetches recent Leads (limit 10) and Opportunities (limit 10) from MongoDB for context
  - Builds strategy prompt combining business data + research insights
  - Calls LLM with structured output schema
  - Returns recommendations (title, rationale, priority, effort) + action_plan
- **Outputs**: `{ recommendations: [...], action_plan: [...], summary }`
- **Features**:
  - ✓ Real database context (Leads, Opportunities)
  - ✓ Structured recommendations with priority/effort levels
  - ✓ Action plan with typed actions

### 3. Execution Agent (`src/agents/executionAgent.ts`)
- **Purpose**: Executes action plans by creating/updating database records
- **Inputs**: actions (list), businessContext, onStep callback
- **Process**:
  - Iterates through actions: create_campaign, draft_post, create_lead, schedule_followup
  - Creates corresponding MongoDB documents
  - Returns results with record IDs
- **Outputs**: `{ results: [{entity_type, record_id, description}], outcome_summary }`
- **Handlers**:
  - `create_campaign` → Campaign (status: draft, ai_generated: true)
  - `draft_post` → SocialPost (status: draft, ai_generated: true)
  - `create_lead` → Lead (source: other, status: new)
  - `schedule_followup` → Updates existing Lead with follow_up_date

### 4. Agent Index (`src/agents/index.ts`)
- Exports all three agent functions for easy importing

### 5. Integration Tests (`src/agents/agents.test.ts`)
- ✅ 3/3 tests passing
- Tests structure validation:
  - Research Agent: findings array with title, description, urgency, etc.
  - Strategy Agent: recommendations with priority/effort
  - Execution Agent: Creates Campaign, SocialPost, Lead records

---

## 🏗 Architecture

### Agent Chain Pattern
```
task → classify intent → select agent chain → run agents in sequence:
                          ↓
                       [research] → findings
                          ↓
                       [strategy] → recommendations
                          ↓
                       [execution] → records created
```

### Data Flow
```
LLM API (AIML/TokenRouter)
    ↑
    └─ Research Agent (struct findings) → MongoDB Opportunities
    └─ Strategy Agent (fetch context) ← MongoDB Leads/Opportunities
    └─ Execution Agent (create records) → MongoDB Campaign/Lead/SocialPost
```

### Callback Pattern
```typescript
onStep({
  agent: 'Research Agent',
  action: 'Scanning live web data via Bright Data…',
  status: 'running' | 'complete' | 'error'
})
```
Used by frontend to track real-time progress.

---

## 📦 Dependencies Added

- Already had: `@langchain/openai`, `langchain`, `zod`, MongoDB models
- No new packages needed

---

## 🧪 Test Results

```
✓ Research Agent generates findings structure
✓ Strategy Agent generates recommendations
✓ Execution Agent creates records

3/3 passing
```

---

## 🔗 Integration Points

### To SuperAgent (Wave 7)
- Import: `{ runResearchAgent, runStrategyAgent, runExecutionAgent }`
- Used to orchestrate agent chains based on intent classification

### To API Routes (Wave 8)
- `/api/agents/run` calls SuperAgent orchestrator
- `/api/agents/approve` calls Execution Agent after user approval
- `/api/agents/chat` calls LLM directly (no agents needed)

### To Frontend (Wave 9)
- Step callbacks stream progress via SSE or WebSocket
- Results saved to MongoDB as AgentTask documents with all steps

---

## 💡 Next Steps (Wave 7: SuperAgent Orchestrator)

1. Create `src/agents/superAgent.ts`:
   - Intent classification function
   - `runSuperAgent()` function that routes to agent chains
   - AgentTask document creation/updates

2. Agent chain routing:
   - `find_leads` → [research, strategy, execution]
   - `track_competitors` → [research]
   - `generate_campaign` → [strategy, execution]
   - `weekly_summary` → [strategy]
   - `brand_mentions` → [research]
   - `general_chat` → [general (no agents)]

3. Confirmation gate:
   - Stop before execution unless `skipConfirmation=true`
   - Allow user to review action_plan before creating records

4. Error handling & logging:
   - Save all steps to AgentTask document
   - Update status: running → awaiting_approval → completed/rejected/failed
   - Record error_message if any agent fails
