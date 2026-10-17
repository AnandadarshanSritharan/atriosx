import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
  url: string;
  filename: string;
  title?: string;
  category?: string;
  featured: boolean;
  displayOrder: number;
}

const gallerySchema = new Schema<IGallery>({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  title: String,
  category: String,
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IGallery>('Gallery', gallerySchema);
