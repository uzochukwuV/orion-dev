import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentRun extends Document {
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

const AgentRunSchema = new Schema<IAgentRun>({
  business_id: { type: String, required: true },
  agent_type: {
    type: String,
    enum: ['market_intelligence', 'marketing', 'sales', 'social_media', 'voice_chat', 'orchestrator'],
    required: true,
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    default: 'running',
  },
  trigger: {
    type: String,
    enum: ['manual', 'scheduled', 'voice', 'chat', 'webhook'],
    default: 'manual',
  },
  input_summary: String,
  output_summary: String,
  actions_taken: [String],
  duration_seconds: Number,
  tokens_used: Number,
  error_message: String,
}, { timestamps: true });

export const AgentRunModel = mongoose.model<IAgentRun>('AgentRun', AgentRunSchema);
