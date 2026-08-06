import React, { useState, useRef } from 'react';

/* ─── Data ──────────────────────────────────────────────── */
const CONTACT_INFO = [
  { icon: '📧', label: 'Email Us', value: 'h780538@gmail.com', sub: 'We reply within 4 hours' },
  { icon: '📞', label: 'Call Us', value: '+91 8102566812', sub: 'Mon–Fri, 9 AM–7 PM IST' },
  { icon: '📍', label: 'Headquarters', value: 'Banur,Punjab', sub: 'Punjab, India - 140601' },
  { icon: '💬', label: 'Live Chat', value: 'Available in-app', sub: 'Avg. response: 2 minutes' },
];

const SOCIALS = [
  { label: 'LinkedIn', icon: 'in', href: '#', color: '#0077b5' },
  { label: 'Twitter', icon: '𝕏', href: '#', color: '#1da1f2' },
  { label: 'YouTube', icon: '▶', href: '#', color: '#ef4444' },
  { label: 'Discord', icon: '◈', href: '#', color: '#5865f2' },
  { label: 'GitHub', icon: '⌥', href: '#', color: '#94a3b8' },
];

const SUBJECTS = [
  'General Enquiry',
  'Partnership / B2B',
  'Press & Media',
  'Careers at CareerCopilot',
  'Bug Report',
  'Feature Request',
];

