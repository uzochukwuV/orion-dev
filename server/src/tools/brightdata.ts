/**
 * Bright Data MCP integration.
 *
 * Connects to the Bright Data MCP server via stdio transport and loads all
 * available tools as LangChain StructuredTool instances.
 *
 * The tool list is cached after the first successful init so subsequent agent
 * calls don't re-spawn the process. If Bright Data is unavailable (missing key,
 * process error, etc.) the function logs a warning and returns an empty array
 * so agents degrade gracefully.
 */

import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';

// Cached tools — populated on first successful init
let _cachedTools: StructuredToolInterface[] | null = null;
let _client: MultiServerMCPClient | null = null;

/**
 * Initialises the Bright Data MCP client and loads all available tools.
 * Results are cached; subsequent calls return the cached list immediately.
 *
 * @returns Array of LangChain StructuredTool instances (empty on failure).
 */
export async function initBrightDataTools(): Promise<StructuredToolInterface[]> {
  // Return cache if already initialised
  if (_cachedTools !== null) {
    return _cachedTools;
  }

  const apiKey = process.env.BRIGHT_DATA_API_KEY;

  if (!apiKey) {
    console.warn('[BrightData] BRIGHT_DATA_API_KEY not set — skipping MCP init, agents will use LLM knowledge only');
    _cachedTools = [];
    return _cachedTools;
  }

  try {
    _client = new MultiServerMCPClient({
      brightdata: {
        transport: 'stdio',
        command: 'npx',
        args: ['@brightdata/mcp'],
        env: {
          API_TOKEN: apiKey,
          // Pass through PATH so npx can find packages
          PATH: process.env.PATH ?? '',
        },
      },
    });

    const tools = await _client.getTools();
    _cachedTools = tools as StructuredToolInterface[];

    console.log(`[BrightData] Loaded ${_cachedTools.length} MCP tools`);
    return _cachedTools;
  } catch (err) {
    console.warn('[BrightData] Failed to initialise MCP client — agents will use LLM knowledge only');
    console.warn('[BrightData] Error:', (err as Error).message);
    _cachedTools = [];
    return _cachedTools;
  }
}

/**
 * Returns the cached Bright Data tools, initialising on first call.
 * Safe to call multiple times — only one MCP process is spawned.
 */
export async function getBrightDataTools(): Promise<StructuredToolInterface[]> {
  return initBrightDataTools();
}

/**
 * Gracefully closes the MCP client connection.
 * Call this on server shutdown to avoid orphaned child processes.
 */
export async function closeBrightDataClient(): Promise<void> {
  if (_client) {
    try {
      await _client.close();
    } catch {
      // ignore close errors on shutdown
    }
    _client = null;
  }
  // Always reset cache, even if client was never initialized
  _cachedTools = null;
}
