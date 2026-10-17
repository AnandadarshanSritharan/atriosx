import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Partner from '../models/Partner';

const router = express.Router();

router.use(authenticate, authorize('superadmin', 'manager'));

router.get('/', async (req, res) => {
  try {
    const partners = await Partner.find();
    res.json({ success: true, data: partners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const partner = await Partner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/investments', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Not found' });
    
    partner.additionalInvestments.push(req.body);
    await partner.save();
    
    res.json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/recalculate/all', async (req, res) => {
  try {
    const partners = await Partner.find({ active: true, percentageType: 'calculated' });
    const totalInvestment = partners.reduce((sum, p) => sum + p.totalInvestment, 0);
    
    if (totalInvestment > 0) {
      for (const p of partners) {
        p.ownershipPercentage = (p.totalInvestment / totalInvestment) * 100;
        await p.save();
      }
    }
    
    res.json({ success: true, message: 'Recalculated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
