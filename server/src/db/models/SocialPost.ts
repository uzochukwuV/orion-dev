import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialPost extends Document {
  business_id: string;
  platform: 'instagram' | 'facebook' | 'google_business' | 'twitter';
  content: string;
  hashtags?: string[];
  image_url?: string;
  status?: 'draft' | 'pending_approval' | 'scheduled' | 'published' | 'failed';
  scheduled_for?: Date;
  published_at?: Date;
  likes?: number;
  comments?: number;
  reach?: number;
  ai_generated?: boolean;
  topic?: string;
}

const SocialPostSchema = new Schema<ISocialPost>({
  business_id: { type: String, required: true },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'google_business', 'twitter'],
    required: true,
  },
  content: { type: String, required: true },
  hashtags: [String],
  image_url: String,
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'scheduled', 'published', 'failed'],
    default: 'draft',
  },
  scheduled_for: Date,
  published_at: Date,
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  ai_generated: { type: Boolean, default: true },
  topic: String,
}, { timestamps: true });

export const SocialPostModel = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
