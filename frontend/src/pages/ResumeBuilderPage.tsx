import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useAssistMutation,
  useDraftQuery,
  useSaveDraftMutation,
} from '../store/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type Personal = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
};

type Exp = { company: string; role: string; start: string; end: string; description: string };
type Edu = { school: string; degree: string; field: string; end: string };
type Project = { title: string; description: string; techStack: string[]; github: string; liveLink: string };
type Cert = { name: string; issuer: string; issueDate: string };
type Achievement = { title: string; description: string };
type Lang = { language: string; proficiency: string };

export type BuilderSections = ReturnType<typeof defaultSections>;

function defaultSections(): {
  personal: Personal;
  experience: Exp[];
  education: Edu[];
  skills: string[];
  projects: Project[];
  certifications: Cert[];
  achievements: Achievement[];
  languages: Lang[];
  social: { linkedin: string; github: string; website: string };
} {
  return {
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      title: '',
      summary: '',
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    social: { linkedin: '', github: '', website: '' },
  };
}

function normalizeSections(raw: Record<string, unknown> | undefined): BuilderSections {
  const base = defaultSections();
  if (!raw || typeof raw !== 'object') return base;
  const personal = { ...base.personal, ...(raw.personal as Personal) };
  const experience = Array.isArray(raw.experience) ? (raw.experience as Exp[]) : base.experience;
  const education = Array.isArray(raw.education) ? (raw.education as Edu[]) : base.education;
  const skills = Array.isArray(raw.skills) ? (raw.skills as string[]) : base.skills;

  const projects = Array.isArray(raw.projects)
    ? (raw.projects as unknown[]).map((p) => {
        if (typeof p === 'string') {
          return { title: p, description: '', techStack: [] as string[], github: '', liveLink: '' };
        }
        const o = p as Record<string, unknown>;
        const ts = o.techStack;
        return {
          title: String(o.title ?? o.name ?? ''),
          description: String(o.description ?? ''),
          techStack: Array.isArray(ts)
            ? ts.map(String)
            : typeof ts === 'string'
              ? ts.split(',').map((s) => s.trim()).filter(Boolean)
              : [],
          github: String(o.github ?? ''),
          liveLink: String(o.liveLink ?? o.live_link ?? ''),
        };
      })
    : base.projects;

  const certifications = Array.isArray(raw.certifications)
    ? (raw.certifications as unknown[]).map((c) =>
        typeof c === 'string'
          ? { name: c, issuer: '', issueDate: '' }
          : {
              name: String((c as Cert).name ?? ''),
              issuer: String((c as Cert).issuer ?? ''),
              issueDate: String((c as Cert).issueDate ?? ''),
            }
      )
    : base.certifications;

  const achievements = Array.isArray(raw.achievements)
    ? (raw.achievements as unknown[]).map((a) =>
        typeof a === 'string'
          ? { title: a, description: '' }
          : {
              title: String((a as Achievement).title ?? ''),
              description: String((a as Achievement).description ?? ''),
            }
      )
    : base.achievements;

  const languages = Array.isArray(raw.languages)
    ? (raw.languages as unknown[]).map((l) =>
        typeof l === 'string'
          ? { language: l, proficiency: '' }
          : {
              language: String((l as Lang).language ?? (l as unknown as { name?: string }).name ?? ''),
              proficiency: String((l as Lang).proficiency ?? ''),
            }
      )
    : base.languages;

  const social = { ...base.social, ...(raw.social as object) };

  return {
    personal,
    experience,
    education,
    skills,
    projects,
    certifications,
    achievements,
    languages,
    social,
  };
}

const defaultOrder = [
  'personal',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'languages',
  'social',
];

function SortableSection({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-surface-line bg-surface-subtle px-2 py-1.5 text-sm text-ink shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
    >
      <button type="button" className="cursor-grab text-ink-muted dark:text-slate-400" {...attributes} {...listeners}>
        ⠿
      </button>
      <span>{label}</span>
    </div>
  );
}

