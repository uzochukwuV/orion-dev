/**
 * Integration tests for Wave 7: SuperAgent Orchestrator.
 * 
 * Tests intent classification, agent chain routing, and approval gates.
 * 
 * Run: npx tsx --test src/agents/superAgent.test.ts
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
import { runSuperAgent } from './superAgent.js';

describe('Wave 7: SuperAgent Orchestrator', () => {
  test('classifies "find leads" intent and executes full chain', async () => {
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

    const steps: string[] = [];
    const result = await runSuperAgent({
      task: 'Find potential leads in the tech industry',
      businessId: 'demo',
      options: { skipConfirmation: true },
      onStep: (step) => {
        steps.push(`[${step.agent}] ${step.action}`);
        console.log(`    ${step.action}`);
      },
    });

    assert.ok(result.agentTaskId, 'Should have agentTaskId');
    assert.ok(result.intent, 'Should have intent');
    assert.ok(Array.isArray(result.steps), 'Should have steps array');
    assert.ok(result.final_summary, 'Should have final_summary');
    assert.ok(Array.isArray(result.records_created), 'Should have records_created');

    console.log(`  ✓ SuperAgent executed: intent=${result.intent}, steps=${result.steps.length}, records=${result.records_created.length}`);
  });

  test('handles user rejection of action plan', async () => {
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

    const result = await runSuperAgent({
      task: 'Generate a marketing campaign',
      businessId: 'demo',
      options: { skipConfirmation: false },
      onStep: (step) => console.log(`    ${step.action}`),
      onConfirm: async (actionPlan) => {
        console.log(`    [UserGate] Rejecting ${actionPlan.length} actions`);
        return false; // User rejects
      },
    });

    assert.ok(result.agentTaskId, 'Should have agentTaskId');
    assert.equal(result.final_summary, 'Rejected by user', 'Should indicate user rejection');
    
    // Check that rejection step exists
    const rejectionStep = result.steps.find((s) => s.status === 'rejected');
    assert.ok(rejectionStep, 'Should have rejection step');

    console.log(`  ✓ SuperAgent respects user rejection`);
  });

  test('tracks all steps in AgentTask document', async () => {
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

    const result = await runSuperAgent({
      task: 'Create a weekly summary of business insights',
      businessId: 'demo',
      options: { skipConfirmation: true },
      onStep: () => {}, // Silent
    });

    assert.ok(result.agentTaskId, 'Should have agentTaskId');
    assert.ok(result.steps.length > 0, 'Should have at least one step');

    // Verify step structure
    for (const step of result.steps) {
      assert.ok(step.agent, `Step should have agent: ${JSON.stringify(step)}`);
      assert.ok(step.action, `Step should have action: ${JSON.stringify(step)}`);
      assert.ok(['running', 'completed', 'failed', 'awaiting_approval', 'approved', 'rejected'].includes(step.status), 
        `Step should have valid status: ${step.status}`);
    }

    console.log(`  ✓ SuperAgent tracked ${result.steps.length} steps in AgentTask`);
  });

  test('routes intents correctly (research-only)', async () => {
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

    const result = await runSuperAgent({
      task: 'Track competitor activities and analyze their latest moves',
      businessId: 'demo',
      options: { skipConfirmation: true },
      onStep: () => {}, // Silent
    });

    // Should be track_competitors intent (research-only chain)
    assert.equal(result.intent, 'track_competitors', 'Should classify as track_competitors');
    
    // Verify that only research agent was called
    const researchSteps = result.steps.filter((s) => s.agent === 'Research Agent');
    const strategySteps = result.steps.filter((s) => s.agent === 'Strategy Agent');
    const executionSteps = result.steps.filter((s) => s.agent === 'Execution Agent');

    assert.ok(researchSteps.length > 0, 'Should have Research Agent steps');
    assert.equal(strategySteps.length, 0, 'Should NOT have Strategy Agent steps for track_competitors');
    assert.equal(executionSteps.length, 0, 'Should NOT have Execution Agent steps for track_competitors');

    console.log(`  ✓ SuperAgent routed correctly: research-only chain`);
  });

  test('creates records in MongoDB via AgentTask', async () => {
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

    const result = await runSuperAgent({
      task: 'Find leads and draft outreach campaigns',
      businessId: 'demo',
      options: { skipConfirmation: true },
      onStep: () => {}, // Silent
    });

    assert.ok(result.agentTaskId, 'Should have agentTaskId');
    assert.ok(Array.isArray(result.records_created), 'Should have records_created');

    if (result.records_created.length > 0) {
      console.log(`    Created records: ${result.records_created.map((r) => `${r.entity_type}(${r.entity_id})`).join(', ')}`);
    }

    console.log(`  ✓ SuperAgent created ${result.records_created.length} records`);
  });
});
