import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Game from '../models/Game';
import FacilityCategory from '../models/FacilityCategory';
import { upload, getFileUrl } from '../middleware/upload';

const router = express.Router();

// List games (public / admin with filters)
router.get('/', async (req, res) => {
  try {
    const { facilityCategory, featured, limit, includeInactive, search } = req.query;
    const query: any = {};

    if (includeInactive !== 'true') {
      query.active = true;
    }

    if (facilityCategory) {
      // Check if it's an ObjectId or slug
      if (typeof facilityCategory === 'string' && facilityCategory.match(/^[0-9a-fA-F]{24}$/)) {
        query.facilityCategory = facilityCategory;
      } else {
        const cat: any = await FacilityCategory.findOne({ slug: String(facilityCategory) } as any);
        if (cat) {
          query.facilityCategory = cat._id;
        } else {
          query.facilityCategory = facilityCategory;
        }
      }
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    let q = Game.find(query)
      .populate('facilityCategory', 'name slug icon')
      .sort({ displayOrder: 1, title: 1 });

    if (limit) q = q.limit(Number(limit)) as any;

    const games = await q;

    // Attach imageUrl / name aliases for client convenience
    const formatted = games.map(g => {
      const obj = g.toObject();
      return {
        ...obj,
        name: obj.title,
        imageUrl: obj.coverImage || '',
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: create game
router.post('/', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const payload = {
      ...req.body,
      title: req.body.title || req.body.name,
    };
    const game = await Game.create(payload);
    res.status(201).json({ success: true, data: game });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: upload game cover image
router.post('/:id/image', authenticate, authorize('superadmin', 'manager'), upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const url = getFileUrl(req, req.file.filename, 'image');
    const game = await Game.findByIdAndUpdate(req.params.id, { coverImage: url }, { new: true })
      .populate('facilityCategory', 'name slug icon');
    res.json({ success: true, data: game });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: update game
router.put('/:id', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const payload = { ...req.body };
    if (req.body.name && !req.body.title) {
      payload.title = req.body.name;
    }
    const game = await Game.findByIdAndUpdate(req.params.id, payload, { new: true })
      .populate('facilityCategory', 'name slug icon');
    res.json({ success: true, data: game });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: delete game
router.delete('/:id', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
