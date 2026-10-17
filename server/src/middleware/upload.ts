import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Storage setup: Cloudinary if credentials present, fallback to memory storage for serverless safety
let storage: multer.StorageEngine;

if (isCloudinaryConfigured) {
  try {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req: any, file: any) => {
        const field = file.fieldname || 'general';
        return {
          folder: `atrios/${field}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'],
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        };
      },
    });
  } catch (storageErr) {
    console.warn('Could not initialize CloudinaryStorage, falling back to memory storage:', storageErr);
    storage = multer.memoryStorage();
  }
} else {
  // In serverless (Vercel), disk is read-only. Memory storage keeps buffers safely in RAM.
  storage = multer.memoryStorage();
}

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|avif/;
  const mime = allowed.test(file.mimetype);
  if (mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter,
});

export const getFileUrl = (req: any, filename?: string, fieldname: string = 'general'): string => {
  if (req.file?.path && typeof req.file.path === 'string' && req.file.path.startsWith('http')) {
    return req.file.path;
  }
  if (req.file?.secure_url && typeof req.file.secure_url === 'string') {
    return req.file.secure_url;
  }
  const host = `${req.protocol}://${req.get('host')}`;
  return `${host}/uploads/${fieldname}/${filename || req.file?.filename || ''}`;
};

export { cloudinary };
