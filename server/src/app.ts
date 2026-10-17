import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import bookingRoutes from './routes/bookings';
import facilityRoutes from './routes/facilities';
import customerRoutes from './routes/customers';
import gameRoutes from './routes/games';
import offerRoutes from './routes/offers';
import newsRoutes from './routes/news';
import expenseRoutes from './routes/expenses';
import partnerRoutes from './routes/partners';
import reportRoutes from './routes/reports';
import galleryRoutes from './routes/gallery';
import settingsRoutes from './routes/settings';
import userRoutes from './routes/users';
import auditLogRoutes from './routes/auditLogs';
import uploadRoutes from './routes/upload';

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    // In production allow same-domain and Vercel preview/prod URLs
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    // Allow Vercel domains and same-origin (no origin header)
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // permissive for now — restrict after live testing
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    brand: 'Atrios Entertainment',
    message: 'Atrios API is running',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry detected' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Resilient DB connection: tries MONGODB_URI first, falls back to embedded in-memory MongoDB
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atrios';
  try {
    // Attempt standard connection with 10s timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log('✅ Connected to MongoDB at:', maskedUri);

    // If database is fresh (no admin user yet), seed the initial data
    try {
      const User = require('./models/User').default;
      const adminExists = await User.findOne({ email: 'admin@atrios.lk' });
      if (!adminExists) {
        console.log('🌱 First time setup: Seeding initial database records...');
        const { seedDatabase } = require('../scripts/seed');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding check warning:', seedErr);
    }
  } catch (err: any) {
    console.log('⚠️ Could not connect to primary MONGODB_URI. Error:', err.message);
    // In production (Vercel), cannot run mongodb-memory-server — fail loudly
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Production: MongoDB Atlas connection failed. Check MONGODB_URI env var.');
      throw err;
    }
    console.log('Starting embedded in-memory MongoDB server as fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log('✅ Connected to Embedded In-Memory MongoDB at:', memUri);
      // Auto-seed in-memory DB so it is ready immediately
      const { seedDatabase } = require('../scripts/seed');
      await seedDatabase();
    } catch (memErr) {
      console.error('❌ Failed to start both standard and embedded MongoDB:', memErr);
      process.exit(1);
    }
  }
};

const PORT = process.env.PORT || 5000;

export const startServer = async () => {
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`🚀 Atrios Entertainment server running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

export default app;
