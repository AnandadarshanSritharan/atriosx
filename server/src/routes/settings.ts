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

router.put('/', authenticate, authorize('superadmin', 'manager', 'admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Synchronize businessHours and workingHours for complete cross-compatibility
    if (updateData.workingHours && !updateData.businessHours) {
      updateData.businessHours = updateData.workingHours;
    }
    if (updateData.businessHours && !updateData.workingHours) {
      updateData.workingHours = updateData.businessHours;
    }

    // Ensure boolean closed and clean strings for each day
    if (updateData.businessHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const d of days) {
        if (updateData.businessHours[d]) {
          updateData.businessHours[d] = {
            open: String(updateData.businessHours[d].open || '10:00').trim(),
            close: String(updateData.businessHours[d].close || '22:00').trim(),
            closed: Boolean(updateData.businessHours[d].closed),
          };
        }
      }
      updateData.workingHours = updateData.businessHours;
    }

    let settings = await BusinessSettings.findOne();
    if (settings) {
      settings.set(updateData);
      settings.markModified('businessHours');
      settings.markModified('workingHours');
      await settings.save();
    } else {
      settings = await BusinessSettings.create(updateData);
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
