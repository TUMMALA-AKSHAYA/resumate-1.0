import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import { ResumeDocument } from '../models/ResumeDocument.js';
import { ResumeDraft } from '../models/ResumeDraft.js';
import { Application } from '../models/Application.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { aiParseResumeFile, aiAnalyzeAts, aiAnalyzeResumeFull } from '../services/aiClient.js';
import { Job } from '../models/Job.js';
import { parsedDataToText } from '../utils/draftToText.js';
import { sendError } from '../utils/errors.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!ok) {
      cb(new Error('Only PDF and DOCX allowed'));
    } else {
      cb(null, true);
    }
  },
});

const router = Router();

router.post(
  '/upload',
  authMiddleware,
  requireRole('candidate', 'admin'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return sendError(res, 400, 'BAD_REQUEST', err.message || 'Upload failed');
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'BAD_REQUEST', 'file required');
      }
      const doc = await ResumeDocument.create({
        userId: req.user.id,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
      });
      res.status(201).json({ resume: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const list = await ResumeDocument.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ resumes: list });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/analyze',
  authMiddleware,
  requireRole('candidate', 'admin'),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const doc = await ResumeDocument.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { jobId } = req.body || {};
      let jobDescription = '';
      if (jobId && mongoose.isValidObjectId(jobId)) {
        const job = await Job.findById(jobId);
        if (job) {
          jobDescription = `${job.title}\n${job.description}\n${(job.skills || []).join(' ')}`;
        }
      }
      const analysis = await aiAnalyzeResumeFull(doc.storedPath, doc.originalName, doc.mimeType, jobDescription);
      doc.parsedData = analysis.parsed;
      doc.atsScore = analysis.ats?.score;
      doc.atsMeta = analysis.ats;
      doc.lastAnalysis = analysis;
      await doc.save();
      res.json({ resume: doc, analysis });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/active',
  authMiddleware,
  requireRole('candidate', 'admin'),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const { isActive } = req.body || {};
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive boolean required' });
      }
      const doc = await ResumeDocument.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      if (req.user.role !== 'admin' && doc.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      doc.isActive = isActive;
      await doc.save();
      res.json({ resume: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/:id/download', authMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await ResumeDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    let allowed =
      doc.userId.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!allowed && req.user.role === 'recruiter') {
      if (!doc.isActive) {
        return res.status(403).json({ error: 'Resume is inactive' });
      }
      const apps = await Application.find({ resumeDocumentId: doc._id }).populate('jobId', 'recruiterId');
      allowed = apps.some((a) => a.jobId && a.jobId.recruiterId?.toString() === req.user.id);
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.download(doc.storedPath, doc.originalName);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/parse', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await ResumeDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const parsed = await aiParseResumeFile(doc.storedPath, doc.originalName, doc.mimeType);
    doc.parsedData = parsed;
    await doc.save();
    res.json({ resume: doc, parsed });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/ats', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { jobId } = req.body || {};
    const doc = await ResumeDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const resumeText = parsedDataToText(doc.parsedData);
    if (!resumeText) {
      return res.status(400).json({ error: 'Parse resume first' });
    }
    let jobDescription = '';
    if (jobId && mongoose.isValidObjectId(jobId)) {
      const job = await Job.findById(jobId);
      if (job) {
        jobDescription = `${job.title}\n${job.description}\n${(job.skills || []).join(' ')}`;
      }
    }
    const ats = await aiAnalyzeAts(resumeText, jobDescription);
    doc.atsScore = ats.score;
    doc.atsMeta = ats;
    await doc.save();
    res.json({ resume: doc, ats });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/hydrate-draft',
  authMiddleware,
  requireRole('candidate', 'admin'),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const doc = await ResumeDocument.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const p = doc.parsedData || {};
      const sections = {
        personal: {
          fullName: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          title: p.title || '',
          summary: p.summary || '',
        },
        education: (p.education || []).map((e) => ({
          school: e.institution || e.school || '',
          degree: e.degree || '',
          field: e.field || '',
          end: e.end || '',
        })),
        skills: p.skills || [],
        experience: (p.experience || []).map((e) => ({
          company: e.company || '',
          role: e.title || e.role || '',
          start: e.start || '',
          end: e.end || '',
          description: e.description || '',
        })),
        projects: (p.projects || []).map((pr) => ({
          title: pr.title || pr.name || '',
          description: pr.description || '',
          techStack: Array.isArray(pr.techStack) ? pr.techStack : [],
          github: pr.github || '',
          liveLink: pr.liveLink || pr.live_link || '',
        })),
        certifications: (p.certifications || []).map((c) =>
          typeof c === 'string'
            ? { name: c, issuer: '', issueDate: '' }
            : {
                name: c.name || '',
                issuer: c.issuer || '',
                issueDate: c.issueDate || c.date || '',
              }
        ),
        achievements: (p.achievements || []).map((a) =>
          typeof a === 'string' ? { title: a, description: '' } : { title: a.title || '', description: a.description || '' }
        ),
        languages: (p.languages || []).map((l) =>
          typeof l === 'string'
            ? { language: l, proficiency: '' }
            : { language: l.language || l.name || '', proficiency: l.proficiency || '' }
        ),
        social: {
          linkedin: p.linkedin || '',
          github: p.github || '',
          website: '',
        },
      };

      const draft = await ResumeDraft.findOneAndUpdate(
        { userId: req.user.id },
        { $set: { sections, lastSavedAt: new Date() } },
        { upsert: true, new: true }
      );

      res.json({ draft });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
