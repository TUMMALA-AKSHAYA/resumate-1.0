/** Flatten resume draft sections to plain text for ATS/matching */
export function draftToText(draft) {
  const s = draft?.sections || {};
  const parts = [];
  const p = s.personal || {};
  if (p.fullName) parts.push(p.fullName);
  if (p.title) parts.push(p.title);
  if (p.summary) parts.push(p.summary);
  if (p.email) parts.push(p.email);
  if (p.phone) parts.push(p.phone);

  for (const exp of s.experience || []) {
    parts.push([exp.role, exp.company, exp.description].filter(Boolean).join(' '));
  }
  for (const ed of s.education || []) {
    parts.push([ed.degree, ed.school, ed.field, ed.end].filter(Boolean).join(' '));
  }
  if (s.skills?.length) parts.push(s.skills.join(' '));
  for (const proj of s.projects || []) {
    if (typeof proj === 'string') {
      parts.push(proj);
      continue;
    }
    const bits = [
      proj.title || proj.name,
      proj.description,
      ...(Array.isArray(proj.techStack) ? proj.techStack : []),
      proj.github,
      proj.liveLink,
    ].filter(Boolean);
    if (bits.length) parts.push(bits.join(' '));
  }
  for (const c of s.certifications || []) {
    if (typeof c === 'string') parts.push(c);
    else parts.push([c.name, c.issuer, c.issueDate].filter(Boolean).join(' '));
  }
  for (const a of s.achievements || []) {
    if (typeof a === 'string') parts.push(a);
    else parts.push([a.title, a.description].filter(Boolean).join(' '));
  }
  for (const l of s.languages || []) {
    if (typeof l === 'string') parts.push(l);
    else parts.push([l.language, l.proficiency].filter(Boolean).join(' '));
  }
  return parts.join('\n').trim();
}

export function parsedDataToText(parsed) {
  if (!parsed || typeof parsed !== 'object') return '';
  if (parsed.rawText) return parsed.rawText;
  const parts = [];
  if (parsed.name) parts.push(parsed.name);
  if (parsed.summary) parts.push(parsed.summary);
  if (parsed.skills?.length) parts.push(parsed.skills.join(' '));
  if (parsed.keywords?.length) parts.push(parsed.keywords.join(' '));
  for (const e of parsed.experience || []) {
    parts.push([e.title, e.company, e.description].filter(Boolean).join(' '));
  }
  for (const ed of parsed.education || []) {
    parts.push(
      [ed.degree, ed.institution || ed.school, ed.field, ed.end].filter(Boolean).join(' ')
    );
  }
  for (const pr of parsed.projects || []) {
    parts.push(
      [pr.title || pr.name, pr.description, ...(Array.isArray(pr.techStack) ? pr.techStack : [])]
        .filter(Boolean)
        .join(' ')
    );
  }
  return parts.join('\n');
}
