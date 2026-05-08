import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import { Job } from '../models/Job.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { parsePagination } from '../utils/pagination.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/mine', authMiddleware, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = { recruiterId: req.user.id };
    const st = req.query.status;
    if (st && ['draft', 'active', 'closed'].includes(String(st))) {
      filter.status = st;
    }
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

/** Public job board: only active jobs unless admin passes ?all=1 with auth */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { q } = req.query;
    const filter = {};

    const includeAll = req.query.all === '1' && req.user?.role === 'admin';
    if (!includeAll) {
      filter.status = 'active';
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { company: rx }];
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

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('recruiter', 'admin'),
  async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (!['draft', 'active', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Not found' });
      if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      job.status = status;
      await job.save();
      res.json({ job });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const job = await Job.findById(req.params.id).populate('recruiterId', 'name email');
    if (!job) return res.status(404).json({ error: 'Not found' });
    const recruiterId = job.recruiterId?._id?.toString() || job.recruiterId?.toString?.();
    const isOwner = req.user && recruiterId === req.user.id;
    const isAdmin = req.user?.role === 'admin';
    if (job.status !== 'active' && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ job });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  authMiddleware,
  requireRole('recruiter', 'admin'),
  body('title').trim().notEmpty().withMessage('title required'),
  body('description').trim().notEmpty().withMessage('description required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        title,
        company,
        description,
        skills,
        salaryMin,
        salaryMax,
        experienceLevel,
        location,
        remote,
        deadline,
        status,
      } = req.body || {};
      const st = status && ['draft', 'active', 'closed'].includes(status) ? status : 'draft';
      const job = await Job.create({
        recruiterId: req.user.id,
        title,
        company,
        description,
        skills: Array.isArray(skills) ? skills : [],
        salaryMin,
        salaryMax,
        experienceLevel,
        location,
        remote,
        deadline: deadline ? new Date(deadline) : undefined,
        status: st,
      });
      res.status(201).json({ job });
    } catch (e) {
      next(e);
    }
  }
);

router.put('/:id', authMiddleware, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = [
      'title',
      'company',
      'description',
      'skills',
      'salaryMin',
      'salaryMax',
      'experienceLevel',
      'location',
      'remote',
      'deadline',
      'status',
    ];
    for (const key of allowed) {
      if (key in (req.body || {})) {
        if (key === 'deadline' && req.body[key]) {
          job[key] = new Date(req.body[key]);
        } else if (key === 'status') {
          const s = req.body.status;
          if (['draft', 'active', 'closed'].includes(s)) job.status = s;
        } else {
          job[key] = req.body[key];
        }
      }
    }
    await job.save();
    res.json({ job });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authMiddleware, requireRole('recruiter', 'admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await job.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
