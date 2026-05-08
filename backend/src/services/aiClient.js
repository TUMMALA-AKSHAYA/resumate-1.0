import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const client = axios.create({ baseURL: BASE, timeout: 120_000 });

export async function aiAnalyzeResumeFull(filePath, originalName, mimeType, jobDescription = '') {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { filename: originalName, contentType: mimeType });
  if (jobDescription) form.append('job_description', jobDescription);
  const { data } = await client.post('/analyze-resume', form, {
    headers: form.getHeaders(),
  });
  return data;
}

export async function aiParseResumeFile(filePath, originalName, mimeType) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { filename: originalName, contentType: mimeType });
  const { data } = await client.post('/parse', form, {
    headers: form.getHeaders(),
  });
  return data;
}

export async function aiAnalyzeAts(resumeText, jobDescription = '') {
  const { data } = await client.post('/analyze-ats', {
    resume_text: resumeText,
    job_description: jobDescription,
  });
  return data;
}

export async function aiMatchResumeToJobs(resumeText, jobs) {
  const { data } = await client.post('/match', {
    resume_text: resumeText,
    jobs,
  });
  return data;
}

export async function aiAssist(body) {
  const { data } = await client.post('/assist', body);
  return data;
}

export async function aiExportPdf(draft) {
  const { data, headers } = await client.post('/export/pdf', draft, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/json' },
  });
  return { buffer: Buffer.from(data), contentType: headers['content-type'] || 'application/pdf' };
}

export async function aiExportDocx(draft) {
  const { data, headers } = await client.post('/export/docx', draft, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/json' },
  });
  return {
    buffer: Buffer.from(data),
    contentType:
      headers['content-type'] ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

export async function aiHealth() {
  const { data } = await client.get('/health');
  return data;
}
