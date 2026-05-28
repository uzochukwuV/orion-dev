# Implementation Plan: Orion SuperAgent Platform

## Overview

Build a Node.js/Express backend that powers all AI agent logic, MongoDB persistence, LangChain.js orchestration with Bright Data MCP tools, and Speechmatics real-time voice. The existing React frontend stays as-is — we replace the `base44` SDK calls with calls to our own REST/WebSocket API.

**Stack:**
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB Atlas (Mongoose ODM)
- **AI Orchestration**: LangChain.js (`@langchain/langgraph`, `@langchain/openai`, `@langchain/mcp-adapters`)
- **LLM Providers**: AI/ML API (`https://api.aimlapi.com/v1`, OpenAI-compatible) + Gemini via `@langchain/google-genai` + TokenRouter fallback
- **Web Data**: Bright Data MCP Server via `@langchain/mcp-adapters`
- **Voice STT**: Speechmatics real-time WebSocket (`@speechmatics/real-time-client`)
- **Voice TTS**: Browser Web Speech Synthesis (frontend, no change)
- **Frontend**: React + Vite (existing, no structural changes)

---

## Tasks

- [-] 1. Initialize Node.js backend project
  - Create `server/` directory at project root
  - Run `npm init -y` inside `server/`
  - Install core dependencies: `express`, `cors`, `dotenv`, `mongoose`, `helmet`, `morgan`, `express-async-errors`
  - Install TypeScript tooling: `typescript`, `ts-node`, `tsx`, `@types/express`, `@types/node`, `@types/cors`, `@types/morgan`
  - Create `server/tsconfig.json` with `module: NodeNext`, `target: ES2022`, `strict: true`, `outDir: dist`
  - Create `server/src/index.ts` — Express app entry point with CORS (allow `http://localhost:5173`), JSON body parser, helmet, morgan, and a `GET /health` route returning `{ status: 'ok' }`
  - Create `server/.env.example` with all required env vars: `MONGODB_URI`, `AIMLAPI_KEY`, `AIMLAPI_BASE_URL=https://api.aimlapi.com/v1`, `GEMINI_API_KEY`, `TOKENROUTER_API_KEY`, `BRIGHT_DATA_API_KEY`, `SPEECHMATICS_API_KEY`, `PORT=3001`
  - Add `server/` to `.gitignore` node_modules and dist
  - _Requirements: Backend foundation_

- [x] 2. MongoDB connection and Mongoose setup
  - Create `server/src/db/connection.ts` — connects to MongoDB Atlas using `MONGODB_URI` env var, logs connection status, exports `connectDB()`
  - Call `connectDB()` in `server/src/index.ts` before starting the HTTP server
  - Create `server/src/db/models/Business.ts` — Mongoose schema matching `entities/Business.json` exactly, export `BusinessModel`
  - Create `server/src/db/models/Lead.ts` — Mongoose schema matching `entities/Lead.json`, export `LeadModel`
  - Create `server/src/db/models/Campaign.ts` — Mongoose schema matching `entities/Campiagns.json`, export `CampaignModel`
  - Create `server/src/db/models/Opportunity.ts` — Mongoose schema matching `entities/Opportunity.json`, export `OpportunityModel`
  - Create `server/src/db/models/SocialPost.ts` — Mongoose schema matching `entities/SocialPost.json`, export `SocialPostModel`
  - Create `server/src/db/models/AgentRun.ts` — Mongoose schema matching `entities/AgentRun.json`, export `AgentRunModel`
  - Create `server/src/db/models/ChatSession.ts` — Mongoose schema matching `entities/ChatSession.json`, export `ChatSessionModel`
  - Create `server/src/db/models/AgentTask.ts` — new schema: `{ business_id, session_id, task, agent_chain: [String], status: enum(running|awaiting_approval|completed|rejected|failed), steps: [{agent,action,result,status}], final_summary, records_created: [{entity_type,entity_id,description}] }`, export `AgentTaskModel` Create an Index Define a search or vector search index to start querying your data. You can define multiple indexes and these indexes can be modified later on
  - Create `server/src/db/models/ScheduledTask.ts` — new schema: `{ business_id, name, task_description, frequency: enum(daily|weekly|monthly), day_of_week, time_of_day, enabled: Boolean default true, last_run, next_run, last_result, run_count: Number default 0 }`, export `ScheduledTaskModel`
  - Create `server/src/db/index.ts` — re-exports all models
  - _Requirements: Data layer_

