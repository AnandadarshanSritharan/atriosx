import express from 'express';
import { authenticate } from '../middleware/auth';
import Customer from '../models/Customer';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.query.search ? { $text: { $search: req.query.search as string } } : {};
    const customers = await Customer.find(query);
    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
