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

// Trust reverse proxy (Vercel, Render, Railway, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);
    // Permissive in production to allow Vercel previews and custom domains
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// Resilient DB connection singleton for serverless and traditional runtimes
let dbConnectionPromise: Promise<any> | null = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atrios';

  dbConnectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      const masked = uri.replace(/:([^:@]+)@/, ':****@');
      console.log('✅ Connected to MongoDB at:', masked);
    } catch (err: any) {
      dbConnectionPromise = null;
      console.error('⚠️ Could not connect to primary MONGODB_URI:', err.message);

      if (process.env.NODE_ENV === 'production') {
        throw new Error(`MongoDB connection failed: ${err.message}`);
      }

      // Local fallback for dev without MongoDB installed
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log('✅ Connected to In-Memory MongoDB at:', memUri);
        const { seedDatabase } = require('../scripts/seed');
        await seedDatabase();
      } catch (memErr: any) {
        throw new Error(`Both primary and in-memory MongoDB failed: ${memErr.message}`);
      }
    }
  })();

  return dbConnectionPromise;
};

// Health check endpoint (independent of DB to always diagnose state)
const healthHandler = async (req: express.Request, res: express.Response) => {
  let dbStatus = 'disconnected';
  let dbError: string | null = null;

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err.message;
  }

  const rawUri = process.env.MONGODB_URI || '';
  res.json({
    success: true,
    brand: 'Atrios Entertainment',
    message: 'Atrios API is running',
    requestPath: req.path,
    requestOriginalUrl: req.originalUrl,
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
      hasMongoUri: Boolean(process.env.MONGODB_URI),
      previewUri: rawUri ? rawUri.replace(/:([^:@]+)@/, ':****@').substring(0, 45) + '...' : 'NOT_SET',
      error: dbError,
    },
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasCloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    },
    timestamp: new Date(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Middleware to ensure DB is connected before handling any data routes
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err: any) {
      console.error('Serverless DB middleware error:', err.message);
      return res.status(500).json({
        success: false,
        message: `Database connection error: ${err.message}`,
        hasMongoUri: Boolean(process.env.MONGODB_URI),
        hint: process.env.MONGODB_URI ? 'Check MongoDB Atlas network access (allow 0.0.0.0/0)' : 'MONGODB_URI environment variable is missing on Vercel',
      });
    }
  }
  next();
});

// Routes (supporting both /api/path and /path)
const routes = [
  { path: 'auth', router: authRoutes },
  { path: 'bookings', router: bookingRoutes },
  { path: 'facilities', router: facilityRoutes },
  { path: 'customers', router: customerRoutes },
  { path: 'games', router: gameRoutes },
  { path: 'offers', router: offerRoutes },
  { path: 'news', router: newsRoutes },
  { path: 'expenses', router: expenseRoutes },
  { path: 'partners', router: partnerRoutes },
  { path: 'reports', router: reportRoutes },
  { path: 'gallery', router: galleryRoutes },
  { path: 'settings', router: settingsRoutes },
  { path: 'users', router: userRoutes },
  { path: 'audit-logs', router: auditLogRoutes },
  { path: 'upload', router: uploadRoutes },
];

routes.forEach(({ path: routePath, router }) => {
  app.use(`/api/${routePath}`, router);
  app.use(`/${routePath}`, router);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`🚀 Atrios Entertainment server running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

(app as any).connectDB = connectDB;
(app as any).startServer = startServer;

export default app;
