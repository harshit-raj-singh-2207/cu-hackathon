import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { exportSummaryReport } from '../../../utils/progressCalculator';
import { generateProgressReportPDF } from '../../../utils/pdfProgressReport';
import { getShareUrl, getBadgeUrl, getMarkdownBadge, getHtmlBadge } from '../../../utils/progressShare';
import { careerPlanStorage } from '../../../services/careerPlanStorage';
import SocialProgressCardModal from './SocialProgressCardModal';

export default function PersonalizedSummary({
  metrics,
  plans,
  activityLog,
  isDemoMode,
  onToggleDemoMode,
  onResetToSeed,
  onSelectStep
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'text' | 'link' | 'md' | 'html'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setIsPublic(careerPlanStorage.isPublicShareEnabled());
  }, []);

  const handleTogglePublicShare = (e) => {
    const nextVal = e.target.checked;
    setIsPublic(nextVal);
    careerPlanStorage.setPublicShare(nextVal);
  };

  const getUser = () => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return { name: 'Developer', email: 'developer@example.com' };
  };

  const shareUrl = getShareUrl();
  const badgeUrl = getBadgeUrl(metrics.percent);
  const markdownSnippet = getMarkdownBadge(metrics.percent, shareUrl);
  const htmlSnippet = getHtmlBadge(metrics.percent, shareUrl);

  const handleCopyAction = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadTXTReport = () => {
    const reportText = exportSummaryReport(plans, metrics, activityLog, isDemoMode);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Career_Progress_Summary_${isDemoMode ? 'Demo_' : ''}${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const user = getUser();
      generateProgressReportPDF({
        plans,
        metrics,
        activityLog,
        isDemoMode,
        user
      });
    } catch (e) {
      console.error('Failed to generate PDF Progress Report', e);
      alert('Error generating PDF report. Please check console for details.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const readiness = metrics.readinessSummary || { readyCount: 0, reviewCount: 0, notReadyCount: 0 };

  return (
    <>
      {/* Overview Button & Widget Banner */}
      <div className={`personalized-summary-banner ${isDemoMode ? 'is-demo-active' : ''}`}>
        
        {/* Judge Demo Mode Isolated Active Alert Bar */}
        {isDemoMode && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <span style={{ fontSize: '12px', color: '#fef08a', fontWeight: 600 }}>
                Judge Demo Mode Active: Showing isolated presentation dataset. Real user data is safe.
              </span>
            </div>
            <button
              onClick={() => onToggleDemoMode(false)}
              style={{
                background: '#eab308',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Exit Demo & Restore My Data
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="summary-icon-glow">
              📊
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Personalized Learner Summary
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                  🟣 Elite Feature
                </span>
                {isDemoMode && (
                  <span className="badge badge-warning" style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.2)', color: '#fef08a', borderColor: 'rgba(234, 179, 8, 0.4)' }}>
                    Demo Environment
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Overall completion: <strong style={{ color: 'var(--text-primary)' }}>{metrics.percent}%</strong> ({metrics.completedSteps}/{metrics.totalSteps} steps completed)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isDemoMode ? (
              <Button variant="ghost" size="sm" onClick={() => onToggleDemoMode(false)}>
                ↩️ Exit Demo
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => onToggleDemoMode(true)}>
                🏆 Judge Demo Mode
              </Button>
            )}

            <Button variant="glow" size="sm" onClick={() => setIsModalOpen(true)}>
              📈 Open Detailed Report
            </Button>
          </div>

        </div>

        {/* AI Next Recommended Action Banner */}
        {metrics.nextAction && (
          <div className="next-action-banner" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-brand)' }}>
                    AI Recommended Next Milestone
                  </span>
                  <h4 style={{ margin: '2px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {metrics.nextAction.stepTitle}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Task: <strong>"{metrics.nextAction.taskName}"</strong>
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <em>Why: {metrics.nextAction.reason}</em>
                  </p>
                </div>
              </div>

              {metrics.nextAction.stepId && (
                <button
                  onClick={() => {
                    const target = plans.find(p => p.id === metrics.nextAction.stepId);
                    if (target) onSelectStep(target);
                  }}
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Go to Step ➔
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Modal Report */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Personalized Learner Progress Dashboard"
        maxWidth="840px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                Learner Mode: {isDemoMode ? 'Judge Demo Environment' : 'Real Personalized Profile'}
              </span>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {metrics.percent === 100 ? '🎉 Roadmap Completed!' : 'Active Career Trajectory'}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="sm" onClick={() => handleCopyAction(exportSummaryReport(plans, metrics, activityLog, isDemoMode), 'text')}>
                {copiedType === 'text' ? '✓ Copied' : '📋 Copy Text'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadTXTReport}>
                📄 Download TXT
              </Button>
              <Button variant="glow" size="sm" onClick={handleDownloadPDFReport} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? '⏳ Generating PDF...' : '📕 Download PDF Report'}
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="summary-stats-grid">
            <div style={{ background: 'var(--bg-surface-3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-light)', display: 'block' }}>
                {metrics.percent}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Progress</span>
            </div>

            <div style={{ background: 'var(--bg-surface-3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', display: 'block' }}>
                {metrics.completedSteps}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed Steps</span>
            </div>

            <div style={{ background: 'var(--bg-surface-3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', display: 'block' }}>
                {metrics.completedTasks}/{metrics.totalTasks}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Checklist Tasks</span>
            </div>

            <div style={{ background: 'var(--bg-surface-3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight 800, color: '#ec4899', display: 'block' }}>
                {metrics.weakAreas.length}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weak Areas</span>
            </div>
          </div>

          {/* NEW: SKILL BENCHMARK READINESS SUMMARY CARD */}
          <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                📝 Skill Benchmark Readiness Summary
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Tested {readiness.totalAttempted} Milestone Quizzes
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#4ade80', display: 'block' }}>
                  {readiness.readyCount}
                </span>
                <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>✓ Ready (3/3)</span>
              </div>

              <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fef08a', display: 'block' }}>
                  {readiness.reviewCount}
                </span>
                <span style={{ fontSize: '11px', color: '#fef08a', fontWeight: 600 }}>⚠️ Needs Review (2/3)</span>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', display: 'block' }}>
                  {readiness.notReadyCount}
                </span>
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>❌ Not Ready (0-1/3)</span>
              </div>
            </div>
          </div>

          {/* SHARE YOUR PROGRESS & SOCIAL CARD EMBEDS CARD */}
          <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))', border: '1px solid var(--border-brand)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🌐 Share Your Progress & Badge Embeds
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Embed dynamic progress badges or export high-resolution 1200x630px cards for LinkedIn, Twitter, & Discord.
                </p>
              </div>

              {/* Public Privacy Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-surface-2)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleTogglePublicShare}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: isPublic ? 'var(--success)' : 'var(--text-muted)' }}>
                  {isPublic ? '🌐 Public Sharing Enabled' : '🔒 Private (Sharing OFF)'}
                </span>
              </label>
            </div>

            {/* Live Badge Preview Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface-3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Live Badge Preview:</span>
              <img src={badgeUrl} alt="Career Progress Badge Preview" style={{ height: '28px', borderRadius: '4px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Auto-updates when your roadmap completion reaches {metrics.percent}%
              </span>
            </div>

            {/* Copy Actions & Social Card Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setIsSocialModalOpen(true)}
              >
                🖼️ Generate Social Card (1200x630)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAction(shareUrl, 'link')}
                disabled={!isPublic && !isDemoMode}
              >
                {copiedType === 'link' ? '✓ Link Copied!' : '🔗 Copy Share Link'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAction(markdownSnippet, 'md')}
                disabled={!isPublic && !isDemoMode}
              >
                {copiedType === 'md' ? '✓ Markdown Copied!' : '📝 Copy Markdown Badge'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAction(htmlSnippet, 'html')}
                disabled={!isPublic && !isDemoMode}
              >
                {copiedType === 'html' ? '✓ HTML Copied!' : '💻 Copy HTML Embed'}
              </Button>
            </div>

            {!isPublic && !isDemoMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '11.5px', color: '#f87171' }}>
                ⚠️ Toggle "Make my progress public" to enable external sharing links and badge embeds.
              </p>
            )}
          </div>

          {/* Topics Breakdown Chart Cards */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--text-primary)' }}>
              🎯 Completion Counts by Topic & Category
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {Object.keys(metrics.topicStats || {}).map(topic => {
                const stat = metrics.topicStats[topic];
                const pct = stat.total > 0 ? Math.round((stat.checked / stat.total) * 100) : 0;
                return (
                  <div key={topic} style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      <span>{topic}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="roadmap-progress" style={{ height: '6px' }}>
                      <span className="roadmap-progress__bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                      {stat.checked} of {stat.total} tasks complete
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Areas Cards */}
          {metrics.weakAreas && metrics.weakAreas.length > 0 ? (
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#f87171' }}>
                ⚠️ Weak Areas Requiring Attention (&lt;60% completion)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {metrics.weakAreas.map((area, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#f87171', fontSize: '13px', display: 'block' }}>
                        {area.topic} ({area.completionPercent}% completion)
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {area.recommendation}
                      </span>
                    </div>
                    <span className="badge badge-muted" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                      {area.completedTasks}/{area.totalTasks} Tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '8px', color: '#4ade80', fontSize: '12.5px' }}>
              ✓ Excellent progress! No major weak areas detected (&gt;=60% completion across all topics).
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--text-primary)' }}>
              📜 Recent Learner Activity Log
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {(activityLog || []).map(act => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{act.icon}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{act.text}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{act.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Learner Storage State
            </span>
            <Button variant="ghost" size="sm" onClick={onResetToSeed}>
              🔄 Reset to Clean Seed Data
            </Button>
          </div>

        </div>
      </Modal>

      {/* Social Progress Card Modal Preview Dialog */}
      <SocialProgressCardModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        plans={plans}
        metrics={metrics}
        user={getUser()}
        isDemoMode={isDemoMode}
      />
    </>
  );
}
