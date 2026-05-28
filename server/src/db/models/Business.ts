import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  user_id?: mongoose.Types.ObjectId;  // NEW: Link to ClerkUser
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

const BusinessSchema = new Schema<IBusiness>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClerkUser',
    index: true,
  },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['salon', 'gym', 'restaurant', 'plumber', 'electrician', 'cleaner', 'landscaper', 'pet_services', 'retail', 'other'],
    required: true,
  },
  owner_email: { type: String, required: true },
  address: String,
  city: String,
  phone: String,
  website: String,
  description: String,
  plan: { type: String, enum: ['starter', 'growth', 'pro'], default: 'starter' },
  plan_status: { type: String, enum: ['active', 'cancelled', 'trialing', 'past_due'], default: 'trialing' },
  onboarding_complete: { type: Boolean, default: false },
  google_business_connected: { type: Boolean, default: false },
  facebook_connected: { type: Boolean, default: false },
  instagram_connected: { type: Boolean, default: false },
  logo_url: String,
  target_audience: String,
  main_services: [String],
  competitors: [String],
  monthly_revenue_goal: Number,
}, { timestamps: true });

export const BusinessModel = mongoose.model<IBusiness>('Business', BusinessSchema);
