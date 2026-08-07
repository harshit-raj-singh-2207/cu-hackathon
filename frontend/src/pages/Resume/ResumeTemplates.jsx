import React from 'react';

/* ──────────────────────────────────────────────
   TEMPLATE REGISTRY — 5 templates
────────────────────────────────────────────── */
export const TEMPLATES = [
  { id: 'sharp',       label: 'Sharp',       accent: '#111111' },
  { id: 'elegant',     label: 'Elegant',     accent: '#555555' },
  { id: 'chronicle',   label: 'Chronicle',   accent: '#1a1a1a' },
  { id: 'diamond',     label: 'Diamond',     accent: '#2d2d2d' },
  { id: 'bennett',     label: 'Bennett',     accent: '#222222' },
  { id: 'atlas',       label: 'Atlas',       accent: '#1a1a1a' },
  { id: 'execpro',     label: 'Exec Pro',    accent: '#0a0a0a' },
  { id: 'prestige',    label: 'Prestige',    accent: '#b8973a' },
  { id: 'fresher',     label: 'Fresher',     accent: '#111111' },
];

/* ── Template Picker Bar ── */
export function TemplatePicker({ current, onChange }) {
  return (
    <div className="tpl-picker">
      <span className="tpl-picker__label">Template</span>
      <div className="tpl-picker__swatches">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => onChange(t.id)}
            className={`tpl-swatch ${current === t.id ? 'tpl-swatch--active' : ''}`}
            style={{ '--accent': t.accent }}
          >
            <span className="tpl-swatch__dot" />
            <span className="tpl-swatch__name">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Shared helpers ── */
function BulletList({ text, cls = 'tpl-bul' }) {
  return (
    <ul className={cls}>
      {text.split('\n').filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  );
}

/**
 * EduSection — renders education regardless of whether it is:
 *   • A plain string  (old / legacy format)
 *   • An array of    { degree, institution, year, gpa } objects (new form format)
 */
function EduLines({ data: edu, cls = 'tpl-edu-line' }) {
  if (!edu) return null;

  // ── Array of objects (new builder format) ─────────────────────────────────
  if (Array.isArray(edu)) {
    if (edu.length === 0) return null;
    return (
      <>
        {edu.map((e, i) => {
          const parts = [e.degree, e.institution].filter(Boolean);
          const meta  = [e.year, e.gpa ? `GPA: ${e.gpa}` : null].filter(Boolean);
          return (
            <p key={i} className={cls} style={{ margin: '0 0 4px' }}>
              <strong>{parts.join(' — ')}</strong>
              {meta.length > 0 && <span style={{ fontWeight: 400 }}> · {meta.join(' · ')}</span>}
            </p>
          );
        })}
      </>
    );
  }

  // ── Plain string (legacy / manual) ────────────────────────────────────────
  return <p className={cls} style={{ margin: 0 }}>{edu}</p>;
}

/**
 * ExtraSections — renders all supplementary resume sections
 * using neutral inline styles so it works inside every template.
 *
 * New object-array shapes (from SectionSystem):
 *   achievements    → [{text}]
 *   extracurricular → [{activity, role, duration}]
 *   languages       → [{language, proficiency}]
 *   publications    → [{title, publisher, year, description}]
 *   internships     → [{company, role, duration, bullets}]
 *   volunteer       → [{org, role, duration, description}]
 *   training        → [{name, provider, year, description}]
 *   positions       → [{title, org, duration, description}]
 *   custom          → [{sectionName, heading, description}]
 *
 * Legacy string values are normalised gracefully.
 */
function ExtraSections({ data }) {
  const H  = { fontSize:'10px', fontWeight:'700', letterSpacing:'0.09em', textTransform:'uppercase', borderBottom:'1px solid #bbb', paddingBottom:'2px', marginBottom:'5px', marginTop:'12px', color:'#111' };
  const B  = { fontSize:'10.5px', color:'#333', margin:'0 0 3px', lineHeight:'1.45' };
  const LI = { fontSize:'10.5px', color:'#333', paddingLeft:'12px', margin:'2px 0', lineHeight:'1.4' };
  const UL = { margin:'0', padding:'0 0 0 14px' };

  // Inline bullet-list renderer for bullets text (newline-separated)
  const BulList = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n').filter(Boolean);
    return lines.length ? (
      <ul style={UL}>{lines.map((l, i) => <li key={i} style={LI}>{l}</li>)}</ul>
    ) : null;
  };

  // Normalise achievements: [{text}] or string[] or string → [{text}]
  const achArr = Array.isArray(data.achievements)
    ? data.achievements.map(a => typeof a === 'string' ? { text: a } : a)
    : (data.achievements ? [{ text: String(data.achievements) }] : []);
  const hasAch = achArr.some(a => a.text);

  // Normalise extracurricular: [{activity,role,duration}] or string → [{activity}]
  const extraArr = Array.isArray(data.extracurricular)
    ? data.extracurricular
    : (data.extracurricular
        ? data.extracurricular.split('\n').filter(Boolean).map(s => ({ activity: s }))
        : []);
  const hasExtra = extraArr.some(e => e.activity);

  // Normalise languages: [{language,proficiency}] or "Lang – Prof, ..." string
  const langArr = Array.isArray(data.languages)
    ? data.languages
    : (data.languages
        ? data.languages.split(',').map(s => {
            const parts = s.split('–').map(x => x.trim());
            return { language: parts[0] || s.trim(), proficiency: parts[1] || '' };
          })
        : []);
  const hasLang = langArr.some(l => l.language);

  // Normalise publications: [{title,publisher,year,description}] or string
  const pubArr = Array.isArray(data.publications)
    ? data.publications
    : (data.publications
        ? data.publications.split('\n').filter(Boolean).map(s => ({ title: s }))
        : []);
  const hasPub = pubArr.some(p => p.title);

  const hasProjects = data.projects?.some(p => p.name);
  const hasCerts    = data.certifications?.some(c => c.name);
  const hasIntern   = data.internships?.some(e => e.role || e.company);
  const hasVol      = data.volunteer?.some(v => v.org || v.role);
  const hasTrain    = data.training?.some(t => t.name);
  const hasPos      = data.positions?.some(p => p.title);
  const hasCustom   = data.custom?.some(c => c.heading || c.sectionName);

  if (!hasProjects && !hasCerts && !hasAch && !hasExtra && !hasLang && !hasPub
      && !hasIntern && !hasVol && !hasTrain && !hasPos && !hasCustom) return null;

  return (
    <>
      {/* Projects */}
      {hasProjects && (
        <div>
          <p style={H}>PROJECTS</p>
          {data.projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom:'7px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <strong style={{ fontSize:'10.5px' }}>{p.name}</strong>
                {p.tech && <span style={{ fontSize:'9px', color:'#555', marginLeft:'6px' }}>{p.tech}</span>}
              </div>
              {p.description && <p style={B}>{p.description}</p>}
              {p.link && <p style={{ ...B, fontSize:'9px', opacity:0.55 }}>{p.link}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {hasCerts && (
        <div>
          <p style={H}>CERTIFICATIONS</p>
          {data.certifications.filter(c => c.name).map((c, i) => (
            <p key={i} style={B}>
              <strong>{c.name}</strong>
              {c.issuer ? ` — ${c.issuer}` : ''}
              {c.year   ? ` (${c.year})`   : ''}
            </p>
          ))}
        </div>
      )}

      {/* Achievements */}
      {hasAch && (
        <div>
          <p style={H}>ACHIEVEMENTS</p>
          <ul style={UL}>
            {achArr.filter(a => a.text).map((a, i) => <li key={i} style={LI}>{a.text}</li>)}
          </ul>
        </div>
      )}

      {/* Internships */}
      {hasIntern && (
        <div>
          <p style={H}>INTERNSHIPS</p>
          {data.internships.filter(e => e.role || e.company).map((e, i) => (
            <div key={i} style={{ marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong style={{ fontSize:'10.5px' }}>{e.role}</strong>
                {e.duration && <span style={{ fontSize:'9.5px', color:'#666' }}>{e.duration}</span>}
              </div>
              {e.company && <p style={{ ...B, marginBottom:'2px' }}>{e.company}</p>}
              <BulList text={e.bullets} />
            </div>
          ))}
        </div>
      )}

      {/* Volunteer Experience */}
      {hasVol && (
        <div>
          <p style={H}>VOLUNTEER EXPERIENCE</p>
          {data.volunteer.filter(v => v.org || v.role).map((v, i) => (
            <div key={i} style={{ marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong style={{ fontSize:'10.5px' }}>{v.role || v.org}</strong>
                {v.duration && <span style={{ fontSize:'9.5px', color:'#666' }}>{v.duration}</span>}
              </div>
              {v.org && v.role && <p style={{ ...B, marginBottom:'2px' }}>{v.org}</p>}
              {v.description && <p style={B}>{v.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Training & Courses */}
      {hasTrain && (
        <div>
          <p style={H}>TRAINING &amp; COURSES</p>
          {data.training.filter(t => t.name).map((t, i) => (
            <div key={i} style={{ marginBottom:'5px' }}>
              <p style={{ ...B, margin:'0 0 1px' }}>
                <strong>{t.name}</strong>
                {t.provider ? ` — ${t.provider}` : ''}
                {t.year     ? ` (${t.year})`     : ''}
              </p>
              {t.description && <p style={{ ...B, fontWeight:'400' }}>{t.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Positions of Responsibility */}
      {hasPos && (
        <div>
          <p style={H}>POSITIONS OF RESPONSIBILITY</p>
          {data.positions.filter(p => p.title).map((p, i) => (
            <div key={i} style={{ marginBottom:'6px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong style={{ fontSize:'10.5px' }}>{p.title}</strong>
                {p.duration && <span style={{ fontSize:'9.5px', color:'#666' }}>{p.duration}</span>}
              </div>
              {p.org && <p style={{ ...B, marginBottom:'2px' }}>{p.org}</p>}
              {p.description && <p style={B}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Extracurricular / Leadership */}
      {hasExtra && (
        <div>
          <p style={H}>EXTRACURRICULAR / LEADERSHIP</p>
          <ul style={UL}>
            {extraArr.filter(e => e.activity).map((e, i) => {
              const line = [e.activity, e.role, e.duration].filter(Boolean).join(' · ');
              return <li key={i} style={LI}>{line}</li>;
            })}
          </ul>
        </div>
      )}

      {/* Languages */}
      {hasLang && (
        <div>
          <p style={H}>LANGUAGES</p>
          <p style={B}>
            {langArr.filter(l => l.language).map((l, i) => (
              <span key={i}>
                {i > 0 && '  ·  '}
                <strong>{l.language}</strong>
                {l.proficiency ? ` – ${l.proficiency}` : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Publications & Patents */}
      {hasPub && (
        <div>
          <p style={H}>PUBLICATIONS &amp; PATENTS</p>
          {pubArr.filter(p => p.title).map((p, i) => (
            <div key={i} style={{ marginBottom:'5px' }}>
              <p style={{ ...B, margin:'0 0 1px' }}>
                <strong>{p.title}</strong>
                {p.publisher ? ` — ${p.publisher}` : ''}
                {p.year      ? ` (${p.year})`      : ''}
              </p>
              {p.description && <p style={{ ...B, fontWeight:'400' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Custom Sections — grouped by sectionName */}
      {hasCustom && (() => {
        const groups = {};
        data.custom.filter(c => c.heading || c.sectionName).forEach(c => {
          const key = c.sectionName || 'Custom';
          if (!groups[key]) groups[key] = [];
          if (c.heading) groups[key].push(c);
        });
        return Object.entries(groups).map(([name, items]) => (
          <div key={name}>
            <p style={H}>{name.toUpperCase()}</p>
            {items.map((item, i) => (
              <div key={i} style={{ marginBottom:'4px' }}>
                {item.heading && <strong style={{ fontSize:'10.5px', display:'block' }}>{item.heading}</strong>}
                {item.description && <p style={B}>{item.description}</p>}
              </div>
            ))}
          </div>
        ));
      })()}
    </>
  );
}


/* ══════════════════════════════════════════════════════════
   1. SHARP — Pathy Krishna style
   Bold centered name · ruled sections · date-right layout
══════════════════════════════════════════════════════════ */
export function SharpTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div className="tpl tpl-sharp">
      <div className="tpl-sharp__header">
        <h1 className="tpl-sharp__name">{data.fullName || 'YOUR NAME'}</h1>
        {data.location && <p className="tpl-sharp__addr">{data.location}</p>}
        <p className="tpl-sharp__contact">
          {[data.phone, data.email, data.linkedin, data.github, data.portfolio].filter(Boolean).join(' | ')}
        </p>
      </div>
      <hr className="tpl-sharp__rule" />

      {data.summary && (
        <SharpSection label="PROFESSIONAL SUMMARY">
          <p className="tpl-sharp__body">{data.summary}</p>
        </SharpSection>
      )}

      {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
        <SharpSection label="EDUCATION">
          <EduLines data={data.education} cls="tpl-sharp__body" />
        </SharpSection>
      )}

      {data.experience?.length > 0 && (
        <SharpSection label="RELEVANT EXPERIENCE">
          {data.experience.map((e, i) => (
            <div key={i} className="tpl-sharp__exp">
              <div className="tpl-sharp__exp-row">
                <span className="tpl-sharp__exp-company">{e.company}</span>
                <span className="tpl-sharp__exp-dur">{e.duration}</span>
              </div>
              <p className="tpl-sharp__exp-role">{e.role}</p>
              <BulletList text={e.bullets} cls="tpl-sharp__bul" />
            </div>
          ))}
        </SharpSection>
      )}

      {skills.length > 0 && (
        <SharpSection label="SKILLS">
          <p className="tpl-sharp__body">{skills.join(' · ')}</p>
        </SharpSection>
      )}
      <ExtraSections data={data} />
    </div>
  );
}
function SharpSection({ label, children }) {
  return (
    <div className="tpl-sharp__section">
      <h3 className="tpl-sharp__section-title">{label}</h3>
      <hr className="tpl-sharp__section-rule" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   2. ELEGANT — Jacqueline Thompson style
   Serif centered name · two-column (sidebar | main)
══════════════════════════════════════════════════════════ */
export function ElegantTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div className="tpl tpl-elg">
      <div className="tpl-elg__header">
        <h1 className="tpl-elg__name">{data.fullName || 'Your Name'}</h1>
        {data.title && <p className="tpl-elg__title">{data.title.toUpperCase()}</p>}
        <hr className="tpl-elg__top-rule" />
      </div>

      <div className="tpl-elg__body">
        {/* Left sidebar */}
        <aside className="tpl-elg__sidebar">
          {(data.phone || data.email || data.location) && (
            <ElgSection label="CONTACT">
              {data.phone    && <p className="tpl-elg__item">📞 {data.phone}</p>}
              {data.email    && <p className="tpl-elg__item">✉ {data.email}</p>}
              {data.location && <p className="tpl-elg__item">📍 {data.location}</p>}
              {data.linkedin && <p className="tpl-elg__item">🔗 {data.linkedin}</p>}
              {data.github   && <p className="tpl-elg__item">💻 {data.github}</p>}
              {data.portfolio && <p className="tpl-elg__item">🌐 {data.portfolio}</p>}
            </ElgSection>
          )}
          {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
            <ElgSection label="EDUCATION">
              <EduLines data={data.education} cls="tpl-elg__body-text" />
            </ElgSection>
          )}
          {skills.length > 0 && (
            <ElgSection label="SKILLS">
              {skills.map((s, i) => (
                <p key={i} className="tpl-elg__item">• <strong>{s}</strong></p>
              ))}
            </ElgSection>
          )}
        </aside>

        {/* Right main */}
        <main className="tpl-elg__main">
          {data.summary && (
            <ElgMainSection label="SUMMARY">
              <p className="tpl-elg__body-text">{data.summary}</p>
            </ElgMainSection>
          )}
          {data.experience?.length > 0 && (
            <ElgMainSection label="WORK EXPERIENCE">
              {data.experience.map((e, i) => (
                <div key={i} className="tpl-elg__exp">
                  <p className="tpl-elg__exp-title"><strong>{e.company} ({e.duration})</strong></p>
                  <p className="tpl-elg__exp-role">{e.role}</p>
                  <BulletList text={e.bullets} cls="tpl-elg__bul" />
                </div>
              ))}
            </ElgMainSection>
          )}
          <ExtraSections data={data} />
        </main>
      </div>
    </div>
  );
}
function ElgSection({ label, children }) {
  return <div className="tpl-elg__sidebar-section"><h4 className="tpl-elg__sidebar-heading">{label}</h4>{children}</div>;
}
function ElgMainSection({ label, children }) {
  return (
    <div className="tpl-elg__main-section">
      <h3 className="tpl-elg__main-heading">{label}</h3>
      <hr className="tpl-elg__section-rule" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   3. CHRONICLE — Olivia Schumacher style
   Large left-aligned name · table-style date | content layout
══════════════════════════════════════════════════════════ */
export function ChronicleTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const col1 = skills.filter((_, i) => i % 3 === 0);
  const col2 = skills.filter((_, i) => i % 3 === 1);
  const col3 = skills.filter((_, i) => i % 3 === 2);

  return (
    <div className="tpl tpl-chr">
      <div className="tpl-chr__header">
        <h1 className="tpl-chr__name">{data.fullName || 'Your Name'}</h1>
        {data.title && <p className="tpl-chr__title">{data.title}</p>}
        <p className="tpl-chr__contact">
          {[data.phone, data.email, data.linkedin, data.github, data.location].filter(Boolean).join(' · ')}
        </p>
        <hr className="tpl-chr__rule" />
      </div>

      {data.experience?.length > 0 && (
        <ChrSection label="WORK EXPERIENCE">
          {data.experience.map((e, i) => (
            <div key={i} className="tpl-chr__row">
              <div className="tpl-chr__left-col">
                <p className="tpl-chr__company">{e.company}</p>
                <p className="tpl-chr__dur">{e.duration}</p>
              </div>
              <div className="tpl-chr__right-col">
                <p className="tpl-chr__role">{e.role}</p>
                <BulletList text={e.bullets} cls="tpl-chr__bul" />
              </div>
            </div>
          ))}
        </ChrSection>
      )}

      {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
        <ChrSection label="EDUCATION">
          <div className="tpl-chr__row">
            <div className="tpl-chr__left-col" />
            <div className="tpl-chr__right-col">
              <EduLines data={data.education} cls="tpl-chr__body" />
            </div>
          </div>
        </ChrSection>
      )}

      {data.summary && (
        <ChrSection label="SUMMARY">
          <p className="tpl-chr__body tpl-chr__body--indent">{data.summary}</p>
        </ChrSection>
      )}

      {skills.length > 0 && (
        <>
          <hr className="tpl-chr__rule" />
          <div className="tpl-chr__footer-grid">
            <div className="tpl-chr__footer-col">
              <h4 className="tpl-chr__footer-heading">SKILLS</h4>
              {col1.map((s, i) => <p key={i} className="tpl-chr__footer-item">{s}</p>)}
            </div>
            <div className="tpl-chr__footer-col">
              <h4 className="tpl-chr__footer-heading">MORE SKILLS</h4>
              {col2.map((s, i) => <p key={i} className="tpl-chr__footer-item">{s}</p>)}
            </div>
            <div className="tpl-chr__footer-col">
              <h4 className="tpl-chr__footer-heading">ADDITIONAL</h4>
              {col3.map((s, i) => <p key={i} className="tpl-chr__footer-item">{s}</p>)}
            </div>
          </div>
        </>
      )}
      <ExtraSections data={data} />
    </div>
  );
}
function ChrSection({ label, children }) {
  return (
    <div className="tpl-chr__section">
      <h3 className="tpl-chr__section-title">{label}</h3>
      <hr className="tpl-chr__rule" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   4. DIAMOND — Lorna Alvarado style
   Two-column · diamond ◇ section icons · timeline bullets
══════════════════════════════════════════════════════════ */
export function DiamondTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div className="tpl tpl-dia">
      {/* Top header */}
      <div className="tpl-dia__header">
        <div>
          <h1 className="tpl-dia__name">{data.fullName || 'Your Name'}</h1>
          {data.title && <p className="tpl-dia__title">{data.title}</p>}
          <div className="tpl-dia__contact">
            {data.phone    && <span>📞 {data.phone}</span>}
            {data.email    && <span>✉ {data.email}</span>}
            {data.linkedin && <span>🔗 {data.linkedin}</span>}
            {data.github   && <span>💻 {data.github}</span>}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="tpl-dia__body">
        {/* Left */}
        <main className="tpl-dia__left">
          {data.summary && (
            <DiaSection label="Summary">
              <p className="tpl-dia__body-text">{data.summary}</p>
            </DiaSection>
          )}
          {data.experience?.length > 0 && (
            <DiaSection label="Work Experience">
              {data.experience.map((e, i) => (
                <div key={i} className="tpl-dia__exp">
                  <div className="tpl-dia__exp-dot" />
                  <div className="tpl-dia__exp-content">
                    <p className="tpl-dia__exp-role"><strong>{e.role}</strong></p>
                    <p className="tpl-dia__exp-company">{e.company}</p>
                    <p className="tpl-dia__exp-dur">{e.duration}</p>
                    <BulletList text={e.bullets} cls="tpl-dia__bul" />
                  </div>
                </div>
              ))}
            </DiaSection>
          )}
          <ExtraSections data={data} />
        </main>

        {/* Right */}
        <aside className="tpl-dia__right">
          {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
            <DiaSection label="Education">
              <EduLines data={data.education} cls="tpl-dia__body-text" />
            </DiaSection>
          )}
          {skills.length > 0 && (
            <DiaSection label="Skills">
              {skills.map((s, i) => <p key={i} className="tpl-dia__skill">• {s}</p>)}
            </DiaSection>
          )}
        </aside>
      </div>
    </div>
  );
}
function DiaSection({ label, children }) {
  return (
    <div className="tpl-dia__section">
      <div className="tpl-dia__section-header">
        <span className="tpl-dia__diamond">◇</span>
        <h3 className="tpl-dia__section-title">{label}</h3>
      </div>
      <hr className="tpl-dia__rule" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5. BENNETT — Sebastian Bennett style
   All-caps bold centered name · icon contact bar · dark footer
══════════════════════════════════════════════════════════ */
export function BennettTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const col1 = skills.filter((_, i) => i % 3 === 0);
  const col2 = skills.filter((_, i) => i % 3 === 1);
  const col3 = skills.filter((_, i) => i % 3 === 2);

  return (
    <div className="tpl tpl-ben">
      <div className="tpl-ben__header">
        <h1 className="tpl-ben__name">{(data.fullName || 'YOUR NAME').toUpperCase()}</h1>
        {data.title && <p className="tpl-ben__title">{data.title}</p>}
        <div className="tpl-ben__contact-bar">
          {data.phone    && <span>📞 {data.phone}</span>}
          {data.email    && <span>✉ {data.email}</span>}
          {data.location && <span>📍 {data.location}</span>}
          {data.github   && <span>💻 {data.github}</span>}
          {data.portfolio && <span>🌐 {data.portfolio}</span>}
        </div>
        <hr className="tpl-ben__rule" />
      </div>

      {data.summary && (
        <BenSection label="ABOUT ME">
          <p className="tpl-ben__body">{data.summary}</p>
        </BenSection>
      )}

      {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
        <BenSection label="EDUCATION">
          <EduLines data={data.education} cls="tpl-ben__body" />
        </BenSection>
      )}

      {data.experience?.length > 0 && (
        <BenSection label="WORK EXPERIENCE">
          {data.experience.map((e, i) => (
            <div key={i} className="tpl-ben__exp">
              <p className="tpl-ben__exp-meta">{e.company} | {e.duration}</p>
              <p className="tpl-ben__exp-role">{e.role}</p>
              <BulletList text={e.bullets} cls="tpl-ben__bul" />
            </div>
          ))}
        </BenSection>
      )}

      {skills.length > 0 && (
        <BenSection label="SKILLS">
          <div className="tpl-ben__skills-grid">
            <ul className="tpl-ben__skills-col">{col1.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            <ul className="tpl-ben__skills-col">{col2.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            <ul className="tpl-ben__skills-col">{col3.map((s, i) => <li key={i}>• {s}</li>)}</ul>
          </div>
        </BenSection>
      )}
      <ExtraSections data={data} />
      <div className="tpl-ben__footer" />
    </div>
  );
}
function BenSection({ label, children }) {
  return (
    <div className="tpl-ben__section">
      <h3 className="tpl-ben__section-title">{label}</h3>
      <hr className="tpl-ben__section-rule" />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   6. ATLAS — Morgan Maxwell style
   Grey header band · two-column body (left main / right sidebar)
══════════════════════════════════════════════════════════ */
export function AtlasTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const half = Math.ceil(skills.length / 2);
  return (
    <div className="tpl tpl-atl">
      <div className="tpl-atl__header">
        <h1 className="tpl-atl__name">{data.fullName || 'YOUR NAME'}</h1>
        {data.title && <p className="tpl-atl__title">{data.title}</p>}
      </div>
      <div className="tpl-atl__body">
        <main className="tpl-atl__left">
          {data.summary && <AtlSection label="ABOUT ME"><p className="tpl-atl__body">{data.summary}</p></AtlSection>}
          {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && <AtlSection label="EDUCATION"><EduLines data={data.education} cls="tpl-atl__body" /></AtlSection>}
          {data.experience?.length > 0 && (
            <AtlSection label="WORK EXPERIENCE">
              {data.experience.map((e, i) => (
                <div key={i} className="tpl-atl__exp">
                  <p className="tpl-atl__exp-meta">{e.company} | {e.duration}</p>
                  <p className="tpl-atl__exp-role">{e.role}</p>
                  <BulletList text={e.bullets} cls="tpl-atl__bul" />
                </div>
              ))}
            </AtlSection>
          )}
          <ExtraSections data={data} />
        </main>
        <aside className="tpl-atl__right">
          {(data.phone || data.email || data.location) && (
            <AtlSideSection label="CONTACT">
              {data.phone    && <p className="tpl-atl__info">{data.phone}</p>}
              {data.email    && <p className="tpl-atl__info">{data.email}</p>}
              {data.location && <p className="tpl-atl__info">{data.location}</p>}
              {data.linkedin && <p className="tpl-atl__info">{data.linkedin}</p>}
              {data.github   && <p className="tpl-atl__info">{data.github}</p>}
              {data.portfolio && <p className="tpl-atl__info">{data.portfolio}</p>}
            </AtlSideSection>
          )}
          {skills.length > 0 && (
            <AtlSideSection label="SKILLS">
              <p className="tpl-atl__side-subtitle">Professional</p>
              {skills.slice(0, half).map((s, i) => <p key={i} className="tpl-atl__info">{s}</p>)}
              <p className="tpl-atl__side-subtitle" style={{marginTop:'8px'}}>Personal</p>
              {skills.slice(half).map((s, i) => <p key={i} className="tpl-atl__info">{s}</p>)}
            </AtlSideSection>
          )}
        </aside>
      </div>
    </div>
  );
}
function AtlSection({ label, children }) {
  return <div className="tpl-atl__section"><h3 className="tpl-atl__section-title">{label}</h3><hr className="tpl-atl__rule" />{children}</div>;
}
function AtlSideSection({ label, children }) {
  return <div className="tpl-atl__side-section"><h4 className="tpl-atl__side-title">{label}</h4><hr className="tpl-atl__side-rule" />{children}</div>;
}

/* ══════════════════════════════════════════════════════════
   7. EXEC PRO — Laya Abdelrahman style
   Spaced-caps name · bold rule · left contact/edu/skills · right exp
══════════════════════════════════════════════════════════ */
export function ExecProTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  return (
    <div className="tpl tpl-exp">
      <div className="tpl-exp__header">
        <h1 className="tpl-exp__name">{data.fullName || 'YOUR NAME'}</h1>
        {data.title && <p className="tpl-exp__title">{data.title}</p>}
        <hr className="tpl-exp__rule" />
      </div>
      {data.summary && <p className="tpl-exp__summary">{data.summary}</p>}
      <div className="tpl-exp__body">
        <aside className="tpl-exp__left">
          {(data.phone || data.email || data.location) && (
            <ExpSection label="CONTACT">
              {data.phone    && <p className="tpl-exp__info">📞 {data.phone}</p>}
              {data.email    && <p className="tpl-exp__info">✉ {data.email}</p>}
              {data.linkedin && <p className="tpl-exp__info">🔗 {data.linkedin}</p>}
              {data.github   && <p className="tpl-exp__info">💻 {data.github}</p>}
              {data.location && <p className="tpl-exp__info">📍 {data.location}</p>}
            </ExpSection>
          )}
          {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
            <ExpSection label="EDUCATION">
              <EduLines data={data.education} cls="tpl-exp__body-text" />
            </ExpSection>
          )}
          {skills.length > 0 && (
            <ExpSection label="SKILLS">
              {skills.map((s, i) => <p key={i} className="tpl-exp__skill">• {s}</p>)}
            </ExpSection>
          )}
        </aside>
        <main className="tpl-exp__right">
          {data.experience?.length > 0 && (
            <ExpRightSection label="WORK EXPERIENCE">
              {data.experience.map((e, i) => (
                <div key={i} className="tpl-exp__exp">
                  <div className="tpl-exp__exp-dot" />
                  <div className="tpl-exp__exp-content">
                    <p className="tpl-exp__exp-role">{e.role}</p>
                    <p className="tpl-exp__exp-company">{e.company}</p>
                    <p className="tpl-exp__exp-dur">{e.duration}</p>
                    <BulletList text={e.bullets} cls="tpl-exp__bul" />
                  </div>
                </div>
              ))}
            </ExpRightSection>
          )}
          <ExtraSections data={data} />
        </main>
      </div>
    </div>
  );
}
function ExpSection({ label, children }) {
  return <div className="tpl-exp__section"><h4 className="tpl-exp__section-title">{label}</h4>{children}</div>;
}
function ExpRightSection({ label, children }) {
  return <div className="tpl-exp__rsection"><h3 className="tpl-exp__rsection-title">{label}</h3>{children}</div>;
}

/* ══════════════════════════════════════════════════════════
   8. PRESTIGE — Emaa Warner style
   Grey header, centered name (dark + gold), spaced subtitle
══════════════════════════════════════════════════════════ */
export function PrestigeTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const nameParts = (data.fullName || 'YOUR NAME').split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName  = nameParts[nameParts.length - 1];
  return (
    <div className="tpl tpl-prs">
      <div className="tpl-prs__header">
        <h1 className="tpl-prs__name">
          <span className="tpl-prs__name-dark">{firstName} </span>
          <span className="tpl-prs__name-gold">{lastName}</span>
        </h1>
        {data.title && <p className="tpl-prs__title">{data.title}</p>}
        <div className="tpl-prs__gold-line" />
      </div>
      <div className="tpl-prs__body">
        <main className="tpl-prs__left">
          {data.summary && <PrsSection label="CAREER SUMMARY"><p className="tpl-prs__text">{data.summary}</p></PrsSection>}
          {data.experience?.length > 0 && (
            <PrsSection label="EXPERIENCE">
              {data.experience.map((e, i) => (
                <div key={i} className="tpl-prs__exp">
                  <p className="tpl-prs__exp-role">{e.role}{e.company ? `, ${e.company}` : ''}</p>
                  <p className="tpl-prs__exp-dur">{e.duration}</p>
                  <BulletList text={e.bullets} cls="tpl-prs__bul" />
                </div>
              ))}
            </PrsSection>
          )}
          <ExtraSections data={data} />
        </main>
        <aside className="tpl-prs__right">
          {(data.phone || data.email || data.location) && (
            <PrsSideSection label="CONTACT">
              {data.phone    && <p className="tpl-prs__info">📞 {data.phone}</p>}
              {data.email    && <p className="tpl-prs__info">✉ {data.email}</p>}
              {data.location && <p className="tpl-prs__info">📍 {data.location}</p>}
              {data.linkedin && <p className="tpl-prs__info">🔗 {data.linkedin}</p>}
              {data.github   && <p className="tpl-prs__info">💻 {data.github}</p>}
            </PrsSideSection>
          )}
          {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && <PrsSideSection label="EDUCATION"><EduLines data={data.education} cls="tpl-prs__text" /></PrsSideSection>}
          {skills.length > 0 && (
            <PrsSideSection label="SKILLS">
              {skills.map((s, i) => <p key={i} className="tpl-prs__info">• {s}</p>)}
            </PrsSideSection>
          )}
        </aside>
      </div>
    </div>
  );
}
function PrsSection({ label, children }) {
  return <div className="tpl-prs__section"><h3 className="tpl-prs__section-title">{label}</h3>{children}</div>;
}
function PrsSideSection({ label, children }) {
  return <div className="tpl-prs__side-section"><h4 className="tpl-prs__side-title">{label}</h4>{children}</div>;
}

/* ══════════════════════════════════════════════════════════
   9. FRESHER — Charlotte Newman style
   Huge bold name · summary · 3-cell contact bar · date|content table
══════════════════════════════════════════════════════════ */
export function FresherTemplate({ data }) {
  const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const col1 = skills.filter((_, i) => i % 3 === 0);
  const col2 = skills.filter((_, i) => i % 3 === 1);
  const col3 = skills.filter((_, i) => i % 3 === 2);
  return (
    <div className="tpl tpl-fsh">
      <div className="tpl-fsh__header">
        <h1 className="tpl-fsh__name">{(data.fullName || 'YOUR NAME').toUpperCase()}</h1>
        {data.title && <p className="tpl-fsh__title">{data.title}</p>}
      </div>
      <hr className="tpl-fsh__rule" />

      {data.summary && (
        <FshSection label="PROFESSIONAL SUMMARY">
          <p className="tpl-fsh__body">{data.summary}</p>
        </FshSection>
      )}

      {(data.phone || data.email || data.location) && (
        <div className="tpl-fsh__contact-bar">
          {data.phone    && <span className="tpl-fsh__contact-cell">{data.phone}</span>}
          {data.email    && <span className="tpl-fsh__contact-cell">{data.email}</span>}
          {data.location && <span className="tpl-fsh__contact-cell">{data.location}</span>}
          {data.github   && <span className="tpl-fsh__contact-cell">{data.github}</span>}
        </div>
      )}

      {data.experience?.length > 0 && (
        <FshSection label="WORK EXPERIENCE">
          {data.experience.map((e, i) => (
            <div key={i} className="tpl-fsh__row">
              <div className="tpl-fsh__left">
                <p className="tpl-fsh__dur">{e.duration}</p>
                <p className="tpl-fsh__co">{e.company}</p>
              </div>
              <div className="tpl-fsh__right">
                <p className="tpl-fsh__role">{e.role}</p>
                <BulletList text={e.bullets} cls="tpl-fsh__bul" />
              </div>
            </div>
          ))}
        </FshSection>
      )}

      {data.education && (Array.isArray(data.education) ? data.education.length > 0 : true) && (
        <FshSection label="EDUCATION">
          <EduLines data={data.education} cls="tpl-fsh__body" />
        </FshSection>
      )}

      {skills.length > 0 && (
        <FshSection label="SKILLS">
          <div className="tpl-fsh__skills-grid">
            <ul className="tpl-fsh__skills-col">{col1.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <ul className="tpl-fsh__skills-col">{col2.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <ul className="tpl-fsh__skills-col">{col3.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </FshSection>
      )}
      <ExtraSections data={data} />
    </div>
  );
}
function FshSection({ label, children }) {
  return (
    <div className="tpl-fsh__section">
      <h3 className="tpl-fsh__section-title">{label}</h3>
      <hr className="tpl-fsh__section-rule" />
      {children}
    </div>
  );
}
