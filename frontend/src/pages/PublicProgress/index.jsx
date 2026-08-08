import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { careerPlanStorage } from '../../services/careerPlanStorage';
import { getBadgeUrl } from '../../utils/progressShare';

export default function PublicProgress() {
  const { shareId } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve sanitized public progress payload
    const publicData = careerPlanStorage.getPublicPayload();
    setPayload(publicData);
    setLoading(false);
  }, [shareId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="roadmap-loading-spinner" />
      </div>
    );
  }

  // PRIVACY GUARD: If user has disabled public sharing
  if (!payload || !payload.isPublic) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px 24px', boxShadow: 'var(--shadow-xl)' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔒</span>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>
            Progress Report is Private
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            The owner of this career roadmap has set their progress sharing to private. Only authorized account owners can view detailed metrics.
          </p>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="glow" size="sm">
              🏠 Return to Career Copilot Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { metrics, learnerName, primaryGoal, updatedAt, isDemoMode } = payload;
  const badgeUrl = getBadgeUrl(metrics.percent);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 20px', color: 'var(--text-primary)' }}>
      
      {/* Demo Warning Banner if active */}
      {isDemoMode && (
        <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ fontSize: '12px', color: '#fef08a', fontWeight: 600 }}>
            Viewing Judge Presentation Demo Dataset
          </span>
        </div>
      )}

      {/* Public Header Branding */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="roadmap-kicker" style={{ marginBottom: '6px' }}>
            ✦ Public Career Progress Report
          </span>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {learnerName}'s Career Roadmap
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Primary Goal: <strong style={{ color: 'var(--text-primary)' }}>{primaryGoal}</strong> · Updated {updatedAt}
          </p>
        </div>

        <div>
          <img src={badgeUrl} alt="Career Progress Badge" style={{ height: '36px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
        </div>
      </header>

      {/* Progress Metric Card */}
      <Card glow style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Overall Roadmap Completion</strong>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-light)' }}>{metrics.percent}%</span>
            </div>
            <div className="roadmap-progress" style={{ height: '12px' }}>
              <span className="roadmap-progress__bar" style={{ width: `${metrics.percent}%` }} />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="summary-stats-grid">
            <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', display: 'block' }}>
                {metrics.completedSteps}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed Steps</span>
            </div>

            <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', display: 'block' }}>
                {metrics.statusCounts?.current || 0}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>In Progress</span>
            </div>

            <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)', display: 'block' }}>
                {metrics.statusCounts?.locked || 0}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending Steps</span>
            </div>

            <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899', display: 'block' }}>
                {metrics.completedTasks} / {metrics.totalTasks}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasks Mastered</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown Cards */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          🏷️ Topic & Category Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.keys(metrics.topicStats || {}).map(topic => {
            const stat = metrics.topicStats[topic];
            const pct = stat.total > 0 ? Math.round((stat.checked / stat.total) * 100) : 0;
            return (
              <div key={topic} style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <span>{topic}</span>
                  <span>{pct}%</span>
                </div>
                <div className="roadmap-progress" style={{ height: '6px' }}>
                  <span className="roadmap-progress__bar" style={{ width: `${pct}%` }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                  {stat.checked} of {stat.total} tasks completed
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <footer style={{ textAlignment: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Powered by <strong>AI Career Copilot</strong> · Public Learner Progress Record
        </span>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            ✨ Build Your Career Roadmap
          </Button>
        </Link>
      </footer>

    </div>
  );
}
