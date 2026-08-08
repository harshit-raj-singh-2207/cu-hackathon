import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';

/* ─── Config ─────────────────────────────────────────────── */
const DOMAINS   = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer', 'Machine Learning Engineer'];
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Adobe', 'Flipkart', 'Razorpay', 'Stripe', 'Netflix'];
const ROUNDS    = [
  { label: 'Behavioral (STAR Method)', value: 'Behavioral' },
  { label: 'Technical DSA',            value: 'Technical DSA' },
  { label: 'System Design',            value: 'System Design' },
];
const EXPERIENCE_LEVELS = [
  { label: 'Fresher',          value: 'Fresher' },
  { label: 'Junior (1-3 yrs)', value: 'Junior (1-3 years)' },
  { label: 'Mid (3-5 yrs)',    value: 'Mid (3-5 years)' },
  { label: 'Senior (5+ yrs)', value: 'Senior (5+ years)' },
];

/* ─── Gemini AI helpers ───────────────────────────────────── */
async function geminiRequest(prompt) {
  const res = await fetch('/api/ai/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: prompt, action: 'custom' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI request failed');
  return data.reply || data.advice || '';
}

async function generateQuestions({ company, job_role, experience_level, interview_type, question_count }) {
  const prompt = `You are an expert technical interviewer at ${company}.
Generate exactly ${question_count} interview questions for a ${experience_level} ${job_role} candidate.
Interview type: ${interview_type}.

Rules:
- Number each question (1. 2. 3. ...)
- Each question on its own line
- No extra commentary, just the questions
- Make questions realistic and specific to ${company}'s interview style

Return ONLY the numbered questions.`;

  const text = await geminiRequest(prompt);
  // Parse numbered questions
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = lines
    .filter(l => /^\d+[\.\)]\s/.test(l))
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim());
  return questions.length >= 2 ? questions : lines.filter(l => l.length > 20).slice(0, question_count);
}

async function evaluateAnswer({ question, answer, interview_type, company, job_role }) {
  const prompt = `You are a senior interviewer at ${company} evaluating a ${job_role} candidate.

Question: "${question}"
Candidate's Answer: "${answer}"
Interview Type: ${interview_type}

Evaluate the answer and respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "score": <number 1-10>,
  "rating": "<Excellent|Good|Average|Poor>",
  "strengths": "<what was good in 1-2 sentences>",
  "improvements": "<what to improve in 1-2 sentences>",
  "ideal_points": "<2-3 key points the ideal answer should have covered>"
}`;

  const text = await geminiRequest(prompt);
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { score: 6, rating: 'Average', strengths: 'Answer provided.', improvements: 'Add more detail.', ideal_points: 'Be more specific.' };
}