- [x] 3. Generic CRUD REST API for all entities
  - Create `server/src/routes/entities.ts` — a generic router factory `createEntityRouter(Model)` that mounts:
    - `GET /` — list with optional `?sort=-created_at&limit=20` query params
    - `GET /:id` — find by ID
    - `POST /` — create, auto-set `created_at`
    - `PUT /:id` — update by ID (partial merge)
    - `DELETE /:id` — delete by ID
  - Mount entity routers in `server/src/index.ts`:
    - `/api/entities/Business` → BusinessModel
    - `/api/entities/Lead` → LeadModel
    - `/api/entities/Campaign` → CampaignModel
    - `/api/entities/Opportunity` → OpportunityModel
    - `/api/entities/SocialPost` → SocialPostModel
    - `/api/entities/AgentRun` → AgentRunModel
    - `/api/entities/ChatSession` → ChatSessionModel
    - `/api/entities/AgentTask` → AgentTaskModel
    - `/api/entities/ScheduledTask` → ScheduledTaskModel
  - Add global error handler middleware in `server/src/index.ts` that returns `{ error: message }` with appropriate status codes
  - _Requirements: Entity persistence API_

- [x] 4. Frontend API client — replace base44 with backend calls
  - Create `src/api/client.ts` — a typed fetch wrapper:
    - `BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'`
    - `apiGet(path, params?)`, `apiPost(path, body)`, `apiPut(path, body)`, `apiDelete(path)` — all return typed responses, throw on non-2xx
  - Create `src/api/entities.ts` — typed entity API functions mirroring the base44 SDK interface:
    - `entities.Lead.list(sort, limit)`, `entities.Lead.create(data)`, `entities.Lead.update(id, data)`
    - Same pattern for Campaign, Opportunity, SocialPost, AgentRun, ChatSession, AgentTask, ScheduledTask, Business
  - Update `src/api/base44Client.js` to re-export from `src/api/entities.ts` so existing page imports keep working without changes
  - Add `VITE_API_URL=http://localhost:3001` to a new `src/.env.local` file
  - _Requirements: Frontend-backend wiring_

- [ ] 5. LangChain.js LLM provider setup
  - Install: `@langchain/openai`, `langchain`, `@langchain/core`
  - Create `server/src/llm/providers.ts`:
    - `getAIMLModel(modelId?)` — returns `ChatOpenAI` with `baseURL: process.env.AIMLAPI_BASE_URL`, `apiKey: process.env.AIMLAPI_KEY`, default model `"mistralai/Mistral-7B-Instruct-v0.2"`
    - `getTokenroutermodel(modelId?)`
    - `getDefaultModel()` — tries AIML first, falls back to tokenrouter if `AIMLAPI_KEY` not set
    - Export `llm` — the default model instance used by all agents
  - Create `server/src/llm/index.ts` — re-exports `llm`, `getAIMLModel`, `getTokenrouterModel`
  - _Requirements: LLM provider layer_

- [ ] 6. Bright Data MCP integration
  - Install: `@langchain/mcp-adapters`, `@modelcontextprotocol/sdk`
  - Create `server/src/tools/brightdata.ts`:
    - `initBrightDataTools()` — async function that creates an `MCPClient` connecting to the Bright Data MCP server via stdio transport using `BRIGHT_DATA_API_KEY`
    - Loads all available tools from the MCP server
    - Returns array of LangChain `StructuredTool` instances
    - Caches the tool list after first init (singleton pattern)
  - Create `server/src/tools/index.ts` — exports `getBrightDataTools()` which calls `initBrightDataTools()`
  - Add error handling: if Bright Data MCP is unavailable, log warning and return empty array (agents degrade gracefully)
  - _Requirements: Live web data tools_

- [ ] 7. Research Agent
  - Create `server/src/agents/researchAgent.ts`
  - Import `llm` from providers, `getBrightDataTools` from tools
  - `runResearchAgent({ task, businessContext, onStep })`:
    - Calls `onStep({ agent: 'Research Agent', action: 'Scanning live web data via Bright Data…', status: 'running' })`
    - Creates a LangChain `AgentExecutor` with the LLM + Bright Data tools using `createReactAgent` from `langchain/agents`
    - Builds a research prompt including business name, type, city, competitors from `businessContext`
    - Invokes the agent with the task
    - Parses the output into structured findings using a second LLM call with `withStructuredOutput` and `RESEARCH_OUTPUT_SCHEMA` (zod schema: `{ findings: [{title, description, category, urgency, impact_score, source, suggested_action}], summary, data_freshness }`)
    - Saves each finding as an `Opportunity` document in MongoDB
    - Calls `onStep({ agent: 'Research Agent', action: 'Found N insights ✓', status: 'complete' })`
    - Returns `{ findings, summary, data_freshness }`
  - Export `runResearchAgent`
  - _Requirements: Research Agent with live web data_

