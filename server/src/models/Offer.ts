import mongoose, { Document, Schema } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  description?: string;
  image?: string;
  code?: string;
  discountType: 'percentage' | 'fixed' | 'custom';
  discountValue: number;
  applicableFacilities: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  expiryDate?: Date;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  terms?: string;
}

const offerSchema = new Schema<IOffer>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  code: { type: String, trim: true, default: '' },
  discountType: { type: String, enum: ['percentage','fixed','custom'], default: 'percentage' },
  discountValue: { type: Number, default: 0 },
  applicableFacilities: [{ type: Schema.Types.ObjectId, ref: 'Facility' }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  expiryDate: { type: Date },
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  terms: { type: String, default: '' },
}, { timestamps: true });

offerSchema.pre('save', function () {
  if (this.expiryDate && !this.endDate) {
    this.endDate = this.expiryDate;
  } else if (this.endDate && !this.expiryDate) {
    this.expiryDate = this.endDate;
  }
});

offerSchema.index({ active: 1, startDate: 1, endDate: 1 });

export default mongoose.model<IOffer>('Offer', offerSchema);
