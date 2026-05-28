import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledTask extends Document {
  business_id: string;
  name: string;
  task_description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: string;
  time_of_day: string;
  enabled: boolean;
  last_run?: Date;
  next_run?: Date;
  last_result?: string;
  run_count: number;
}

const ScheduledTaskSchema = new Schema<IScheduledTask>({
  business_id: { type: String, required: true },
  name: { type: String, required: true },
  task_description: { type: String, required: true },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  day_of_week: String,
  time_of_day: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  last_run: Date,
  next_run: Date,
  last_result: String,
  run_count: { type: Number, default: 0 },
}, { timestamps: true });

export const ScheduledTaskModel = mongoose.model<IScheduledTask>('ScheduledTask', ScheduledTaskSchema);