- [ ] 8. Strategy Agent
  - Create `server/src/agents/strategyAgent.ts`
  - `runStrategyAgent({ task, businessContext, researchFindings, onStep })`:
    - Calls `onStep({ agent: 'Strategy Agent', action: 'Analyzing business data…', status: 'running' })`
    - Fetches recent Leads (limit 10) and Opportunities (limit 10) from MongoDB for context
    - Builds a strategy prompt combining business data + research findings
    - Calls `llm.withStructuredOutput(STRATEGY_SCHEMA)` where `STRATEGY_SCHEMA` (zod): `{ recommendations: [{title, rationale, priority, effort}], action_plan: [{action_type, description, entity_data}], summary }`
    - Calls `onStep({ agent: 'Strategy Agent', action: 'Generated N recommendations ✓', status: 'complete' })`
    - Returns `{ recommendations, action_plan, summary }`
  - Export `runStrategyAgent`
  - _Requirements: Strategy Agent_

- [ ] 9. Execution Agent
  - Create `server/src/agents/executionAgent.ts`
  - `runExecutionAgent({ actions, businessContext, onStep })`:
    - For each action in `actions`:
      - `create_campaign`: creates `CampaignModel` doc with `ai_generated: true`, `status: 'draft'`
      - `draft_post`: creates `SocialPostModel` doc with `ai_generated: true`, `status: 'draft'`
      - `create_lead`: creates `LeadModel` doc with `source: 'other'`, `status: 'new'`
      - `schedule_followup`: updates existing Lead `follow_up_date`
      - Calls `onStep` per action with running/complete status
    - Returns `{ results: [{type, record}], outcome_summary }`
  - Export `runExecutionAgent`
  - _Requirements: Execution Agent_

- [ ] 10. SuperAgent orchestrator
  - Create `server/src/agents/superAgent.ts`
  - `INTENT_CHAINS` map: `{ find_leads: ['research','strategy','execution'], track_competitors: ['research'], generate_campaign: ['strategy','execution'], weekly_summary: ['strategy'], brand_mentions: ['research'], general_chat: ['general'] }`
  - `classifyIntent(task, llm)` — calls `llm.withStructuredOutput({ intent: z.string(), confidence: z.number(), context: z.object({}).passthrough() })` with a classification prompt, returns `{ intent, agent_chain, context }`
  - `runSuperAgent({ task, businessId, options, onStep, onConfirm })`:
    - Creates an `AgentTask` MongoDB doc with `status: 'running'`
    - Calls `classifyIntent` to get agent chain
    - Fetches `Business` doc for `businessContext`
    - Runs agents in sequence: research → strategy → execution (with `onConfirm` gate before execution)
    - If `options.skipConfirmation === true`: skips the confirm gate (for scheduled tasks)
    - On completion: updates `AgentTask` to `status: 'completed'` with all steps and `final_summary`
    - On error: updates `AgentTask` to `status: 'failed'` with `error_message`
    - Returns `{ agentTaskId, steps, final_summary, records_created }`
  - Export `runSuperAgent`
  - _Requirements: SuperAgent orchestration_

- [ ] 11. Agent REST API routes
  - Create `server/src/routes/agents.ts`
  - `POST /api/agents/run` — body: `{ task, business_id, skip_confirmation? }` → calls `runSuperAgent`, streams step events via SSE (`text/event-stream`) or returns full result if SSE not requested
  - `POST /api/agents/approve` — body: `{ agent_task_id, actions }` → resumes execution after user approval, calls `runExecutionAgent`
  - `POST /api/agents/reject` — body: `{ agent_task_id }` → updates AgentTask to `status: 'rejected'`
  - `POST /api/agents/chat` — body: `{ message, session_id, business_id }` → general chat using `llm` with conversation history from `ChatSession`, saves messages to ChatSession, returns `{ reply, session_id }`
  - `GET /api/agents/runs` — returns recent `AgentTask` records for a business
  - Mount in `server/src/index.ts` at `/api/agents`
  - _Requirements: Agent API endpoints_