async function generateFinalReport({ questions, answers, feedbacks, company, job_role, interview_type }) {
  const qa = questions.map((q, i) => `Q${i+1}: ${q}\nA: ${answers[i] || '(no answer)'}\nScore: ${feedbacks[i]?.score || 0}/10`).join('\n\n');
  const prompt = `You are a senior HR manager at ${company}. Review this ${interview_type} interview for a ${job_role} role and give a final assessment.

${qa}

Respond in EXACT JSON (no markdown):
{
  "overall_score": <average score as number>,
  "verdict": "<Strongly Recommended|Recommended|Maybe|Not Recommended>",
  "summary": "<2-3 sentence overall assessment>",
  "top_strength": "<biggest strength shown>",
  "top_weakness": "<biggest area to improve>",
  "next_steps": "<practical advice for the candidate>"
}`;

  const text = await geminiRequest(prompt);
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  const avg = feedbacks.reduce((s, f) => s + (f?.score || 0), 0) / feedbacks.length;
  return { overall_score: Math.round(avg), verdict: avg >= 7 ? 'Recommended' : 'Maybe', summary: 'Interview completed.', top_strength: 'Completed the session.', top_weakness: 'Needs more preparation.', next_steps: 'Practice more mock interviews.' };
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Interview() {
  // Phase: 'setup' | 'session' | 'report'
  const [phase, setPhase] = useState('setup');

  // Setup state
  const [domain, setDomain]         = useState(DOMAINS[0]);
  const [company, setCompany]       = useState(COMPANIES[0]);
  const [expLevel, setExpLevel]     = useState(EXPERIENCE_LEVELS[1].value);
  const [round, setRound]           = useState(ROUNDS[0].value);
  const [qCount, setQCount]         = useState(4);
  const [starting, setStarting]     = useState(false);
  const [startError, setStartError] = useState('');

  // Session state
  const [questions, setQuestions]   = useState([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [answer, setAnswer]         = useState('');
  const [answers, setAnswers]       = useState([]);
  const [feedbacks, setFeedbacks]   = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [sessionConfig, setSessionConfig] = useState({});

  // Report state
  const [report, setReport]         = useState(null);
  const [buildingReport, setBuildingReport] = useState(false);

  // Scheduler state
  const [schedules, setSchedules]   = useState([
    { company: 'Google',  date: 'Aug 15, 2026', time: '14:30', status: 'Confirmed' },
    { company: 'Amazon',  date: 'Aug 20, 2026', time: '11:00', status: 'Pending' },
  ]);
  const [booking, setBooking]       = useState({ company: 'Google', date: '', time: '' });

  const textareaRef = useRef(null);

  useEffect(() => { if (phase === 'session') textareaRef.current?.focus(); }, [phase, currentQ]);

  /* ── Start Session ── */
  const handleStart = async () => {
    setStarting(true);
    setStartError('');
    try {
      const cfg = { company, job_role: domain, experience_level: expLevel, interview_type: round, question_count: Number(qCount) };
      setSessionConfig(cfg);
      const qs = await generateQuestions(cfg);
      if (!qs || qs.length === 0) throw new Error('Could not generate questions. Check AI configuration.');
      setQuestions(qs);
      setCurrentQ(0);
      setAnswers([]);
      setFeedbacks([]);
      setAnswer('');
      setCurrentFeedback(null);
      setPhase('session');
    } catch (err) {
      setStartError(err.message || 'Failed to start. Check backend connection.');
    } finally {
      setStarting(false);
    }
  };

  /* ── Submit Answer ── */
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);
    setCurrentFeedback(null);
    try {
      const fb = await evaluateAnswer({
        question: questions[currentQ],
        answer: answer.trim(),
        interview_type: sessionConfig.interview_type,
        company: sessionConfig.company,
        job_role: sessionConfig.job_role,
      });
      const newAnswers   = [...answers, answer.trim()];
      const newFeedbacks = [...feedbacks, fb];
      setAnswers(newAnswers);
      setFeedbacks(newFeedbacks);
      setCurrentFeedback(fb);

      // Auto-advance or finish after short delay
      if (currentQ + 1 >= questions.length) {
        setTimeout(async () => {
          setBuildingReport(true);
          setPhase('report');
          const rep = await generateFinalReport({ questions, answers: newAnswers, feedbacks: newFeedbacks, ...sessionConfig });
          setReport(rep);
          setBuildingReport(false);
        }, 1800);
      }
    } catch (err) {
      setCurrentFeedback({ score: 0, rating: 'Error', strengths: '', improvements: err.message, ideal_points: '' });
    } finally {
      setEvaluating(false);
    }
  };

  /* ── Next Question ── */
  const handleNext = () => {
    setCurrentQ(q => q + 1);
    setAnswer('');
    setCurrentFeedback(null);
  };

  /* ── Restart ── */
  const handleRestart = () => {
    setPhase('setup');
    setReport(null);
    setQuestions([]);
    setAnswers([]);
    setFeedbacks([]);
    setCurrentFeedback(null);
  };

  /* ── Book Schedule ── */
  const handleBook = (e) => {
    e.preventDefault();
    if (!booking.date || !booking.time) return;
    const readableDate = new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    setSchedules(prev => [...prev, { company: booking.company, date: readableDate, time: booking.time, status: 'Confirmed' }]);
    setBooking({ company: 'Google', date: '', time: '' });
  };

  /* ── RENDER PHASES ── */
  if (phase === 'session') return <SessionView
    questions={questions} currentQ={currentQ} answer={answer} setAnswer={setAnswer}
    onSubmit={handleSubmitAnswer} evaluating={evaluating} currentFeedback={currentFeedback}
    onNext={handleNext} sessionConfig={sessionConfig} textareaRef={textareaRef}
    answers={answers} feedbacks={feedbacks}
  />;

  if (phase === 'report') return <ReportView
    report={report} building={buildingReport} questions={questions}
    answers={answers} feedbacks={feedbacks} sessionConfig={sessionConfig}
    onRestart={handleRestart}
  />;

  /* ── SETUP PHASE ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <header>
        <span style={s.eyebrow}>✦ Interview Arena</span>
        <h1 style={s.h1}>AI Mock Interview</h1>
        <p style={s.subtitle}>Practice with AI-generated questions & get instant structured feedback powered by Gemini.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Setup Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="🎤 Interview Session Parameters" subtitle="Configure your mock interview.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={s.label}>Target Company</label>
                <select style={s.select} value={company} onChange={e => setCompany(e.target.value)}>
                  {COMPANIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Target Domain</label>
                <select style={s.select} value={domain} onChange={e => setDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Experience Level</label>
                <select style={s.select} value={expLevel} onChange={e => setExpLevel(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(el => <option key={el.value} value={el.value}>{el.label}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Round Format</label>
                <select style={s.select} value={round} onChange={e => setRound(e.target.value)}>
                  {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Number of Questions</label>
                <select style={s.select} value={qCount} onChange={e => setQCount(e.target.value)}>
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
              </div>

              {startError && (
                <div style={s.errorBox}>⚠️ {startError}</div>
              )}

              <button onClick={handleStart} disabled={starting} style={s.primaryBtn}>
                {starting ? '⏳ Generating Questions...' : '🚀 Begin Live Session'}
              </button>
            </div>
          </Card>

          <Card title="✨ Interview Tips" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-brand)' }}>
            <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>💡 <strong>STAR Methodology</strong>: Structure behavioral answers with Situation, Task, Action, Result.</li>
              <li>💡 <strong>Think Aloud</strong>: Verbalize your thought process before writing code.</li>
              <li>💡 <strong>Confidence</strong>: Pause 2 seconds before answering — it shows composure.</li>
            </ul>
          </Card>
        </div>

        {/* Scheduler */}
        <Card title="📅 Interview Scheduler" subtitle="Sync mock dates with tech recruit timelines.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Schedule Mock Session</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={s.label}>Company</label>
                  <select style={s.select} value={booking.company} onChange={e => setBooking({ ...booking, company: e.target.value })}>
                    {COMPANIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={s.label}>Date</label>
                  <input style={s.input} type="date" value={booking.date} onChange={e => setBooking({ ...booking, date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, alignItems: 'end' }}>
                <div><label style={s.label}>Time Slot</label>
                  <input style={s.input} type="time" value={booking.time} onChange={e => setBooking({ ...booking, time: e.target.value })} required />
                </div>
                <button type="submit" style={s.glowBtn}>Book Slot</button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Upcoming Sessions ({schedules.length})</strong>
              {schedules.map((sch, i) => (
                <div key={i} style={s.scheduleRow}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 13, display: 'block' }}>{sch.company} Mock</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sch.date} · {sch.time}</span>
                  </div>
                  <span className={`badge ${sch.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{sch.status}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Session View ───────────────────────────────────────── */
function SessionView({ questions, currentQ, answer, setAnswer, onSubmit, evaluating, currentFeedback, onNext, sessionConfig, textareaRef, answers, feedbacks }) {
  const isLast = currentQ + 1 >= questions.length;
  const answered = currentFeedback !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={s.eyebrow}>🎤 Live Session — {sessionConfig.company} · {sessionConfig.interview_type}</span>
          <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Question {currentQ + 1} of {questions.length}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i < currentQ ? '#22c55e' : i === currentQ ? 'var(--primary)' : 'var(--border)',
            }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((currentQ) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Question Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title={`Question ${currentQ + 1}`}>
            <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
              {questions[currentQ]}
            </p>
          </Card>

          {/* Feedback */}
          {currentFeedback && (
            <div style={{
              background: 'var(--bg-surface-2)', border: `1px solid ${
                currentFeedback.score >= 8 ? '#22c55e40' : currentFeedback.score >= 5 ? '#f59e0b40' : '#ef444440'
              }`, borderRadius: 14, padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: currentFeedback.score >= 8 ? '#22c55e' : currentFeedback.score >= 5 ? '#f59e0b' : '#ef4444' }}>
                  {currentFeedback.score}/10
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  background: currentFeedback.score >= 8 ? '#22c55e20' : currentFeedback.score >= 5 ? '#f59e0b20' : '#ef444420',
                  color: currentFeedback.score >= 8 ? '#22c55e' : currentFeedback.score >= 5 ? '#f59e0b' : '#ef4444',
                }}>{currentFeedback.rating}</span>
              </div>
              {currentFeedback.strengths && <p style={{ fontSize: 13, color: '#22c55e', margin: '0 0 6px' }}>✅ {currentFeedback.strengths}</p>}
              {currentFeedback.improvements && <p style={{ fontSize: 13, color: '#f59e0b', margin: '0 0 6px' }}>💡 {currentFeedback.improvements}</p>}
              {currentFeedback.ideal_points && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>📌 Key points: {currentFeedback.ideal_points}</p>}
            </div>
          )}
        </div>

        {/* Answer Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Your Answer">
            <textarea
              ref={textareaRef}
              style={{ ...s.textarea, minHeight: 180, opacity: answered ? 0.7 : 1 }}
              placeholder="Type your answer here... Be detailed and structured."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              disabled={answered || evaluating}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {!answered ? (
                <button
                  onClick={onSubmit}
                  disabled={!answer.trim() || evaluating}
                  style={{ ...s.primaryBtn, flex: 1 }}
                >
                  {evaluating ? '🤖 Evaluating...' : '✅ Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={onNext}
                  style={{ ...s.glowBtn, flex: 1 }}
                >
                  {isLast ? '📊 View Final Report' : '→ Next Question'}
                </button>
              )}
            </div>
          </Card>

          {/* Answered count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {feedbacks.map((fb, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface-2)', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 20 }}>Q{i + 1}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(fb.score / 10) * 100}%`, background: fb.score >= 7 ? '#22c55e' : fb.score >= 5 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: fb.score >= 7 ? '#22c55e' : fb.score >= 5 ? '#f59e0b' : '#ef4444' }}>{fb.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Report View ────────────────────────────────────────── */
function ReportView({ report, building, questions, answers, feedbacks, sessionConfig, onRestart }) {
  const VERDICT_COLOR = { 'Strongly Recommended': '#22c55e', 'Recommended': '#6366f1', 'Maybe': '#f59e0b', 'Not Recommended': '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={s.eyebrow}>📊 Interview Complete — {sessionConfig.company} · {sessionConfig.interview_type}</span>
          <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Final Report</h2>
        </div>
        <button onClick={onRestart} style={s.outlineBtn}>↩ New Interview</button>
      </div>

      {building || !report ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 60, color: 'var(--text-muted)' }}>
          <div style={s.spinnerAnim} />
          <span>Building your personalised report...</span>
        </div>
      ) : (
        <>
          {/* Overall Score Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 28px' }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{report.overall_score}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>out of 10</div>
            </div>
            <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Verdict</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: VERDICT_COLOR[report.verdict] || '#6366f1' }}>{report.verdict}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{report.summary}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>TOP STRENGTH</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{report.top_strength}</div>
              </div>
              <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>IMPROVE</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{report.top_weakness}</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-brand)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>📌 Next Steps</div>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.next_steps}</p>
          </div>

          {/* Q&A Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Question-by-Question Breakdown</h3>
            {questions.map((q, i) => {
              const fb = feedbacks[i];
              return (
                <div key={i} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--primary)', marginRight: 6 }}>Q{i + 1}.</span>{q}
                    </p>
                    <span style={{ fontSize: 20, fontWeight: 800, color: fb?.score >= 7 ? '#22c55e' : fb?.score >= 5 ? '#f59e0b' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {fb?.score || 0}/10
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>YOUR ANSWER</div>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{answers[i] || '(no answer)'}</p>
                  </div>
                  {fb && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {fb.strengths && <p style={{ margin: 0, fontSize: 12, color: '#22c55e' }}>✅ {fb.strengths}</p>}
                      {fb.improvements && <p style={{ margin: 0, fontSize: 12, color: '#f59e0b' }}>💡 {fb.improvements}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Shared Styles ──────────────────────────────────────── */
const s = {
  eyebrow: { color: 'var(--primary-light)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  h1: { fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0' },
  subtitle: { color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  select: { width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' },
  input: { width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 13.5, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' },
  primaryBtn: { width: '100%', padding: '12px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' },
  glowBtn: { width: '100%', padding: '11px 20px', background: 'var(--bg-surface-2)', color: 'var(--primary)', border: '1px solid var(--border-brand)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  outlineBtn: { padding: '8px 18px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  errorBox: { color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' },
  scheduleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' },
  spinnerAnim: { width: 24, height: 24, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};

// Inject spinner keyframe
if (!document.getElementById('interview-spin')) {
  const st = document.createElement('style');
  st.id = 'interview-spin';
  st.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(st);
}