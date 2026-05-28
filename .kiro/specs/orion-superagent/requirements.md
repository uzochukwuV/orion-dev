# Requirements Document

## Introduction

The Orion SuperAgent Platform upgrades an existing React + Vite small-business AI app into a conversational multi-agent command center. Users interact via natural language text or voice to trigger a chain of specialized AI agents — Research, Strategy, and Execution — that use live web data from Bright Data and persist results to base44 entities. The platform also introduces a frontend-based task scheduler, an upgraded Intelligence page with competitor tracking, and a rebuilt Agents page with full run history. This feature targets the Bright Data "Web Data UNLOCKED" hackathon (GTM Intelligence track) and the "Best Use of Kiro" partner challenge.

---

## Glossary

- **SuperAgent**: The top-level AI orchestrator that receives user tasks and delegates to sub-agents.
- **Research_Agent**: The sub-agent responsible for live web data collection using `add_context_from_internet: true`.
- **Strategy_Agent**: The sub-agent that analyzes business data and research findings to produce recommendations.
- **Execution_Agent**: The sub-agent that creates base44 entity records (Campaigns, Leads, SocialPosts) from approved action plans.
- **SuperAgentPanel**: The full-screen floating chat panel through which users interact with the SuperAgent.
- **AgentTask**: A base44 entity recording the full trace of a multi-agent run (chain, steps, results).
- **ScheduledTask**: A base44 entity storing a recurring agent task configuration.
- **Scheduler**: The frontend scheduling system using `setTimeout`/`setInterval` and localStorage.
- **TaskConfirmCard**: An inline UI card shown before the Execution_Agent creates records, requiring user approval.
- **AgentStepCard**: An inline UI card showing one agent's thinking step in the chat thread.
- **VoiceModal**: The floating voice input/output modal using the browser Web Speech API.
- **Intelligence_Page**: The existing `/intelligence` route, upgraded with live scan and competitor tracking.
- **Agents_Page**: The existing `/agents` route, rebuilt with SuperAgent input, agent cards, scheduler, and run history.
- **base44_SDK**: The `@base44/sdk` client used for all LLM calls and entity CRUD operations.
- **InvokeLLM**: `base44.integrations.Core.InvokeLLM` — the LLM call function.
- **Bright_Data**: The live web data source accessed via `add_context_from_internet: true` on InvokeLLM calls.

---

## Requirements

### Requirement 1: SuperAgent Chat Interface

**User Story:** As a business owner, I want a conversational AI panel accessible from any page, so that I can give natural language tasks to my AI team without navigating away from my current work.

#### Acceptance Criteria

1. THE SuperAgentPanel SHALL be accessible from every page via a floating button in the Sidebar.
2. WHEN the floating SuperAgent button is clicked, THE SuperAgentPanel SHALL open as a full-screen overlay panel.
3. WHEN a user submits a task, THE SuperAgent SHALL classify the intent and determine the appropriate agent chain before executing any agent.
4. WHILE an agent chain is running, THE SuperAgentPanel SHALL display each agent's step as an AgentStepCard showing the agent name, current action, and status (running/complete/error).
5. WHEN an agent chain completes, THE SuperAgent SHALL save an AgentTask record to base44 containing the task text, agent chain array, all steps, and a final summary.
6. WHEN the SuperAgentPanel is open, THE SuperAgentPanel SHALL display preset task template buttons: "Find new clients while I sleep", "Track my competitors", "Prepare weekly revenue summary", "Track brand mentions daily".
7. WHEN a preset task button is clicked, THE SuperAgentPanel SHALL populate the task input with the preset text and submit it automatically.
8. THE SuperAgentPanel SHALL persist the chat thread in React state across page navigation without unmounting.

### Requirement 2: Research Agent — Live Web Intelligence

**User Story:** As a business owner, I want my AI to scan the web for competitor intelligence and market signals, so that I can make informed decisions based on current data.

#### Acceptance Criteria

1. WHEN the Research_Agent is invoked, THE Research_Agent SHALL call InvokeLLM with `add_context_from_internet: true` to retrieve live web data.
2. WHEN the Research_Agent receives a response with N findings (N > 0), THE Research_Agent SHALL create exactly N Opportunity records in base44, each with a non-empty `source` field and `status: "new"`.
3. WHEN an Opportunity record is created by the Research_Agent, THE Opportunity record SHALL include: `title`, `description`, `category`, `urgency`, `impact_score`, `source`, and `suggested_action`.
4. WHEN the Research_Agent completes, THE Research_Agent SHALL emit a step event with the count of findings discovered.
5. THE Research_Agent SHALL use a structured JSON schema response to ensure consistent output parsing.