- [ ] 12. Intelligence / market scan API route
  - Create `server/src/routes/intelligence.ts`
  - `POST /api/intelligence/scan` — body: `{ business_id, competitors? }`:
    - Fetches Business doc for context
    - Calls `runResearchAgent` with `add_context_from_internet: true` via Bright Data tools
    - Returns `{ opportunities: [...], summary, data_freshness }`
    - Saves an `AgentRun` record with `agent_type: 'market_intelligence'`
  - Mount in `server/src/index.ts` at `/api/intelligence`
  - _Requirements: Intelligence page backend_

- [ ] 13. Speechmatics real-time voice WebSocket
  - Install: `@speechmatics/real-time-client`, `ws`
  - Create `server/src/voice/speechmaticsRelay.ts`:
    - Exports `setupVoiceWebSocket(httpServer)` — attaches a `ws.WebSocketServer` at path `/ws/voice`
    - On client connect: creates a `RealtimeClient` from `@speechmatics/real-time-client` with `apiKey: process.env.SPEECHMATICS_API_KEY`
    - Starts a Speechmatics session with `{ transcription_config: { language: 'en', enable_partials: true, max_delay: 2 } }`
    - Forwards binary audio chunks from the browser WebSocket to Speechmatics
    - Forwards Speechmatics transcript events back to the browser as JSON: `{ type: 'transcript', text, is_final }`
    - On final transcript: optionally calls `runSuperAgent` and sends back `{ type: 'agent_response', ... }`
    - Handles disconnect and cleanup
  - Call `setupVoiceWebSocket(server)` in `server/src/index.ts` after `server.listen()`
  - _Requirements: Speechmatics voice STT_

- [ ] 14. Update frontend VoiceModal to use Speechmatics WebSocket
  - Modify `src/components/voice/VoiceModal.jsx`
  - Replace `window.SpeechRecognition` with a `WebSocket` connection to `ws://localhost:3001/ws/voice`
  - On open: set `isConnected = true`
  - On mic button click: start capturing audio via `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`, send binary chunks over WebSocket
  - On WebSocket message `type: 'transcript'`: update `transcript` state (show partials in real-time)
  - On WebSocket message `type: 'agent_response'`: show response, speak via `window.speechSynthesis`
  - On stop: send a stop signal, close MediaRecorder
  - Keep existing UI (mic button, transcript display, response display) — only replace the data source
  - _Requirements: Voice frontend wiring_

- [ ] 15. Update frontend ChatPanel to use backend API
  - Modify `src/components/chat/ChatPanel.jsx`
  - Replace `base44.integrations.Core.InvokeLLM` call with `apiPost('/api/agents/chat', { message, session_id, business_id: 'demo' })`
  - Store `session_id` in component state (null on first message, use returned `session_id` for subsequent messages)
  - Keep existing UI unchanged
  - _Requirements: Chat frontend wiring_

- [ ] 16. Update frontend Intelligence page to use backend API
  - Modify `src/pages/Intelligence.jsx`
  - Replace `base44.integrations.Core.InvokeLLM` scan call with `apiPost('/api/intelligence/scan', { business_id: 'demo' })`
  - Replace `base44.entities.Opportunity.*` calls with `entities.Opportunity.*` from `src/api/entities.ts`
  - Fix TypeScript error: cast LLM response as typed object before accessing `.opportunities`
  - Keep existing UI unchanged
  - _Requirements: Intelligence page wiring_

- [ ] 17. Update frontend Agents page to use backend API
  - Modify `src/pages/Agents.jsx`
  - Replace `base44.integrations.Core.InvokeLLM` calls with `apiPost('/api/agents/run', { task: agent.prompt, business_id: 'demo' })`
  - Replace `base44.entities.AgentRun.*` calls with `entities.AgentRun.*` from `src/api/entities.ts`
  - Fix TypeScript error: cast `res` as string before calling `.substring()`
  - Keep existing UI unchanged
  - _Requirements: Agents page wiring_

