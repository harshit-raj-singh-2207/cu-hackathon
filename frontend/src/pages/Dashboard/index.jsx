import React, { useMemo, useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { RadialProgress } from '../../components/ProgressBar';

export default function Dashboard() {
  const [user, setUser] = useState({ name: 'Kumar', initials: 'K' });
  const notifications = [
    { id: 1, text: 'Stripe fit analysis complete: 96% Match.', time: '5m ago' },
    { id: 2, text: 'Google Mock Interview scheduled.', time: '2h ago' },
  ];
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('coding'); // 'coding' | 'applications'

  // Mock Job recommendations data
  const jobs = [
    { company: 'Stripe', role: 'Senior Frontend Engineer', fit: 96, salary: '₹32L - ₹40L', logo: '💳' },
    { company: 'Vercel', role: 'Frontend Engineer (Next.js)', fit: 92, salary: '₹45L - ₹55L', logo: '▲' },
    { company: 'Razorpay', role: 'Software Developer (React)', fit: 91, salary: '₹18L - ₹24L', logo: '💳' }
  ];

  // Mock upcoming interviews data
  const interviews = [
    { company: 'Google', date: 'July 12, 2026', time: '14:30', status: 'Confirmed', round: 'Technical DSA' },
    { company: 'Stripe', date: 'July 24, 2026', time: '16:00', status: 'Confirmed', round: 'System Integration' }
  ];



  // AI Coach state
  const [coachText, setCoachText] = useState('');
  const [coachReply, setCoachReply] = useState("Hello! Ask me how to optimize your resume keywords, structure STAR responses, or ace system designs.");
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser({
          name: u.name || 'Kumar',
          initials: (u.name || 'Kumar').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAskCoach = (e) => {
    e.preventDefault();
    if (!coachText.trim()) return;

    setCoachLoading(true);
    setCoachReply('');

    const query = coachText.toLowerCase();
    let reply = "I recommend focusing on adding active metrics to your summary and practicing mock interviews to structure STAR answers.";
    if (query.includes('stripe') || query.includes('api')) {
      reply = "Stripe checks code readability and robust validations. Ensure you explain trade-offs and handle edge exceptions gracefully.";
    } else if (query.includes('google') || query.includes('dsa')) {
      reply = "Google focuses on optimal runtime solutions. Propose a brute force structure first, then optimize utilizing pointers or HashMaps.";
    } else if (query.includes('resume') || query.includes('ats')) {
      reply = "Scan your resume against ATS filters: use standard sans-serif typography, avoid multi-column layouts, and list core technologies clearly.";
    }

    setTimeout(() => {
      setCoachLoading(false);
      setCoachReply(reply);
      setCoachText('');
    }, 1000);
  };

  const chartData = useMemo(() => {
    return activeChartTab === 'coding'
      ? [20, 45, 30, 80, 55, 95, 110]
      : [10, 25, 40, 35, 50, 45, 60];
  }, [activeChartTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', opacity: 1, animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Header Banner */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✦ System Command
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
            Career Workspace Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Review application conversion funnels, job recommendations, and upcoming mock interview panels.
          </p>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          
          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            🔔
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              width: '280px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              zIndex: 100,
              backdropFilter: 'blur(20px)',
            }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Alerts</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{n.text}</div>
                ))}
              </div>
            </div>
          )}

          <a href="/profile" style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700',
            textDecoration: 'none',
          }}>
            {user.initials}
          </a>
        </div>
      </header>

      {/* Row 1: Premium KPI Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* KPI 1: Resume Score */}
        <Card title="📄 Resume Score" subtitle="Target standard: 95%">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <RadialProgress percent={91} size={54} strokeWidth={5} />
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '10px' }}>+3% Weekly</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Ready to apply</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: ATS Score */}
        <Card title="🎯 ATS Match Score" subtitle="Keyword alignment ratio">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <RadialProgress percent={86} size={54} strokeWidth={5} />
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-primary" style={{ fontSize: '10px' }}>+5% Weekly</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Stripe fit matching</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Coding Score */}
        <Card title="💻 Coding Challenge Score" subtitle="Daily DSA targets complete">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <RadialProgress percent={72} size={54} strokeWidth={5} />
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '10px' }}>142 Solved</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>14-day streak</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Weekly Progress */}
        <Card title="📈 Weekly Activity Ratio" subtitle="Aggregate target checklist">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <RadialProgress percent={84} size={54} strokeWidth={5} />
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-cyan" style={{ fontSize: '10px' }}>+12% Trend</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Excellent pace</span>
            </div>
          </div>
        </Card>

      </section>

      {/* Row 2: AI Insights Banner */}
      <section>
        <Card title="✨ AI Co-Pilot Strategic Insights" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>💡</span>
              <span><strong>Action Item</strong>: Insert <strong>GraphQL queries</strong> in your resume experience bullets to raise alignment fits for Stripe SDE to 96%.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>🎯</span>
              <span><strong>Next Mock Panel</strong>: Google interview scheduled in <strong>3 days</strong>. Practice <strong>Validate Binary Search Tree</strong> algorithms.</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Row 3: Interactive Chart & Upcoming Interviews */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Momentum Chart */}
        <Card
          title="📈 Performance Momentum Tracker"
          subtitle="Visualize monthly progress across code runs and applications."
          action={
            <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setActiveChartTab('coding')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: activeChartTab === 'coding' ? 'var(--bg-surface)' : 'transparent',
                  color: activeChartTab === 'coding' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                DSA Solved
              </button>
              <button
                onClick={() => setActiveChartTab('applications')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: activeChartTab === 'applications' ? 'var(--bg-surface)' : 'transparent',
                  color: activeChartTab === 'applications' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Applications
              </button>
            </div>
          }
        >
          <div style={{ marginTop: '20px', position: 'relative' }}>
            <svg viewBox="0 0 500 160" width="100%" height="160" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>

              <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />

              <path d={generatePath(chartData, true)} fill="url(#chartGrad)" style={{ transition: 'd 500ms ease' }} />
              <path d={generatePath(chartData, false)} fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'd 500ms ease' }} />

              {chartData.map((pt, i) => {
                const x = (i / (chartData.length - 1)) * 500;
                const y = 140 - (pt / 120) * 110;
                return (
                  <circle key={i} cx={x} cy={y} r="4.5" fill="#fff" stroke="var(--primary)" strokeWidth="2.5" />
                );
              })}
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </Card>

        {/* Upcoming Interviews */}
        <Card title="📅 Upcoming Mock Interviews" subtitle="Confirmed calendar panels sync status.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {interviews.map((int, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{int.company} · <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{int.round}</span></strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{int.date} &nbsp;·&nbsp; {int.time}</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '9px' }}>{int.status}</span>
              </div>
            ))}
            <Button onClick={() => window.location.href = '/interview'} variant="glow" style={{ width: '100%', marginTop: '4px' }}>
              Schedule Mock slot
            </Button>
          </div>
        </Card>

      </section>

      {/* Row 4: Job Recommendations & AI Career Coach */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Job Recommendations */}
        <Card title="💼 Curated Job Matches" subtitle="Tailored fit metrics based on resume checks.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {jobs.map((job, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '28px', background: 'rgba(37,99,235,0.06)', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>{job.logo}</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{job.role}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{job.company} &nbsp;·&nbsp; {job.salary}</span>
                  </div>
                </div>
                <span style={{ color: 'var(--secondary-light)', fontWeight: '750', fontSize: '13px' }}>{job.fit}% fit</span>
              </div>
            ))}
            <Button onClick={() => window.location.href = '/jobs'} variant="glow" style={{ width: '100%', marginTop: '4px' }}>
              Open Job Finder
            </Button>
          </div>
        </Card>

        {/* AI Career Coach Widget */}
        <Card title="🤖 AI Career Coach Widget" subtitle="Instant answers to target application pipelines.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-secondary)', minHeight: '60px' }}>
              {coachLoading ? 'Formulating advice...' : coachReply}
            </div>
            <form onSubmit={handleAskCoach} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ask me: 'How to prepare Google loops?'"
                value={coachText}
                onChange={e => setCoachText(e.target.value)}
                style={s.input}
              />
              <Button type="submit" variant="primary" size="sm">Ask</Button>
            </form>
          </div>
        </Card>

      </section>

    </div>
  );
}

// Generate smooth cubic bezier SVG path values
function generatePath(points, closePath = false) {
  if (points.length === 0) return '';
  // const height = 160; // reserved for future scaling
  const width = 500;
  const maxVal = 120;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = 140 - (val / maxVal) * 110;
    return { x, y };
  });

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx1 = prev.x + (curr.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (curr.x - prev.x) / 2;
    const cy2 = curr.y;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
  }

  if (closePath) {
    d += ` L ${coords[coords.length - 1].x} 160 L ${coords[0].x} 160 Z`;
  }
  return d;
}

const s = {
  input: {
    flex: 1,
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
  },
};
