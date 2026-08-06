import React, { useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';

const COMPANIES_PREP = [
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '💳',
    headcount: '8,000+ employees',
    difficulty: 'Hard',
    salary: '₹35L - ₹45L average base',
    focus: 'API Integration, Clean Code, Performance optimizations',
    loop: [
      { name: 'Technical Phone Screen', duration: '60m', details: 'Solve an integration problem focusing on modular structures and API usage.' },
      { name: 'Coding Loop (DSA & System)', duration: '2x 45m', details: 'Implement complex algorithms; prioritize readability and clean abstraction.' },
      { name: 'System Design & Scalability', duration: '60m', details: 'Design high-volume ledger platforms or messaging queue structures.' }
    ],
    questions: [
      { q: "Design a rate limiter middleware for client APIs.", hint: "Use token bucket algorithms with Redis cache storage configurations." },
      { q: "Implement a visual ledger ledger balancing processor.", hint: "Focus on idempotent state variables to ensure safe transaction calculations." }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    logo: '🔍',
    headcount: '150,000+ employees',
    difficulty: 'Very Hard',
    salary: '₹32L - ₹48L average base',
    focus: 'DSA Algorithms, Complexity, Scale architecture',
    loop: [
      { name: 'Phone Assessment', duration: '45m', details: 'Basic algorithms and tree traversal concepts.' },
      { name: 'Onsite Coding loops', duration: '3x 45m', details: 'Advanced dynamic programming, graphs, and heap configurations.' },
      { name: 'Googliness & Leadership', duration: '45m', details: 'Behavioral assessments testing stakeholder alignments and ethics.' }
    ],
    questions: [
      { q: "Validate a Binary Search Tree structure.", hint: "Perform standard DFS traversal passing min and max limits down each recursion path." },
      { q: "Design a distributed search autocomplete index.", hint: "Incorporate Trie structures paired with priority queue buffers." }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '📦',
    headcount: '1M+ employees',
    difficulty: 'Hard',
    salary: '₹28L - ₹38L average base',
    focus: 'Leadership Principles, Scalability, Object Oriented design',
    loop: [
      { name: 'Online Assessment (OA)', duration: '90m', details: '2 coding challenges and logic scenarios.' },
      { name: 'Technical Coding loops', duration: '2x 45m', details: 'Standard DSA coupled with Amazon Leadership Principles (LP).' },
      { name: 'System Architecture Design', duration: '60m', details: 'Design storage networks like AWS S3 or shopping cart logic.' }
    ],
    questions: [
      { q: "LRU Cache design & implementations.", hint: "Utilize HashMaps coupled with Doubly Linked Lists for O(1) performance." },
      { q: "Find path matrix grids (Dijkstra).", hint: "Incorporate priority queues checking distance paths." }
    ]
  }
];

export default function RecruiterArena() {
  const [selectedComp, setSelectedComp] = useState(COMPANIES_PREP[0]);
  const [showHintIdx, setShowHintIdx] = useState(null);

  const handleSelect = (comp) => {
    setSelectedComp(comp);
    setShowHintIdx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header>
        <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ✦ Company Hub
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
          Company Preparation Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Deep dive into the recruitment structures, salaries, and past questions of priority companies.
        </p>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1.2fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* Col 1: Sidebar targets list wrapped in a Card */}
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <Card title="🏢 Target List" subtitle="Select a firm for loop details.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {COMPANIES_PREP.map(c => {
                const isSel = selectedComp.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: isSel ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface-2)',
                      border: isSel ? '1px solid var(--border-brand)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{c.logo}</span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: isSel ? 'var(--primary)' : 'var(--text-primary)', display: 'block' }}>{c.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.difficulty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Col 2: Interview Loop & details */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title={`${selectedComp.name} Selection loop`} subtitle={`Typical interview architecture.`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {selectedComp.loop.map((round, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-soft)', border: '1px solid var(--border-brand)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13.5px' }}>{round.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>⏱ {round.duration}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: 0, lineHeight: '1.5' }}>
                      {round.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Col 3: Past Questions & details */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Stats */}
          <Card title="📈 Overview details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>AVERAGE COMPENSATION</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{selectedComp.salary}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>PRIMARY EVALUATION CRITERIA</span>
                <strong style={{ color: 'var(--secondary-light)', fontSize: '13px' }}>{selectedComp.focus}</strong>
              </div>
            </div>
          </Card>

          {/* Past Questions */}
          <Card title="❓ Past Interview Questions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedComp.questions.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                    "{item.q}"
                  </p>
                  
                  {/* Hint Toggle */}
                  <div style={{ marginTop: '4px' }}>
                    <button
                      onClick={() => setShowHintIdx(showHintIdx === idx ? null : idx)}
                      style={{ fontSize: '11.5px', color: 'var(--primary-light)', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                    >
                      {showHintIdx === idx ? 'Hide hint' : 'Show hint'}
                    </button>
                    {showHintIdx === idx && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', lineHeight: '1.4' }}>
                        💡 {item.hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <Button onClick={() => window.location.href = '/interview'} variant="primary" style={{ width: '100%', marginTop: '6px' }}>
                Practice Mock Interview
              </Button>
            </div>
          </Card>

          {/* AI Strategy Advisor card */}
          <Card title="💡 Preparation Advice" subtitle="Suggested strategy by CareerCopilot AI.">
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '10px' }}>
              For <strong>{selectedComp.name}</strong> loops, focus heavily on explaining your runtime and space tradeoffs out loud. Start with a brute-force approach, draft the complexities, and then introduce HashMap/cache optimizations.
            </div>
          </Card>

        </section>

      </div>
    </div>
  );
}
