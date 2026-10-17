import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Gallery from '../models/Gallery';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: gallery });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const item = await Gallery.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
