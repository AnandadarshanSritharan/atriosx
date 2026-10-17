import mongoose, { Document, Schema } from 'mongoose';

interface PeakPricing {
  days: number[];
  hours: { start: string; end: string };
  rate: number;
}

interface AvailabilitySlot {
  day: number;
  open: string;
  close: string;
  available: boolean;
}

export interface PricingTier {
  persons: number;
  hourlyRate: number;
  halfHourRate?: number;
}

export interface IFacility extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  description?: string;
  images: string[];
  hourlyRate: number;
  halfHourRate?: number;
  pricingTiers?: PricingTier[];
  minPersons?: number;
  maxPersons?: number;
  color: string;
  active: boolean;
  bookingEnabled: boolean;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  bufferTimeMinutes: number;
  displayOrder: number;
  rules: string[];
  features: string[];
  peakPricing: PeakPricing[];
  availability: AvailabilitySlot[];
  archived: boolean;
}

const facilitySchema = new Schema<IFacility>({
  name: { type: String, required: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'FacilityCategory', required: true },
  description: String,
  images: [String],
  hourlyRate: { type: Number, required: true, min: 0 },
  halfHourRate: Number,
  pricingTiers: [{
    persons: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },
    halfHourRate: Number,
  }],
  minPersons: { type: Number, default: 1 },
  maxPersons: { type: Number, default: 4 },
  color: { type: String, default: '#3d85c8' },
  active: { type: Boolean, default: true },
  bookingEnabled: { type: Boolean, default: true },
  minDurationMinutes: { type: Number, default: 30 },
  maxDurationMinutes: { type: Number, default: 240 },
  bufferTimeMinutes: { type: Number, default: 0 },
  displayOrder: { type: Number, default: 0 },
  rules: [String],
  features: [String],
  peakPricing: [{
    days: [Number],
    hours: { start: String, end: String },
    rate: Number,
  }],
  availability: [{
    day: Number,
    open: String,
    close: String,
    available: { type: Boolean, default: true },
  }],
  archived: { type: Boolean, default: false },
}, { timestamps: true });

facilitySchema.index({ active: 1, displayOrder: 1 });
facilitySchema.index({ category: 1 });

export default mongoose.model<IFacility>('Facility', facilitySchema);
