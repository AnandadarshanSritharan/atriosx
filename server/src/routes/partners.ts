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

// Recalculate equity distribution helper
async function recalculateEquityShares() {
  const partners = await Partner.find({ active: true });
  const totalInvestment = partners.reduce((sum, p) => sum + (p.totalInvestment || p.initialInvestment || 0), 0);
  if (totalInvestment > 0) {
    for (const p of partners) {
      if (p.percentageType !== 'manual') {
        const inv = p.totalInvestment || p.initialInvestment || 0;
        p.ownershipPercentage = Math.round(((inv / totalInvestment) * 100) * 100) / 100;
        await p.save();
      }
    }
  }
}

router.put('/recalculate/all', async (req, res) => {
  try {
    await recalculateEquityShares();
    const updated = await Partner.find();
    res.json({ success: true, message: 'Recalculated', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/recalculate', async (req, res) => {
  try {
    await recalculateEquityShares();
    const updated = await Partner.find();
    res.json({ success: true, message: 'Recalculated', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.initialInvestment !== undefined && payload.totalInvestment === undefined) {
      payload.totalInvestment = payload.initialInvestment;
    }
    const partner = await Partner.create(payload);
    await recalculateEquityShares();
    res.status(201).json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.initialInvestment !== undefined) {
      payload.totalInvestment = payload.initialInvestment;
    }
    const partner = await Partner.findByIdAndUpdate(req.params.id, payload, { new: true });
    await recalculateEquityShares();
    res.json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Partner.findByIdAndDelete(req.params.id);
    await recalculateEquityShares();
    res.json({ success: true, message: 'Partner removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/investments', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Not found' });
    
    partner.additionalInvestments.push(req.body);
    await partner.save();
    await recalculateEquityShares();
    
    res.json({ success: true, data: partner });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
