#!/bin/bash
# Wave 7 SuperAgent Quick Reference

## Test All Agents

# Run all agent tests (Wave 6 + Wave 7)
cd server
npx tsx --test src/agents/*.test.ts

# Run only SuperAgent tests
npx tsx --test src/agents/superAgent.test.ts

## Verify TypeScript

# Check for type errors
npx tsc --noEmit src/agents/superAgent.ts

# Build all agents
npx tsc src/agents/*.ts

## File Structure

server/src/agents/
├── researchAgent.ts          (Wave 6) Research + findings
├── strategyAgent.ts          (Wave 6) Recommendations
├── executionAgent.ts         (Wave 6) Record creation
├── superAgent.ts             (Wave 7) Orchestrator + intent
├── index.ts                  (Exports all agents)
├── agents.test.ts            (Wave 6 tests) - 3 passing
└── superAgent.test.ts        (Wave 7 tests) - 5 passing

## Key Functions

### SuperAgent Main Function
runSuperAgent({
  task: string,                      // User request
  businessId: string,                // Business ID
  options: { skipConfirmation?: bool },
  onStep?: (step) => void,          // Progress callback
  onConfirm?: (plan) => bool        // Approval callback
})
→ {
  agentTaskId: string,
  intent: 'find_leads' | 'track_competitors' | ...,
  steps: AgentStep[],
  final_summary: string,
  records_created: RecordResult[]
}

### Intent Classification
classifyIntent(task, llm)
→ { intent, confidence: 0.0-1.0, context }

## Intent → Chain Mapping

find_leads          → [research, strategy, execution]
track_competitors   → [research]
generate_campaign   → [strategy, execution]
weekly_summary      → [strategy]
brand_mentions      → [research]
general_chat        → []

## Test Results

✅ 5/5 SuperAgent tests passing
   - Intent classification
   - Full chain execution
   - User rejection handling
   - Step tracking
   - Record creation

✅ 3/3 Agent tests passing (Wave 6)
   - Research agent
   - Strategy agent
   - Execution agent

## Next: Wave 8 - API Routes

POST /api/agents/run              Run SuperAgent
POST /api/agents/approve          Approve action plan
POST /api/agents/reject           Reject action plan
POST /api/agents/chat             Direct LLM chat
GET  /api/agents/runs             List recent tasks
