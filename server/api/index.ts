import mongoose from 'mongoose';
import app, { connectDB } from '../src/app';

// Cache DB connection between warm Lambda invocations
let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
