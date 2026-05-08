import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { ResumeDocument } from '../models/ResumeDocument.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { parsePagination } from '../utils/pagination.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendError } from '../utils/errors.js';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(500);
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/users/:id/disable',
  body('disabled').isBoolean(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { disabled } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, { disabled }, { new: true }).select(
        '-passwordHash'
      );
      if (!user) return sendError(res, 404, 'NOT_FOUND', 'Not found');
      res.json({ user });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/jobs', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    const st = req.query.status;
    if (st && ['draft', 'active', 'closed'].includes(String(st))) {
      filter.status = st;
    }
    if (req.query.recruiterId && mongoose.isValidObjectId(String(req.query.recruiterId))) {
      filter.recruiterId = req.query.recruiterId;
    }
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recruiterId', 'name email'),
      Job.countDocuments(filter),
    ]);
    res.json({
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/jobs/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, 'BAD_REQUEST', 'Invalid id');
    }
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return sendError(res, 404, 'NOT_FOUND', 'Not found');
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/resumes', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.isActive === 'true') filter.isActive = true;
    if (req.query.isActive === 'false') filter.isActive = false;
    const [resumes, total] = await Promise.all([
      ResumeDocument.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email name'),
      ResumeDocument.countDocuments(filter),
    ]);
    res.json({
      resumes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [usersByRole, jobsByStatus] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const totalUsers = usersByRole.reduce((a, r) => a + r.count, 0);
    const totalJobs = jobsByStatus.reduce((a, r) => a + r.count, 0);
    res.json({ usersByRole, jobsByStatus, totalUsers, totalJobs });
  } catch (e) {
    next(e);
  }
});

export default router;
