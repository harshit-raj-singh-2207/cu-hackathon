import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { interviewService } from '../../services/interviewService';

const DOMAINS = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer'];
const ROUNDS = [
  { label: 'Behavioral (STAR Method)', value: 'Behavioral' },
  { label: 'Technical DSA', value: 'Technical DSA' },
  { label: 'System Design', value: 'System Design' }
];
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Adobe'];
const EXPERIENCE_LEVELS = [
  { label: 'Fresher', value: 'Fresher' },
  { label: 'Junior (1-3 years)', value: 'Junior (1-3 years)' },
  { label: 'Mid (3-5 years)', value: 'Mid (3-5 years)' },
  { label: 'Senior (5+ years)', value: 'Senior (5+ years)' }
];

export default function Interview() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [company, setCompany] = useState(COMPANIES[0]);
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[1].value);
  const [round, setRound] = useState(ROUNDS[0].value);
  const [questionCount, setQuestionCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startSession = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        company,
        job_role: domain,
        experience_level: experienceLevel,
        interview_type: round,
        question_count: Number(questionCount)
      };
      const data = await interviewService.startSession(payload);
      
      // Navigate to the live interview session page
      navigate(`/interview/session/${data.id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start interview session. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✦ Interview Arena
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
              AI Mock Interview & Scheduler
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Practice domain-specific communication & coding skills with immediate AI structured evaluations.
            </p>
          </div>
        </div>
      </header>

      {/* Setup screen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="🎤 Interview Session Parameters" subtitle="Select your focus area and format.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={s.label}>Target Company</label>
                <select style={s.select} value={company} onChange={(e) => setCompany(e.target.value)}>
                  {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Target Domain</label>
                <select style={s.select} value={domain} onChange={(e) => setDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Experience Level</label>
                <select style={s.select} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(el => <option key={el.value} value={el.value}>{el.label}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Round Format</label>
                <select style={s.select} value={round} onChange={(e) => setRound(e.target.value)}>
                  {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Question Count</label>
                <select style={s.select} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
                  {[2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} Questions</option>)}
                </select>
              </div>

              {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <Button onClick={startSession} variant="primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }} loading={loading} disabled={loading}>
                {loading ? 'Initializing AI Agent...' : 'Begin Live Session'}
              </Button>
            </div>
          </Card>

          {/* AI Interview Tips glass card */}
          <Card title="✨ AI Interview Preparation Tips" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-brand)' }}>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>💡 <strong>STAR Methodology</strong>: Structure your behavioral answers clearly outlining Situation, Task, Action, and Result parameters.</li>
              <li>💡 <strong>Technical Whiteboarding</strong>: Verbalize your logic step-by-step; explain runtime complexity before writing the code.</li>
              <li>💡 <strong>Confidence & Tone</strong>: Maintain a structured, steady tone and pause for 2 seconds before answering.</li>
            </ul>
          </Card>
        </div>

        <InterviewScheduler />
      </div>

    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   INTERVIEW SCHEDULER PANEL
   ────────────────────────────────────────────────────────── */
function InterviewScheduler() {
  const [schedules, setSchedules] = useState([
    { company: 'Google', date: 'July 12, 2026', time: '14:30', status: 'Confirmed' },
    { company: 'Amazon', date: 'July 18, 2026', time: '11:00', status: 'Pending' },
    { company: 'Stripe', date: 'July 24, 2026', time: '16:00', status: 'Confirmed' }
  ]);

  const [booking, setBooking] = useState({ company: 'Google', date: '', time: '' });

  const handleBook = (e) => {
    e.preventDefault();
    if (!booking.date || !booking.time) return;

    const readableDate = new Date(booking.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    setSchedules([
      ...schedules,
      { company: booking.company, date: readableDate, time: booking.time, status: 'Confirmed' }
    ]);
    setBooking({ company: 'Google', date: '', time: '' });
    alert('Mock interview scheduled and synced with calendar!');
  };

  return (
    <Card title="📅 Interview Scheduler" subtitle="Sync mock dates with tech recruit timelines.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Schedule Mock Session</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={s.label}>Company Target</label>
              <select style={s.select} value={booking.company} onChange={(e) => setBooking({ ...booking, company: e.target.value })}>
                {['Google', 'Amazon', 'Meta', 'Netflix', 'Stripe', 'Razorpay'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Date</label>
              <input style={s.input} type="date" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={s.label}>Time Slot</label>
              <input style={s.input} type="time" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} required />
            </div>
            <Button type="submit" variant="glow" style={{ width: '100%' }}>Book Slot</Button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Upcoming Sessions ({schedules.length})</strong>
          {schedules.map((sch, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{sch.company} Mock Review</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sch.date} &nbsp;·&nbsp; {sch.time}</span>
              </div>
              <span className={`badge ${sch.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                {sch.status}
              </span>
            </div>
          ))}
        </div>

      </div>
    </Card>
  );
}

const s = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
};