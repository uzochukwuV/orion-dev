/**
 * LLM provider setup for the Orion backend.
 *
 * Supported providers:
 *   - AI/ML API    — OpenAI-compatible endpoint at AIMLAPI_BASE_URL
 *   - TokenRouter  — OpenAI-compatible endpoint at https://api.tokenrouter.com/v1
 *
 * Usage:
 *   import { llm, getAIMLModel, getTokenRouterModel, getLLM } from './llm/providers.js'
 */

import { ChatOpenAI } from '@langchain/openai';

// ---------------------------------------------------------------------------
// AI/ML API (OpenAI-compatible)
// ---------------------------------------------------------------------------

/**
 * Returns a ChatOpenAI instance pointed at the AI/ML API endpoint.
 *
 * @param modelId  Optional model override. Defaults to Mistral-7B-Instruct.
 */
export function getAIMLModel(modelId?: string): ChatOpenAI {
  const apiKey = process.env.AIMLAPI_KEY;
  const baseURL = process.env.AIMLAPI_BASE_URL ?? 'https://api.aimlapi.com/v1';

  if (!apiKey) {
    throw new Error('AIMLAPI_KEY environment variable is not set');
  }

  return new ChatOpenAI({
    apiKey,
    configuration: { baseURL },
    model: modelId ?? 'mistralai/Mistral-7B-Instruct-v0.2',
    temperature: 0.7,
  });
}

// ---------------------------------------------------------------------------
// TokenRouter (OpenAI-compatible fallback)
// ---------------------------------------------------------------------------

/**
 * Returns a ChatOpenAI instance pointed at the TokenRouter endpoint.
 * TokenRouter is OpenAI-API-compatible, so no extra package is needed.
 *
 * @param modelId  Optional model override. Defaults to gpt-4o-mini.
 */
export function getTokenRouterModel(modelId?: string): ChatOpenAI {
  const apiKey = process.env.TOKENROUTER_API_KEY;
  const baseURL = 'https://api.tokenrouter.com/v1';

  if (!apiKey) {
    throw new Error('TOKENROUTER_API_KEY environment variable is not set');
  }

  return new ChatOpenAI({
    apiKey,
    configuration: { baseURL },
    model: modelId ?? 'openai/gpt-5-mini',
    temperature: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Default model — AIML first, TokenRouter fallback
// ---------------------------------------------------------------------------

/**
 * Returns the default LLM instance.PS C:\Users\ASUS FX95G\Documents\python\orion\server> npx tsx --test src/tools/brightdata.test.ts
✓ Loaded .env — BRIGHT_DATA_API_KEY is set
[BrightData] BRIGHT_DATA_API_KEY not set — skipping MCP init, agents will use LLM knowledge only
  ✓ Returns [] gracefully when key is absent
  → Spawning Bright Data MCP process (may take a few seconds)…
  ✓ All tools have name and description
  ✓ Singleton cache confirmed — no duplicate MCP process spawned
  SKIP: No search/scrape tool found among:
▶ getBrightDataTools()
  ✔ returns empty array (not throws) when BRIGHT_DATA_API_KEY is missing (1.4378ms)
  ✖ loads tools from Bright Data MCP server (3.6336ms)
  ✔ each tool has a name and description (0.2643ms)
  ✔ caching works — second call returns same array reference (0.1966ms)
  ✔ at least one tool can be invoked with a simple web search (0.4074ms)
✖ getBrightDataTools() (7.3989ms)
ℹ tests 5
ℹ suites 1
ℹ pass 4
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 648.4779

✖ failing tests:

test at src\tools\brightdata.test.ts:1:1362
✖ loads tools from Bright Data MCP server (3.6336ms)
  AssertionError [ERR_ASSERTION]: Expected at least 1 tool, got 0
      at TestContext.<anonymous> (C:\Users\ASUS FX95G\Documents\python\orion\server\src\tools\brightdata.test.ts:82:12)     
      at async Test.run (node:internal/test_runner/test:1208:7)
      at async Suite.processPendingSubtests (node:internal/test_runner/test:831:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }
PS C:\Users\AS
 * Tries AI/ML API first; falls back to TokenRouter if AIMLAPI_KEY is not set.
 */
export function getDefaultModel(): ChatOpenAI {
  if (process.env.AIMLAPI_KEY) {
    return getAIMLModel();
  }

  if (process.env.TOKENROUTER_API_KEY) {
    console.warn('[LLM] AIMLAPI_KEY not set — falling back to TokenRouter');
    return getTokenRouterModel();
  }

  throw new Error(
    'No LLM provider configured. Set AIMLAPI_KEY or TOKENROUTER_API_KEY in your .env file.'
  );
}

/**
 * Singleton default model instance used by all agents.
 * Lazily initialised on first call so the server can start without keys
 * (keys are only required when an agent is actually invoked).
 */
let _llm: ChatOpenAI | null = null;

export function getLLM(): ChatOpenAI {
  if (!_llm) {
    _llm = getDefaultModel();
  }
  return _llm;
}

/**
 * Convenience accessor: `llm.instance` returns the lazily-initialised default model.
 * Agents should call `getLLM()` rather than importing `llm` directly so
 * that the singleton is created after dotenv has loaded the env vars.
 */
export const llm = {
  /** Returns the default model. Initialises the singleton on first call. */
  get instance(): ChatOpenAI {
    return getLLM();
  },
};
