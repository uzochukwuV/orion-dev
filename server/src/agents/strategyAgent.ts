/**
 * Strategy Agent — Analyzes business data and research findings.
 *
 * Generates strategic recommendations and action plans based on local data
 * (Leads, Opportunities) and research insights.
 *
 * Usage:
 *   const result = await runStrategyAgent({
 *     task: "Generate growth strategy",
 *     businessContext: { business_id: 'demo', name: 'TechCorp', type: 'salon' },
 *     researchFindings: { findings: [...], summary: '...' },
 *     onStep: ({ agent, action, status }) => console.log(action)
 *   });
 */

import { z } from 'zod';
import { getLLM } from '../llm/providers.js';
import { LeadModel } from '../db/models/Lead.js';
import { OpportunityModel } from '../db/models/Opportunity.js';
import { getPlaybook, buildStrategyPrompt, type Vertical } from '../playbooks/index.js';

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
  // Get vertical from businessContext
  const vertical = (businessContext.type as Vertical) || 'salon';
  const playbook = getPlaybook(vertical);
  
  onStep?.({ agent: 'Strategy Agent', action: `Analyzing data for ${playbook.display_name}…`, status: 'running' });

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

    // Build strategy prompt using playbook
    const leadSummary = recentLeads.length > 0
      ? `Recent leads (${recentLeads.length}): ${recentLeads.map(l => l.name || l.email).join(', ')}`
      : 'No recent leads';

    const opportunitySummary = recentOpportunities.length > 0
      ? `Active opportunities (${recentOpportunities.length}): ${recentOpportunities.map(o => o.title).join(', ')}`
      : 'No recent opportunities';

    const strategyPrompt = buildStrategyPrompt(
      task,
      vertical,
      {
        name: businessContext.name || 'Unknown',
        type: playbook.display_name,
        city: businessContext.city || 'Unknown',
      },
      researchFindings
    );

    // Add local business context to the prompt
    const localContextPrompt = `${strategyPrompt}

Local Business Data:
- ${leadSummary}
- ${opportunitySummary}

KPIs for this vertical:
- Primary: ${playbook.kpis.primary.join(', ')}
- Secondary: ${playbook.kpis.secondary.join(', ')}

Generate recommendations with clear rationale and action plans.`;

    const structuredLLM = llm.withStructuredOutput(STRATEGY_OUTPUT_SCHEMA);
    const result = await structuredLLM.invoke(localContextPrompt);

    onStep?.({
      agent: 'Strategy Agent',
      action: `Generated ${result.recommendations.length} recommendations for ${playbook.display_name} ✓`,
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
