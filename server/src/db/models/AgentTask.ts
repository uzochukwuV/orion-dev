import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentTaskStep {
  agent: string;
  action: string;
  result?: string;
  status: string;
}

export interface IAgentTaskRecord {
  entity_type: string;
  entity_id: string;
  description: string;
}

export interface IAgentTask extends Document {
  business_id: string;
  session_id?: string;
  task: string;
  agent_chain: string[];
  status: 'running' | 'awaiting_approval' | 'completed' | 'rejected' | 'failed';
  steps: IAgentTaskStep[];
  final_summary?: string;
  records_created: IAgentTaskRecord[];
  error_message?: string;
}

const AgentTaskSchema = new Schema<IAgentTask>({
  business_id: { type: String, required: true },
  session_id: String,
  task: { type: String, required: true },
  agent_chain: [String],
  status: {
    type: String,
    enum: ['running', 'awaiting_approval', 'completed', 'rejected', 'failed'],
    default: 'running',
  },
  steps: [{
    agent: String,
    action: String,
    result: String,
    status: String,
  }],
  final_summary: String,
  records_created: [{
    entity_type: String,
    entity_id: String,
    description: String,
  }],
  error_message: String,
}, { timestamps: true });

export const AgentTaskModel = mongoose.model<IAgentTask>('AgentTask', AgentTaskSchema);