- [ ] 18. Update remaining frontend pages to use entity API
  - Modify `src/pages/Dashboard.jsx`:
    - Replace all `base44.entities.*` calls with `entities.*` from `src/api/entities.ts`
    - Remove unused icon imports (`Share2`, `ArrowUpRight`, `AlertCircle`, `CheckCircle2`, `Clock`)
    - Remove unused `loading` state variable
  - Modify `src/pages/Leads.jsx`:
    - Replace `base44.entities.Lead.*` with `entities.Lead.*`
    - Replace `base44.integrations.Core.InvokeLLM` follow-up call with `apiPost('/api/agents/chat', { message: prompt, business_id: 'demo' })`
    - Remove unused imports (`Phone`, `Mail`, `MessageSquare`, `motion`)
  - Modify `src/pages/Campaigns.jsx`:
    - Replace `base44.entities.Campaign.*` with `entities.Campaign.*`
    - Replace `base44.integrations.Core.InvokeLLM` generate call with `apiPost('/api/agents/run', { task: prompt, business_id: 'demo' })`
    - Fix TypeScript error: cast `res` as typed object before spreading
  - Modify `src/pages/Social.jsx`:
    - Replace `base44.entities.SocialPost.*` with `entities.SocialPost.*`
    - Replace `base44.integrations.Core.InvokeLLM` generate call with `apiPost('/api/agents/run', { task: prompt, business_id: 'demo' })`
    - Fix TypeScript errors: cast `res` as typed object before accessing `.posts`
    - Remove unused imports (`Plus`, `Instagram`, `Facebook`, `CheckCircle2`, `Clock`)
  - Modify `src/pages/Settings.jsx`:
    - Replace fake `setTimeout` save with `entities.Business.update(id, data)` real API call
    - Load current business data on mount with `entities.Business.list()`
  - _Requirements: All pages wired to real data_

- [ ] 19. Scheduled task runner (backend cron)
  - Install: `node-cron`
  - Create `server/src/scheduler/taskRunner.ts`:
    - `startScheduler()` — runs every minute via `node-cron`
    - On each tick: queries `ScheduledTaskModel` for enabled tasks where `next_run <= now`
    - For each due task: calls `runSuperAgent({ task: task.task_description, businessId: task.business_id, options: { skipConfirmation: true } })`
    - After run: updates `ScheduledTask` with `last_run = now`, `next_run = calculateNextRun(task)`, `last_result = summary`, `run_count++`
    - `calculateNextRun(task)` — pure function: daily → +1 day, weekly → next matching weekday, monthly → +1 month
  - Call `startScheduler()` in `server/src/index.ts` after DB connects
  - _Requirements: Scheduled agent tasks_

- [ ] 20. Add `dev` scripts and README
  - Add to root `package.json` scripts:
    - `"server": "cd server && tsx watch src/index.ts"`
    - `"dev:all": "concurrently \"npm run dev\" \"npm run server\""` (install `concurrently` at root)
  - Create `server/README.md` documenting:
    - All env vars with descriptions
    - How to run: `npm run dev:all`
    - API endpoint reference (entities CRUD, agents, intelligence, voice WS)
    - How to connect MongoDB Atlas (connection string format)
    - How to get Speechmatics API key and Bright Data API key
  - _Requirements: Developer experience_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "Backend project init" },
    { "wave": 2, "tasks": ["2"], "description": "MongoDB models" },
    { "wave": 3, "tasks": ["3"], "description": "Entity CRUD API" },
    { "wave": 4, "tasks": ["4"], "description": "Frontend API client" },
    { "wave": 5, "tasks": ["5", "6"], "description": "LLM providers + Bright Data tools" },
    { "wave": 6, "tasks": ["7", "8", "9"], "description": "Agent modules (parallel)" },
    { "wave": 7, "tasks": ["10"], "description": "SuperAgent orchestrator" },
    { "wave": 8, "tasks": ["11", "12", "13"], "description": "API routes + Voice WS (parallel)" },
    { "wave": 9, "tasks": ["14", "15", "16", "17", "18"], "description": "Frontend wiring (parallel)" },
    { "wave": 10, "tasks": ["19", "20"], "description": "Scheduler + docs" }
  ]
}
```

## Notes

- All agents use `business_id: 'demo'` until auth is wired — matches existing frontend pattern
- Bright Data MCP tools are loaded once at startup and cached; if unavailable the agents still work using the LLM's own knowledge
- AI/ML API base URL is `https://api.aimlapi.com/v1` — fully OpenAI-compatible, use `ChatOpenAI` with custom `baseURL`
- Openrouter is the fallback model 
- Speechmatics `@speechmatics/real-time-client` npm package handles the WebSocket protocol — no manual WS framing needed
- The frontend `base44Client.js` re-export shim means zero changes needed to existing page imports
- `node-cron` runs in-process — no Redis or separate worker needed for hackathon scope
