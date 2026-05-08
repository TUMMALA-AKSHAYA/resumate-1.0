import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import resumeRoutes from './routes/resumes.js';
import draftRoutes from './routes/drafts.js';
import matchRoutes from './routes/match.js';
import savedJobRoutes from './routes/savedJobs.js';
import adminRoutes from './routes/admin.js';
import { AppError } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 4000;

/** Dev: allow Vite dev (5173) and preview (4173). Set CORS_ORIGIN to a comma-separated list to override. */
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const CORS_LIST = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultOrigins;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

await connectDb();

app.use(
  cors({
    origin: CORS_LIST.length === 1 ? CORS_LIST[0] : CORS_LIST,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});
app.use('/api/', limiter);

app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  if (err && err.code === 11000) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Email already registered' },
    });
  }
  if (err instanceof AppError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details !== undefined) body.error.details = err.details;
    return res.status(err.status).json(body);
  }
  const status = err.status && Number.isFinite(err.status) ? err.status : 500;
  const message = err.message || 'Internal Server Error';
  if (status < 500) {
    return res.status(status).json({ error: { code: 'ERROR', message } });
  }
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
