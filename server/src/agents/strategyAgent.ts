/**
 * Strategy Agent — Analyzes business data and research findings.
 *
 * Generates strategic recommendations and action plans based on local data
 * (Leads, Opportunities) and research insights.
 *
 * Usage:
 *   const result = await runStrategyAgent({
 *     task: "Generate growth strategy",
 *     businessContext: { business_id: 'demo', name: 'TechCorp' },
 *     researchFindings: { findings: [...], summary: '...' },
 *     onStep: ({ agent, action, status }) => console.log(action)
 *   });
 */

import { z } from 'zod';
import { getLLM } from '../llm/providers.js';
import { LeadModel } from '../db/models/Lead.js';
import { OpportunityModel } from '../db/models/Opportunity.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const STRATEGY_OUTPUT_SCHEMA = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      rationale: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      effort: z.enum(['low', 'medium', 'high']),
    })
  ),
  action_plan: z.array(
    z.object({
      action_type: z.enum(['create_campaign', 'draft_post', 'create_lead', 'schedule_followup']),
      description: z.string(),
      entity_data: z.record(z.any()),
    })
  ),
  summary: z.string(),
});

type StrategyOutput = z.infer<typeof STRATEGY_OUTPUT_SCHEMA>;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusinessContext {
  business_id?: string;
  name?: string;
  type?: string;
  city?: string;
  [key: string]: any;
}

export interface ResearchFindings {
  findings?: Array<any>;
  summary?: string;
  data_freshness?: string;
}

export interface StepCallback {
  agent: string;
  action: string;
  status: 'running' | 'complete' | 'error';
}

// ─── Strategy Agent ──────────────────────────────────────────────────────────

/**
 * Runs the strategy agent to generate recommendations and action plans.
 *
 * @param task               The strategy task/question
 * @param businessContext    Business info for context
 * @param researchFindings   Research output from research agent
 * @param onStep            Callback for progress updates
 * @returns                Strategy recommendations + action plan
 */
export async function runStrategyAgent({
  task,
  businessContext,
  researchFindings,
  onStep,
}: {
  task: string;
  businessContext: BusinessContext;
  researchFindings?: ResearchFindings;
  onStep?: (step: StepCallback) => void;
}): Promise<StrategyOutput> {
  onStep?.({ agent: 'Strategy Agent', action: 'Analyzing business data…', status: 'running' });

  try {
    const llm = getLLM();
    const businessId = businessContext.business_id || 'demo';

    // Fetch recent business data for context
    const recentLeads = await LeadModel.find({ business_id: businessId })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const recentOpportunities = await OpportunityModel.find({ business_id: businessId })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    // Build strategy prompt
    const leadSummary = recentLeads.length > 0
      ? `Recent leads (${recentLeads.length}): ${recentLeads.map(l => l.name || l.email).join(', ')}`
      : 'No recent leads';

    const opportunitySummary = recentOpportunities.length > 0
      ? `Active opportunities (${recentOpportunities.length}): ${recentOpportunities.map(o => o.title).join(', ')}`
      : 'No recent opportunities';

    const researchContext = researchFindings?.summary
      ? `Research insights: ${researchFindings.summary}`
      : 'No research data provided';

    const strategyPrompt = `You are a strategic business consultant. Develop a strategy based on:

Task: ${task}

Business Context:
- Business: ${businessContext.name || 'Unknown'}
- Type: ${businessContext.type || 'General'}
- City: ${businessContext.city || 'Unknown'}

Current Data:
- ${leadSummary}
- ${opportunitySummary}

${researchContext}

Generate 3-5 strategic recommendations with:
1. Clear title and rationale
2. Priority level (low, medium, high)
3. Estimated effort (low, medium, high)

Also create an action plan with specific next steps.`;

    const structuredLLM = llm.withStructuredOutput(STRATEGY_OUTPUT_SCHEMA);
    const result = await structuredLLM.invoke(strategyPrompt);

    onStep?.({
      agent: 'Strategy Agent',
      action: `Generated ${result.recommendations.length} recommendations ✓`,
      status: 'complete',
    });

    return result;
  } catch (error) {
    onStep?.({
      agent: 'Strategy Agent',
      action: `Error: ${(error as Error).message}`,
      status: 'error',
    });
    throw error;
  }
}
