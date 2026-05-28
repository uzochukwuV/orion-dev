import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: 'website_form' | 'phone_call' | 'social_dm' | 'referral' | 'google' | 'facebook' | 'walk_in' | 'other';
  service_interest?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
  ai_score?: number;
  notes?: string;
  last_contacted?: Date;
  follow_up_date?: Date;
  value_estimate?: number;
  ai_followup_sent?: boolean;
  campaign_id?: string;
}

const LeadSchema = new Schema<ILead>({
  business_id: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  source: {
    type: String,
    enum: ['website_form', 'phone_call', 'social_dm', 'referral', 'google', 'facebook', 'walk_in', 'other'],
  },
  service_interest: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'],
    default: 'new',
  },
  ai_score: Number,
  notes: String,
  last_contacted: Date,
  follow_up_date: Date,
  value_estimate: Number,
  ai_followup_sent: { type: Boolean, default: false },
  campaign_id: String,
}, { timestamps: true });

export const LeadModel = mongoose.model<ILead>('Lead', LeadSchema);
