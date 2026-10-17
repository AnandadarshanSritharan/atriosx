import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'closed' | 'special';
  specialHours?: { open: string; close: string };
}

const holidaySchema = new Schema<IHoliday>({
  date: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['closed','special'], default: 'closed' },
  specialHours: { open: String, close: String },
}, { timestamps: true });

export default mongoose.model<IHoliday>('Holiday', holidaySchema);