### Requirement 3: Strategy Agent — Recommendations

**User Story:** As a business owner, I want my AI to analyze my business data and research findings to produce a prioritized action plan, so that I know exactly what to do next.

#### Acceptance Criteria

1. WHEN the Strategy_Agent is invoked, THE Strategy_Agent SHALL load the current business context (Business entity, recent Leads, recent Opportunities) before generating recommendations.
2. WHEN the Strategy_Agent produces an action plan, THE action plan SHALL contain at least one action item with `action_type`, `description`, and `entity_data` fields.
3. WHEN the Strategy_Agent completes, THE Strategy_Agent SHALL emit a step event with the count of recommendations generated.
4. THE Strategy_Agent SHALL use a structured JSON schema response to ensure consistent output parsing.

### Requirement 4: Execution Agent — Record Creation with Approval Gate

**User Story:** As a business owner, I want to review and approve what my AI plans to do before it creates any records, so that I stay in control of my business data.

#### Acceptance Criteria

1. WHEN the Execution_Agent is about to create records, THE SuperAgentPanel SHALL display a TaskConfirmCard listing all planned actions before any records are created.
2. WHEN the user clicks "Approve" on a TaskConfirmCard, THE Execution_Agent SHALL create the specified entity records in base44.
3. WHEN the user clicks "Reject" on a TaskConfirmCard, THE Execution_Agent SHALL not create any records and SHALL append a message confirming no changes were made.
4. WHEN the Execution_Agent completes successfully, THE Execution_Agent SHALL emit a step event listing the entity types and counts created.
5. WHEN the Execution_Agent creates a Campaign record, THE Campaign record SHALL have `ai_generated: true` and `status: "draft"`.
6. WHEN the Execution_Agent creates a Lead record, THE Lead record SHALL have `source: "other"` and `status: "new"`.

### Requirement 5: Frontend Scheduler

**User Story:** As a business owner, I want to configure recurring AI tasks that run automatically, so that my AI works for me even when I'm not using the app.

#### Acceptance Criteria

1. WHEN a user creates a ScheduledTask, THE Scheduler SHALL register a `setTimeout` for the next scheduled run time and persist the configuration to both localStorage and a base44 ScheduledTask entity.
2. WHEN a scheduled task fires, THE Scheduler SHALL invoke the SuperAgent with `skipConfirmation: true` so the task runs without requiring user approval.
3. WHEN a scheduled task completes, THE Scheduler SHALL update the ScheduledTask entity with `last_run`, `next_run`, `last_result`, and an incremented `run_count`.
4. WHEN the app loads and an enabled ScheduledTask has a `next_run` timestamp in the past, THE Scheduler SHALL trigger that task exactly once during the mount cycle.
5. WHEN a user toggles a ScheduledTask off, THE Scheduler SHALL cancel the pending `setTimeout` and update `enabled: false` in both localStorage and the base44 entity.
6. THE Scheduler SHALL support three frequency options: daily, weekly, and monthly.

### Requirement 6: Rebuilt Agents Page

**User Story:** As a business owner, I want a unified Agents page that shows all my AI agents, lets me give them tasks, manage schedules, and review run history, so that I have full visibility and control over my AI team.

#### Acceptance Criteria

1. THE Agents_Page SHALL display a "Give your SuperAgent a task" input at the top of the page that submits to the SuperAgent.
2. THE Agents_Page SHALL display five agent type cards: SuperAgent Orchestrator, Research Agent, Strategy Agent, Execution Agent, and Voice Intelligence Agent — each with a status indicator and description.
3. THE Agents_Page SHALL display a Scheduled Tasks section showing all ScheduledTask records with name, frequency, next run time, last result, and an enable/disable toggle.
4. WHEN a user clicks "Add Schedule" on the Agents_Page, THE Agents_Page SHALL display a form to create a new ScheduledTask with fields for name, task description, frequency, day of week (if weekly), and time of day.
5. THE Agents_Page SHALL display a Run History section showing the 20 most recent AgentTask records with task text, agent chain, status, and an expandable full output.
6. WHEN an AgentTask record has `status: "completed"`, THE Run History item SHALL display a green status indicator.
7. WHEN an AgentTask record has `status: "failed"`, THE Run History item SHALL display a red status indicator with the error message.

### Requirement 7: Upgraded Intelligence Page

**User Story:** As a business owner, I want my Intelligence page to show live web data with source attribution and let me track specific competitors, so that I have a real-time market intelligence feed.

