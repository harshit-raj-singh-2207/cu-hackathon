import React from 'react';

export default function ProgressBar({
  percent = 0,
  height = '8px',
  showLabel = false,
  labelPrefix = '',
  labelSuffix = '%',
  glow = false,
  style = {},
}) {
  const cleanPercent = Math.min(Math.max(0, percent), 100);

  return (
    <div style={{ width: '100%', ...style }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
          }}
        >
          <span>Progress</span>
          <span style={{ color: 'var(--primary-light)' }}>
            {labelPrefix}
            {cleanPercent}
            {labelSuffix}
          </span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: height,
          background: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${cleanPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
            borderRadius: '999px',
            transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: glow ? '0 0 10px var(--primary-glow)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
export function RadialProgress({
  percent = 0,
  size = 60,
  strokeWidth = 6,
  showLabel = true,
  style = {}
}) {
  const cleanPercent = Math.min(Math.max(0, percent), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...style
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Indicator circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#gradientProgress)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <defs>
          <linearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <span
          style={{
            position: 'absolute',
            fontSize: size > 80 ? '1.1rem' : '0.85rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}
        >
          {cleanPercent}%
        </span>
      )}
    </div>
  );
}
