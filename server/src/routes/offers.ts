import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Offer from '../models/Offer';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { active, all } = req.query;
    const query: any = {};

    if (all === 'true') {
      // Admin request: return all offers without date restrictions
      if (active !== undefined && active !== '') {
        query.active = active === 'true';
      }
    } else if (active === 'false') {
      query.active = false;
    } else {
      // Public view: show all active offers (excluding only expired ones)
      query.active = true;
      const now = new Date();
      query.$or = [
        { expiryDate: { $gte: now } },
        { endDate: { $gte: now } },
        { expiryDate: null },
        { endDate: null },
        { expiryDate: { $exists: false } },
        { endDate: { $exists: false } },
      ];
    }

    const offers = await Offer.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: offers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const data = { ...req.body };
    const dateLimit = data.expiryDate || data.endDate;
    if (dateLimit) {
      data.endDate = new Date(dateLimit);
      data.expiryDate = new Date(dateLimit);
    }
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    const offer = await Offer.create(data);
    res.status(201).json({ success: true, data: offer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const data = { ...req.body };
    const dateLimit = data.expiryDate || data.endDate;
    if (dateLimit) {
      data.endDate = new Date(dateLimit);
      data.expiryDate = new Date(dateLimit);
    }
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
