/**
 * Typed entity API functions that mirror the base44 SDK interface.
 * All entity CRUD maps to the backend REST API at /api/entities/{EntityName}.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';
export { apiPost, apiDelete, apiGet, apiPut }

// ---------------------------------------------------------------------------
// Dashboard Stats API
// ---------------------------------------------------------------------------

export interface DashboardStats {
  leads: {
    total: number;
    active: number;
    won: number;
    totalValue: number;
  };
  campaigns: {
    total: number;
    active: number;
    pending: number;
    revenue: number;
    clicks: number;
    impressions: number;
  };
  opportunities: {
    total: number;
    new: number;
    highUrgency: number;
    actedOn: number;
    avgImpact: number;
  };
  agentRuns: Array<{
    id: string;
    agent_type: string;
    status: string;
    output_summary?: string;
    createdAt: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>('/api/dashboard/stats');
}
// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Options accepted by every .list() call */
export interface ListOptions {
  sort?: string;
  limit?: number;
}

/** Generic record shape returned by the backend (includes _id / id) */
export interface BaseRecord {
  id?: string;
  _id?: string;
  created_at?: string;
  updated_at?: string;
}

function entityPath(name: string): string {
  return `/api/entities/${name}`;
}

/** Build a generic CRUD object for a given entity name. */
function makeEntityApi<TRecord extends BaseRecord, TCreate = Partial<TRecord>>(name: string) {
  return {
    /** List records. sort defaults to '-created_at', limit defaults to 20. */
    list(sort?: string, limit?: number): Promise<TRecord[]> {
      const params: Record<string, string | number | undefined> = {};
      if (sort !== undefined) params.sort = sort;
      if (limit !== undefined) params.limit = limit;
      return apiGet<TRecord[]>(entityPath(name), params);
    },

    /** Fetch a single record by ID. */
    get(id: string): Promise<TRecord> {
      return apiGet<TRecord>(`${entityPath(name)}/${id}`);
    },

    /** Create a new record. */
    create(data: TCreate): Promise<TRecord> {
      return apiPost<TRecord>(entityPath(name), data);
    },

    /** Partially update a record by ID. */
    update(id: string, data: Partial<TRecord>): Promise<TRecord> {
      return apiPut<TRecord>(`${entityPath(name)}/${id}`, data);
    },

    /** Delete a record by ID. */
    delete(id: string): Promise<void> {
      return apiDelete<void>(`${entityPath(name)}/${id}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Entity type definitions (matching the JSON schemas in /entities/)
// ---------------------------------------------------------------------------

export interface Lead extends BaseRecord {
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: 'website_form' | 'phone_call' | 'social_dm' | 'referral' | 'google' | 'facebook' | 'walk_in' | 'other';
  service_interest?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
  ai_score?: number;
  notes?: string;
  last_contacted?: string;
  follow_up_date?: string;
  value_estimate?: number;
  ai_followup_sent?: boolean;
  campaign_id?: string;
}

export interface Campaign extends BaseRecord {
  business_id: string;
  name: string;
  type: 'email' | 'sms' | 'google_ads' | 'facebook_ads' | 'instagram' | 'promotion';
  status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'cancelled';
  objective?: string;
  target_audience?: string;
  headline?: string;
  body_copy?: string;
  cta?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue_attributed?: number;
  ai_generated?: boolean;
  opportunity_id?: string;
}

export interface Opportunity extends BaseRecord {
  business_id: string;
  title: string;
  description?: string;
  category: 'pricing' | 'competitor' | 'trend' | 'review' | 'seasonal' | 'gap';
  source?: string;
  impact_score?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'new' | 'reviewed' | 'acted_on' | 'dismissed';
  raw_data?: string;
  suggested_action?: string;
  action_taken?: string;
}

export interface SocialPost extends BaseRecord {
  business_id: string;
  platform: 'instagram' | 'facebook' | 'google_business' | 'twitter';
  content: string;
  hashtags?: string[];
  image_url?: string;
  status?: 'draft' | 'pending_approval' | 'scheduled' | 'published' | 'failed';
  scheduled_for?: string;
  published_at?: string;
  likes?: number;
  comments?: number;
  reach?: number;
  ai_generated?: boolean;
  topic?: string;
}

export interface AgentRun extends BaseRecord {
  business_id: string;
  agent_type: 'market_intelligence' | 'marketing' | 'sales' | 'social_media' | 'voice_chat' | 'orchestrator';
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  trigger?: 'manual' | 'scheduled' | 'voice' | 'chat' | 'webhook';
  input_summary?: string;
  output_summary?: string;
  actions_taken?: string[];
  duration_seconds?: number;
  tokens_used?: number;
  error_message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  action_taken?: string;
}

export interface ChatSession extends BaseRecord {
  business_id: string;
  title?: string;
  messages?: ChatMessage[];
  last_message_at?: string;
  agent_run_ids?: string[];
}

export interface AgentTaskStep {
  agent?: string;
  action?: string;
  result?: string;
  status?: string;
}

export interface AgentTaskRecord extends BaseRecord {
  business_id: string;
  session_id?: string;
  task?: string;
  agent_chain?: string[];
  status?: 'running' | 'awaiting_approval' | 'completed' | 'rejected' | 'failed';
  steps?: AgentTaskStep[];
  final_summary?: string;
  records_created?: Array<{ entity_type: string; entity_id: string; description: string }>;
}

export interface ScheduledTask extends BaseRecord {
  business_id: string;
  name?: string;
  task_description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  day_of_week?: string;
  time_of_day?: string;
  enabled?: boolean;
  last_run?: string;
  next_run?: string;
  last_result?: string;
  run_count?: number;
}

export interface Business extends BaseRecord {
  name: string;
  type: 'salon' | 'gym' | 'restaurant' | 'plumber' | 'electrician' | 'cleaner' | 'landscaper' | 'pet_services' | 'retail' | 'other';
  owner_email: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  description?: string;
  plan?: 'starter' | 'growth' | 'pro';
  plan_status?: 'active' | 'cancelled' | 'trialing' | 'past_due';
  onboarding_complete?: boolean;
  google_business_connected?: boolean;
  facebook_connected?: boolean;
  instagram_connected?: boolean;
  logo_url?: string;
  target_audience?: string;
  main_services?: string[];
  competitors?: string[];
  monthly_revenue_goal?: number;
}

// ---------------------------------------------------------------------------
// Entity API objects — mirrors base44.entities.*
// ---------------------------------------------------------------------------

export const entities = {
  Lead: makeEntityApi<Lead>('Lead'),
  Campaign: makeEntityApi<Campaign>('Campaign'),
  Opportunity: makeEntityApi<Opportunity>('Opportunity'),
  SocialPost: makeEntityApi<SocialPost>('SocialPost'),
  AgentRun: makeEntityApi<AgentRun>('AgentRun'),
  ChatSession: makeEntityApi<ChatSession>('ChatSession'),
  AgentTask: makeEntityApi<AgentTaskRecord>('AgentTask'),
  ScheduledTask: makeEntityApi<ScheduledTask>('ScheduledTask'),
  Business: makeEntityApi<Business>('Business'),
};
