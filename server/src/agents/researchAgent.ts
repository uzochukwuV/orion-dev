/**
 * Research Agent — Scans live web data via Bright Data MCP tools.
 *
 * Generates structured findings from web research and saves them as Opportunities
 * in MongoDB.
 *
 * Usage:
 *   const result = await runResearchAgent({
 *     task: "Find latest AI trends",
 *     businessContext: { name: 'TechCorp', type: 'salon', city: 'SF', competitors: [...] },
 *     onStep: ({ agent, action, status }) => console.log(action)
 *   });
 */

import { z } from 'zod';
import { getLLM } from '../llm/providers.js';
import { getBrightDataTools } from '../tools/index.js';
import { OpportunityModel } from '../db/models/Opportunity.js';
import { getPlaybook, buildResearchPrompt, type Vertical } from '../playbooks/index.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RESEARCH_OUTPUT_SCHEMA = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      urgency: z.enum(['low', 'medium', 'high']),
      impact_score: z.number().min(0).max(10),
      source: z.string(),
      suggested_action: z.string(),
    })
  ),
  summary: z.string(),
  data_freshness: z.string(),
});

type ResearchOutput = z.infer<typeof RESEARCH_OUTPUT_SCHEMA>;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusinessContext {
  business_id?: string;
  name?: string;
  type?: string;
  city?: string;
  competitors?: string[];
  [key: string]: any;
}

export interface StepCallback {
  agent: string;
  action: string;
  status: 'running' | 'complete' | 'error';
}

// ─── Research Agent ──────────────────────────────────────────────────────────

/**
 * Runs the research agent to scan web data and generate findings.
 *
 * @param task              The research task/question
 * @param businessContext   Business info for context in the research prompt
 * @param onStep           Callback for progress updates
 * @returns                Research findings + summary
 */
export async function runResearchAgent({
  task,
  businessContext,
  onStep,
}: {
  task: string;
  businessContext: BusinessContext;
  onStep?: (step: StepCallback) => void;
}): Promise<ResearchOutput> {
  onStep?.({ agent: 'Research Agent', action: 'Scanning live web data via Bright Data…', status: 'running' });

  try {
    const llm = getLLM();
    const tools = await getBrightDataTools();

    // Get vertical from businessContext
    const vertical = (businessContext.type as Vertical) || 'salon';
    const playbook = getPlaybook(vertical);

    // If no tools available, fall back to LLM-only knowledge
    if (tools.length === 0) {
      console.warn('[Research Agent] No Bright Data tools available — using LLM knowledge only');
    }

    // Build vertical-aware research prompt
    const businessInfo = {
      name: businessContext.name || 'Unknown Business',
      type: businessContext.type || 'General',
      city: businessContext.city || 'Unknown',
      location: businessContext.location || businessContext.city || 'Unknown',
      competitors: businessContext.competitors?.join(', ') || 'None specified',
    };

    // Use playbook to build the research prompt
    const researchPrompt = buildResearchPrompt(task, vertical, businessInfo);

    // Call LLM to get research response
    const researchResponse = await llm.invoke(researchPrompt);
    const researchText = typeof researchResponse.content === 'string' 
      ? researchResponse.content 
      : JSON.stringify(researchResponse);

    // Parse research into structured findings
    const structuredPrompt = `Convert this research summary into structured findings for a ${playbook.display_name}.

Research Summary:
${researchText}

Return a JSON object with:
{
  "findings": [
    {
      "title": "Finding title",
      "description": "Detailed description",
      "category": "market|competitor|trend|technology|customer",
      "urgency": "low|medium|high",
      "impact_score": 1-10,
      "source": "Where this came from",
      "suggested_action": "What to do about it"
    }
  ],
  "summary": "Overall research summary",
  "data_freshness": "Today's date"
}`;

    const structuredLLM = llm.withStructuredOutput(RESEARCH_OUTPUT_SCHEMA);
    const result = await structuredLLM.invoke(structuredPrompt);

    // Save findings as Opportunities in MongoDB
    for (const finding of result.findings) {
      await OpportunityModel.create({
        title: finding.title,
        description: finding.description,
        category: finding.category as any,
        source: finding.source || 'research_agent',
        impact_score: finding.impact_score,
        urgency: finding.urgency,
        status: 'new',
        business_id: businessContext.business_id || 'demo',
        suggested_action: finding.suggested_action,
        raw_data: JSON.stringify({ ...finding, vertical, playbook: playbook.display_name }),
      });
    }

    onStep?.({
      agent: 'Research Agent',
      action: `Found ${result.findings.length} insights for ${playbook.display_name} ✓`,
      status: 'complete',
    });

    return result;
  } catch (error) {
    onStep?.({
      agent: 'Research Agent',
      action: `Error: ${(error as Error).message}`,
      status: 'error',
    });
    throw error;
  }
}
