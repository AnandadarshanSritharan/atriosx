import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: Date;
  noShowCount: number;
  notes?: string;
  loyaltyPoints: number;
  membershipTier: 'standard' | 'silver' | 'gold' | 'platinum';
  firstBooking?: Date;
  active: boolean;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: Date,
  noShowCount: { type: Number, default: 0 },
  notes: String,
  loyaltyPoints: { type: Number, default: 0 },
  membershipTier: { type: String, enum: ['standard', 'silver', 'gold', 'platinum'], default: 'standard' },
  firstBooking: Date,
  active: { type: Boolean, default: true },
}, { timestamps: true });

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });

export default mongoose.model<ICustomer>('Customer', customerSchema);
