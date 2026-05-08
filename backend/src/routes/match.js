import { Router } from 'express';
import { Job } from '../models/Job.js';
import { ResumeDocument } from '../models/ResumeDocument.js';
import { ResumeDraft } from '../models/ResumeDraft.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { aiMatchResumeToJobs } from '../services/aiClient.js';
import { draftToText, parsedDataToText } from '../utils/draftToText.js';

const router = Router();

async function getCandidateResumeText(userId) {
  const draft = await ResumeDraft.findOne({ userId });
  if (draft) {
    const t = draftToText(draft);
    if (t) return t;
  }
  const doc = await ResumeDocument.findOne({ userId, isActive: true }).sort({ updatedAt: -1 });
  if (doc?.parsedData) {
    return parsedDataToText(doc.parsedData);
  }
  return '';
}

router.get('/jobs', authMiddleware, requireRole('candidate', 'admin'), async (req, res, next) => {
  try {
    const resumeText = await getCandidateResumeText(req.user.id);
    if (!resumeText) {
      return res.json({ results: [], message: 'Add a resume draft or upload and parse a resume.' });
    }
    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(50);
    const payload = jobs.map((j) => ({
      id: String(j._id),
      description: `${j.title}\n${j.description}\n${(j.skills || []).join(' ')}`,
      job: { id: String(j._id), title: j.title, company: j.company },
    }));
    const match = await aiMatchResumeToJobs(
      resumeText,
      payload.map((p) => ({ id: p.id, description: p.description }))
    );
    const byId = Object.fromEntries(payload.map((p) => [p.id, p.job]));
    const results = (match.results || []).map((r) => ({
      ...r,
      job: byId[r.id],
    }));
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json({ results });
  } catch (e) {
    next(e);
  }
});

export default router;
