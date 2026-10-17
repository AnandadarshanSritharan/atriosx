import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';
export type BookingSource = 'website' | 'phone' | 'walk_in' | 'admin' | 'other';

export interface IBooking extends Document {
  bookingNumber: string;
  customer: mongoose.Types.ObjectId;
  facility: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  durationMinutes: number;
  personCount: number;
  rateSnapshot: number; // rate at time of booking — never changes
  subtotal: number;
  discount: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  bookingSource: BookingSource;
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdBy?: mongoose.Types.ObjectId; // null = public booking
  updatedBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancelReason?: string;
  archived: boolean;
  auditTrail: Array<{
    action: string;
    by?: mongoose.Types.ObjectId;
    at: Date;
    note?: string;
  }>;
}

const bookingSchema = new Schema<IBooking>({
  bookingNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String, required: true }, // HH:MM
  durationMinutes: { type: Number, required: true },
  personCount: { type: Number, default: 1 },
  rateSnapshot: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled','no_show'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid','paid','partial','refunded'], default: 'unpaid' },
  paymentMethod: String,
  bookingSource: { type: String, enum: ['website','phone','walk_in','admin','other'], default: 'website' },
  notes: String,
  checkedIn: { type: Boolean, default: false },
  checkedInAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: Date,
  cancelReason: String,
  archived: { type: Boolean, default: false },
  auditTrail: [{
    action: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

// CRITICAL: Compound index for conflict detection
bookingSchema.index({ facility: 1, date: 1, status: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
