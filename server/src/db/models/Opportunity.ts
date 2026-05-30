import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunity extends Document {
  business_id: string;
  title: string;
  description?: string;
  category: 'pricing' | 'competitor' | 'trend' | 'review' | 'seasonal' | 'gap' | 'market' | 'technology' | 'customer' | 'lead' | 'general';
  source?: string;
  impact_score?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'new' | 'reviewed' | 'acted_on' | 'dismissed';
  raw_data?: string;
  suggested_action?: string;
  action_taken?: string;
}

const OpportunitySchema = new Schema<IOpportunity>({
  business_id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['pricing', 'competitor', 'trend', 'review', 'seasonal', 'gap', 'market', 'technology', 'customer', 'lead', 'general'],
    required: true,
  },
  source: String,
  impact_score: Number,
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'acted_on', 'dismissed'],
    default: 'new',
  },
  raw_data: String,
  suggested_action: String,
  action_taken: String,
}, { timestamps: true });

export const OpportunityModel = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
