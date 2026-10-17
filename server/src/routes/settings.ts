import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import BusinessSettings from '../models/BusinessSettings';
import Holiday from '../models/Holiday';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await BusinessSettings.findOne();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (settings) {
      settings = await BusinessSettings.findByIdAndUpdate(settings._id, req.body, { new: true });
    } else {
      settings = await BusinessSettings.create(req.body);
    }
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/holidays', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/holidays', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    res.status(201).json({ success: true, data: holiday });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/holidays/:id', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
