/**
 * sectionSchema.js
 * ─────────────────
 * Single source of truth for every repeatable resume section.
 * Each entry is consumed by <RepeatingSection> in SectionSystem.jsx.
 *
 * field.span  →  'half'  = 2-column grid  |  'full'  = full width
 * field.type  →  'text' | 'textarea' | 'url'
 */

export const SECTION_SCHEMA = [
  // ── Work Experience ─────────────────────────────────────────────
  {
    id: 'experience',
    label: 'Work Experience',
    icon: '🏢',
    defaultFor: ['experienced'],
    defaultEntry: { company: '', role: '', duration: '', bullets: '' },
    fields: [
      { key: 'company',  label: 'Company / Organisation',         type: 'text',     span: 'half' },
      { key: 'role',     label: 'Role / Designation',             type: 'text',     span: 'half' },
      { key: 'duration', label: 'Duration',                       type: 'text',     span: 'full', placeholder: 'e.g. Jun 2023 – Aug 2023' },
      { key: 'bullets',  label: 'Key Contributions (one per line)', type: 'textarea', span: 'full' },
    ],
    cardTitle: e => e.role    || 'New Experience Entry',
    cardSub:   e => [e.company, e.duration].filter(Boolean).join(' · '),
  },

  // ── Education ───────────────────────────────────────────────────
  {
    id: 'education',
    label: 'Education',
    icon: '🎓',
    defaultFor: ['fresher', 'experienced'],
    defaultEntry: { degree: '', institution: '', year: '', gpa: '' },
    fields: [
      { key: 'degree',      label: 'Degree / Programme', type: 'text', span: 'half' },
      { key: 'institution', label: 'Institution',         type: 'text', span: 'half' },
      { key: 'year',        label: 'Year of Passing',     type: 'text', span: 'half' },
      { key: 'gpa',         label: 'GPA / Percentage',   type: 'text', span: 'half', optional: true },
    ],
    cardTitle: e => e.degree      || 'New Education Entry',
    cardSub:   e => [e.institution, e.year].filter(Boolean).join(' · '),
  },

  // ── Projects ────────────────────────────────────────────────────
  {
    id: 'projects',
    label: 'Projects',
    icon: '🚀',
    defaultFor: ['fresher', 'experienced'],
    defaultEntry: { name: '', tech: '', description: '', link: '' },
    fields: [
      { key: 'name',        label: 'Project Name',           type: 'text',     span: 'half' },
      { key: 'tech',        label: 'Tech Stack',             type: 'text',     span: 'half' },
      { key: 'description', label: 'Description / Impact',   type: 'textarea', span: 'full' },
      { key: 'link',        label: 'Live / GitHub Link',     type: 'url',      span: 'full', optional: true, placeholder: 'https://...' },
    ],
    cardTitle: e => e.name   || 'New Project',
    cardSub:   e => e.tech   || '',
  },

  // ── Internships ─────────────────────────────────────────────────
  {
    id: 'internships',
    label: 'Internships',
    icon: '💼',
    defaultFor: ['fresher'],
    defaultEntry: { company: '', role: '', duration: '', bullets: '' },
    fields: [
      { key: 'company',  label: 'Company / Organisation',         type: 'text',     span: 'half' },
      { key: 'role',     label: 'Role / Designation',             type: 'text',     span: 'half' },
      { key: 'duration', label: 'Duration',                       type: 'text',     span: 'full', placeholder: 'e.g. Jun 2023 – Aug 2023' },
      { key: 'bullets',  label: 'Key Contributions (one per line)', type: 'textarea', span: 'full' },
    ],
    cardTitle: e => e.role    || 'New Internship',
    cardSub:   e => [e.company, e.duration].filter(Boolean).join(' · '),
  },

  // ── Certifications ──────────────────────────────────────────────
  {
    id: 'certifications',
    label: 'Certifications',
    icon: '📜',
    defaultFor: ['fresher', 'experienced'],
    defaultEntry: { name: '', issuer: '', year: '' },
    fields: [
      { key: 'name',   label: 'Certification Name',        type: 'text', span: 'half' },
      { key: 'issuer', label: 'Issuing Organisation',      type: 'text', span: 'half' },
      { key: 'year',   label: 'Year',                      type: 'text', span: 'full' },
    ],
    cardTitle: e => e.name   || 'New Certification',
    cardSub:   e => [e.issuer, e.year].filter(Boolean).join(' · '),
  },

  // ── Achievements ────────────────────────────────────────────────
  {
    id: 'achievements',
    label: 'Achievements',
    icon: '🏆',
    defaultFor: ['fresher', 'experienced'],
    defaultEntry: { text: '' },
    fields: [
      { key: 'text', label: 'Achievement', type: 'textarea', span: 'full', placeholder: 'e.g. Winner – HackIndia 2023 (React track)' },
    ],
    cardTitle: e => e.text || 'New Achievement',
    cardSub:   () => '',
  },

  // ── Volunteer Experience ─────────────────────────────────────────
  {
    id: 'volunteer',
    label: 'Volunteer Experience',
    icon: '🤝',
    defaultFor: [],
    defaultEntry: { org: '', role: '', duration: '', description: '' },
    fields: [
      { key: 'org',         label: 'Organisation',  type: 'text',     span: 'half' },
      { key: 'role',        label: 'Role',          type: 'text',     span: 'half' },
      { key: 'duration',    label: 'Duration',      type: 'text',     span: 'full' },
      { key: 'description', label: 'Description',   type: 'textarea', span: 'full', optional: true },
    ],
    cardTitle: e => e.role   || 'New Volunteer Entry',
    cardSub:   e => [e.org, e.duration].filter(Boolean).join(' · '),
  },

  // ── Training & Courses ──────────────────────────────────────────
  {
    id: 'training',
    label: 'Training & Courses',
    icon: '📚',
    defaultFor: [],
    defaultEntry: { name: '', provider: '', year: '', description: '' },
    fields: [
      { key: 'name',        label: 'Course / Training Name', type: 'text',     span: 'half' },
      { key: 'provider',    label: 'Provider / Platform',    type: 'text',     span: 'half' },
      { key: 'year',        label: 'Year',                   type: 'text',     span: 'full' },
      { key: 'description', label: 'Description',            type: 'textarea', span: 'full', optional: true },
    ],
    cardTitle: e => e.name     || 'New Training Entry',
    cardSub:   e => [e.provider, e.year].filter(Boolean).join(' · '),
  },

  // ── Positions of Responsibility ─────────────────────────────────
  {
    id: 'positions',
    label: 'Positions of Responsibility',
    icon: '🎖️',
    defaultFor: ['fresher'],
    defaultEntry: { title: '', org: '', duration: '', description: '' },
    fields: [
      { key: 'title',       label: 'Position / Title',     type: 'text',     span: 'half' },
      { key: 'org',         label: 'Organisation / Club',  type: 'text',     span: 'half' },
      { key: 'duration',    label: 'Duration',             type: 'text',     span: 'full' },
      { key: 'description', label: 'Description',          type: 'textarea', span: 'full', optional: true },
    ],
    cardTitle: e => e.title || 'New Position',
    cardSub:   e => [e.org, e.duration].filter(Boolean).join(' · '),
  },

  // ── Extracurricular Activities ──────────────────────────────────
  {
    id: 'extracurricular',
    label: 'Extracurricular Activities',
    icon: '🌟',
    defaultFor: ['fresher'],
    defaultEntry: { activity: '', role: '', duration: '' },
    fields: [
      { key: 'activity', label: 'Activity / Club',  type: 'text', span: 'half' },
      { key: 'role',     label: 'Role / Position',  type: 'text', span: 'half' },
      { key: 'duration', label: 'Duration',         type: 'text', span: 'full', optional: true },
    ],
    cardTitle: e => e.activity || 'New Activity',
    cardSub:   e => [e.role, e.duration].filter(Boolean).join(' · '),
  },

  // ── Languages ───────────────────────────────────────────────────
  {
    id: 'languages',
    label: 'Languages',
    icon: '🌐',
    defaultFor: [],
    defaultEntry: { language: '', proficiency: '' },
    fields: [
      { key: 'language',    label: 'Language',    type: 'text', span: 'half' },
      { key: 'proficiency', label: 'Proficiency', type: 'text', span: 'half', placeholder: 'e.g. Fluent, Native, Conversational' },
    ],
    cardTitle: e => e.language    || 'New Language',
    cardSub:   e => e.proficiency || '',
  },

  // ── Publications & Patents ──────────────────────────────────────
  {
    id: 'publications',
    label: 'Publications & Patents',
    icon: '📄',
    defaultFor: ['experienced'],
    defaultEntry: { title: '', publisher: '', year: '', description: '' },
    fields: [
      { key: 'title',       label: 'Title',               type: 'text',     span: 'half' },
      { key: 'publisher',   label: 'Publisher / Venue',   type: 'text',     span: 'half' },
      { key: 'year',        label: 'Year',                type: 'text',     span: 'full' },
      { key: 'description', label: 'Description / DOI',   type: 'textarea', span: 'full', optional: true },
    ],
    cardTitle: e => e.title  || 'New Publication',
    cardSub:   e => [e.publisher, e.year].filter(Boolean).join(' · '),
  },

  // ── Custom Section ──────────────────────────────────────────────
  {
    id: 'custom',
    label: 'Custom Section',
    icon: '✏️',
    defaultFor: [],
    defaultEntry: { sectionName: 'Custom Section', heading: '', description: '' },
    fields: [
      { key: 'sectionName', label: 'Section Name',  type: 'text',     span: 'full', placeholder: 'e.g. Hobbies, Awards, References' },
      { key: 'heading',     label: 'Item Heading',  type: 'text',     span: 'half' },
      { key: 'description', label: 'Description',   type: 'textarea', span: 'full', optional: true },
    ],
    cardTitle: e => e.heading     || e.sectionName || 'Custom Entry',
    cardSub:   e => e.sectionName || '',
  },
];

/** Quick lookup by section id */
export const SECTION_MAP = Object.fromEntries(SECTION_SCHEMA.map(s => [s.id, s]));

/** Build the initial formData slice for all repeating sections */
export function buildInitialRepeating() {
  return Object.fromEntries(SECTION_SCHEMA.map(s => [s.id, []]));
}
