import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { apiRequest } from '../../services/api';
import '../../styles/roadmap.css';

const MOCK_ROADMAP = {
  title: 'Full-Stack Developer Roadmap',
  target_role: 'Senior Full-Stack Engineer',
  duration_weeks: 16,
  phases: [
    {
      name: 'Foundation',
      week_range: 'Week 1–4',
      status: 'completed',
      topics: [
        { name: 'Advanced JavaScript & TypeScript', completed: true },
        { name: 'React Hooks & State Management', completed: true },
        { name: 'Data Structures & Algorithms', completed: true },
        { name: 'Git Advanced Workflows', completed: false },
      ],
    },
    {
      name: 'Backend Mastery',
      week_range: 'Week 5–8',
      status: 'in_progress',
      topics: [
        { name: 'Node.js & Express Deep Dive', completed: true },
        { name: 'Database Design (SQL & NoSQL)', completed: false },
        { name: 'REST API & GraphQL Design', completed: false },
        { name: 'Authentication & Security', completed: false },
      ],
    },
    {
      name: 'System Design',
      week_range: 'Week 9–12',
      status: 'locked',
      topics: [
        { name: 'Distributed Systems Basics', completed: false },
        { name: 'Caching & Load Balancing', completed: false },
        { name: 'Microservices Architecture', completed: false },
        { name: 'Cloud Deployment (AWS/GCP)', completed: false },
      ],
    },
    {
      name: 'Interview Prep',
      week_range: 'Week 13–16',
      status: 'locked',
      topics: [
        { name: 'Mock Technical Interviews', completed: false },
        { name: 'System Design Case Studies', completed: false },
        { name: 'Behavioral Questions Prep', completed: false },
        { name: 'Portfolio & Resume Polish', completed: false },
      ],
    },
  ],
};

const STATUS_CONFIG = {
  completed: { color: 'var(--success)', bg: 'var(--success-bg)', label: '✓ Complete', icon: '✅' },
  in_progress: { color: 'var(--primary)', bg: 'var(--primary-soft)', label: '◉ In Progress', icon: '🔵' },
  locked: { color: 'var(--text-muted)', bg: 'var(--bg-surface-2)', label: '🔒 Locked', icon: '🔒' },
};

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/roadmap/');
      setRoadmap(data);
    } catch {
      setRoadmap(MOCK_ROADMAP);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!targetRole.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const data = await apiRequest('/roadmap/generate', {
        method: 'POST',
        body: JSON.stringify({ target_role: targetRole }),
      });
      setRoadmap(data);
    } catch {
      setRoadmap({ ...MOCK_ROADMAP, title: `${targetRole} Roadmap`, target_role: targetRole });
    } finally {
      setGenerating(false);
    }
  };

  const toggleTopic = (phaseIdx, topicIdx) => {
    setRoadmap(prev => ({
      ...prev,
      phases: prev.phases.map((phase, pi) =>
        pi === phaseIdx
          ? { ...phase, topics: phase.topics.map((t, ti) => ti === topicIdx ? { ...t, completed: !t.completed } : t) }
          : phase
      ),
    }));
  };

  const totalTopics = roadmap?.phases?.reduce((s, p) => s + p.topics.length, 0) || 0;
  const completedTopics = roadmap?.phases?.reduce((s, p) => s + p.topics.filter(t => t.completed).length, 0) || 0;
  const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={S.spinner} />
          <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      <header>
        <span style={S.eyebrow}>✦ AI Learning Path</span>
        <h1 style={S.title}>Career Roadmap</h1>
        <p style={S.subtitle}>AI-generated personalized learning path to reach your dream role.</p>
      </header>

      {/* Generate New Roadmap */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Target Role</label>
            <input
              style={S.input}
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer, ML Engineer, DevOps..."
              onKeyDown={e => e.key === 'Enter' && generateRoadmap()}
            />
          </div>
          <Button variant="primary" onClick={generateRoadmap} loading={generating} disabled={!targetRole.trim()}>
            ✨ Generate Roadmap
          </Button>
        </div>
      </Card>

      {error && <div style={S.errorBanner}>{error}</div>}

      {roadmap && (
        <>
          {/* Progress Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card>
              <div style={S.statLabel}>Overall Progress</div>
              <div style={S.statValue}>{progress}%</div>
              <div style={S.barBg}><div style={{ ...S.barFill, width: `${progress}%` }} /></div>
            </Card>
            <Card>
              <div style={S.statLabel}>Topics Completed</div>
              <div style={S.statValue}>{completedTopics} / {totalTopics}</div>
            </Card>
            <Card>
              <div style={S.statLabel}>Target Role</div>
              <div style={{ ...S.statValue, fontSize: '16px' }}>{roadmap.target_role}</div>
            </Card>
            <Card>
              <div style={S.statLabel}>Duration</div>
              <div style={S.statValue}>{roadmap.duration_weeks} weeks</div>
            </Card>
          </div>

          {/* Phases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {roadmap.phases.map((phase, pi) => {
              const config = STATUS_CONFIG[phase.status] || STATUS_CONFIG.locked;
              const phaseCompleted = phase.topics.filter(t => t.completed).length;
              const phaseTotal = phase.topics.length;

              return (
                <Card key={pi}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{config.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                          Phase {pi + 1}: {phase.name}
                        </h3>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{phase.week_range}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{phaseCompleted}/{phaseTotal}</span>
                      <span style={{ ...S.statusBadge, color: config.color, background: config.bg }}>{config.label}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {phase.topics.map((topic, ti) => (
                      <div
                        key={ti}
                        onClick={() => phase.status !== 'locked' && toggleTopic(pi, ti)}
                        style={{
                          ...S.topicRow,
                          cursor: phase.status !== 'locked' ? 'pointer' : 'default',
                          opacity: phase.status === 'locked' ? 0.5 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                            background: topic.completed ? 'var(--success)' : 'var(--bg-surface-2)',
                            color: topic.completed ? '#fff' : 'var(--text-muted)',
                            border: topic.completed ? 'none' : '1.5px solid var(--border-strong)',
                            transition: 'all 200ms ease',
                          }}>
                            {topic.completed ? '✓' : ''}
                          </span>
                          <span style={{
                            color: topic.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontSize: '14px',
                            textDecoration: topic.completed ? 'line-through' : 'none',
                            transition: 'all 200ms ease',
                          }}>
                            {topic.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const S = {
  eyebrow: { color: 'var(--primary-light)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0' },
  subtitle: { color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' },
  label: { fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' },
  input: { width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '11px 14px', fontSize: '13.5px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' },
  errorBanner: { background: 'var(--error-bg)', color: 'var(--error)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px' },
  statLabel: { color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' },
  statValue: { color: 'var(--text-primary)', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' },
  barBg: { height: '6px', borderRadius: '3px', background: 'var(--bg-surface-2)', marginTop: '10px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', background: 'var(--gradient-brand)', transition: 'width 600ms ease' },
  statusBadge: { fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px' },
  topicRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', transition: 'background 150ms ease' },
  spinner: { width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
};
