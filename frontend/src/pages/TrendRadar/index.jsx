import React from 'react';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';

export default function TrendRadar() {
  const trends = [
    { name: 'TypeScript & Typings', growth: '+28%', index: 94, salary: '₹22L avg', demand: 'High' },
    { name: 'Next.js & Server Components', growth: '+42%', index: 88, salary: '₹26L avg', demand: 'Very High' },
    { name: 'Docker / CI-CD Pipelines', growth: '+15%', index: 72, salary: '₹24L avg', demand: 'Medium' },
    { name: 'WebAssembly & Canvas GL', growth: '+64%', index: 45, salary: '₹34L avg', demand: 'High' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header>
        <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ✦ Tech Observatory
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
          Trend Radar & Future Skills
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Real-time analysis of recruitment volume, high-paying tech stacks, and global engineering demands.
        </p>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Growth Indicators */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="📈 Tech Stack Growth Rates" subtitle="Based on monthly open positioning volume.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {trends.map((t, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{t.name}</strong>
                    <span style={{ color: 'var(--secondary-light)', fontWeight: '700' }}>
                      {t.growth} YoY &nbsp;·&nbsp; <span style={{ color: 'var(--text-muted)' }}>Index {t.index}/100</span>
                    </span>
                  </div>
                  <ProgressBar percent={t.index} height="6px" glow />
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Right: Salary Margins and actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="💼 Premium Market Demand">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trends.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{t.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average Compensation: {t.salary}</span>
                  </div>
                  <span className={`badge ${t.demand === 'Very High' ? 'badge-success' : 'badge-primary'}`}>
                    {t.demand}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Tech Stack Suggestions card */}
          <Card title="💡 Tech Stack Insights" subtitle="Co-pilot market projections.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>🎯</span>
                <span>Prioritize <strong>TypeScript configurations</strong> when starting new repositories.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>⚡</span>
                <span><strong>Next.js Server Components</strong> are dominating modern SaaS structures.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>🐳</span>
                <span>Containerizing with <strong>Docker</strong> raises overall deployment efficiency.</span>
              </div>
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
