import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import AuditLog from '../models/AuditLog';

const router = express.Router();

router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
