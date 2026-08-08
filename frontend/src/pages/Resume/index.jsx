import React, { useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { RadialProgress } from '../../components/ProgressBar';
import {
  TemplatePicker,
  SharpTemplate,
  ElegantTemplate,
  ChronicleTemplate,
  DiamondTemplate,
  BennettTemplate,
  AtlasTemplate,
  ExecProTemplate,
  PrestigeTemplate,
  FresherTemplate,
} from './ResumeTemplates';
import { SECTION_SCHEMA } from './sectionSchema';
import { RepeatingSection } from './SectionSystem';
import { resumeService } from '../../services/resumeService';

export default function Resume() {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'analyzer'

  return (
    <div className="resume-page">

      {/* Page Header */}
      <header className="resume-header">
        <div className="resume-header__left">
          <span className="resume-header__eyebrow">✦ Resume Suite</span>
          <h1 className="resume-header__title">AI Resume Workspace</h1>
          <p className="resume-header__subtitle">Craft or analyze resumes tailored specifically for automated recruiters and top tech companies.</p>
        </div>

        {/* Workspace Mode Tab Toggle */}
        <div className="resume-mode-toggle">
          <button
            onClick={() => setActiveTab('builder')}
            className={`resume-mode-btn ${activeTab === 'builder' ? 'resume-mode-btn--active' : ''}`}
          >
            AI Builder
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`resume-mode-btn ${activeTab === 'analyzer' ? 'resume-mode-btn--active' : ''}`}
          >
            AI Analyzer
          </button>
        </div>
      </header>

      {/* Main Mode View */}
      {activeTab === 'builder' ? <ResumeBuilder /> : <ResumeAnalyzer />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ACCORDION — stable module-level component.
   IMPORTANT: Must NOT be defined inside another component or
   React will remount it (and destroy child state) on every
   parent re-render, causing inputs to lose focus.
   ────────────────────────────────────────────────────────── */
function Acc({ id, label, open, onToggle, children }) {
  return (
    <div className={`rb-acc ${open ? 'rb-acc--open' : ''}`}>
      <button type="button" className="rb-acc__head" onClick={() => onToggle(id)}>
        <span className="rb-acc__label">{label}</span>
        <span className="rb-acc__arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="rb-acc__body">{children}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   AI RESUME BUILDER WORKSPACE
   ────────────────────────────────────────────────────────── */
function ResumeBuilder() {
  const [template, setTemplate]       = useState('sharp');
  const [profileType, setProfileType] = useState('fresher'); // 'fresher' | 'experienced'

  /* ─── formData ───────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    // ── Non-repeating ──────────────────────────────
    fullName:  'Arjun Sharma',
    title:     'Frontend Developer',
    email:     'arjun.sharma@gmail.com',
    phone:     '+91 98765 43210',
    location:  'Bengaluru, India',
    linkedin:  'linkedin.com/in/arjunsharma',
    github:    'github.com/arjunsharma',
    portfolio: '',
    summary:   'Recent B.Tech graduate with strong passion for frontend development and building scalable web applications. Seeking an opportunity to contribute to a dynamic engineering team.',
    skills:    'React, JavaScript, HTML, CSS, Git, Node.js, Python',

    // ── Repeating sections (all arrays of objects with _id) ──
    experience: [
      { _id: 1, company: 'NovaCloud Payments', role: 'Frontend Intern', duration: 'Jun 2023 – Aug 2023',
        bullets: 'Built merchant dashboard components using React.\nReduced page load time by 18% via lazy loading.' },
    ],
    education: [
      { _id: 2, degree: 'B.Tech – Computer Science', institution: 'NIT Trichy', year: '2021', gpa: '8.4 / 10' },
    ],
    projects: [
      { _id: 3, name: 'Portfolio Website', tech: 'React, Tailwind',
        description: 'Built a personal portfolio with dark-mode support and animated transitions.', link: '' },
    ],
    internships:    [],
    certifications: [
      { _id: 4, name: 'AWS Cloud Practitioner', issuer: 'Amazon', year: '2023' },
    ],
    achievements: [
      { _id: 5, text: 'Winner – HackIndia 2023 (React track)' },
      { _id: 6, text: 'Ranked top 5% in LeetCode India contest' },
    ],
    volunteer:   [],
    training:    [],
    positions:   [],
    extracurricular: [
      { _id: 7, activity: 'IEEE Student Chapter', role: 'Technical Head', duration: '2020–2021' },
    ],
    languages: [
      { _id: 8, language: 'English', proficiency: 'Fluent' },
      { _id: 9, language: 'Hindi',   proficiency: 'Native' },
    ],
    publications: [],
    custom:       [],
  });

  /* Generic scalar setter */
  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handlePrint = () => window.print && window.print();

  /* Accordion for non-repeating sections (header, summary, skills) */
  const [openSections, setOpenSections] = useState({ header: false, summary: false, skills: false });
  const toggleSection = (id) => setOpenSections(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="resume-builder-grid">

      {/* ════════════════════════════════════════
          LEFT PANEL — Form
      ════════════════════════════════════════ */}
      <section className="resume-builder-left">
        <Card title="📝 Resume Information">

          {/* Profile type toggle */}
          <div className="rb-profile-toggle">
            <button type="button"
              className={`rb-profile-btn ${profileType === 'fresher' ? 'rb-profile-btn--active' : ''}`}
              onClick={() => setProfileType('fresher')}>
              🎓 Fresher <span className="rb-profile-btn__tag">Recommended</span>
            </button>
            <button type="button"
              className={`rb-profile-btn ${profileType === 'experienced' ? 'rb-profile-btn--active' : ''}`}
              onClick={() => setProfileType('experienced')}>
              💼 Experienced
            </button>
          </div>

          <div className="resume-form" style={{ gap: 10 }}>

            {/* ── Header / Contact ── */}
            <Acc id="header" label="📌 Header / Contact" open={openSections.header} onToggle={toggleSection}>
              <div className="resume-form__row">
                <div>
                  <label className="resume-label">Full Name *</label>
                  <input className="resume-input" value={formData.fullName}  onChange={e => set('fullName',  e.target.value)} />
                </div>
                <div>
                  <label className="resume-label">Job Title</label>
                  <input className="resume-input" value={formData.title}     onChange={e => set('title',     e.target.value)} />
                </div>
              </div>
              <div className="resume-form__row">
                <div>
                  <label className="resume-label">Phone *</label>
                  <input className="resume-input" type="tel"   value={formData.phone}    onChange={e => set('phone',    e.target.value)} />
                </div>
                <div>
                  <label className="resume-label">Email *</label>
                  <input className="resume-input" type="email" value={formData.email}    onChange={e => set('email',    e.target.value)} />
                </div>
              </div>
              <div className="resume-form__row">
                <div>
                  <label className="resume-label">Location</label>
                  <input className="resume-input" value={formData.location}  onChange={e => set('location',  e.target.value)} />
                </div>
                <div>
                  <label className="resume-label">LinkedIn URL</label>
                  <input className="resume-input" value={formData.linkedin}  onChange={e => set('linkedin',  e.target.value)} />
                </div>
              </div>
              <div className="resume-form__row">
                <div>
                  <label className="resume-label">GitHub URL {profileType === 'fresher' && <span className="rb-hint">recommended</span>}</label>
                  <input className="resume-input" value={formData.github}    onChange={e => set('github',    e.target.value)} />
                </div>
                <div>
                  <label className="resume-label">Portfolio URL <span className="rb-hint">optional</span></label>
                  <input className="resume-input" value={formData.portfolio} onChange={e => set('portfolio', e.target.value)} />
                </div>
              </div>
            </Acc>

            {/* ── Summary / Objective ── */}
            <Acc id="summary" label={profileType === 'fresher' ? '🎯 Career Objective' : '🎯 Professional Summary'} open={openSections.summary} onToggle={toggleSection}>
              <label className="resume-label">
                {profileType === 'fresher'
                  ? 'Briefly describe your goals and what you bring to the role'
                  : 'Summarise your experience and impact in 3–5 sentences'}
              </label>
              <textarea
                className="resume-input resume-textarea"
                rows={4}
                value={formData.summary}
                onChange={e => set('summary', e.target.value)}
              />
            </Acc>

            {/* ── Skills ── */}
            <Acc id="skills" label="⚙️ Technical Skills" open={openSections.skills} onToggle={toggleSection}>
              <label className="resume-label">Skills (comma-separated)</label>
              <textarea
                className="resume-input resume-textarea"
                rows={3}
                placeholder="e.g. React, Python, SQL, Git, Docker, AWS"
                value={formData.skills}
                onChange={e => set('skills', e.target.value)}
              />
            </Acc>

            {/* ════════════════════════════════
                REPEATING SECTIONS
                All driven by SECTION_SCHEMA
            ════════════════════════════════ */}
            {SECTION_SCHEMA.map(schema => (
              <RepeatingSection
                key={schema.id}
                schema={schema}
                entries={formData[schema.id] || []}
                onChange={arr => set(schema.id, arr)}
              />
            ))}

          </div>
        </Card>

        {/* AI Tips */}
        <Card title="✨ AI Resume Tips" glow className="resume-card-glow">
          <ul className="resume-tips-list">
            <li>💡 <strong>Quantify achievements</strong>: Use numbers — "reduced load time by 32%" beats "improved performance".</li>
            <li>💡 <strong>Action verbs</strong>: Start every bullet with "Built", "Led", "Optimised", "Designed" etc.</li>
            {profileType === 'fresher'
              ? <li>💡 <strong>Projects matter most</strong>: Freshers should list 2–4 strong projects with GitHub links.</li>
              : <li>💡 <strong>Impact first</strong>: Lead each role with the biggest business outcome you drove.</li>}
          </ul>
        </Card>
      </section>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Live Canvas Preview
      ════════════════════════════════════════ */}
      <section className="resume-builder-right">
        <Card title="📄 Live Resume Preview" subtitle="Switch templates below." className="resume-preview-card">
          <TemplatePicker current={template} onChange={setTemplate} />
          <div className="resume-canvas-scroll">
            <div className="resume-canvas">
              {template === 'sharp'     && <SharpTemplate     data={formData} />}
              {template === 'elegant'   && <ElegantTemplate   data={formData} />}
              {template === 'chronicle' && <ChronicleTemplate data={formData} />}
              {template === 'diamond'   && <DiamondTemplate   data={formData} />}
              {template === 'bennett'   && <BennettTemplate   data={formData} />}
              {template === 'atlas'     && <AtlasTemplate     data={formData} />}
              {template === 'execpro'   && <ExecProTemplate   data={formData} />}
              {template === 'prestige'  && <PrestigeTemplate  data={formData} />}
              {template === 'fresher'   && <FresherTemplate   data={formData} />}
            </div>
          </div>
          <div className="resume-canvas-actions">
            <Button variant="primary" style={{ flex: 1 }} onClick={handlePrint}>
              Print / Save PDF
            </Button>
          </div>
        </Card>
      </section>

    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   AI RESUME ANALYZER WORKSPACE
   ────────────────────────────────────────────────────────── */

function ResumeAnalyzer() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (fileObj) => {
    setFile(fileObj);
    setAnalyzing(true);
    setReport(null);
    setError(null);

    try {
      // 1. Upload to backend (saves to disk and extracts text)
      await resumeService.upload(fileObj);
      
      // 2. Invoke analyzer heuristings & LLM processing
      const data = await resumeService.analyze();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to process and analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className={`resume-analyzer-grid ${report ? 'resume-analyzer-grid--with-report' : ''}`}>

      {/* Upload pane */}
      <section className="resume-section-stack">
        <Card title="📤 Resume Parser Dropzone" subtitle="Drop your PDF or DOCX resume below for a detailed ATS audit.">
          
          {error && (
            <div className="resume-error-banner" style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid rgba(220,38,38,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`resume-dropzone ${dragActive ? 'resume-dropzone--active' : ''} ${file ? 'resume-dropzone--has-file' : ''}`}
          >
            <input
              type="file"
              className="resume-dropzone__input"
              onChange={handleChange}
              accept=".pdf,.doc,.docx"
            />
            <span className="resume-dropzone__icon">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" style={{ display: 'block' }}>
                <rect width="48" height="48" rx="12" fill="rgba(37,99,235,0.08)" />
                <path d="M24 18v10M20 22l4-4 4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 30h16" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <strong className="resume-dropzone__title">
              {file ? file.name : 'Drag and drop your resume file'}
            </strong>
            <span className="resume-dropzone__hint">
              Supports PDF or DOCX up to 10MB
            </span>
            <span className="resume-dropzone__browse">Browse files</span>
          </div>

          {analyzing && (
            <div className="resume-analyzing">
              <div className="resume-analyzing__spinner" />
              <span className="resume-analyzing__text">Uploading & analyzing structures, syntax, and keywords...</span>
            </div>
          )}
        </Card>
      </section>

      {/* Analysis report dashboard */}
      {report && (
        <section className="resume-section-stack">
          <Card title="📊 Audit Analysis Report" subtitle={`Based on analysis of ${report.resume_filename || file?.name}`}>

            {/* Score Ring */}
            <div className="resume-score-row">
              <div className="resume-score-ring-wrap">
                <RadialProgress percent={report.score} size={80} strokeWidth={7} />
              </div>
              <div>
                <strong className="resume-score-label">Overall ATS Formatting Score</strong>
                <span className="resume-score-pass">
                  {report.score > 75 ? '✓ Strong technical format & layout.' : '⚠ Formatting improvements needed.'}
                </span>
              </div>
            </div>

            {/* Formatting Checks */}
            <div className="resume-metrics" style={{ marginTop: '24px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}>
                Structure & Format Checks
              </strong>
              {report.checks?.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: check.passed ? 'var(--success)' : 'var(--error)' }}>
                    {check.passed ? '✔' : '✖'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{check.label}</span>
                </div>
              ))}
            </div>

            {/* Strengths / Skills & Suggestions Lists */}
            <div className="resume-feedback">
              <div>
                <strong className="resume-feedback__group-title resume-feedback__group-title--strength">
                  ✓ Detected Tech Skills
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {report.extracted_skills?.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No technical skills detected.</span>
                  ) : (
                    report.extracted_skills?.map((skill, i) => (
                      <span key={i} style={{ padding: '4px 8px', background: 'rgba(37,99,235,0.08)', borderRadius: '6px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                        {skill.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <strong className="resume-feedback__group-title resume-feedback__group-title--weakness">
                  ⚠ Recommended Actions
                </strong>
                <ul className="resume-feedback__list">
                  {report.suggestions?.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                  {(!report.suggestions || report.suggestions.length === 0) && (
                    <li style={{ color: 'var(--text-muted)' }}>Looking good! No major suggestions.</li>
                  )}
                </ul>
              </div>
            </div>

          </Card>
        </section>
      )}

    </div>
  );
}
