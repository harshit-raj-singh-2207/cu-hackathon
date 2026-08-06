import React, { useState } from 'react';
import '../../styles/auth.css';
import { register } from '../../services/authService';

/* ── Constants ───────────────────────────────────────────── */
const ROLES = ['Student / Fresher', 'Working Professional', 'Career Switcher', 'Recruiter / HR', 'Freelancer'];
const GOALS = [
  { icon: '📄', label: 'Improve my Resume' },
  { icon: '🎤', label: 'Ace Interviews' },
  { icon: '💻', label: 'Coding Practice' },
  { icon: '💼', label: 'Find Better Jobs' },
  { icon: '🗺️', label: 'Plan Career Path' },
  { icon: '📊', label: 'Salary Insights' },
];

const STEPS = ['Account', 'Profile', 'Goals'];
const EXP_OPTIONS = ['0–1 yrs (Fresher)', '1–3 yrs', '3–5 yrs', '5–8 yrs', '8–12 yrs', '12+ yrs'];

/* ── Password strength ───────────────────────────────────── */
function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-4
}
const PW_CLASSES = ['weak', 'weak', 'fair', 'good', 'strong'];
const PW_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

/* ── Step indicator ──────────────────────────────────────── */
function StepDots({ current }) {
  return (
    <div className="auth-steps">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const dotCls = done
          ? 'auth-step__dot auth-step__dot--done'
          : active
          ? 'auth-step__dot auth-step__dot--active'
          : 'auth-step__dot';

        return (
          <React.Fragment key={label}>
            <div className="auth-step">
              <div className={dotCls}>{done ? '✓' : i + 1}</div>
              <span className="auth-step__label" style={{ color: active ? 'var(--primary)' : done ? 'var(--success)' : undefined }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`auth-step-connector${done ? ' auth-step-connector--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Step 1 — Account ────────────────────────────────────── */
function StepAccount({ data, setData, errors }) {
  const [show, setShow] = useState(false);
  const strength = pwStrength(data.password);

  return (
    <div className="auth-form">
      <div className="auth-field-row">
        <div>
          <label className="auth-label" htmlFor="reg-fname">First Name</label>
          <input id="reg-fname" type="text" className={`auth-input${errors.firstName ? ' auth-input--error' : ''}`}
            placeholder="Arjun" value={data.firstName}
            onChange={e => setData(d => ({ ...d, firstName: e.target.value }))} />
          {errors.firstName && <span className="auth-field-error">{errors.firstName}</span>}
        </div>
        <div>
          <label className="auth-label" htmlFor="reg-lname">Last Name</label>
          <input id="reg-lname" type="text" className={`auth-input${errors.lastName ? ' auth-input--error' : ''}`}
            placeholder="Sharma" value={data.lastName}
            onChange={e => setData(d => ({ ...d, lastName: e.target.value }))} />
          {errors.lastName && <span className="auth-field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-email">Email Address</label>
        <input id="reg-email" type="email" className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
          placeholder="you@example.com" value={data.email}
          onChange={e => setData(d => ({ ...d, email: e.target.value }))} />
        {errors.email && <span className="auth-field-error">{errors.email}</span>}
      </div>

      <div>
        <label className="auth-label">Password</label>
        <div className="auth-input-wrap">
          <input id="reg-password" type={show ? 'text' : 'password'}
            className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
            placeholder="Min. 8 characters" value={data.password}
            onChange={e => setData(d => ({ ...d, password: e.target.value }))}
            style={{ paddingRight: 44 }} />
          <button type="button" className="auth-toggle-btn" onClick={() => setShow(v => !v)}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
        {data.password && (
          <div className="auth-strength">
            <div className="auth-strength__bars">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`auth-strength__bar${i < strength ? ` auth-strength__bar--filled-${PW_CLASSES[strength]}` : ''}`} />
              ))}
            </div>
            <span className="auth-strength__label">{PW_LABELS[strength]}</span>
          </div>
        )}
        {errors.password && <span className="auth-field-error">{errors.password}</span>}
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
        <input id="reg-confirm" type="password" className={`auth-input${errors.confirm ? ' auth-input--error' : ''}`}
          placeholder="Repeat password" value={data.confirm}
          onChange={e => setData(d => ({ ...d, confirm: e.target.value }))} />
        {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input id="reg-terms" type="checkbox" checked={data.terms}
          onChange={e => setData(d => ({ ...d, terms: e.target.checked }))}
          style={{ marginTop: 3, accentColor: 'var(--primary)', width: 15, height: 15 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          I agree to the{' '}
          <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
        </span>
      </label>
      {errors.terms && <span className="auth-field-error">{errors.terms}</span>}
    </div>
  );
}

/* ── Step 2 — Profile ────────────────────────────────────── */
function StepProfile({ data, setData, errors }) {
  return (
    <div className="auth-form">
      <div>
        <label className="auth-label">Current Role</label>
        <div className="auth-chips-row">
          {ROLES.map(r => (
            <button type="button" key={r}
              className={`auth-chip${data.role === r ? ' auth-chip--active' : ''}`}
              onClick={() => setData(d => ({ ...d, role: r }))}>
              {r}
            </button>
          ))}
        </div>
        {errors.role && <span className="auth-field-error">{errors.role}</span>}
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-jobtitle">Job Title / Course</label>
        <input id="reg-jobtitle" type="text" className={`auth-input${errors.jobTitle ? ' auth-input--error' : ''}`}
          placeholder="e.g. Software Engineer / B.Tech CS" value={data.jobTitle}
          onChange={e => setData(d => ({ ...d, jobTitle: e.target.value }))} />
        {errors.jobTitle && <span className="auth-field-error">{errors.jobTitle}</span>}
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-location">Location</label>
        <input id="reg-location" type="text" className={`auth-input${errors.location ? ' auth-input--error' : ''}`}
          placeholder="e.g. Bangalore, India" value={data.location}
          onChange={e => setData(d => ({ ...d, location: e.target.value }))} />
        {errors.location && <span className="auth-field-error">{errors.location}</span>}
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-exp">Years of Experience</label>
        <select id="reg-exp" className="auth-input" value={data.experience}
          onChange={e => setData(d => ({ ...d, experience: e.target.value }))}>
          <option value="">Select experience…</option>
          {EXP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ── Step 3 — Goals ──────────────────────────────────────── */
function StepGoals({ data, setData, errors }) {
  const toggle = (label) => {
    setData(d => ({
      ...d,
      goals: d.goals.includes(label) ? d.goals.filter(g => g !== label) : [...d.goals, label],
    }));
  };
  return (
    <div className="auth-form">
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
        Choose what you want to achieve — we'll personalise your CareerCopilot experience around your goals.
      </p>
      <div className="auth-goals-grid">
        {GOALS.map(g => {
          const active = data.goals.includes(g.label);
          return (
            <button type="button" key={g.label}
              className={`auth-goal-card${active ? ' auth-goal-card--active' : ''}`}
              onClick={() => toggle(g.label)}>
              <span className="auth-goal-card__icon">{g.icon}</span>
              <span className="auth-goal-card__label">{g.label}</span>
              {active && <span className="auth-goal-card__check">✓</span>}
            </button>
          );
        })}
      </div>
      {errors.goals && <span className="auth-field-error">{errors.goals}</span>}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
        Select at least one goal to continue
      </p>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
const INIT = {
  firstName: '', lastName: '', email: '', password: '', confirm: '', terms: false,
  role: '', jobTitle: '', location: '', experience: '', goals: [],
};

export default function Register() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!data.firstName.trim()) e.firstName = 'First name required.';
      if (!data.lastName.trim()) e.lastName = 'Last name required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Valid email required.';
      if (data.password.length < 8) e.password = 'Minimum 8 characters.';
      if (new TextEncoder().encode(data.password).length > 72) e.password = 'Password must be 72 bytes or fewer.';
      if (data.password !== data.confirm) e.confirm = 'Passwords do not match.';
      if (!data.terms) e.terms = 'You must accept the terms.';
    }
    if (step === 1) {
      if (!data.role) e.role = 'Please select your role.';
      if (!data.jobTitle.trim()) e.jobTitle = 'Job title / course required.';
      if (!data.location.trim()) e.location = 'Location required.';
    }
    if (step === 2) {
      if (data.goals.length === 0) e.goals = 'Select at least one goal.';
    }
    return e;
  };

  const next = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 2) { setStep(s => s + 1); return; }
    try {
      await register(`${data.firstName} ${data.lastName}`, data.email, data.password);
      setDone(true);
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  /* ── Success screen ── */
  if (done) return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-success">
          <span className="auth-success__icon">🎉</span>
          <h2 className="auth-success__title">Welcome, {data.firstName}!</h2>
          <p className="auth-success__body">
            Your CareerCopilot account is ready. Let's land that dream role.
          </p>
          <a href="/login" className="auth-btn-primary" style={{ marginTop: 16 }}>
            Continue to Sign In →
          </a>
        </div>
      </div>
    </div>
  );

  /* ── Registration form ── */
  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--wide">

        {/* Logo */}
        <div className="auth-logo-row" style={{ justifyContent: 'center' }}>
          <div className="auth-logo-mark">CC</div>
          <span className="auth-logo-text">CareerCopilot</span>
        </div>

        <h1 className="auth-title" style={{ textAlign: 'center' }}>Create your account</h1>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
          Join 2.4M+ professionals accelerating their careers with AI
        </p>

        {/* OAuth */}
        <div className="auth-oauth-row">
          <button type="button" className="auth-oauth-btn">
            <span style={{ color: '#ea4335', fontWeight: 900, fontSize: 16 }}>G</span>
            <span>Continue with Google</span>
          </button>
          <button type="button" className="auth-oauth-btn">
            <span style={{ color: '#0077b5', fontWeight: 900, fontSize: 14 }}>in</span>
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span>or register with email</span>
          <span className="auth-divider__line" />
        </div>

        {/* Step indicator */}
        <StepDots current={step} />

        {/* Form content */}
        <form onSubmit={e => { e.preventDefault(); next(); }}>
          {step === 0 && <StepAccount data={data} setData={setData} errors={errors} />}
          {step === 1 && <StepProfile data={data} setData={setData} errors={errors} />}
          {step === 2 && <StepGoals data={data} setData={setData} errors={errors} />}
          {errors.submit && <span className="auth-field-error">{errors.submit}</span>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, gap: 12 }}>
            {step > 0
              ? <button type="button" className="auth-btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <div />}
            <button id="reg-next" type="submit" className="auth-btn-primary">
              {step < 2 ? 'Continue →' : '🚀 Create Account'}
            </button>
          </div>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