/* ─── Component ─────────────────────────────────────────── */
export default function Contact() {
  const formRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [focused, setFocused] = useState('');

  /* Validation */
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email.';
    if (!form.subject) e.subject = 'Please choose a subject.';
    if (form.message.trim().length < 20) e.message = 'Message must be at least 20 characters.';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setStatus('loading');
    /* Simulate API call */
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1400);
  };

  const fieldStyle = (field) => ({
    ...s.input,
    borderColor: errors[field] ? '#ef4444' : focused === field ? 'var(--primary)' : 'var(--border)',
    boxShadow: focused === field ? '0 0 0 3px var(--primary-glow)' : 'none',
  });

  return (
    <section id="contact" style={s.section}>
      <div style={s.container}>

        {/* ── Header ── */}
        <div style={s.header}>
          <span style={s.label}>Contact</span>
          <h2 style={s.title}>Get in <span style={s.grad}>touch</span></h2>
          <p style={s.subtitle}>
            Have a question, partnership idea, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div style={s.mainGrid}>

          {/* ── Left — Info ── */}
          <div style={s.infoCol}>
            <div style={s.infoCards}>
              {CONTACT_INFO.map(c => (
                <div key={c.label} style={s.infoCard}>
                  <span style={s.infoIcon}>{c.icon}</span>
                  <div>
                    <div style={s.infoLabel}>{c.label}</div>
                    <div style={s.infoValue}>{c.value}</div>
                    <div style={s.infoSub}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div style={s.socialBox}>
              <p style={s.socialTitle}>Follow us</p>
              <div style={s.socialRow}>
                {SOCIALS.map(sc => (
                  <a key={sc.label} href={sc.href} title={sc.label}
                    style={s.socialBtn}
                    onMouseEnter={e => { e.currentTarget.style.background = sc.color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = sc.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)'; }}>
                    {sc.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Office hours */}
            <div style={s.hoursBox}>
              <p style={s.hoursTitle}>🕐 Support Hours</p>
              <div style={s.hoursGrid}>
                {[['Mon – Fri', '9:00 AM – 7:00 PM IST'], ['Saturday', '10:00 AM – 4:00 PM IST'], ['Sunday', 'Closed']].map(([d, h]) => (
                  <React.Fragment key={d}>
                    <span style={s.hoursDay}>{d}</span>
                    <span style={s.hoursTime}>{h}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right — Form ── */}
          <div style={s.formCard}>
            {status === 'success' ? (
              <div style={s.successBox}>
                <div style={s.successIcon}>✅</div>
                <h3 style={s.successTitle}>Message Sent!</h3>
                <p style={s.successText}>
                  Thanks for reaching out. Our team will get back to you within 4 hours.
                </p>
                <button style={s.btnPrimary} onClick={() => setStatus('idle')}>Send Another</button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <h3 style={s.formTitle}>Send us a message</h3>
                <p style={s.formSubtitle}>All fields are required.</p>

                {/* Row 1 */}
                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Arjun Sharma"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused('')}
                      style={fieldStyle('name')}
                    />
                    {errors.name && <span style={s.err}>{errors.name}</span>}
                  </div>
                  <div style={s.field}>
                    <label style={s.fieldLabel}>Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      style={fieldStyle('email')}
                    />
                    {errors.email && <span style={s.err}>{errors.email}</span>}
                  </div>
                </div>

                {/* Subject */}
                <div style={s.field}>
                  <label style={s.fieldLabel}>Subject</label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                    onFocus={() => setFocused('subject')}
                    onBlur={() => setFocused('')}
                    style={{ ...fieldStyle('subject'), color: form.subject ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <option value="" disabled style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>Select a subject…</option>
                    {SUBJECTS.map(sub => <option key={sub} value={sub} style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)' }}>{sub}</option>)}
                  </select>
                  {errors.subject && <span style={s.err}>{errors.subject}</span>}
                </div>

                {/* Message */}
                <div style={s.field}>
                  <label style={s.fieldLabel}>
                    Message
                    <span style={s.charCount}>{form.message.length} / 1000</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    placeholder="Tell us what's on your mind…"
                    maxLength={1000}
                    value={form.message}
                    onChange={e => handleChange('message', e.target.value)}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused('')}
                    style={{ ...fieldStyle('message'), resize: 'vertical', minHeight: 140 }}
                  />
                  {errors.message && <span style={s.err}>{errors.message}</span>}
                </div>

                {/* Footer */}
                <div style={s.formFooter}>
                  <p style={s.privacyNote}>
                    🔒 Your data is safe with us. We never spam or share your info.
                  </p>
                  <button
                    id="contact-submit"
                    type="submit"
                    disabled={status === 'loading'}
                    style={{ ...s.btnPrimary, ...(status === 'loading' ? { opacity: 0.7 } : {}) }}>
                    {status === 'loading' ? (
                      <><span style={s.spinner} />Sending…</>
                    ) : (
                      <>Send Message →</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── FAQ Strip ── */}
        <div style={s.faqStrip}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
            Looking for quick answers?{' '}
            <a href="#faq" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Browse our FAQ →
            </a>
          </p>
        </div>

      </div>
    </section>
  );
}

/* ─── Styles ────────────────────────────────────────────── */
const s = {
  section: { padding: '100px 0', background: 'var(--bg-base)', fontFamily: 'Inter,sans-serif' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },

  header: { textAlign: 'center', marginBottom: 56 },
  label: {
    display: 'inline-block', padding: '6px 18px', borderRadius: 999,
    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)',
    color: 'var(--primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 20,
  },
  title: { fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 16 },
  grad: { background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 },

  mainGrid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'start' },

  /* Info column */
  infoCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  infoCards: { display: 'flex', flexDirection: 'column', gap: 12 },
  infoCard: {
    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14,
  },
  infoIcon: { fontSize: 22, flexShrink: 0, lineHeight: 1, marginTop: 2 },
  infoLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  infoValue: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 },
  infoSub: { fontSize: 12, color: 'var(--text-muted)' },

  socialBox: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '18px 20px',
  },
  socialTitle: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 },
  socialRow: { display: 'flex', gap: 10 },
  socialBtn: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
    transition: 'all 0.2s ease', cursor: 'pointer',
  },

  hoursBox: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '18px 20px',
  },
  hoursTitle: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 14 },
  hoursGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 4px' },
  hoursDay: { fontSize: 12, color: 'var(--text-muted)' },
  hoursTime: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 },

  /* Form card */
  formCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 20, padding: 36,
  },
  formTitle: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' },
  formSubtitle: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 },

  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 18 },
  fieldLabel: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  charCount: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
  input: {
    background: 'var(--bg-base)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '11px 14px', fontSize: 14, fontFamily: 'Inter,sans-serif',
    outline: 'none', transition: 'all 0.2s ease', width: '100%',
    WebkitAppearance: 'none', appearance: 'none',
  },
  err: { fontSize: 11, color: '#ef4444', marginTop: 5, fontWeight: 500 },

  formFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  privacyNote: { fontSize: 12, color: 'var(--text-muted)', margin: 0 },

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#2563eb,#0ea5e9)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    transition: 'opacity 0.2s ease', whiteSpace: 'nowrap',
  },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },

  successBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', padding: '48px 24px', gap: 16,
  },
  successIcon: { fontSize: 52 },
  successTitle: { fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' },
  successText: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' },

  faqStrip: {
    marginTop: 56, padding: '24px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 14,
  },
};
