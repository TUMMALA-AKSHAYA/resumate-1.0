/**
 * One-time migration: set Job.status = active where missing.
 * Run: node src/scripts/migratePhase1.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { ResumeDocument } from '../models/ResumeDocument.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resumate';

async function main() {
  await mongoose.connect(uri);
  const r1 = await Job.updateMany(
    { $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] },
    { $set: { status: 'active' } }
  );
  console.log('Jobs updated (missing status):', r1.modifiedCount);
  const r2 = await ResumeDocument.updateMany(
    { $or: [{ isActive: { $exists: false } }] },
    { $set: { isActive: true } }
  );
  console.log('Resumes updated (missing isActive):', r2.modifiedCount);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
