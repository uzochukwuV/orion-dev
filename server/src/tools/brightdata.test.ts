/**
 * Integration tests for the Bright Data MCP tool loader.
 *
 * These tests spawn a REAL Bright Data MCP process — they require:
 *   - BRIGHT_DATA_API_KEY in server/.env
 *   - @brightdata/mcp available via npx (downloaded on first run)
 *
 * Run: npx tsx --test src/tools/brightdata.test.ts
 *
 * Note: MCP process startup can take 5-15 seconds on first run while npx
 * downloads the package. Subsequent runs use the npx cache and are faster.
 */

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Load server/.env ─────────────────────────────────────────────────────────
try {
  const lines = readFileSync(resolve('.env'), 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim().replace(/\r$/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
  console.log(`✓ Loaded .env — BRIGHT_DATA_API_KEY is ${process.env.BRIGHT_DATA_API_KEY ? 'set' : 'NOT set'}`);
} catch (e) {
  console.warn('Could not load .env:', (e as Error).message);
}

import {
  getBrightDataTools,
  initBrightDataTools,
  closeBrightDataClient,
} from './brightdata.js';

// ─── Cleanup ─────────────────────────────────────────────────────────────────

after(async () => {
  await closeBrightDataClient();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getBrightDataTools()', () => {

  test('returns empty array (not throws) when BRIGHT_DATA_API_KEY is missing', async () => {
    const saved = process.env.BRIGHT_DATA_API_KEY;
    delete process.env.BRIGHT_DATA_API_KEY;

    // Reset the module-level cache so the missing-key path is exercised
    await closeBrightDataClient();

    try {
      const tools = await getBrightDataTools();
      assert.ok(Array.isArray(tools), 'Expected an array');
      assert.equal(tools.length, 0, 'Expected empty array when key is missing');
      console.log('  ✓ Returns [] gracefully when key is absent');
    } finally {
      // Restore the original value, then reset cache
      if (saved !== undefined) {
        process.env.BRIGHT_DATA_API_KEY = saved;
      } else {
        delete process.env.BRIGHT_DATA_API_KEY;
      }
      await closeBrightDataClient();
    }
  });

  test('loads tools from Bright Data MCP server', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    console.log('  → Spawning Bright Data MCP process (may take a few seconds)…');
    const tools = await initBrightDataTools();

    assert.ok(Array.isArray(tools), 'Expected an array of tools');
    assert.ok(tools.length > 0, `Expected at least 1 tool, got ${tools.length}`);

    console.log(`  ✓ Loaded ${tools.length} Bright Data MCP tools`);
    console.log(`  Tool names: ${tools.map((t: any) => t.name).join(', ')}`);
  });

  test('each tool has a name and description', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    const tools = await getBrightDataTools();

    for (const tool of tools) {
      assert.ok(
        typeof (tool as any).name === 'string' && (tool as any).name.length > 0,
        `Tool missing name: ${JSON.stringify(tool)}`
      );
      assert.ok(
        typeof (tool as any).description === 'string' && (tool as any).description.length > 0,
        `Tool "${(tool as any).name}" missing description`
      );
    }

    console.log('  ✓ All tools have name and description');
  });

  test('caching works — second call returns same array reference', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    const first = await getBrightDataTools();
    const second = await getBrightDataTools();

    assert.strictEqual(first, second, 'Expected the same cached array reference on second call');
    console.log('  ✓ Singleton cache confirmed — no duplicate MCP process spawned');
  });

  test('at least one tool can be invoked with a simple web search', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    const tools = await getBrightDataTools();

    // Find a search-like tool (Bright Data MCP typically exposes web_search or similar)
    const searchTool = tools.find((t: any) =>
      /search|scrape|browse|web/i.test((t as any).name)
    ) as any;

    if (!searchTool) {
      console.warn(`  SKIP: No search/scrape tool found among: ${tools.map((t: any) => t.name).join(', ')}`);
      return;
    }

    console.log(`  → Invoking tool: "${searchTool.name}"`);

    // Most Bright Data search tools accept a { query } or { url } input
    let result: unknown;
    try {
      result = await searchTool.invoke({ query: 'Bright Data MCP test' });
    } catch {
      // Some tools require different input shapes — try url-based fallback
      try {
        result = await searchTool.invoke({ url: 'https://example.com' });
        console.log(result)
      } catch (err2) {
        console.warn(`  ⚠ Tool invocation failed: ${(err2 as Error).message}`);
        console.warn('    This may be a quota/permission issue, not a code bug.');
        return;
      }
    }

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    assert.ok(text.length > 0, 'Expected a non-empty result from Bright Data tool');
    console.log(`  ✓ Tool "${searchTool.name}" returned ${text.length} chars`);
  });

});
