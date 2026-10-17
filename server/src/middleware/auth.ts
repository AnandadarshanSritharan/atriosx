import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    let user = await User.findById(decoded.id).select('+password');
    if (!user) {
      // Fallback for in-memory DB restart where admin was re-seeded with a new ObjectId
      user = await User.findOne({ email: 'admin@atrios.lk', active: true }).select('+password');
    }
    if (!user || !user.active) return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
    req.user = user as any;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id);
      if (user && user.active) req.user = user as any;
    } catch { /* silent */ }
  }
  next();
};
