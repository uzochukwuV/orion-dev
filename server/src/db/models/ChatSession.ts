import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  action_taken?: string;
}

export interface IChatSession extends Document {
  business_id: string;
  title?: string;
  messages?: IChatMessage[];
  last_message_at?: Date;
  agent_run_ids?: string[];
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'assistant'] },
  content: String,
  timestamp: String,
  action_taken: String,
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>({
  business_id: { type: String, required: true },
  title: String,
  messages: [ChatMessageSchema],
  last_message_at: Date,
  agent_run_ids: [String],
}, { timestamps: true });

export const ChatSessionModel = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
