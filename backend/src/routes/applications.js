import { Router } from 'express';
import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { ResumeDocument } from '../models/ResumeDocument.js';
import { ResumeDraft } from '../models/ResumeDraft.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { aiMatchResumeToJobs } from '../services/aiClient.js';
import { draftToText, parsedDataToText } from '../utils/draftToText.js';

const router = Router();

router.post('/', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const { jobId, resumeDocumentId } = req.body || {};
    if (!jobId) return res.status(400).json({ error: 'jobId required' });
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ error: 'Invalid jobId' });
    }
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'active') {
      return res.status(400).json({ error: 'Job is not accepting applications' });
    }

    let resumeText = '';
    let docId = resumeDocumentId;

    if (docId) {
      if (!mongoose.isValidObjectId(docId)) {
        return res.status(400).json({ error: 'Invalid resumeDocumentId' });
      }
      const doc = await ResumeDocument.findOne({ _id: docId, userId: req.user.id });
      if (!doc) return res.status(404).json({ error: 'Resume not found' });
      if (!doc.isActive) {
        return res.status(400).json({ error: 'Resume is inactive. Activate it to apply.' });
      }
      resumeText = parsedDataToText(doc.parsedData) || '';
    } else {
      const draft = await ResumeDraft.findOne({ userId: req.user.id });
      if (draft) resumeText = draftToText(draft);
    }

    if (!resumeText) {
      return res.status(400).json({
        error: 'No resume content. Upload and parse a resume or save a resume draft, or pass resumeDocumentId.',
      });
    }

    const match = await aiMatchResumeToJobs(resumeText, [
      {
        id: String(job._id),
        description: `${job.title}\n${job.description}\n${(job.skills || []).join(' ')}`,
      },
    ]);
    const first = match?.results?.[0] || {};
    const matchScore = typeof first.score === 'number' ? first.score : null;
    const matchMeta = first;

    const application = await Application.create({
      candidateId: req.user.id,
      jobId,
      resumeDocumentId: docId || undefined,
      status: 'submitted',
      matchScore,
      matchMeta,
    });

    res.status(201).json({ application });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Already applied to this job' });
    }
    next(e);
  }
});

router.get('/me', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const apps = await Application.find({ candidateId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('jobId');
    res.json({ applications: apps });
  } catch (e) {
    next(e);
  }
});

router.get(
  '/job/:jobId',
  authMiddleware,
  requireRole('recruiter', 'admin'),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.jobId)) {
        return res.status(400).json({ error: 'Invalid jobId' });
      }
      const job = await Job.findById(req.params.jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const applications = await Application.find({ jobId: req.params.jobId })
        .populate('candidateId', 'email name')
        .populate('resumeDocumentId')
        .populate('jobId', 'recruiterId title')
        .sort({ matchScore: -1, createdAt: -1 });
      res.json({ applications });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('recruiter', 'admin'),
  async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (!['submitted', 'shortlisted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const app = await Application.findById(req.params.id).populate('jobId');
      if (!app) return res.status(404).json({ error: 'Not found' });
      const job = app.jobId;
      if (!job) return res.status(404).json({ error: 'Job missing' });
      if (job.recruiterId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      app.status = status;
      await app.save();
      res.json({ application: app });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
