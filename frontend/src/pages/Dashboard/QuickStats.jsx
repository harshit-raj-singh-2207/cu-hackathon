import React, { useEffect, useMemo, useState } from 'react';

const easeOut = (value) => 1 - Math.pow(1 - value, 3);

function useAnimatedNumber(value, duration = 1100) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.round(value * easeOut(progress)));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return displayValue;
}

export function StatCard({ stat, index = 0 }) {
  const animatedValue = useAnimatedNumber(stat.value);
  const formattedValue = useMemo(() => {
    if (stat.suffix === '%') return `${animatedValue}%`;
    if (stat.prefix) return `${stat.prefix}${animatedValue}`;
    return animatedValue.toLocaleString();
  }, [animatedValue, stat.prefix, stat.suffix]);

  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${stat.tone} dashboard-delay-${index}`}>
      <div className="dashboard-stat-card__shine" />
      <div className="dashboard-stat-card__top">
        <span className="dashboard-icon dashboard-stat-card__icon">{stat.icon}</span>
        <span className={`dashboard-trend dashboard-trend--${stat.trendDirection}`}>
          {stat.trend}
        </span>
      </div>
      <div className="dashboard-stat-card__body">
        <strong className="dashboard-stat-card__value">{formattedValue}</strong>
        <span className="dashboard-stat-card__label">{stat.label}</span>
      </div>
      <p className="dashboard-stat-card__description">{stat.description}</p>
    </article>
  );
}

const stats = [
  {
    label: 'Total Jobs',
    value: 248,
    icon: 'JB',
    trend: '+18%',
    trendDirection: 'up',
    description: 'Matched roles curated for your profile',
    tone: 'blue',
  },
  {
    label: 'Applications',
    value: 37,
    icon: 'AP',
    trend: '+9',
    trendDirection: 'up',
    description: 'Submitted across priority companies',
    tone: 'cyan',
  },
  {
    label: 'Interview Invites',
    value: 8,
    icon: 'IN',
    trend: '+3',
    trendDirection: 'up',
    description: 'Scheduled and awaiting confirmation',
    tone: 'violet',
  },
  {
    label: 'Resume Score',
    value: 91,
    suffix: '%',
    icon: 'CV',
    trend: '+6%',
    trendDirection: 'up',
    description: 'Optimized for recruiter screening',
    tone: 'green',
  },
  {
    label: 'ATS Score',
    value: 86,
    suffix: '%',
    icon: 'ATS',
    trend: '+4%',
    trendDirection: 'up',
    description: 'Keyword alignment with target roles',
    tone: 'amber',
  },
  {
    label: 'Coding Progress',
    value: 72,
    suffix: '%',
    icon: 'CD',
    trend: '+12%',
    trendDirection: 'up',
    description: 'Weekly practice completion rate',
    tone: 'pink',
  },
  {
    label: 'Learning Streak',
    value: 14,
    icon: 'ST',
    trend: 'days',
    trendDirection: 'neutral',
    description: 'Consistent learning momentum',
    tone: 'indigo',
  },
  {
    label: 'Profile Completion',
    value: 94,
    suffix: '%',
    icon: 'PF',
    trend: '+2%',
    trendDirection: 'up',
    description: 'Strong recruiter-ready profile',
    tone: 'slate',
  },
];

export default function QuickStats() {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <div>
          <span className="dashboard-eyebrow">Career Command Center</span>
          <h2 className="dashboard-section__title">Performance Overview</h2>
        </div>
        <a className="dashboard-link" href="/analytics">View analytics</a>
      </div>
      <div className="dashboard-stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>
    </section>
  );
}
