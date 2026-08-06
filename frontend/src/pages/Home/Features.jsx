import React, { useState } from 'react';

/* ─── Features Data ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: '📄',
    title: 'Resume Analyzer',
    desc: 'AI scores your resume across 12 dimensions — format, keywords, impact, ATS-friendliness — and gives line-by-line fixes.',
    tag: 'AI Powered',
    color: '#7c3aed',
    href: '/resume',
    highlights: ['ATS score', 'Section-by-section fix', 'Industry benchmarking'],
  },
  {
    icon: '🎯',
    title: 'ATS Checker',
    desc: 'Paste any job description and see exactly which keywords your resume is missing. Beat the bots before humans even see you.',
    tag: 'Smart Match',
    color: '#06b6d4',
    href: '/ats',
    highlights: ['Keyword gap analysis', 'JD vs Resume matrix', 'One-click suggestions'],
  },
  {
    icon: '🎤',
    title: 'Mock Interview',
    desc: 'Practice with AI-generated questions tailored to your role and experience. Get instant feedback on answers, tone, and structure.',
    tag: 'Live AI',
    color: '#ec4899',
    href: '/interview',
    highlights: ['Role-specific Qs', 'Answer scoring', 'Follow-up questions'],
  },
  {
    icon: '💻',
    title: 'Coding Practice',
    desc: 'Curated DSA problems mapped to real FAANG & startup interview patterns. Solve, submit, and track your progress over time.',
    tag: 'DSA + CP',
    color: '#22c55e',
    href: '/coding',
    highlights: ['500+ problems', 'Company filters', 'Solution walkthroughs'],
  },
  {
    icon: '💼',
    title: 'Job Recommendations',
    desc: 'AI matches you to the most relevant openings based on your skills, experience, location, and salary expectations — not just keywords.',
    tag: 'Smart Fit',
    color: '#f59e0b',
    href: '/jobs',
    highlights: ['Match % score', 'Salary insights', 'One-click apply'],
  },
  {
    icon: '🗺️',
    title: 'Career Roadmap',
    desc: 'Get a personalised step-by-step roadmap to your dream role — skills to learn, certs to earn, projects to build.',
    tag: 'Personalised',
    color: '#06b6d4',
    href: '/roadmap',
    highlights: ['Role-based paths', 'Milestone tracking', 'Time estimates'],
  },
  {
    icon: '📊',
    title: 'Placement Analytics',
    desc: 'Deep insights into placement trends, salary bands by role & city, and which skills are currently highest in demand.',
    tag: 'Real Data',
    color: '#8b5cf6',
    href: '/analytics',
    highlights: ['Live salary data', 'Skill demand charts', 'City-wise heatmap'],
  },
  {
    icon: '🤖',
    title: 'AI Career Digital Twin',
    desc: 'A living simulation of your career. See how different choices — a new skill, a course, a pivot — change your future trajectory.',
    tag: 'Futuristic',
    color: '#7c3aed',
    href: '/twin',
    highlights: ['Scenario simulation', 'Skill radar', 'Salary forecasting'],
  },
  {
    icon: '🏢',
    title: 'Recruiter Arena',
    desc: 'For hiring teams: post roles, screen AI-ranked candidates, and shortlist with smart filters. Hire 3× faster.',
    tag: 'For Recruiters',
    color: '#ef4444',
    href: '/recruiter',
    highlights: ['AI screening', 'Batch shortlisting', 'Analytics dashboard'],
  },
  {
    icon: '📡',
    title: 'Trend Radar',
    desc: 'Stay ahead. Track rising skills, hot companies, and industry shifts in real time — before everyone else catches on.',
    tag: 'Real-time',
    color: '#22d3ee',
    href: '/trends',
    highlights: ['Skill trends', 'Hot companies', 'Salary movement'],
  },
];

const CATEGORIES = ['All', 'Job Seeker', 'Skill Building', 'Recruiter'];
const CAT_MAP = {
  'All':          FEATURES,
  'Job Seeker':   FEATURES.filter((_, i) => [0,1,2,4].includes(i)),
  'Skill Building': FEATURES.filter((_, i) => [3,5,6,7,9].includes(i)),
  'Recruiter':    FEATURES.filter((_, i) => [8].includes(i)),
};

/* ─── Feature Card ──────────────────────────────────────── */
function FeatureCard({ f, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...s.card,
        borderColor: hovered ? `${f.color}60` : 'var(--border)',
        background:  hovered ? `radial-gradient(ellipse at top left,${f.color}08,var(--bg-surface) 60%)` : 'var(--bg-surface)',
        transform:   hovered ? 'translateY(-4px)' : 'translateY(0)',
        animationDelay: `${index * 0.07}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + Tag */}
      <div style={s.cardTop}>
        <span style={{ ...s.iconWrap, background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
          {f.icon}
        </span>
        <span style={{ ...s.tag, color: f.color, background: `${f.color}15`, borderColor: `${f.color}40` }}>
          {f.tag}
        </span>
      </div>

      {/* Title + Desc */}
      <h3 style={s.cardTitle}>{f.title}</h3>
      <p style={s.cardDesc}>{f.desc}</p>

      {/* Highlights */}
      <ul style={s.highlights}>
        {f.highlights.map(h => (
          <li key={h} style={s.highlight}>
            <span style={{ ...s.dot, background: f.color }} />
            {h}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a href={f.href} style={{ ...s.cardCta, color: f.color }}>
        Explore {f.title} →
      </a>

      {/* Bottom accent bar */}
      <div style={{ ...s.accentBar, background: `linear-gradient(90deg,${f.color},transparent)`, opacity: hovered ? 1 : 0 }} />
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────── */
export default function Features() {
  const [activecat, setActivecat] = useState('All');
  const list = CAT_MAP[activecat] || FEATURES;

  return (
    <section id="features" style={s.section}>
      <div style={s.container}>

        {/* ── Header ── */}
        <div style={s.header}>
          <span style={s.label}>Features</span>
          <h2 style={s.title}>
            Everything you need to{' '}
            <span style={s.grad}>land your dream role</span>
          </h2>
          <p style={s.subtitle}>
            10 AI-powered tools working together as one seamless career platform — from your first resume to your dream offer.
          </p>
        </div>

        {/* ── Category Filter ── */}
        <div style={s.filterRow}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActivecat(cat)}
              style={{
                ...s.filterBtn,
                ...(activecat === cat ? s.filterActive : {}),
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Feature Grid ── */}
        <div style={s.grid}>
          {list.map((f, i) => <FeatureCard key={f.title} f={f} index={i} />)}
        </div>

        {/* ── Bottom Banner ── */}
        <div style={s.banner}>
          <div style={s.bannerLeft}>
            <h3 style={s.bannerTitle}>All tools. One subscription.</h3>
            <p style={s.bannerSub}>No feature gates. No paywalled insights. Everything unlocked from day one.</p>
          </div>
          <div style={s.bannerActions}>
            <a href="/register" style={s.btnPrimary}>Start Free →</a>
            <a href="#pricing" style={s.btnOutline}>See Pricing</a>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─── Styles ────────────────────────────────────────────── */
const s = {
  section:   { padding: '100px 0', background: 'var(--bg-base)', fontFamily: 'Inter,sans-serif' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },

  header: { textAlign: 'center', marginBottom: 40 },
  label: {
    display: 'inline-block', padding: '6px 18px', borderRadius: 999,
    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)',
    color: 'var(--primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 20,
  },
  title: {
    fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--text-primary)',
    letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16,
  },
  grad: {
    background: 'var(--gradient-text)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: { color: 'var(--text-secondary)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 },

  filterRow: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48, flexWrap: 'wrap' },
  filterBtn: {
    padding: '8px 22px', borderRadius: 999, border: '1px solid var(--border)',
    background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  filterActive: {
    background: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.3)',
    color: 'var(--primary)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
    marginBottom: 56,
  },

  card: {
    position: 'relative', overflow: 'hidden',
    border: '1px solid var(--border)', borderRadius: 18, padding: 26,
    display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'all 0.25s ease', cursor: 'default',
    animation: 'fadeInUp 0.5s ease both',
  },
  cardTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  tag: {
    fontSize: 11, fontWeight: 700, padding: '4px 12px',
    borderRadius: 999, border: '1px solid', letterSpacing: '0.04em',
  },
  cardTitle: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  cardDesc:  { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 },

  highlights: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  highlight:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  dot:        { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },

  cardCta: {
    fontSize: 13, fontWeight: 700, textDecoration: 'none',
    marginTop: 4, transition: 'opacity 0.2s ease',
    display: 'inline-block',
  },

  accentBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
    transition: 'opacity 0.3s ease',
  },

  banner: {
    background: 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(14,165,233,0.06))',
    border: '1px solid var(--border-strong)', borderRadius: 20,
    padding: '36px 40px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
  },
  bannerLeft:    {},
  bannerTitle:   { fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 },
  bannerSub:     { color: 'var(--text-secondary)', fontSize: 14, margin: 0 },
  bannerActions: { display: 'flex', gap: 12, flexShrink: 0 },

  btnPrimary: {
    padding: '12px 28px', borderRadius: 10,
    background: 'linear-gradient(135deg,#2563eb,#0ea5e9)',
    color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center',
  },
  btnOutline: {
    padding: '12px 28px', borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center',
  },
};
