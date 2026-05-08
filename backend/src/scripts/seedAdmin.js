import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resumate';

async function main() {
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || 'admin@resumate.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const exists = await User.findOne({ email });
  if (exists) {
    exists.role = 'admin';
    exists.passwordHash = await bcrypt.hash(password, 10);
    exists.disabled = false;
    await exists.save();
    console.log('Updated admin:', email);
  } else {
    await User.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
      name: 'Admin',
    });
    console.log('Created admin:', email, 'password:', password);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
