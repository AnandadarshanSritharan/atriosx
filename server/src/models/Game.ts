import mongoose, { Document, Schema } from 'mongoose';

export interface IGame extends Document {
  title: string;
  platform: string;           // kept for backwards compat (e.g. "PS5", "PC")
  facilityCategory?: mongoose.Types.ObjectId; // links to FacilityCategory
  category?: string;          // genre / game category e.g. "Action", "Sports"
  description?: string;
  coverImage?: string;
  active: boolean;
  featured: boolean;
  displayOrder: number;
}

const gameSchema = new Schema<IGame>({
  title: { type: String, required: true, trim: true },
  platform: { type: String, default: '' },
  facilityCategory: { type: Schema.Types.ObjectId, ref: 'FacilityCategory', default: null },
  category: String,
  description: String,
  coverImage: String,
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

gameSchema.index({ active: 1, featured: -1, displayOrder: 1 });
gameSchema.index({ facilityCategory: 1, active: 1 });

export default mongoose.model<IGame>('Game', gameSchema);
