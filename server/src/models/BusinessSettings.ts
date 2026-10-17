import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface IBusinessSettings extends Document {
  businessName: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
  };
  businessHours: {
    monday: IBusinessHours;
    tuesday: IBusinessHours;
    wednesday: IBusinessHours;
    thursday: IBusinessHours;
    friday: IBusinessHours;
    saturday: IBusinessHours;
    sunday: IBusinessHours;
  };
  workingHours?: {
    monday?: IBusinessHours;
    tuesday?: IBusinessHours;
    wednesday?: IBusinessHours;
    thursday?: IBusinessHours;
    friday?: IBusinessHours;
    saturday?: IBusinessHours;
    sunday?: IBusinessHours;
  };
  bookingSettings: {
    minDurationMinutes: number;
    maxDurationMinutes: number;
    intervalMinutes: number;
    advanceBookingDays: number;
    cancellationHours: number;
    bufferTimeMinutes: number;
    requirePhoneVerification: boolean;
  };
  financialSettings: {
    currency: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    taxRate: number;
    defaultPaymentStatus: string;
    profitCalculationMethod: 'investment' | 'manual';
  };
  websiteSettings: {
    heroTitle: string;
    heroSubtitle: string;
    metaTitle?: string;
    metaDescription?: string;
    googleMapsEmbed?: string;
    maintenanceMode: boolean;
  };
}

const defaultHours: IBusinessHours = { open: '10:00', close: '22:00', closed: false };

const businessHoursItemSchema = new Schema<IBusinessHours>({
  open: { type: String, default: '10:00' },
  close: { type: String, default: '22:00' },
  closed: { type: Boolean, default: false },
}, { _id: false });

const businessSettingsSchema = new Schema<IBusinessSettings>({
  businessName: { type: String, default: 'Atrios Entertainment' },
  logo: String,
  phone: String,
  email: String,
  address: String,
  website: String,
  socialLinks: {
    instagram: String,
    facebook: String,
    tiktok: String,
    whatsapp: String,
    youtube: String,
  },
  businessHours: {
    monday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    tuesday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    wednesday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    thursday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    friday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    saturday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours }) },
    sunday: { type: businessHoursItemSchema, default: () => ({ ...defaultHours, open: '11:00' }) },
  },
  workingHours: { type: Schema.Types.Mixed },
  bookingSettings: {
    minDurationMinutes: { type: Number, default: 30 },
    maxDurationMinutes: { type: Number, default: 240 },
    intervalMinutes: { type: Number, default: 30 },
    advanceBookingDays: { type: Number, default: 30 },
    cancellationHours: { type: Number, default: 2 },
    bufferTimeMinutes: { type: Number, default: 0 },
    requirePhoneVerification: { type: Boolean, default: false },
  },
  financialSettings: {
    currency: { type: String, default: 'LKR' },
    currencySymbol: { type: String, default: 'Rs.' },
    currencyPosition: { type: String, default: 'before' },
    taxRate: { type: Number, default: 0 },
    defaultPaymentStatus: { type: String, default: 'unpaid' },
    profitCalculationMethod: { type: String, default: 'investment' },
  },
  websiteSettings: {
    heroTitle: { type: String, default: 'ATRIOS ENTERTAINMENT' },
    heroSubtitle: { type: String, default: 'Play. Compete. Experience.' },
    metaTitle: String,
    metaDescription: String,
    googleMapsEmbed: String,
    maintenanceMode: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.model<IBusinessSettings>('BusinessSettings', businessSettingsSchema);
