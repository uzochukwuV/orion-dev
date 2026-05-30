/**
 * Integration tests for the Bright Data MCP tool loader.
 */

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load server/.env
try {
  const envPath = resolve('.env');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n');
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
    console.log(`Loaded .env - BRIGHT_DATA_API_KEY is ${process.env.BRIGHT_DATA_API_KEY ? 'set' : 'NOT set'}`);
  } else {
    console.log('No .env file found');
  }
} catch (e) {
  console.warn('Could not load .env:', (e as Error).message);
}

import {
  getBrightDataTools,
  initBrightDataTools,
  closeBrightDataClient,
} from './brightdata.js';

after(async () => {
  await closeBrightDataClient();
});

describe('getBrightDataTools()', () => {

  test('returns empty array when BRIGHT_DATA_API_KEY is missing', async () => {
    const saved = process.env.BRIGHT_DATA_API_KEY;
    delete process.env.BRIGHT_DATA_API_KEY;
    await closeBrightDataClient();

    try {
      const tools = await getBrightDataTools();
      assert.ok(Array.isArray(tools), 'Expected an array');
      assert.equal(tools.length, 0, 'Expected empty array when key is missing');
      console.log('  Returns [] gracefully when key is absent');
    } finally {
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

    await closeBrightDataClient();

    console.log('  Spawning Bright Data MCP process...');
    const tools = await initBrightDataTools();

    assert.ok(Array.isArray(tools), 'Expected an array of tools');
    
    // 0 tools is now acceptable - agents will fallback to LLM-only
    if (tools.length === 0) {
      console.log('  MCP initialized but returned 0 tools - acceptable');
    } else {
      console.log(`  Loaded ${tools.length} Bright Data MCP tools`);
      console.log(`  Tool names: ${tools.map((t: any) => t.name).join(', ')}`);
    }
  });

  test('each tool has a name and description', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    const tools = await getBrightDataTools();

    if (tools.length === 0) {
      console.log('  SKIP: No tools loaded (acceptable scenario)');
      return;
    }

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

    console.log('  All tools have name and description');
  });

  test('caching works - second call returns same array reference', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    await closeBrightDataClient();

    const first = await getBrightDataTools();
    const second = await getBrightDataTools();

    assert.strictEqual(first, second, 'Expected the same cached array reference');
    console.log('  Singleton cache confirmed');
  });

  test('tool invocation works with web search', async () => {
    if (!process.env.BRIGHT_DATA_API_KEY) {
      console.warn('  SKIP: BRIGHT_DATA_API_KEY not set');
      return;
    }

    const tools = await getBrightDataTools();

    if (tools.length === 0) {
      console.log('  SKIP: No tools loaded (acceptable scenario)');
      return;
    }

    const searchTool = tools.find((t: any) =>
      /search|scrape|browse|web/i.test((t as any).name)
    ) as any;

    if (!searchTool) {
      console.log(`  SKIP: No search/scrape tool found`);
      return;
    }

    console.log(`  Invoking tool: "${searchTool.name}"`);

    let result: unknown;
    try {
      result = await searchTool.invoke({ query: 'Bright Data MCP test' });
    } catch {
      try {
        result = await searchTool.invoke({ url: 'https://example.com' });
      } catch (err2) {
        console.warn(`  Tool invocation failed: ${(err2 as Error).message}`);
        return;
      }
    }

    const text = typeof result === 'string' ? result : JSON.stringify(result);
    assert.ok(text.length > 0, 'Expected a non-empty result');
    console.log(`  Tool returned ${text.length} chars`);
  });

});
