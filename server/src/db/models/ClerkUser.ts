/**
 * ClerkUser Model — Links Clerk auth users to Orion database
 * 
 * When a user signs up via Clerk, a ClerkUser document is created
 * linking their Clerk ID to their business/data in MongoDB
 */

import mongoose from 'mongoose';

const clerkUserSchema = new mongoose.Schema(
  {
    clerk_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: String,
    
    // Link to default business (users can have multiple businesses later)
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    },

    // Subscription tier
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro'],
      default: 'free',
    },

    // Settings
    settings: {
      notifications_enabled: { type: Boolean, default: true },
      email_digest: { type: String, enum: ['daily', 'weekly', 'never'], default: 'weekly' },
    },

    // Timestamps
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
    verified_at: Date,
  },
  {
    timestamps: false,
  }
);

// Pre-save: Update timestamp
clerkUserSchema.pre('save', function (next: any) {
  this.updated_at = new Date();
  next();
});

export const ClerkUserModel = mongoose.model('ClerkUser', clerkUserSchema);
