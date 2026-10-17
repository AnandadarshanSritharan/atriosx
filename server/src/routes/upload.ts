import express from 'express';
import { authenticate } from '../middleware/auth';
import { upload, getFileUrl } from '../middleware/upload';

const router = express.Router();

// Upload a single image
router.post('/', authenticate, upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = getFileUrl(req, req.file.filename, req.file.fieldname || 'images');
    res.json({
      success: true,
      data: {
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload multiple images
router.post('/multiple', authenticate, upload.array('images', 10), (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const urls = req.files.map((file: any) => {
      if (file.path && typeof file.path === 'string' && file.path.startsWith('http')) {
        return file.path;
      }
      return `${req.protocol}://${req.get('host')}/uploads/${file.fieldname || 'images'}/${file.filename}`;
    });
    res.json({ success: true, data: { urls } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
