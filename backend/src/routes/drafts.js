import { Router } from 'express';
import { ResumeDraft } from '../models/ResumeDraft.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { draftToText } from '../utils/draftToText.js';
import { aiAssist, aiExportPdf, aiExportDocx } from '../services/aiClient.js';

const router = Router();

function computeCompleteness(sections) {
  let score = 0;
  const s = sections || {};
  const p = s.personal || {};
  if (p.fullName) score += 10;
  if (p.email) score += 10;
  if (p.summary) score += 15;
  if ((s.skills || []).length) score += 15;
  if ((s.experience || []).length) score += 25;
  if ((s.education || []).length) score += 15;
  if ((s.projects || []).length) score += 10;
  return Math.min(100, score);
}

router.get('/', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    let draft = await ResumeDraft.findOne({ userId: req.user.id });
    if (!draft) {
      draft = await ResumeDraft.create({ userId: req.user.id });
    }
    res.json({ draft });
  } catch (e) {
    next(e);
  }
});

router.put('/', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const { templateId, sectionOrder, sections } = req.body || {};
    const update = { lastSavedAt: new Date() };
    if (templateId) update.templateId = templateId;
    if (Array.isArray(sectionOrder)) update.sectionOrder = sectionOrder;
    if (sections && typeof sections === 'object') {
      update.sections = sections;
      update.completeness = computeCompleteness(sections);
    }
    const draft = await ResumeDraft.findOneAndUpdate({ userId: req.user.id }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json({ draft });
  } catch (e) {
    next(e);
  }
});

router.post('/assist', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const { assist_type, text, job_description } = req.body || {};
    if (!assist_type || text == null) {
      return res.status(400).json({ error: 'assist_type and text required' });
    }
    const result = await aiAssist({
      assist_type,
      text: String(text),
      job_description: job_description || '',
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/export/pdf', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const draft = await ResumeDraft.findOne({ userId: req.user.id });
    if (!draft) return res.status(404).json({ error: 'No draft' });
    const body = {
      templateId: draft.templateId,
      sectionOrder: draft.sectionOrder,
      sections: draft.sections,
    };
    const { buffer, contentType } = await aiExportPdf(body);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

router.post('/export/docx', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const draft = await ResumeDraft.findOne({ userId: req.user.id });
    if (!draft) return res.status(404).json({ error: 'No draft' });
    const body = {
      templateId: draft.templateId,
      sectionOrder: draft.sectionOrder,
      sections: draft.sections,
    };
    const { buffer, contentType } = await aiExportDocx(body);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="resume.docx"');
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

/** Plain text from current draft (for matching / ATS without upload) */
router.get('/text', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const draft = await ResumeDraft.findOne({ userId: req.user.id });
    if (!draft) return res.json({ text: '' });
    res.json({ text: draftToText(draft) });
  } catch (e) {
    next(e);
  }
});

export default router;
