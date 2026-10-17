import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth';
import News from '../models/News';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, published, all, limit } = req.query;
    const query: any = {};

    if (all === 'true') {
      // Admin request: return all articles
      if (status) query.status = status;
      if (published !== undefined && published !== '') {
        query.published = published === 'true';
      }
    } else if (status) {
      query.status = status;
    } else if (published !== undefined && published !== '') {
      query.status = published === 'true' ? 'published' : 'draft';
    } else {
      // Public default: only published articles
      query.status = 'published';
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const news = await News.find(query).sort({ publishDate: -1, createdAt: -1 }).limit(limitNum);
    res.json({ success: true, data: news });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const param = req.params.slug;
    let article = await News.findOne({ slug: param });
    if (!article && mongoose.isValidObjectId(param)) {
      article = await News.findById(param);
    }
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, data: article });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, authorize('superadmin', 'manager', 'admin'), async (req: any, res) => {
  try {
    const data = { ...req.body };

    const img = data.imageUrl || data.featuredImage || data.image;
    if (img) {
      data.featuredImage = img;
      data.image = img;
    }

    const date = data.publishedAt || data.publishDate;
    if (date) {
      data.publishDate = new Date(date);
      data.publishedAt = new Date(date);
    }

    if (data.published !== undefined) {
      data.status = data.published ? 'published' : 'draft';
    } else if (data.status) {
      data.published = data.status === 'published';
    }

    if (!data.author) {
      data.author = req.user?.name || 'Atrios Team';
    }

    if (!data.slug && data.title) {
      const base = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      data.slug = `${base || 'news'}-${Date.now().toString().slice(-6)}`;
    }

    const news = await News.create(data);
    res.status(201).json({ success: true, data: news });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const data = { ...req.body };

    const img = data.imageUrl || data.featuredImage || data.image;
    if (img) {
      data.featuredImage = img;
      data.image = img;
    }

    const date = data.publishedAt || data.publishDate;
    if (date) {
      data.publishDate = new Date(date);
      data.publishedAt = new Date(date);
    }

    if (data.published !== undefined) {
      data.status = data.published ? 'published' : 'draft';
    } else if (data.status) {
      data.published = data.status === 'published';
    }

    const news = await News.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!news) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, data: news });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
