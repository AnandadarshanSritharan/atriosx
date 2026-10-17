import mongoose, { Document, Schema } from 'mongoose';

export interface IRevenue extends Document {
  title: string;
  source: 'booking' | 'food' | 'drinks' | 'event' | 'merchandise' | 'other';
  amount: number;
  date: Date;
  booking?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const revenueSchema = new Schema<IRevenue>({
  title: { type: String, required: true },
  source: { type: String, enum: ['booking','food','drinks','event','merchandise','other'], default: 'other' },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

revenueSchema.index({ date: -1 });
revenueSchema.index({ source: 1 });

export default mongoose.model<IRevenue>('Revenue', revenueSchema);
