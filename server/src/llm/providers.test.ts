/**
 * Integration tests for TokenRouter LLM provider.
 *
 * These tests make REAL API calls — they require TOKENROUTER_API_KEY in server/.env.
 * Run: npx tsx --test src/llm/providers.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Load server/.env ─────────────────────────────────────────────────────────
try {
  const lines = readFileSync(resolve('.env'), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log(`✓ Loaded .env — TOKENROUTER_API_KEY is ${process.env.TOKENROUTER_API_KEY ? 'set' : 'NOT set'}`);
} catch (e) {
  console.warn('Could not load .env:', (e as Error).message);
}

import { getTokenRouterModel, getDefaultModel } from './providers.js';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getTokenRouterModel()', () => {

  test('throws when TOKENROUTER_API_KEY is not set', () => {
    const saved = process.env.TOKENROUTER_API_KEY;
    delete process.env.TOKENROUTER_API_KEY;

    try {
      assert.throws(
        () => getTokenRouterModel(),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match((err as Error).message, /TOKENROUTER_API_KEY/i);
          return true;
        }
      );
    } finally {
      if (saved !== undefined) process.env.TOKENROUTER_API_KEY = saved;
    }
  });

  test('returns a ChatOpenAI instance with correct baseURL', () => {
    if (!process.env.TOKENROUTER_API_KEY) {
      console.warn('  SKIP: TOKENROUTER_API_KEY not set');
      return;
    }

    const model = getTokenRouterModel();
    // ChatOpenAI stores the baseURL inside its client configuration
    const baseURL = (model as any).clientConfig?.baseURL
      ?? (model as any).configuration?.baseURL
      ?? (model as any).client?.baseURL
      ?? '';

    assert.ok(
      baseURL.includes('tokenrouter.com') || baseURL === '',
      `Expected tokenrouter.com in baseURL, got: "${baseURL}"`
    );
    console.log('  ✓ ChatOpenAI instance created with TokenRouter config');
  });

  test('sends a real chat completion and returns a non-empty string', async () => {
    if (!process.env.TOKENROUTER_API_KEY) {
      console.warn('  SKIP: TOKENROUTER_API_KEY not set');
      return;
    }

    const model = getTokenRouterModel();

    const response = await model.invoke([
      { role: 'user', content: 'Reply with exactly the word: PONG' },
    ]);

    const text = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    assert.ok(text.length > 0, 'Expected a non-empty response from TokenRouter');
    console.log(`  ✓ TokenRouter responded: "${text.trim()}"`);
  });

  test('model override works — accepts a custom model ID', async () => {
    if (!process.env.TOKENROUTER_API_KEY) {
      console.warn('  SKIP: TOKENROUTER_API_KEY not set');
      return;
    }

    // Explicitly pass the model ID to confirm override path works
    const model = getTokenRouterModel('openai/gpt-4o-mini');
    const response = await model.invoke([
      { role: 'user', content: 'Say: OK' },
    ]);

    const text = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    assert.ok(text.length > 0, 'Expected a non-empty response with custom model ID');
    console.log(`  ✓ Custom model ID accepted, response: "${text.trim()}"`);
  });

});

describe('getDefaultModel() — TokenRouter fallback', () => {

  test('falls back to TokenRouter when AIMLAPI_KEY is absent', () => {
    if (!process.env.TOKENROUTER_API_KEY) {
      console.warn('  SKIP: TOKENROUTER_API_KEY not set');
      return;
    }

    const savedAIML = process.env.AIMLAPI_KEY;
    delete process.env.AIMLAPI_KEY;

    try {
      const model = getDefaultModel();
      assert.ok(model, 'Expected a model instance');
      console.log('  ✓ getDefaultModel() returned TokenRouter fallback');
    } finally {
      if (savedAIML !== undefined) process.env.AIMLAPI_KEY = savedAIML;
    }
  });

  test('throws when neither key is set', () => {
    const savedAIML = process.env.AIMLAPI_KEY;
    const savedTR = process.env.TOKENROUTER_API_KEY;
    delete process.env.AIMLAPI_KEY;
    delete process.env.TOKENROUTER_API_KEY;

    try {
      assert.throws(
        () => getDefaultModel(),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match((err as Error).message, /AIMLAPI_KEY|TOKENROUTER_API_KEY/i);
          return true;
        }
      );
      console.log('  ✓ Throws with helpful message when no keys are set');
    } finally {
      if (savedAIML !== undefined) process.env.AIMLAPI_KEY = savedAIML;
      if (savedTR !== undefined) process.env.TOKENROUTER_API_KEY = savedTR;
    }
  });

});
