import mongoose from 'mongoose';
import { Job } from './models/Job.js';
import { ResumeDocument } from './models/ResumeDocument.js';

export async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resumate';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  if (process.env.RUN_MIGRATIONS !== '0') {
    try {
      await Job.updateMany(
        { $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] },
        { $set: { status: 'active' } }
      );
      await ResumeDocument.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
      );
    } catch (e) {
      console.warn('Startup migration warning:', e.message);
    }
  }
}
