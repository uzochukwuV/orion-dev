/**
 * USAGE EXAMPLES — Wave 7 SuperAgent Orchestrator
 */

// ─── Import ──────────────────────────────────────────────────────────────────

import { runSuperAgent } from './src/agents/index.js';

// ─── Example 1: Find Leads (Full Chain with Approval) ────────────────────────

async function findLeadsWorkflow() {
  console.log('\n=== Example 1: Find Leads ===\n');

  const result = await runSuperAgent({
    task: 'Find 20 software development agencies in California as potential partners',
    businessId: 'demo',
    options: { skipConfirmation: false }, // Require user approval
    onStep: ({ agent, action, status }) => {
      console.log(`[${agent}] ${action} (${status})`);
    },
    onConfirm: async (actionPlan) => {
      // Frontend shows approval dialog with actionPlan details
      console.log('\n📋 Action Plan for User Review:');
      actionPlan.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.action_type}: ${action.description}`);
      });
      console.log('\n✅ User approved the action plan\n');
      return true; // User confirmed
    },
  });

  console.log('\n✅ Workflow Complete:');
  console.log(`  Intent: ${result.intent}`);
  console.log(`  Steps: ${result.steps.length}`);
  console.log(`  Records Created: ${result.records_created.length}`);
  console.log(`  Summary: ${result.final_summary.substring(0, 100)}...`);

  // result.records_created = [
  //   { entity_type: 'Campaign', entity_id: '...', description: 'Campaign "Partnership Outreach" created' },
  //   { entity_type: 'Lead', entity_id: '...', description: 'Lead "ACME Tech" created' },
  //   { entity_type: 'Lead', entity_id: '...', description: 'Lead "TechFlow Inc" created' },
  // ]
}

// ─── Example 2: Track Competitors (Research Only, No Approval) ───────────────

async function trackCompetitorsWorkflow() {
  console.log('\n=== Example 2: Track Competitors ===\n');

  const result = await runSuperAgent({
    task: 'What marketing strategies are our 3 main competitors using right now?',
    businessId: 'demo',
    options: { skipConfirmation: true }, // Skip approval (no record creation)
    onStep: ({ agent, action, status }) => {
      console.log(`  ${action}`);
    },
  });

  console.log(`\n✅ Complete:\n  Intent: ${result.intent}\n  Records: ${result.records_created.length}`);
  // result.intent = 'track_competitors'
  // result.records_created = [] (no execution phase)
  // result.steps = [Classifier, Research, Summary]
}

// ─── Example 3: Generate Campaign (Strategy Only) ──────────────────────────

async function generateCampaignWorkflow() {
  console.log('\n=== Example 3: Generate Campaign ===\n');

  const approvalGiven = await new Promise<boolean>((resolve) => {
    // Simulate user decision: reject first, then approve
    setTimeout(() => resolve(true), 1000);
  });

  const result = await runSuperAgent({
    task: 'Create a back-to-school email campaign targeting parents',
    businessId: 'demo',
    options: { skipConfirmation: false },
    onStep: ({ agent, action }) => console.log(`  ✓ ${action}`),
    onConfirm: async (actionPlan) => {
      console.log(`\n📋 Proposed Actions:`);
      actionPlan.forEach((a) => console.log(`  - ${a.action_type}: ${a.description}`));
      console.log(`\n${approvalGiven ? '✅ APPROVED' : '❌ REJECTED'}`);
      return approvalGiven;
    },
  });

  console.log(`\nResult: Status=${result.final_summary.includes('Rejected') ? 'rejected' : 'completed'}`);
}

// ─── Example 4: Weekly Summary (Scheduled Task) ──────────────────────────────

async function weeklyTaskWorkflow() {
  console.log('\n=== Example 4: Weekly Summary (Scheduled) ===\n');

  // This would run from cron job (Wave 10: Scheduler)
  const result = await runSuperAgent({
    task: 'Generate a weekly business performance summary with recommendations',
    businessId: 'demo',
    options: { skipConfirmation: true }, // Auto-execute (no user gate)
    onStep: ({ agent, action }) => {
      console.log(`  [${agent}] ${action}`);
    },
    // No onConfirm callback (approval gate skipped)
  });

  console.log(`\n✅ Scheduled Task Complete:`);
  console.log(`  Agent Task ID: ${result.agentTaskId}`);
  console.log(`  Status: Completed`);
  console.log(`  Summary: ${result.final_summary.substring(0, 150)}...`);

  // Save to database: AgentTaskModel
  // Sent to user via email/dashboard
}

// ─── Example 5: Handle User Rejection ──────────────────────────────────────

async function handlingRejectionWorkflow() {
  console.log('\n=== Example 5: Handle User Rejection ===\n');

  const result = await runSuperAgent({
    task: 'Find and contact new leads in the finance industry',
    businessId: 'demo',
    options: { skipConfirmation: false },
    onStep: ({ agent, action }) => console.log(`  ${action}`),
    onConfirm: async (actionPlan) => {
      // User reviews and rejects
      console.log(`\n📋 Proposed ${actionPlan.length} actions`);
      console.log('User says: "Not ready to create leads yet"');
      console.log('❌ REJECTED\n');
      return false; // Reject
    },
  });

  // result.final_summary = 'Rejected by user'
  // result.records_created = [] (no execution ran)
  // result.steps includes rejection step
  console.log(`\nOutcome: ${result.final_summary}`);
  console.log(`No records created (execution skipped)`);
}

// ─── Example 6: Error Handling ────────────────────────────────────────────────

async function errorHandlingWorkflow() {
  console.log('\n=== Example 6: Error Handling ===\n');

  try {
    const result = await runSuperAgent({
      task: 'Find leads',
      businessId: 'demo',
      options: { skipConfirmation: true },
      onStep: ({ agent, action, status }) => {
        if (status === 'error') {
          console.log(`❌ ${agent}: ${action}`);
        } else {
          console.log(`✓ ${agent}: ${action}`);
        }
      },
    });

    console.log(`\nFinal Status: ${result.final_summary.includes('Error') ? 'Failed' : 'Success'}`);
  } catch (error) {
    console.error(`\n❌ Workflow Error: ${(error as Error).message}`);
    // Save error to AgentTask
    // Show error notification to user
  }
}

// ─── Example 7: Monitor Progress (Frontend Integration) ────────────────────

async function frontendIntegration() {
  console.log('\n=== Example 7: Frontend Integration ===\n');

  const progressSteps: string[] = [];
  const actionPlanForReview: any = null;

  try {
    const result = await runSuperAgent({
      task: 'Generate Q4 marketing strategy',
      businessId: 'demo',
      options: { skipConfirmation: false },

      // Frontend: Update progress bar/log in real-time
      onStep: ({ agent, action, status }) => {
        progressSteps.push(action);
        console.log(`📊 Step ${progressSteps.length}: ${action}`);

        // Frontend would emit: window.eventEmitter.emit('agent-step', { agent, action, status })
        // WebSocket or SSE: ws.send({ type: 'agent-step', agent, action, status })
      },

      // Frontend: Show approval dialog modal
      onConfirm: async (actionPlan) => {
        console.log(`\n🔔 Approval Required`);
        console.log(`  ${actionPlan.length} actions need review`);

        // Frontend code would:
        // 1. Show modal with actionPlan details
        // 2. Display "Approve" / "Reject" buttons
        // 3. Return user's choice

        // Simulated user decision (in real app: from modal button click)
        const userDecision = await simulateUserDialog(actionPlan);
        return userDecision;
      },
    });

    // Frontend: Display results
    console.log(`\n✅ Complete`);
    console.log(`  Steps: ${progressSteps.length}`);
    console.log(`  Records: ${result.records_created.length}`);
    console.log(`  Summary: ${result.final_summary}`);

    // Frontend would:
    // 1. Hide modal
    // 2. Show success toast/notification
    // 3. Redirect to created records page
  } catch (error) {
    console.error(`\n❌ Workflow Failed`);
    // Frontend would show error toast/notification
  }
}

// ─── Helper: Simulate User Dialog ─────────────────────────────────────────────

async function simulateUserDialog(actionPlan: any[]): Promise<boolean> {
  // In real app, this would be:
  // - Modal showing each action
  // - Approve/Reject/Edit buttons
  // - Confirmation before proceeding

  console.log('\n   📋 Action Plan Details:');
  actionPlan.forEach((action, i) => {
    console.log(`     ${i + 1}. ${action.action_type}`);
    console.log(`        ${action.description}`);
  });

  // Simulated delay for user interaction
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('\n   ✅ User Approved');
  return true;
}

// ─── Run Examples ───────────────────────────────────────────────────────────

async function runAllExamples() {
  if (!process.env.AIMLAPI_KEY && !process.env.TOKENROUTER_API_KEY) {
    console.log('⚠️  Skipping examples — no LLM provider configured');
    console.log('Set AIMLAPI_KEY or TOKENROUTER_API_KEY in .env to run');
    return;
  }

  try {
    // Uncomment to run individual examples:

    // await findLeadsWorkflow();
    // await trackCompetitorsWorkflow();
    // await generateCampaignWorkflow();
    // await weeklyTaskWorkflow();
    // await handlingRejectionWorkflow();
    // await errorHandlingWorkflow();
    // await frontendIntegration();

    console.log('📚 Examples available (see comments to run)\n');
  } catch (error) {
    console.error('Example error:', error);
  }
}

// runAllExamples();
