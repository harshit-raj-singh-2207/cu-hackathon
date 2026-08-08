import React from 'react';

export default function SkillReadinessBadge({ result, compact = false }) {
  if (!result) return null;

  const { status, score, readinessText } = result;

  let bg = 'rgba(100, 116, 139, 0.15)';
  let border = 'rgba(100, 116, 139, 0.3)';
  let color = 'var(--text-muted)';
  let icon = '📝';

  if (status === 'READY') {
    bg = 'rgba(34, 197, 94, 0.15)';
    border = 'rgba(34, 197, 94, 0.4)';
    color = '#4ade80';
    icon = '✓';
  } else if (status === 'NEEDS_REVIEW') {
    bg = 'rgba(234, 179, 8, 0.15)';
    border = 'rgba(234, 179, 8, 0.4)';
    color = '#fef08a';
    icon = '⚠️';
  } else if (status === 'NOT_READY') {
    bg = 'rgba(239, 68, 68, 0.15)';
    border = 'rgba(239, 68, 68, 0.4)';
    color = '#f87171';
    icon = '❌';
  }

  if (compact) {
    return (
      <span
        className="badge"
        style={{
          background: bg,
          borderColor: border,
          color,
          fontSize: '10px',
          fontWeight: 700,
          gap: '4px'
        }}
        title={`Skill Benchmark: ${score} (${readinessText})`}
      >
        {icon} {score} {readinessText}
      </span>
    );
  }

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
            Skill Benchmark: {readinessText}
          </span>
          <span style={{ fontSize: '10.5px', opacity: 0.85 }}>
            Score: {score} ({result.percentage}%)
          </span>
        </div>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
        {status}
      </span>
    </div>
  );
}
