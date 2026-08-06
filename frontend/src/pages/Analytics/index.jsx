import React from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';

export default function Analytics() {
  const funnelData = [
    { stage: 'Applications Sent', count: 248, percentage: 100, color: 'var(--primary)' },
    { stage: 'Recruiter Screening', count: 98, percentage: 39, color: 'var(--secondary)' },
    { stage: 'Technical Interviews', count: 37, percentage: 15, color: '#ec4899' },
    { stage: 'Final Rounds', count: 8, percentage: 3, color: 'var(--success)' },
  ];

  const skillGaps = [
    { skill: 'TypeScript (Generics & Enums)', gap: 'High', matches: 35, category: 'Frontend' },
    { skill: 'GraphQL query schema models', gap: 'Medium', matches: 50, category: 'APIs' },
    { skill: 'AWS CloudFront caching & VPC configurations', gap: 'Low', matches: 75, category: 'DevOps' },
    { skill: 'System Design Patterns (Sharding, PubSub)', gap: 'High', matches: 40, category: 'Backend' },
  ];

  return (
    <div className="analytics-page" style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header className="analytics-header">
        <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ✦ Placement Intelligence
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
          Analytics & Skill Gap Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Monitor your recruitment pipeline conversion rates and identify key technology stacks to optimize.
          </p>
      </header>

      {/* Main Grid */}
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Conversion Funnel and stats */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Conversion Funnel */}
          <Card title="📊 Application Conversion Funnel" subtitle="Conversion ratios across priority channels.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {funnelData.map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.stage}</strong>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                      {item.count} &nbsp;·&nbsp; <span style={{ color: item.color }}>{item.percentage}% ratio</span>
                    </span>
                  </div>
                  
                  {/* Custom progress funnel block */}
                  <div style={{ width: '100%', height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${item.color}30, ${item.color})`,
                        borderRadius: '6px',
                        transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Card title="📈 Overall Conv Rate" subtitle="Benchmark: 3% (Top tier)">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                <strong style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--success)', letterSpacing: '-0.03em' }}>
                  3.2%
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>+0.4% from last month</span>
              </div>
            </Card>

            <Card title="⏱ Interview Frequency" subtitle="Benchmark: 1 mock per week">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                <strong style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  2.4 / wk
                </strong>
                <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '600' }}>Exceeding criteria</span>
              </div>
            </Card>
          </div>

        </section>

        {/* Right: Skill Gap Analysis */}
        <section>
          <Card title="⚡ Skill Gap Audit Summary" subtitle="Concrete priorities to bridge before applying.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              {skillGaps.map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                  
                  {/* Skill title & indicator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px', display: 'block' }}>{item.skill}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {item.category}</span>
                    </div>
                    <span className={`badge ${item.gap === 'High' ? 'badge-error' : item.gap === 'Medium' ? 'badge-warning' : 'badge-primary'}`}>
                      {item.gap} Gap
                    </span>
                  </div>

                  {/* Completion percentage bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ProgressBar percent={item.matches} height="5px" style={{ flex: 1 }} />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', width: '32px', textAlign: 'right' }}>
                      {item.matches}%
                    </span>
                  </div>

                </div>
              ))}

              <Button href="/roadmap" onClick={() => window.location.href = '/roadmap'} variant="glow" style={{ width: '100%', marginTop: '6px' }}>
                Add Missing Gaps to Path
              </Button>
            </div>
          </Card>

          {/* AI recommendations card */}
          <Card title="💡 Recommended Learning Focus" subtitle="Suggested strategy by CareerCopilot AI.">
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, marginTop: '10px' }}>To optimize your index metrics, prioritize these targets:</p>
              <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>🎯 Master <strong>generics & structural typings</strong> in TypeScript.</li>
                <li>🎯 Build simulated **caching models** using Redis structures.</li>
              </ul>
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
