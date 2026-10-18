import mongoose, { Document, Schema } from 'mongoose';

export interface IFacilityCategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  displayOrder: number;
  active: boolean;
}

const facilityCategorySchema = new Schema<IFacilityCategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: String,
  image: String,
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IFacilityCategory>('FacilityCategory', facilityCategorySchema);
