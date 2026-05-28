/**
 * SuperAgent Orchestrator — Intent classification + agent chain routing.
 *
 * Classifies user tasks into intents, selects the appropriate agent chain,
 * orchestrates execution with human-in-loop approval gates, and saves all
 * steps to MongoDB AgentTask documents.
 *
 * Usage:
 *   const result = await runSuperAgent({
 *     task: "Find 10 leads in tech industry",
 *     businessId: "demo",
 *     options: { skipConfirmation: false },
 *     onStep: ({ agent, action, status }) => console.log(action),
 *     onConfirm: async (plan) => userApprovedPlan ? true : false,
 *   });
 */

import { z } from 'zod';
import { getLLM } from '../llm/providers.js';
import {
  runResearchAgent,
  runStrategyAgent,
  runExecutionAgent,
} from './index.js';
import { AgentTaskModel } from '../db/models/AgentTask.js';
import { BusinessModel } from '../db/models/Business.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const INTENT_SCHEMA = z.object({
  intent: z.enum([
    'find_leads',
    'track_competitors',
    'generate_campaign',
    'weekly_summary',
    'brand_mentions',
    'general_chat',
  ]),
  confidence: z.number().min(0).max(1),
  context: z.object({}).passthrough(),
});

type IntentClassification = z.infer<typeof INTENT_SCHEMA>;

// ─── Intent to Agent Chain Mapping ───────────────────────────────────────────

