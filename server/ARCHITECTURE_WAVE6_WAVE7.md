# Orion Agent Architecture — Wave 6 + Wave 7

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORION SUPERAGENT PLATFORM                    │
└─────────────────────────────────────────────────────────────────┘

                          USER INPUT
                             │
                             ▼
                   ┌──────────────────┐
                   │   SuperAgent     │
                   │ (Wave 7)         │
                   └────────┬─────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    Classifier         Intent Chain        Business Context
    - Extract intent     Routing            - Fetch from DB
    - Confidence score   ├─ Research        - Pass to agents
                         ├─ Strategy
                         └─ Execution

                   AGENT EXECUTION PIPELINE
         ┌──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Research Ag. │  │ Strategy Ag. │  │ Execution Ag.│
    │ (Wave 6)     │  │ (Wave 6)     │  │ (Wave 6)     │
    ├──────────────┤  ├──────────────┤  ├──────────────┤
    │ Input:       │  │ Input:       │  │ Input:       │
    │ - task       │  │ - task       │  │ - actions    │
    │ - context    │  │ - context    │  │ - context    │
    │ - research   │  │ - research   │  │              │
    │              │  │              │  │              │
    │ Process:     │  │ Process:     │  │ Process:     │
    │ 1. LLM call  │  │ 1. Fetch DB  │  │ 1. Loop      │
    │ 2. Search    │  │ 2. LLM call  │  │ 2. Create    │
    │ 3. Parse     │  │ 3. Output    │  │ 3. Track IDs │
    │              │  │    schema    │  │              │
    │ Output:      │  │ Output:      │  │ Output:      │
    │ - findings   │  │ - recommend  │  │ - results    │
    │ - summary    │  │ - action_pl  │  │ - summary    │
    └────────┬─────┘  └────────┬─────┘  └────────┬─────┘
             │                 │                 │
             ▼                 ▼                 ▼
        MongoDB         MongoDB          MongoDB
        Opportunity     (context)        Campaign
                                         Lead
                                         SocialPost

              ┌─────────────────────────┐
              │  USER APPROVAL GATE     │
              │  (Wave 7: Optional)     │
              └────────┬────────────────┘
                       │
                  [APPROVED/REJECTED]
                       │
                       ▼
              ┌──────────────────┐
              │  AgentTask       │
              │  MongoDB Doc     │
              ├──────────────────┤
              │ - status         │
              │ - steps []       │
              │ - records_creat. │
              │ - summary        │
              └──────────────────┘
```

## Wave 6: Agents (Individual)

### Research Agent
```
Task + Context
    ▼
LLM Research Call
    ▼
Structured Output (Zod)
    ▼
Parse Findings
    ▼
Save to MongoDB (Opportunity)
    ▼
Return: { findings[], summary, freshness }
```

### Strategy Agent
```
Task + Context + Research
    ▼
Fetch Recent Leads/Opportunities (DB)
    ▼
LLM Strategy Call
    ▼
Structured Output (Zod)
    ▼
Generate Recommendations + Action Plan
    ▼
Return: { recommendations[], action_plan[], summary }
```

### Execution Agent
```
Actions (Array)
    ▼
Loop Through Actions
    ├─ create_campaign → CampaignModel.create()
    ├─ draft_post → SocialPostModel.create()
    ├─ create_lead → LeadModel.create()
    └─ schedule_followup → LeadModel.update()
    ▼
Collect Results + IDs
    ▼
Return: { results[], outcome_summary }
```

## Wave 7: SuperAgent (Orchestrator)

```
User Task
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         │
[Phase 1] Create AgentTask (MongoDB)          │
    ▼                                         │
[Phase 2] Classify Intent                     │ Streaming
    ├─ find_leads                             │ callbacks
    ├─ track_competitors                      │ via onStep()
    ├─ generate_campaign                      │
    ├─ weekly_summary                         │
    ├─ brand_mentions                         │
    └─ general_chat                           │
    ▼                                         │
[Phase 3] Fetch Business Context              │
    ▼                                         │
[Phase 4] Select & Run Agent Chain            │
    ├─ Research (if in chain)                 │
    ├─ Strategy (if in chain)                 │
    └─ Execution (if in chain)                │
    ▼                                         │
[Phase 5] Approval Gate (if needed)           │
    ├─ User Rejects? → Save + Return          │
    └─ User Approves? → Continue              │
    ▼                                         │
