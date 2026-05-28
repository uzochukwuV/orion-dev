/**
 * Integration tests for Wave 6 agent modules.
 * 
 * Run: npx tsx --test src/agents/*.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Load .env ─────────────────────────────────────────────────────────────────
try {
  const lines = readFileSync(resolve('.env'), 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim().replace(/\r$/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log(`✓ .env loaded`);
} catch (e) {
  console.warn('Could not load .env:', (e as Error).message);
}

import { connectDB } from '../db/connection.js';
import { runResearchAgent } from './researchAgent.js';
import { runStrategyAgent } from './strategyAgent.js';
import { runExecutionAgent } from './executionAgent.js';

describe('Wave 6: Agent Modules', () => {
  test('Research Agent generates findings structure', async () => {
    // Skip if no LLM key
    if (!process.env.AIMLAPI_KEY && !process.env.TOKENROUTER_API_KEY) {
      console.log('  SKIP: No LLM provider configured');
      return;
    }

    try {
      await connectDB();
    } catch (err) {
      console.log('  SKIP: Could not connect to MongoDB:', (err as Error).message);
      return;
    }

    const result = await runResearchAgent({
      task: 'Find opportunities in AI market',
      businessContext: { business_id: 'test', name: 'TechCorp', type: 'SaaS', city: 'SF' },
      onStep: (step) => console.log(`    [${step.agent}] ${step.action}`),
    });

    assert.ok(Array.isArray(result.findings), 'Should have findings array');
    assert.ok(result.summary, 'Should have summary');
    assert.ok(result.data_freshness, 'Should have data_freshness');
    
    if (result.findings.length > 0) {
      const finding = result.findings[0];
      assert.ok(finding.title, 'Finding should have title');
      assert.ok(finding.description, 'Finding should have description');
      assert.ok(['low', 'medium', 'high'].includes(finding.urgency), 'Finding should have valid urgency');
    }

    console.log(`  ✓ Research Agent generated structured findings`);
  });

  test('Strategy Agent generates recommendations', async () => {
    if (!process.env.AIMLAPI_KEY && !process.env.TOKENROUTER_API_KEY) {
      console.log('  SKIP: No LLM provider configured');
      return;
    }

    try {
      await connectDB();
    } catch (err) {
      console.log('  SKIP: Could not connect to MongoDB');
      return;
    }

    const result = await runStrategyAgent({
      task: 'Develop growth strategy',
      businessContext: { business_id: 'test', name: 'TechCorp' },
      onStep: (step) => console.log(`    [${step.agent}] ${step.action}`),
    });

    assert.ok(Array.isArray(result.recommendations), 'Should have recommendations');
    assert.ok(result.summary, 'Should have summary');

    if (result.recommendations.length > 0) {
      const rec = result.recommendations[0];
      assert.ok(rec.title, 'Recommendation should have title');
      assert.ok(['low', 'medium', 'high'].includes(rec.priority), 'Should have priority');
      assert.ok(['low', 'medium', 'high'].includes(rec.effort), 'Should have effort');
    }

    console.log(`  ✓ Strategy Agent generated ${result.recommendations.length} recommendations`);
  });

  test('Execution Agent creates records', async () => {
    try {
      await connectDB();
    } catch (err) {
      console.log('  SKIP: Could not connect to MongoDB');
      return;
    }

    const actions = [
      {
        action_type: 'create_campaign' as const,
        description: 'Create email campaign',
        entity_data: { name: 'Test Campaign', type: 'email' },
      },
      {
        action_type: 'draft_post' as const,
        description: 'Draft social post',
        entity_data: { platform: 'instagram', content: 'Test post content' },
      },
      {
        action_type: 'create_lead' as const,
        description: 'Create lead',
        entity_data: { name: 'John Doe', email: 'john@example.com' },
      },
    ];

    const result = await runExecutionAgent({
      actions,
      businessContext: { business_id: 'test' },
      onStep: (step) => console.log(`    [${step.agent}] ${step.action}`),
    });

    assert.ok(Array.isArray(result.results), 'Should have results array');
    assert.equal(result.results.length, actions.length, `Should execute all ${actions.length} actions`);

    for (const res of result.results) {
      assert.ok(res.entity_type, 'Result should have entity_type');
      assert.ok(res.record_id, 'Result should have record_id');
    }

    console.log(`  ✓ Execution Agent executed ${result.results.length} actions successfully`);
  });
});
