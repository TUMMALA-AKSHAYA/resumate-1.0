import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import { SavedJob } from '../models/SavedJob.js';
import { Job } from '../models/Job.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { parsePagination } from '../utils/pagination.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const [items, total] = await Promise.all([
      SavedJob.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'jobId' }),
      SavedJob.countDocuments({ userId: req.user.id }),
    ]);
    const savedJobs = items.filter((s) => s.jobId && s.jobId.status === 'active');
    res.json({
      savedJobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRole('candidate', 'admin'),
  body('jobId').isMongoId().withMessage('valid jobId required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { jobId } = req.body || {};
      const job = await Job.findById(jobId);
      if (!job || job.status !== 'active') {
        return res.status(404).json({ error: 'Job not available' });
      }
      const row = await SavedJob.create({ userId: req.user.id, jobId });
      await row.populate('jobId');
      res.status(201).json({ savedJob: row });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ error: 'Job already saved' });
      }
      next(e);
    }
  }
);

router.delete('/:jobId', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }
    await SavedJob.deleteOne({ userId: req.user.id, jobId });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
