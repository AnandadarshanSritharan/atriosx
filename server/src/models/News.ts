import mongoose, { Document, Schema } from 'mongoose';

export interface INews extends Document {
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  image?: string;
  author: string;
  publishDate: Date;
  publishedAt?: Date;
  status: 'draft' | 'published';
  published?: boolean;
  featured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

const newsSchema = new Schema<INews>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  category: { type: String, default: 'General' },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },
  featuredImage: { type: String, default: '' },
  image: { type: String, default: '' },
  author: { type: String, default: 'Atrios Team' },
  publishDate: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft','published'], default: 'draft' },
  published: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  tags: [String],
  seoTitle: String,
  seoDescription: String,
}, { timestamps: true });

newsSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${base || 'news'}-${Date.now().toString().slice(-6)}`;
  }
  if (this.featuredImage && !this.image) {
    this.image = this.featuredImage;
  } else if (this.image && !this.featuredImage) {
    this.featuredImage = this.image;
  }
  if (this.publishedAt && !this.publishDate) {
    this.publishDate = this.publishedAt;
  } else if (this.publishDate && !this.publishedAt) {
    this.publishedAt = this.publishDate;
  }
  if (this.published !== undefined) {
    this.status = this.published ? 'published' : 'draft';
  } else if (this.status) {
    this.published = this.status === 'published';
  }
});

newsSchema.index({ status: 1, publishDate: -1 });
newsSchema.index({ slug: 1 }, { unique: true });
newsSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<INews>('News', newsSchema);