#### Acceptance Criteria

1. THE Intelligence_Page SHALL display a "Live Web Scan" button that triggers the Research_Agent with `add_context_from_internet: true`.
2. WHEN a Live Web Scan completes, THE Intelligence_Page SHALL display each finding as a MarketSignalCard with title, description, urgency badge, impact score, and source attribution.
3. WHEN a MarketSignalCard was generated with `add_context_from_internet: true`, THE MarketSignalCard SHALL display a "Powered by live web data" label.
4. THE Intelligence_Page SHALL display a Competitor Tracker section where users can add competitor names or URLs to monitor.
5. WHEN a competitor is added to the Competitor Tracker, THE competitor name/URL SHALL be saved to the Business entity's `competitors` array.
6. WHEN the user clicks "Scan Competitors", THE Intelligence_Page SHALL invoke the Research_Agent with the saved competitor list as context.
7. THE Intelligence_Page SHALL display summary stat cards for: New Opportunities count, High Urgency count, Acted On count, and Average Impact Score.

### Requirement 8: Voice Intelligence Upgrade

**User Story:** As a business owner, I want to speak tasks to my AI and hear responses read back, so that I can use Orion hands-free while working.

#### Acceptance Criteria

1. WHEN the user clicks the mic button in the VoiceModal, THE VoiceModal SHALL start the browser Web Speech API recognition session.
2. WHEN the Web Speech API produces a final transcript, THE VoiceModal SHALL pass the transcript verbatim to the SuperAgent's `runTask` function.
3. WHEN the SuperAgent produces a final response, THE VoiceModal SHALL read the response aloud using the browser Speech Synthesis API.
4. WHEN the browser does not support `window.SpeechRecognition` or `window.webkitSpeechRecognition`, THE VoiceModal SHALL display a message: "Voice requires Chrome or Edge" and disable the mic button.
5. WHEN the VoiceModal is closed while speech synthesis is active, THE VoiceModal SHALL cancel the active speech synthesis utterance.
6. THE VoiceModal SHALL display the live transcript text as the user speaks.

### Requirement 9: Dashboard SuperAgent Activity Feed

**User Story:** As a business owner, I want my Dashboard to show recent SuperAgent activity, so that I can see at a glance what my AI team has been doing.

#### Acceptance Criteria

1. THE Dashboard SHALL display a SuperAgent Activity section showing the 5 most recent AgentTask records.
2. WHEN an AgentTask record is displayed in the Dashboard activity feed, THE activity item SHALL show: task text (truncated to 60 chars), agent chain as a badge list, status indicator, and relative time.
3. WHEN no AgentTask records exist, THE Dashboard activity section SHALL display a prompt: "Give your SuperAgent a task to get started."
4. THE Dashboard SHALL display a "SuperAgent" quick-action button that opens the SuperAgentPanel.

### Requirement 10: New Entity Schemas

**User Story:** As a developer, I want the new ScheduledTask and AgentTask entities defined as JSON schema files, so that the base44 SDK can persist and query them correctly.

#### Acceptance Criteria

1. THE ScheduledTask entity JSON file SHALL be created at `entities/ScheduledTask.json` with fields: `business_id`, `name`, `task_description`, `frequency`, `day_of_week`, `time_of_day`, `enabled`, `last_run`, `next_run`, `last_result`, `run_count`.
2. THE AgentTask entity JSON file SHALL be created at `entities/AgentTask.json` with fields: `business_id`, `session_id`, `task`, `agent_chain`, `status`, `steps`, `final_summary`, `records_created`.
3. THE ScheduledTask entity SHALL have `required` fields: `business_id`, `name`, `task_description`, `frequency`, `time_of_day`.
4. THE AgentTask entity SHALL have `required` fields: `business_id`, `task`.

### Requirement 11: Hackathon Alignment — Bright Data Integration

**User Story:** As a hackathon submitter, I want every Research Agent call to demonstrably use Bright Data live web data and be labeled as such in the UI, so that the judges can clearly see the Bright Data integration.

#### Acceptance Criteria

1. WHEN the Research_Agent calls InvokeLLM, THE call SHALL always include `add_context_from_internet: true`.
2. WHEN a result card is rendered from a Research_Agent run, THE card SHALL display the label "Powered by live web data" with a globe or signal icon.
3. THE Intelligence_Page Live Web Scan button SHALL display the label "Live Web Scan · Bright Data" to make the integration explicit.
4. WHEN the SuperAgent routes a task to the Research_Agent, THE AgentStepCard for that step SHALL display "Scanning live web data via Bright Data…" as the action text.
