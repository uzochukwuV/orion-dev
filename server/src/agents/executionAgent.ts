/**
 * Execution Agent — Creates and schedules records based on strategy actions.
 *
 * Translates action plans into concrete database records:
 * - create_campaign → Campaign document
 * - draft_post → SocialPost document
 * - create_lead → Lead document
 * - schedule_followup → Update existing Lead with follow_up_date
 *
 * Usage:
 *   const result = await runExecutionAgent({
 *     actions: [...],
 *     businessContext: { business_id: 'demo' },
 *     onStep: ({ agent, action, status }) => console.log(action)
 *   });
 */

import { CampaignModel } from '../db/models/Campaign.js';
import { SocialPostModel } from '../db/models/SocialPost.js';
import { LeadModel } from '../db/models/Lead.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExecutionAction {
  action_type: 'create_campaign' | 'draft_post' | 'create_lead' | 'schedule_followup';
  description: string;
  entity_data: Record<string, any>;
}

export interface BusinessContext {
  business_id?: string;
  name?: string;
  [key: string]: any;
}

export interface StepCallback {
  agent: string;
  action: string;
  status: 'running' | 'complete' | 'error';
}

export interface ExecutionResult {
  action_type: string;
  entity_type: string;
  record_id: string;
  description: string;
}

// ─── Execution Agent ─────────────────────────────────────────────────────────

/**
 * Executes a list of actions by creating and updating database records.
 *
 * @param actions           List of actions to execute
 * @param businessContext   Business info for record context
 * @param onStep           Callback for progress updates
 * @returns                Results of each executed action
 */
export async function runExecutionAgent({
  actions,
  businessContext,
  onStep,
}: {
  actions: ExecutionAction[];
  businessContext: BusinessContext;
  onStep?: (step: StepCallback) => void;
}): Promise<{
  results: ExecutionResult[];
  outcome_summary: string;
}> {
  onStep?.({ agent: 'Execution Agent', action: `Executing ${actions.length} actions…`, status: 'running' });

  const results: ExecutionResult[] = [];
  const businessId = businessContext.business_id || 'demo';

  try {
    for (const action of actions) {
      onStep?.({
        agent: 'Execution Agent',
        action: `Executing: ${action.description}`,
        status: 'running',
      });

      try {
        let result: ExecutionResult | null = null;

        switch (action.action_type) {
          case 'create_campaign':
            result = await executeCreateCampaign(action, businessId);
            break;
          case 'draft_post':
            result = await executeDraftPost(action, businessId);
            break;
          case 'create_lead':
            result = await executeCreateLead(action, businessId);
            break;
          case 'schedule_followup':
            result = await executeScheduleFollowup(action, businessId);
            break;
          default:
            console.warn(`Unknown action type: ${(action as any).action_type}`);
        }

        if (result) {
          results.push(result);
        }
      } catch (err) {
        console.error(`Failed to execute action: ${(err as Error).message}`);
        onStep?.({
          agent: 'Execution Agent',
          action: `Error executing: ${(err as Error).message}`,
          status: 'error',
        });
      }
    }

    const summary = `Executed ${results.length}/${actions.length} actions: ${results.map(r => r.entity_type).join(', ')}`;

    onStep?.({
      agent: 'Execution Agent',
      action: `${summary} ✓`,
      status: 'complete',
    });

    return { results, outcome_summary: summary };
  } catch (error) {
    onStep?.({
      agent: 'Execution Agent',
      action: `Error: ${(error as Error).message}`,
      status: 'error',
    });
    throw error;
  }
}

// ─── Action Executors ────────────────────────────────────────────────────────

async function executeCreateCampaign(
  action: ExecutionAction,
  businessId: string
): Promise<ExecutionResult> {
  const campaignData = action.entity_data;
  const campaign = await CampaignModel.create({
    business_id: businessId,
    name: campaignData.name || campaignData.title || 'Untitled Campaign',
    type: campaignData.type || 'email',
    status: 'draft',
    objective: campaignData.description || action.description,
    ai_generated: true,
  });

  return {
    action_type: 'create_campaign',
    entity_type: 'Campaign',
    record_id: campaign?._id.toString() || 'unknown',
    description: `Campaign "${campaign?.name}" created`,
  };
}

async function executeDraftPost(
  action: ExecutionAction,
  businessId: string
): Promise<ExecutionResult> {
  const postData = action.entity_data;
  const post = await SocialPostModel.create({
    business_id: businessId,
    content: postData.content || postData.text || action.description,
    platform: postData.platform || 'instagram',
    status: 'draft',
    ai_generated: true,
  });

  return {
    action_type: 'draft_post',
    entity_type: 'SocialPost',
    record_id: post?._id.toString() || 'unknown',
    description: `Post drafted: "${post?.content.substring(0, 50)}…"`,
  };
}

async function executeCreateLead(
  action: ExecutionAction,
  businessId: string
): Promise<ExecutionResult> {
  const leadData = action.entity_data;
  const lead = await LeadModel.create({
    business_id: businessId,
    name: leadData.name || 'Unknown Lead',
    email: leadData.email,
    phone: leadData.phone,
    source: 'other',
    status: 'new',
  });

  return {
    action_type: 'create_lead',
    entity_type: 'Lead',
    record_id: lead?._id.toString() || 'unknown',
    description: `Lead "${lead?.name}" created`,
  };
}

async function executeScheduleFollowup(
  action: ExecutionAction,
  businessId: string
): Promise<ExecutionResult> {
  const followupData = action.entity_data;
  const leadId = followupData.lead_id;
  const followupDate = new Date(followupData.follow_up_date || Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (!leadId) {
    throw new Error('lead_id is required for schedule_followup action');
  }

  const lead = await LeadModel.findByIdAndUpdate(
    leadId,
    {
      follow_up_date: followupDate,
      notes: (followupData.notes || '') + ` [Scheduled by AI on ${new Date().toISOString()}]`,
    },
    { new: true }
  );

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  return {
    action_type: 'schedule_followup',
    entity_type: 'Lead',
    record_id: lead?._id.toString() || 'unknown',
    description: `Followup scheduled for ${followupDate.toDateString()}`,
  };
}
