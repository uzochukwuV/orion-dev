/**
 * User Model — Email/password authentication (replaces ClerkUser)
 *
 * Stores user accounts with secure password hashing using bcrypt.
 * Users can own multiple businesses.
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface IUser extends Document {
  email: string;
  password_hash: string;
  name?: string;
  // Link to default business (users can have multiple businesses later)
  business_id?: mongoose.Types.ObjectId;
  // Subscription tier
  plan: 'free' | 'starter' | 'growth' | 'pro';
  // Settings
  settings: {
    notifications_enabled: boolean;
    email_digest: 'daily' | 'weekly' | 'never';
  };
  // Email verification
  email_verified: boolean;
  verification_token?: string;
  // Timestamps
  created_at: Date;
  updated_at: Date;
  verified_at?: Date;
  last_login?: Date;
  // Instance methods
  verifyPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    name: String,

    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    },

    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro'],
      default: 'starter',
    },

    settings: {
      notifications_enabled: { type: Boolean, default: true },
      email_digest: { type: String, enum: ['daily', 'weekly', 'never'], default: 'weekly' },
    },

    email_verified: {
      type: Boolean,
      default: false,
    },
    verification_token: String,

    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
    verified_at: Date,
    last_login: Date,
  },
  {
    timestamps: false,
    collection: 'users',
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  this.updated_at = new Date();

  // Only hash if password is modified
  if (!this.isModified('password_hash')) return;

  // If password_hash is not already a bcrypt hash (starts with $2)
  if (!this.password_hash.startsWith('$2')) {
    this.password_hash = await bcrypt.hash(this.password_hash, SALT_ROUNDS);
  }
});

// Instance method to verify password
userSchema.methods.verifyPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

// Static method to hash a password
userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Check if email is taken (case-insensitive)
userSchema.statics.emailTaken = async function (email: string): Promise<boolean> {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

export const UserModel = mongoose.model<IUser>('User', userSchema);
