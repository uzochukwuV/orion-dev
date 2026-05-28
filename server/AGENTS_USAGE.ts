/**
 * USAGE EXAMPLES — Wave 6 Agents
 */

// ─── Import ──────────────────────────────────────────────────────────────────

import {
  runResearchAgent,
  runStrategyAgent,
  runExecutionAgent,
} from './src/agents/index.js';

// ─── Research Agent ──────────────────────────────────────────────────────────

const researchResult = await runResearchAgent({
  task: 'Identify growth opportunities in AI market',
  businessContext: {
    business_id: 'demo',
    name: 'TechCorp',
    type: 'SaaS',
    city: 'San Francisco',
    competitors: ['Company A', 'Company B'],
  },
  onStep: ({ agent, action, status }) => {
    console.log(`[${agent}] ${action} (${status})`);
    // Frontend: emit SSE or WebSocket event
  },
});

// Result structure:
// {
//   findings: [
//     {
//       title: 'AI Automation Trend',
//       description: 'Growing demand for AI automation tools...',
//       category: 'trend',
//       urgency: 'high',
//       impact_score: 8,
//       source: 'Market Research',
//       suggested_action: 'Launch AI feature'
//     }
//   ],
//   summary: 'Overall market insights...',
//   data_freshness: 'Today'
// }

// ─── Strategy Agent ──────────────────────────────────────────────────────────

const strategyResult = await runStrategyAgent({
  task: 'Create Q1 growth plan',
  businessContext: {
    business_id: 'demo',
    name: 'TechCorp',
    type: 'SaaS',
  },
  researchFindings: researchResult, // From research agent
  onStep: ({ agent, action, status }) => {
    console.log(`[${agent}] ${action}`);
  },
});

// Result structure:
// {
//   recommendations: [
//     {
//       title: 'Launch AI Beta Program',
//       rationale: 'Market research shows strong demand...',
//       priority: 'high',
//       effort: 'medium'
//     }
//   ],
//   action_plan: [
//     {
//       action_type: 'create_campaign',
//       description: 'Email campaign for beta signup',
//       entity_data: { name: 'AI Beta', type: 'email' }
//     }
//   ],
//   summary: 'Recommended 3 initiatives...'
// }

// ─── Execution Agent ─────────────────────────────────────────────────────────

const executionResult = await runExecutionAgent({
  actions: strategyResult.action_plan,
  businessContext: { business_id: 'demo' },
  onStep: ({ agent, action, status }) => {
    console.log(`[${agent}] ${action}`);
  },
});

// Result structure:
// {
//   results: [
//     {
//       action_type: 'create_campaign',
//       entity_type: 'Campaign',
//       record_id: '60d5ec49f1b2c72d08c0d1a1',
//       description: 'Campaign "AI Beta" created'
//     }
//   ],
//   outcome_summary: 'Executed 3/3 actions: Campaign, Campaign, Lead'
// }

// ─── Typical Flow ────────────────────────────────────────────────────────────

async function fullAgentWorkflow(task: string, businessId: string) {
  const business = { business_id: businessId, name: 'TechCorp' };

  // Step 1: Research
  const research = await runResearchAgent({
    task,
    businessContext: business,
    onStep: (s) => console.log(s),
  });

  // Step 2: Strategy (uses research findings)
  const strategy = await runStrategyAgent({
    task,
    businessContext: business,
    researchFindings: research,
    onStep: (s) => console.log(s),
  });

  // Step 3: Get user approval (frontend gate)
  const userApproved = await askUserForApproval(strategy.action_plan);

  if (userApproved) {
    // Step 4: Execute
    const execution = await runExecutionAgent({
      actions: strategy.action_plan,
      businessContext: business,
      onStep: (s) => console.log(s),
    });

    return { research, strategy, execution };
  } else {
    throw new Error('User rejected action plan');
  }
}

// ─── Error Handling ──────────────────────────────────────────────────────────

try {
  const result = await runResearchAgent({
    task: 'Find opportunities',
    businessContext: { business_id: 'demo', name: 'Test' },
    onStep: (s) => console.log(s),
  });
} catch (error) {
  console.error('Agent failed:', error);
  // Error saved to AgentTask in database
  // Frontend shows error notification
}

// ─── Database Records Created ────────────────────────────────────────────────

// Research Agent creates:
// - Opportunity documents for each finding

// Strategy Agent queries:
// - Lead documents (10 most recent)
// - Opportunity documents (10 most recent)

// Execution Agent creates:
// - Campaign documents (status: 'draft', ai_generated: true)
// - SocialPost documents (status: 'draft', ai_generated: true)
// - Lead documents (source: 'other', status: 'new')
// - Updates Lead documents (follow_up_date)
