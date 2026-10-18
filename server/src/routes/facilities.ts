import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import Facility from '../models/Facility';
import FacilityCategory from '../models/FacilityCategory';
import { upload, getFileUrl } from '../middleware/upload';
import { createAuditLog } from '../middleware/auditLogger';

const router = express.Router();

// Public: list active facilities
router.get('/', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query: any = { archived: false };
    if (includeInactive !== 'true') query.active = true;
    const facilities = await Facility.find(query).populate('category', 'name slug icon image').sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: facilities });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: create facility
router.post('/', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const facility = await Facility.create(req.body);
    await createAuditLog({
      user: req.user, action: 'CREATE', entity: 'Facility',
      entityId: facility._id.toString(), description: `Facility "${facility.name}" created`, ip: req.ip,
    });
    res.status(201).json({ success: true, data: facility });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Category routes MUST come before /:id routes ─────────────────────────────
// If they were after /:id, Express would match "categories" as a facility ID

// Public: list all active categories (supports both /categories and /categories/all)
router.get(['/categories', '/categories/all'], async (req, res) => {
  try {
    const categories = await FacilityCategory.find({ active: true }).sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: create category
router.post('/categories', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const category = await FacilityCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: update category
router.put('/categories/:id', authenticate, authorize('superadmin', 'manager'), async (req, res) => {
  try {
    const category = await FacilityCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: upload category cover image
router.post('/categories/:id/image', authenticate, authorize('superadmin', 'manager'), upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const url = getFileUrl(req, req.file.filename, 'categories');
    const category = await FacilityCategory.findByIdAndUpdate(
      req.params.id,
      { image: url },
      { new: true }
    );
    res.json({ success: true, data: { url, category } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: delete/deactivate category
router.delete('/categories/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await FacilityCategory.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Facility by ID routes ─────────────────────────────────────────────────────

// Public: get single facility
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).populate('category', 'name slug icon image');
    if (!facility || facility.archived) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: facility });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update facility
router.put('/:id', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('category');
    if (!facility) return res.status(404).json({ success: false, message: 'Not found' });
    await createAuditLog({
      user: req.user, action: 'UPDATE', entity: 'Facility',
      entityId: req.params.id, description: `Facility "${facility.name}" updated`, ip: req.ip,
    });
    res.json({ success: true, data: facility });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: soft delete facility
router.delete('/:id', authenticate, authorize('superadmin', 'manager'), async (req: any, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, { archived: true, active: false }, { new: true });
    await createAuditLog({
      user: req.user, action: 'ARCHIVE', entity: 'Facility',
      entityId: req.params.id, description: `Facility archived`, ip: req.ip,
    });
    res.json({ success: true, data: facility });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: upload facility image
router.post('/:id/images', authenticate, authorize('superadmin', 'manager'), upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const url = getFileUrl(req, req.file.filename, 'image');
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { $push: { images: url } },
      { new: true }
    );
    res.json({ success: true, data: { url, facility } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