function Preview({
  templateId,
  sectionOrder,
  sections,
}: {
  templateId: string;
  sectionOrder: string[];
  sections: ReturnType<typeof defaultSections>;
}) {
  const font = templateId === 'modern' ? 'font-sans' : templateId === 'minimal' ? 'font-serif' : 'font-sans';
  const accent =
    templateId === 'modern' ? 'text-fuchsia-700' : templateId === 'minimal' ? 'text-slate-700' : 'text-brand-700';

  return (
    <div
      className={`${font} min-h-[500px] rounded-xl border border-surface-line bg-white p-6 text-sm text-ink shadow-card dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100`}
    >
      <h2 className={`text-2xl font-bold ${accent}`}>{sections.personal.fullName || 'Your name'}</h2>
      <p className="text-ink-secondary">{sections.personal.title}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {[sections.personal.email, sections.personal.phone, sections.personal.location].filter(Boolean).join(' · ')}
      </p>
      {sectionOrder.map((key) => {
        if (key === 'personal') {
          return sections.personal.summary ? (
            <p key={key} className="mt-4 whitespace-pre-wrap text-ink-secondary">
              {sections.personal.summary}
            </p>
          ) : null;
        }
      })}

      {sectionOrder.map((key) => {
        if (key === 'experience' && sections.experience.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Experience</h3>
              {sections.experience.map((e, i) => (
                <div key={i} className="mt-2">
                  <div className="font-medium">
                    {e.role} — {e.company}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {e.start} – {e.end}
                  </div>
                  <p className="whitespace-pre-wrap">{e.description}</p>
                </div>
              ))}
            </div>
          );
        }
        if (key === 'education' && sections.education.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Education</h3>
              {sections.education.map((e, i) => (
                <div key={i} className="mt-2">
                  <div className="font-medium">
                    {e.degree} — {e.school}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {e.field}
                    {e.end ? ` · ${e.end}` : ''}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (key === 'skills' && sections.skills.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Skills</h3>
              <p>{sections.skills.join(', ')}</p>
            </div>
          );
        }
        if (key === 'projects' && sections.projects.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Projects</h3>
              {sections.projects.map((p, i) => (
                <div key={i} className="mt-2">
                  <div className="font-medium">{p.title}</div>
                  {p.techStack?.length ? (
                    <div className="text-xs text-ink-muted">Tech: {p.techStack.join(', ')}</div>
                  ) : null}
                  <p className="whitespace-pre-wrap">{p.description}</p>
                  <div className="text-xs text-ink-muted">
                    {[p.github && `GitHub: ${p.github}`, p.liveLink && `Live: ${p.liveLink}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        if (key === 'certifications' && sections.certifications.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Certifications</h3>
              <ul className="mt-2 list-disc pl-5">
                {sections.certifications.map((c, i) => (
                  <li key={i}>
                    {[c.name, c.issuer, c.issueDate].filter(Boolean).join(' — ')}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (key === 'achievements' && sections.achievements.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Achievements</h3>
              {sections.achievements.map((a, i) => (
                <div key={i} className="mt-2">
                  <div className="font-medium">{a.title}</div>
                  <p className="text-ink-secondary">{a.description}</p>
                </div>
              ))}
            </div>
          );
        }
        if (key === 'languages' && sections.languages.length) {
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Languages</h3>
              <p>{sections.languages.map((l) => [l.language, l.proficiency].filter(Boolean).join(' — ')).join(' · ')}</p>
            </div>
          );
        }
        if (key === 'social') {
          const l = sections.social.linkedin;
          const g = sections.social.github;
          const w = sections.social.website;
          if (!l && !g && !w) return null;
          return (
            <div key={key} className="mt-4">
              <h3 className={`font-semibold ${accent}`}>Links</h3>
              <p className="text-xs text-ink-muted">
                {[l && `LinkedIn: ${l}`, g && `GitHub: ${g}`, w && `Web: ${w}`].filter(Boolean).join(' · ')}
              </p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function ResumeBuilderPage() {
  const { data, refetch } = useDraftQuery();
  const [saveDraft] = useSaveDraftMutation();
  const [assist] = useAssistMutation();
  const [templateId, setTemplateId] = useState<'ats' | 'modern' | 'minimal'>('ats');
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [sections, setSections] = useState(defaultSections());
  const [activeSection, setActiveSection] = useState('personal');
  const [assistMsg, setAssistMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const d = data?.draft as {
      templateId?: string;
      sectionOrder?: string[];
      sections?: ReturnType<typeof defaultSections>;
    } | undefined;
    if (!d) return;
    if (d.templateId) setTemplateId(d.templateId as 'ats' | 'modern' | 'minimal');
    if (d.sectionOrder?.length) setSectionOrder(d.sectionOrder);
    if (d.sections) setSections(normalizeSections(d.sections as Record<string, unknown>));
  }, [data]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft({ templateId, sectionOrder, sections });
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [templateId, sectionOrder, sections, saveDraft]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id as string);
    const newIndex = sectionOrder.indexOf(over.id as string);
    setSectionOrder(arrayMove(sectionOrder, oldIndex, newIndex));
  }

  const exp = sections.experience;
  const edu = sections.education;

  async function runAssist(type: 'summary' | 'bullet' | 'keywords') {
    setAssistMsg('');
    let text = '';
    if (type === 'summary') text = sections.personal.summary || exp.map((e) => e.description).join('\n');
    if (type === 'bullet') text = exp[0]?.description || '';
    try {
      const r = await assist({ assist_type: type, text }).unwrap();
      setAssistMsg(`${r.source}: ${r.text}`);
      if (type === 'summary') {
        setSections((s) => ({ ...s, personal: { ...s.personal, summary: r.text } }));
      }
    } catch {
      setAssistMsg('Assist failed');
    }
  }

  async function exportFile(kind: 'pdf' | 'docx') {
    const token = localStorage.getItem('resumate_token');
    const r = await fetch(`${API}/drafts/export/${kind}`, {
      method: 'POST',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'pdf' ? 'resume.pdf' : 'resume.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  const labels = useMemo(
    () => ({
      personal: 'Header & summary',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
      achievements: 'Achievements',
      languages: 'Languages',
      social: 'Links',
    }),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-50">Resume builder</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-surface-line bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition hover:bg-surface-subtle dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            onClick={() => refetch()}
          >
            Reload
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
            onClick={() => exportFile('pdf')}
          >
            Export PDF
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
            onClick={() => exportFile('docx')}
          >
            Export DOCX
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-ink-secondary dark:text-slate-300">
            Template
            <select
              className="form-input mt-1 w-full dark:bg-slate-900"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as typeof templateId)}
            >
              <option value="ats">ATS-friendly</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal / Fresher</option>
            </select>
          </label>

          <div>
            <div className="mb-2 text-sm font-medium text-ink-muted dark:text-slate-400">Section order (drag)</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1">
                  {sectionOrder.map((id) => (
                    <SortableSection key={id} id={id} label={labels[id as keyof typeof labels] || id} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {sectionOrder.map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-lg px-2 py-1 text-sm font-medium transition ${
                  activeSection === id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-surface-line bg-surface-subtle text-ink hover:bg-surface-tint dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                onClick={() => setActiveSection(id)}
              >
                {labels[id as keyof typeof labels] || id}
              </button>
            ))}
          </div>

          {activeSection === 'personal' && (
            <div className="form-panel-grid">
              {(['fullName', 'title', 'email', 'phone', 'location'] as const).map((f) => (
                <input
                  key={f}
                  className="form-input"
                  placeholder={f}
                  value={sections.personal[f]}
                  onChange={(e) =>
                    setSections((s) => ({ ...s, personal: { ...s.personal, [f]: e.target.value } }))
                  }
                />
              ))}
              <textarea
                className="form-input min-h-[80px]"
                placeholder="Summary"
                value={sections.personal.summary}
                onChange={(e) =>
                  setSections((s) => ({ ...s, personal: { ...s.personal, summary: e.target.value } }))
                }
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                  onClick={() => runAssist('summary')}
                >
                  AI improve summary
                </button>
              </div>
            </div>
          )}

          {activeSection === 'experience' && (
            <div className="form-panel-stack">
              {exp.map((row, idx) => (
                <div key={idx} className="grid gap-2 border-b border-surface-line pb-3 last:border-0 last:pb-0 dark:border-slate-600">
                  <input
                    className="form-input"
                    placeholder="Role"
                    value={row.role}
                    onChange={(e) => {
                      const next = [...exp];
                      next[idx] = { ...row, role: e.target.value };
                      setSections((s) => ({ ...s, experience: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Company"
                    value={row.company}
                    onChange={(e) => {
                      const next = [...exp];
                      next[idx] = { ...row, company: e.target.value };
                      setSections((s) => ({ ...s, experience: next }));
                    }}
                  />
                  <div className="flex gap-2">
                    <input
                      className="form-input flex-1"
                      placeholder="Start"
                      value={row.start}
                      onChange={(e) => {
                        const next = [...exp];
                        next[idx] = { ...row, start: e.target.value };
                        setSections((s) => ({ ...s, experience: next }));
                      }}
                    />
                    <input
                      className="form-input flex-1"
                      placeholder="End"
                      value={row.end}
                      onChange={(e) => {
                        const next = [...exp];
                        next[idx] = { ...row, end: e.target.value };
                        setSections((s) => ({ ...s, experience: next }));
                      }}
                    />
                  </div>
                  <textarea
                    className="form-input"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => {
                      const next = [...exp];
                      next[idx] = { ...row, description: e.target.value };
                      setSections((s) => ({ ...s, experience: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="text-left text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                    onClick={async () => {
                      const r = await assist({ assist_type: 'bullet', text: row.description }).unwrap();
                      const next = [...exp];
                      next[idx] = { ...row, description: r.text };
                      setSections((s) => ({ ...s, experience: next }));
                    }}
                  >
                    AI polish bullet
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() => setSections((s) => ({ ...s, experience: [...s.experience, { company: '', role: '', start: '', end: '', description: '' }] }))}
              >
                + Add experience
              </button>
            </div>
          )}

          {activeSection === 'education' && (
            <div className="form-panel-stack">
              {edu.map((row, idx) => (
                <div key={idx} className="grid gap-2">
                  <input
                    className="form-input"
                    placeholder="School"
                    value={row.school}
                    onChange={(e) => {
                      const next = [...edu];
                      next[idx] = { ...row, school: e.target.value };
                      setSections((s) => ({ ...s, education: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Degree"
                    value={row.degree}
                    onChange={(e) => {
                      const next = [...edu];
                      next[idx] = { ...row, degree: e.target.value };
                      setSections((s) => ({ ...s, education: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Field"
                    value={row.field}
                    onChange={(e) => {
                      const next = [...edu];
                      next[idx] = { ...row, field: e.target.value };
                      setSections((s) => ({ ...s, education: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="End year (optional)"
                    value={row.end}
                    onChange={(e) => {
                      const next = [...edu];
                      next[idx] = { ...row, end: e.target.value };
                      setSections((s) => ({ ...s, education: next }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() => setSections((s) => ({ ...s, education: [...s.education, { school: '', degree: '', field: '', end: '' }] }))}
              >
                + Add education
              </button>
            </div>
          )}

          {activeSection === 'skills' && (
            <textarea
              className="form-input min-h-[100px] w-full"
              placeholder="Comma-separated skills"
              value={sections.skills.join(', ')}
              onChange={(e) =>
                setSections((s) => ({
                  ...s,
                  skills: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
            />
          )}

          {activeSection === 'projects' && (
            <div className="form-panel-stack">
              {sections.projects.map((row, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 border-b border-surface-line pb-3 last:border-0 last:pb-0 dark:border-slate-600"
                >
                  <input
                    className="form-input"
                    placeholder="Title"
                    value={row.title}
                    onChange={(e) => {
                      const next = [...sections.projects];
                      next[idx] = { ...row, title: e.target.value };
                      setSections((s) => ({ ...s, projects: next }));
                    }}
                  />
                  <textarea
                    className="form-input"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => {
                      const next = [...sections.projects];
                      next[idx] = { ...row, description: e.target.value };
                      setSections((s) => ({ ...s, projects: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Tech stack (comma separated)"
                    value={row.techStack.join(', ')}
                    onChange={(e) => {
                      const next = [...sections.projects];
                      next[idx] = {
                        ...row,
                        techStack: e.target.value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                      };
                      setSections((s) => ({ ...s, projects: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="GitHub URL"
                    value={row.github}
                    onChange={(e) => {
                      const next = [...sections.projects];
                      next[idx] = { ...row, github: e.target.value };
                      setSections((s) => ({ ...s, projects: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Live link"
                    value={row.liveLink}
                    onChange={(e) => {
                      const next = [...sections.projects];
                      next[idx] = { ...row, liveLink: e.target.value };
                      setSections((s) => ({ ...s, projects: next }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() =>
                  setSections((s) => ({
                    ...s,
                    projects: [
                      ...s.projects,
                      { title: '', description: '', techStack: [], github: '', liveLink: '' },
                    ],
                  }))
                }
              >
                + Add project
              </button>
            </div>
          )}

          {activeSection === 'certifications' && (
            <div className="form-panel-stack">
              {sections.certifications.map((row, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 border-b border-surface-line pb-3 last:border-0 last:pb-0 dark:border-slate-600"
                >
                  <input
                    className="form-input"
                    placeholder="Name"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...sections.certifications];
                      next[idx] = { ...row, name: e.target.value };
                      setSections((s) => ({ ...s, certifications: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Issuer"
                    value={row.issuer}
                    onChange={(e) => {
                      const next = [...sections.certifications];
                      next[idx] = { ...row, issuer: e.target.value };
                      setSections((s) => ({ ...s, certifications: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Issue date"
                    value={row.issueDate}
                    onChange={(e) => {
                      const next = [...sections.certifications];
                      next[idx] = { ...row, issueDate: e.target.value };
                      setSections((s) => ({ ...s, certifications: next }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() =>
                  setSections((s) => ({
                    ...s,
                    certifications: [...s.certifications, { name: '', issuer: '', issueDate: '' }],
                  }))
                }
              >
                + Add certification
              </button>
            </div>
          )}

          {activeSection === 'achievements' && (
            <div className="form-panel-stack">
              {sections.achievements.map((row, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 border-b border-surface-line pb-3 last:border-0 last:pb-0 dark:border-slate-600"
                >
                  <input
                    className="form-input"
                    placeholder="Title"
                    value={row.title}
                    onChange={(e) => {
                      const next = [...sections.achievements];
                      next[idx] = { ...row, title: e.target.value };
                      setSections((s) => ({ ...s, achievements: next }));
                    }}
                  />
                  <textarea
                    className="form-input"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => {
                      const next = [...sections.achievements];
                      next[idx] = { ...row, description: e.target.value };
                      setSections((s) => ({ ...s, achievements: next }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() =>
                  setSections((s) => ({
                    ...s,
                    achievements: [...s.achievements, { title: '', description: '' }],
                  }))
                }
              >
                + Add achievement
              </button>
            </div>
          )}

          {activeSection === 'languages' && (
            <div className="form-panel-stack">
              {sections.languages.map((row, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 border-b border-surface-line pb-3 last:border-0 last:pb-0 dark:border-slate-600 md:grid-cols-2"
                >
                  <input
                    className="form-input"
                    placeholder="Language"
                    value={row.language}
                    onChange={(e) => {
                      const next = [...sections.languages];
                      next[idx] = { ...row, language: e.target.value };
                      setSections((s) => ({ ...s, languages: next }));
                    }}
                  />
                  <input
                    className="form-input"
                    placeholder="Proficiency"
                    value={row.proficiency}
                    onChange={(e) => {
                      const next = [...sections.languages];
                      next[idx] = { ...row, proficiency: e.target.value };
                      setSections((s) => ({ ...s, languages: next }));
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                onClick={() =>
                  setSections((s) => ({
                    ...s,
                    languages: [...s.languages, { language: '', proficiency: '' }],
                  }))
                }
              >
                + Add language
              </button>
            </div>
          )}

          {activeSection === 'social' && (
            <div className="form-panel-grid">
              {(['linkedin', 'github', 'website'] as const).map((f) => (
                <input
                  key={f}
                  className="form-input"
                  placeholder={f}
                  value={sections.social[f]}
                  onChange={(e) =>
                    setSections((s) => ({ ...s, social: { ...s.social, [f]: e.target.value } }))
                  }
                />
              ))}
            </div>
          )}

          {assistMsg && <p className="text-xs text-ink-muted dark:text-slate-400">{assistMsg}</p>}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-ink-muted dark:text-slate-400">Live preview</h2>
          <Preview templateId={templateId} sectionOrder={sectionOrder} sections={sections} />
        </div>
      </div>
    </div>
  );
}
