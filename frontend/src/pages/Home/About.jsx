import React, { useEffect, useRef, useState } from 'react';

/* ─── Data ──────────────────────────────────────────────── */
const STATS = [
  { value: '2.4M+',  label: 'Resumes Analyzed',    icon: '📄' },
  { value: '840K+',  label: 'Mock Interviews Done', icon: '🎤' },
  { value: '96%',    label: 'Placement Rate',        icon: '🏆' },
  { value: '180+',   label: 'Partner Companies',     icon: '🤝' },
];

const VALUES = [
  {
    icon: '🤖',
    title: 'AI-First Approach',
    desc: 'Every feature is built around cutting-edge AI models — not retrofitted. Your career data drives personalised, real-time guidance.',
  },
  {
    icon: '🎯',
    title: 'Outcome Focused',
    desc: 'We measure our success by yours. Every tool is designed to move you closer to an offer, a promotion, or a career change.',
  },
  {
    icon: '🔒',
    title: 'Privacy by Design',
    desc: 'Your data is yours. We never sell it, share it with recruiters without consent, or use it to train models without your opt-in.',
  },
  {
    icon: '🌍',
    title: 'Built for India & Beyond',
    desc: 'Designed for the Indian job market first — FAANG, startups, PSUs — with global reach for the diaspora and international roles.',
  },
];

const TEAM = [
  { name: 'Priya Sharma',   role: 'Co-Founder & CEO',      initials: 'PS', bg: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  { name: 'Arjun Mehta',    role: 'Co-Founder & CTO',      initials: 'AM', bg: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
  { name: 'Sneha Kapoor',   role: 'Head of AI Research',   initials: 'SK', bg: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { name: 'Rohan Verma',    role: 'Head of Product',       initials: 'RV', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { name: 'Divya Nair',     role: 'Lead Career Coach',     initials: 'DN', bg: 'linear-gradient(135deg,#22c55e,#4ade80)' },
  { name: 'Karan Singh',    role: 'Head of Partnerships',  initials: 'KS', bg: 'linear-gradient(135deg,#ef4444,#f87171)' },
];

/* ─── Animated Counter ──────────────────────────────────── */
function useInView(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

/* ─── Component ─────────────────────────────────────────── */
export default function About() {
  const sectionRef = useRef(null);
  const visible    = useInView(sectionRef);

  return (
    <section id="about" ref={sectionRef} style={s.section}>
      <div style={s.container}>

        {/* ── Section Label ── */}
        <div style={s.labelRow}>
          <span style={s.label}>About Us</span>
        </div>

        {/* ── Mission ── */}
        <div style={{ ...s.missionWrap, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease' }}>
          <h2 style={s.missionTitle}>
            We're on a mission to make{' '}
            <span style={s.gradientText}>every career move</span>{' '}
            smarter
          </h2>
          <p style={s.missionDesc}>
            CareerCopilot was born from a simple frustration: the job market is brutally
            competitive, but the tools available to job seekers haven't kept up. We built
            an AI platform that doesn't just automate tasks — it acts as your personal
            career strategist, coach, and analyst all in one.
          </p>
          <p style={s.missionDesc}>
            Founded in 2024 in Bangalore, we've helped over <strong style={{ color: 'var(--primary)' }}>2.4 million professionals</strong> land
            better roles, negotiate higher salaries, and build careers they're proud of.
          </p>
        </div>

        {/* ── Stats ── */}
        <div style={s.statsGrid}>
          {STATS.map((st, i) => (
            <div key={st.label} style={{
              ...s.statCard,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(20px)',
              transition: `all 0.6s ease ${0.1 + i * 0.1}s`,
            }}>
              <span style={s.statIcon}>{st.icon}</span>
              <span style={s.statValue}>{st.value}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={s.divider} />

        {/* ── Values ── */}
        <div style={s.labelRow}>
          <span style={s.label}>Our Values</span>
        </div>
        <h3 style={s.sectionH3}>What drives every decision we make</h3>

        <div style={s.valuesGrid}>
          {VALUES.map((v, i) => (
            <div key={v.title} style={{
              ...s.valueCard,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(20px)',
              transition: `all 0.6s ease ${0.2 + i * 0.1}s`,
            }}>
              <span style={s.valueIcon}>{v.icon}</span>
              <h4 style={s.valueTitle}>{v.title}</h4>
              <p style={s.valueDesc}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={s.divider} />

        {/* ── Team ── */}
        <div style={s.labelRow}>
          <span style={s.label}>The Team</span>
        </div>
        <h3 style={s.sectionH3}>Built by people who've been in your shoes</h3>
        <p style={{ ...s.missionDesc, maxWidth: 560, margin: '0 auto 40px', textAlign: 'center' }}>
          Our team combines ex-Google, ex-Microsoft, and ex-McKinsey backgrounds with a
          deep passion for democratising career growth.
        </p>

        <div style={s.teamGrid}>
          {TEAM.map((m, i) => (
            <div key={m.name} style={{
              ...s.teamCard,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'scale(0.95)',
              transition: `all 0.5s ease ${0.1 + i * 0.08}s`,
            }}>
              <div style={{ ...s.teamAvatar, background: m.bg }}>{m.initials}</div>
              <h4 style={s.teamName}>{m.name}</h4>
              <p style={s.teamRole}>{m.role}</p>
              <div style={s.teamLinks}>
                <a href="/" style={s.teamLink} title="LinkedIn">in</a>
                <a href="/" style={s.teamLink} title="Twitter">𝕏</a>
              </div>
            </div>
          ))}
        </div>

        {/* ── Backed By ── */}
        <div style={s.backedCard}>
          <p style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
            Backed & trusted by
          </p>
          <div style={s.backedLogos}>
            {['Y Combinator', 'Sequoia India', 'Blume Ventures', 'Kalaari Capital', 'Google for Startups'].map(b => (
              <div key={b} style={s.backedItem}>{b}</div>
            ))}
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

  labelRow:  { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  label: {
    display: 'inline-block', padding: '6px 18px', borderRadius: 999,
    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)',
    color: 'var(--primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  },

  missionWrap: { textAlign: 'center', maxWidth: 800, margin: '0 auto 60px' },
  missionTitle: {
    fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--text-primary)',
    lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 24,
  },
  gradientText: {
    background: 'var(--gradient-text)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  missionDesc: { color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.75, marginBottom: 16 },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 64,
  },
  statCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 16, padding: '28px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
  },
  statIcon:  { fontSize: 28 },
  statValue: { fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 },
  statLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  divider: { height: 1, background: 'var(--border)', margin: '64px 0' },

  sectionH3: {
    fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)',
    textAlign: 'center', letterSpacing: '-0.025em', marginBottom: 12,
  },

  valuesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginTop: 40,
  },
  valueCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 28, transition: 'border-color 0.2s ease',
  },
  valueIcon:  { fontSize: 32, display: 'block', marginBottom: 16 },
  valueTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 },
  valueDesc:  { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 },

  teamGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48,
  },
  teamCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px 20px', textAlign: 'center',
  },
  teamAvatar: {
    width: 64, height: 64, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 20,
    fontWeight: 800, color: '#fff', margin: '0 auto 16px',
  },
  teamName:  { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  teamRole:  { fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 },
  teamLinks: { display: 'flex', justifyContent: 'center', gap: 10 },
  teamLink: {
    width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textDecoration: 'none',
    transition: 'all 0.2s ease',
  },

  backedCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '36px 40px', textAlign: 'center',
  },
  backedLogos: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  backedItem: {
    padding: '8px 22px', background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)', borderRadius: 999,
    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
  },
};
