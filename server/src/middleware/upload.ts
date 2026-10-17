import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Storage setup: Cloudinary if credentials present, fallback to local disk
let storage: multer.StorageEngine;

if (isCloudinaryConfigured) {
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
} else {
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadDir, file.fieldname || 'general');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|avif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter,
});

export const getFileUrl = (req: any, filename?: string, fieldname: string = 'general'): string => {
  // If uploaded to Cloudinary, req.file.path or req.file.secure_url is the full CDN URL
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