const INTENT_CHAINS: Record<string, ('research' | 'strategy' | 'execution')[]> = {
  find_leads: ['research', 'strategy', 'execution'],
  track_competitors: ['research'],
  generate_campaign: ['strategy', 'execution'],
  weekly_summary: ['strategy'],
  brand_mentions: ['research'],
  general_chat: [],
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StepCallback {
  agent: string;
  action: string;
  status: 'running' | 'complete' | 'error';
}

export interface AgentStep {
  agent: string;
  action: string;
  result?: string;
  status: 'running' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed' | 'failed';
  error?: string;
}

export interface SuperAgentOptions {
  skipConfirmation?: boolean;
}

// ─── Classification Function ─────────────────────────────────────────────────

/**
 * Classifies a user task into an intent and extracts context.
 */
async function classifyIntent(task: string, llm: any): Promise<IntentClassification> {
  const classificationPrompt = `Classify the following user task into one of these intents:
- find_leads: Searching for potential customers or business leads
- track_competitors: Monitoring or analyzing competitors
- generate_campaign: Creating marketing campaigns or content
- weekly_summary: Generating periodic business summaries or reports
- brand_mentions: Finding or tracking brand mentions online
- general_chat: General conversation or questions

Task: "${task}"

Respond with JSON: { "intent": "...", "confidence": 0.0-1.0, "context": {...} }`;

  const structuredLLM = llm.withStructuredOutput(INTENT_SCHEMA);
  const result = await structuredLLM.invoke(classificationPrompt);
  return result;
}

// ─── SuperAgent Orchestrator ─────────────────────────────────────────────────

/**
 * Runs the SuperAgent orchestrator for a given task.
 *
 * @param task              User task/prompt
 * @param businessId        Business ID to work with
 * @param options           { skipConfirmation?: boolean }
 * @param onStep           Callback for progress updates
 * @param onConfirm        Callback for user approval gate (called with action_plan)
 * @returns                SuperAgent result with all steps + records created
 */
export async function runSuperAgent({
  task,
  businessId,
  options = {},
  onStep,
  onConfirm,
}: {
  task: string;
  businessId: string;
  options?: SuperAgentOptions;
  onStep?: (step: StepCallback) => void;
  onConfirm?: (actionPlan: any[]) => Promise<boolean>;
}): Promise<{
  agentTaskId: string;
  intent: string;
  steps: AgentStep[];
  final_summary: string;
  records_created: Array<{ entity_type: string; entity_id: string; description: string }>;
}> {
  const llm = getLLM();
  const steps: AgentStep[] = [];
  const recordsCreated: Array<{ entity_type: string; entity_id: string; description: string }> = [];

  onStep?.({ agent: 'SuperAgent', action: 'Classifying intent…', status: 'running' });

  try {
    // ─── Phase 1: Create AgentTask document ──────────────────────────────────

    const agentTask = await AgentTaskModel.create({
      business_id: businessId,
      task,
      agent_chain: [],
      status: 'running',
      steps: [],
    });

    const agentTaskId = agentTask._id.toString();

    // ─── Phase 2: Classify intent ────────────────────────────────────────────

    const classification = await classifyIntent(task, llm);
    const intentChain = INTENT_CHAINS[classification.intent] || [];

    steps.push({
      agent: 'Classifier',
      action: `Classified as: ${classification.intent} (confidence: ${(classification.confidence * 100).toFixed(0)}%)`,
      status: 'completed',
    });

    onStep?.({
      agent: 'SuperAgent',
      action: `Intent: ${classification.intent} | Chain: ${intentChain.join(' → ') || 'none'}`,
      status: 'complete',
    });

    // ─── Phase 3: Fetch business context ─────────────────────────────────────

    const business = await BusinessModel.findOne({ _id: businessId }).lean();
    const businessContext = business || { business_id: businessId, name: 'Unknown' };

    // ─── Phase 4: Execute agent chain ────────────────────────────────────────

    let researchFindings: any = null;
    let strategyRecommendations: any = null;

    // Research Agent
    if (intentChain.includes('research')) {
      try {
        onStep?.({ agent: 'SuperAgent', action: 'Running Research Agent…', status: 'running' });

        researchFindings = await runResearchAgent({
          task,
          businessContext,
          onStep: (step) => {
            steps.push({
              agent: step.agent,
              action: step.action,
              status: 'completed',
            });
            onStep?.(step);
          },
        });

        steps.push({
          agent: 'Research Agent',
          action: `Found ${researchFindings.findings?.length || 0} findings`,
          result: JSON.stringify(researchFindings),
          status: 'completed',
        });
      } catch (error) {
        const errorMsg = (error as Error).message;
        steps.push({
          agent: 'Research Agent',
          action: 'Research failed',
          status: 'failed',
          error: errorMsg,
        });
        throw new Error(`Research Agent failed: ${errorMsg}`);
      }
    }

    // Strategy Agent
    if (intentChain.includes('strategy')) {
      try {
        onStep?.({ agent: 'SuperAgent', action: 'Running Strategy Agent…', status: 'running' });

        strategyRecommendations = await runStrategyAgent({
          task,
          businessContext,
          researchFindings,
          onStep: (step) => {
            steps.push({
              agent: step.agent,
              action: step.action,
              status: 'completed',
            });
            onStep?.(step);
          },
        });

        steps.push({
          agent: 'Strategy Agent',
          action: `Generated ${strategyRecommendations.recommendations?.length || 0} recommendations`,
          result: JSON.stringify(strategyRecommendations),
          status: 'completed',
        });
      } catch (error) {
        const errorMsg = (error as Error).message;
        steps.push({
          agent: 'Strategy Agent',
          action: 'Strategy generation failed',
          status: 'failed',
          error: errorMsg,
        });
        throw new Error(`Strategy Agent failed: ${errorMsg}`);
      }
    }

    // ─── Phase 5: User Approval Gate ─────────────────────────────────────────

    if (
      intentChain.includes('execution') &&
      strategyRecommendations?.action_plan &&
      !options.skipConfirmation
    ) {
      onStep?.({
        agent: 'SuperAgent',
        action: 'Awaiting user approval…',
        status: 'running',
      });

      steps.push({
        agent: 'UserGate',
        action: 'Waiting for user approval',
        status: 'awaiting_approval',
      });

      const approved = onConfirm ? await onConfirm(strategyRecommendations.action_plan) : false;

      if (!approved) {
        steps[steps.length - 1].status = 'rejected';
        steps.push({
          agent: 'UserGate',
          action: 'User rejected action plan',
          status: 'rejected',
        });

        await AgentTaskModel.updateOne(
          { _id: agentTaskId },
          {
            status: 'rejected',
            steps,
            final_summary: 'User rejected the proposed action plan',
          }
        );

        onStep?.({
          agent: 'SuperAgent',
          action: 'Execution cancelled by user',
          status: 'complete',
        });

        return {
          agentTaskId,
          intent: classification.intent,
          steps,
          final_summary: 'Rejected by user',
          records_created: recordsCreated,
        };
      }

      steps[steps.length - 1].status = 'approved';
      steps.push({
        agent: 'UserGate',
        action: 'User approved action plan',
        status: 'approved',
      });
    }

    // ─── Phase 6: Execution Agent ────────────────────────────────────────────

    if (intentChain.includes('execution') && strategyRecommendations?.action_plan) {
      try {
        onStep?.({ agent: 'SuperAgent', action: 'Executing actions…', status: 'running' });

        const executionResult = await runExecutionAgent({
          actions: strategyRecommendations.action_plan,
          businessContext,
          onStep: (step) => {
            steps.push({
              agent: step.agent,
              action: step.action,
              status: 'completed',
            });
            onStep?.(step);
          },
        });

        steps.push({
          agent: 'Execution Agent',
          action: `Executed ${executionResult.results.length} actions`,
          result: JSON.stringify(executionResult),
          status: 'completed',
        });

        // Track records created
        for (const res of executionResult.results) {
          recordsCreated.push({
            entity_type: res.entity_type,
            entity_id: res.record_id,
            description: res.description,
          });
        }
      } catch (error) {
        const errorMsg = (error as Error).message;
        steps.push({
          agent: 'Execution Agent',
          action: 'Execution failed',
          status: 'failed',
          error: errorMsg,
        });
        throw new Error(`Execution Agent failed: ${errorMsg}`);
      }
    }

    // ─── Phase 7: Generate Final Summary ─────────────────────────────────────

    const summaryPrompt = `Summarize this agent workflow in 2-3 sentences:

Intent: ${classification.intent}
Steps: ${steps.map((s) => s.action).join('; ')}
Records created: ${recordsCreated.length}`;

    const summaryResponse = await llm.invoke(summaryPrompt);
    const finalSummary = typeof summaryResponse.content === 'string' 
      ? summaryResponse.content 
      : JSON.stringify(summaryResponse);

    // ─── Phase 8: Update AgentTask with completion ───────────────────────────

    await AgentTaskModel.updateOne(
      { _id: agentTaskId },
      {
        status: 'completed',
        agent_chain: intentChain,
        steps,
        final_summary: finalSummary,
        records_created: recordsCreated,
      }
    );

    onStep?.({
      agent: 'SuperAgent',
      action: `Completed with ${recordsCreated.length} records created ✓`,
      status: 'complete',
    });

    return {
      agentTaskId,
      intent: classification.intent,
      steps,
      final_summary: finalSummary,
      records_created: recordsCreated,
    };
  } catch (error) {
    const errorMsg = (error as Error).message;

    steps.push({
      agent: 'SuperAgent',
      action: 'Workflow failed',
      status: 'failed',
      error: errorMsg,
    });

    onStep?.({
      agent: 'SuperAgent',
      action: `Error: ${errorMsg}`,
      status: 'error',
    });

    // Try to update AgentTask with error
    try {
      const existingTask = await AgentTaskModel.findOne({
        business_id: businessId,
        task,
        status: 'running',
      });

      if (existingTask) {
        await AgentTaskModel.updateOne(
          { _id: existingTask._id },
          {
            status: 'failed',
            steps,
            final_summary: `Error: ${errorMsg}`,
          }
        );
      }
    } catch (updateError) {
      console.error('Failed to update AgentTask:', updateError);
    }

    throw error;
  }
}
