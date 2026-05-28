import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
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
  start_date?: Date;
  end_date?: Date;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue_attributed?: number;
  ai_generated?: boolean;
  opportunity_id?: string;
}

const CampaignSchema = new Schema<ICampaign>({
  business_id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['email', 'sms', 'google_ads', 'facebook_ads', 'instagram', 'promotion'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  objective: String,
  target_audience: String,
  headline: String,
  body_copy: String,
  cta: String,
  budget: Number,
  start_date: Date,
  end_date: Date,
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  revenue_attributed: { type: Number, default: 0 },
  ai_generated: { type: Boolean, default: false },
  opportunity_id: String,
}, { timestamps: true });

export const CampaignModel = mongoose.model<ICampaign>('Campaign', CampaignSchema);