[Phase 6] Execute if Approved                 │
    ▼                                         │
[Phase 7] Generate Summary                    │
    ▼                                         │
[Phase 8] Update AgentTask + Return           │
    │                                         │
    └─────────────────────────────────────────┘
         ▼
    Return SuperAgent Result
    {
      agentTaskId,
      intent,
      steps[],
      final_summary,
      records_created[]
    }
```

## Data Flow: Intent → Chain → Agents → Records

### Example: "Find 20 leads in tech"

```
Task: "Find 20 software startups in SF as leads"
│
├─ Classify: find_leads (0.95 confidence)
├─ Chain: [research, strategy, execution]
├─ Business: { id: 'demo', name: 'TechCorp', city: 'SF' }
│
├─ Run Research Agent
│  ├─ Input: "Find software startups in SF"
│  ├─ LLM: "Here are 20 startups..."
│  └─ Output: findings[] → Save as Opportunity docs
│
├─ Run Strategy Agent
│  ├─ Context: 10 recent leads + 10 opportunities
│  ├─ LLM: "Recommend outreach campaign"
│  └─ Output: [
│       { action_type: 'create_campaign', ... },
│       { action_type: 'create_lead', ... },
│       { action_type: 'draft_post', ... }
│     ]
│
├─ Ask User: "Approve these actions?"
│  └─ User clicks: ✅ APPROVE
│
├─ Run Execution Agent
│  ├─ Create Campaign doc
│  ├─ Create 5 Lead docs
│  ├─ Create 3 SocialPost docs
│  └─ Output: results[] with IDs
│
└─ Return: {
     agentTaskId: '507f1f77bcf86cd799439011',
     intent: 'find_leads',
     steps: [Classifier, Research, Strategy, UserGate, Execution, Summary],
     final_summary: 'Found 20 startup leads, created outreach campaign',
     records_created: [
       { entity_type: 'Campaign', entity_id: '...', description: '...' },
       { entity_type: 'Lead', entity_id: '...', description: '...' },
       { entity_type: 'Lead', entity_id: '...', description: '...' },
       ...
     ]
   }
```

## Component Dependencies

```
SuperAgent (orchestrator)
    │
    ├─→ researchAgent
    │   └─→ getLLM()
    │   └─→ getBrightDataTools()
    │   └─→ OpportunityModel
    │
    ├─→ strategyAgent
    │   └─→ getLLM()
    │   └─→ LeadModel
    │   └─→ OpportunityModel
    │
    ├─→ executionAgent
    │   └─→ CampaignModel
    │   └─→ SocialPostModel
    │   └─→ LeadModel
    │
    ├─→ getLLM()
    │   └─→ ChatOpenAI (AIML or TokenRouter)
    │
    └─→ AgentTaskModel
    └─→ BusinessModel
```

## Files (28KB Total)

```
Wave 6 Agents (13KB):
  researchAgent.ts      (5.6K) - 165 lines
  strategyAgent.ts      (5.0K) - 155 lines
  executionAgent.ts     (6.9K) - 230 lines
  agents.test.ts        (5.1K) - 165 lines
  
Wave 7 Orchestrator (21KB):
  superAgent.ts         (14K)  - 440 lines
  superAgent.test.ts    (7.1K) - 230 lines

Documentation (25KB):
  WAVE_6_AGENTS.md                 (5KB)
  WAVE_7_SUPERAGENT.md             (9KB)
  SUPERAGENT_EXAMPLES.ts           (10KB)
```

## Test Results

```
Wave 6 Tests: 3/3 ✅
  ✓ Research Agent generates findings structure
  ✓ Strategy Agent generates recommendations
  ✓ Execution Agent creates records

Wave 7 Tests: 5/5 ✅
  ✓ Classifies intent and executes full chain
  ✓ Handles user rejection of action plan
  ✓ Tracks all steps in AgentTask document
  ✓ Routes intents correctly (research-only)
  ✓ Creates records in MongoDB via AgentTask

Total: 8/8 ✅
```

## Next: Wave 8 - API Routes

Wrap SuperAgent in REST endpoints:

```
POST /api/agents/run              Stream SuperAgent via SSE
POST /api/agents/approve          Resume after approval
POST /api/agents/reject           Reject action plan
POST /api/agents/chat             Direct LLM chat
GET  /api/agents/runs             List tasks
```
