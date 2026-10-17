import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  email?: string;
  phone?: string;
  initialInvestment: number;
  additionalInvestments: Array<{ amount: number; date: Date; note?: string }>;
  totalInvestment: number;
  ownershipPercentage: number;
  percentageType: 'calculated' | 'manual';
  active: boolean;
  notes?: string;
  joinDate: Date;
}

const partnerSchema = new Schema<IPartner>({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: String,
  initialInvestment: { type: Number, required: true, default: 0 },
  additionalInvestments: [{
    amount: Number,
    date: Date,
    note: String,
  }],
  totalInvestment: { type: Number, default: 0 },
  ownershipPercentage: { type: Number, default: 0 },
  percentageType: { type: String, enum: ['calculated','manual'], default: 'calculated' },
  active: { type: Boolean, default: true },
  notes: String,
  joinDate: { type: Date, default: Date.now },
}, { timestamps: true });

partnerSchema.pre('save', function() {
  const additional = this.additionalInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  this.totalInvestment = this.initialInvestment + additional;
});

export default mongoose.model<IPartner>('Partner', partnerSchema);
