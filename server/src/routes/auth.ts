import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.active) return res.status(401).json({ success: false, message: 'Account is inactive' });
    
    user.lastLogin = new Date();
    await user.save();
    
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn });
    
    res.json({ success: true, token, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', authenticate, async (req: any, res) => {
  res.json({ success: true, data: req.user });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

router.put('/change-password', authenticate, async (req: any, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(400).json({ success: false, message: 'Invalid old password' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
