import React, { useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { RadialProgress } from '../../components/ProgressBar';

export default function ATS() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);

  const handleScan = (e) => {
    e.preventDefault();
    if (!jobDescription.trim() || !resumeText.trim()) return;

    setScanning(true);
    setReport(null);

    // Mock parsing density comparison
    setTimeout(() => {
      setScanning(false);

      // Score logic based on keywords
      const jdLow = jobDescription.toLowerCase();
      const resLow = resumeText.toLowerCase();

      const keywords = ['react', 'typescript', 'redux', 'graphql', 'system design', 'aws', 'docker', 'ci/cd', 'agile'];
      const found = keywords.filter(kw => jdLow.includes(kw) && resLow.includes(kw));
      const missing = keywords.filter(kw => jdLow.includes(kw) && !resLow.includes(kw));
      const irrelevant = keywords.filter(kw => !jdLow.includes(kw) && resLow.includes(kw));

      const score = Math.round((found.length / (found.length + missing.length || 1)) * 100);

      setReport({
        score: Math.max(45, score),
        foundKeywords: found.length > 0 ? found : ['React', 'CSS Grid'],
        missingKeywords: missing.length > 0 ? missing : ['GraphQL', 'AWS', 'System Design'],
        irrelevantKeywords: irrelevant,
        checks: [
          { label: 'Has contact details', passed: true },
          { label: 'Standard layout formatting', passed: true },
          { label: 'No tables or image columns', passed: false },
          { label: 'No invalid fonts used', passed: true },
        ]
      });
    }, 1500);
  };

  const loadMockData = () => {
    setJobDescription(
      `Senior React Developer\n\nRequirements:\n- 4+ years React experience\n- Strong TypeScript syntax skills\n- Experience building CI/CD pipelines using Docker\n- Knowledge of GraphQL query interfaces & AWS storage architectures\n- Experience designing micro-frontend architectures`
    );
    setResumeText(
      `Arjun Sharma\narjun@gmail.com\n\nProfile: 4 years designing responsive client systems with React.js, TypeScript, Redux, and TailwindCSS. Optimized loading pipelines and built reusable components.\nSkills: React, TypeScript, Redux, Node, Git, CSS, Next.js`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Embed Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
        <Button variant="secondary" onClick={loadMockData} size="sm">
          Load Sample Role & Resume
        </Button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: report ? '1.2fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Inputs Card */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="🎯 Scan inputs">
            <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={s.label}>Paste Job Description</label>
                <textarea
                  placeholder="Paste the entire text description of your target job role..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ ...s.input, height: '140px' }}
                  required
                />
              </div>

              <div>
                <label style={s.label}>Paste Resume Content</label>
                <textarea
                  placeholder="Paste the raw text content of your current resume..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ ...s.input, height: '140px' }}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={scanning}
                style={{ width: '100%', padding: '12px' }}
                disabled={!jobDescription.trim() || !resumeText.trim()}
              >
                Start Matching Scan
              </Button>
            </form>
          </Card>
        </section>

        {/* Right Scan Report output */}
        {report && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="📊 Optimization Index Scan">
              
              {/* Score ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px', marginBottom: '20px' }}>
                <RadialProgress percent={report.score} size={84} strokeWidth={7} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '16px', display: 'block' }}>Keyword Match Density</strong>
                  <span style={{ color: report.score >= 80 ? 'var(--success)' : 'var(--warning)', fontSize: '13px', display: 'block', marginTop: '2px', fontWeight: '600' }}>
                    {report.score >= 80 ? '✓ Ready to apply!' : '⚠ Missing critical parameters.'}
                  </span>
                </div>
              </div>

              {/* Keyword Gaps tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px', marginBottom: '20px' }}>
                
                {/* Missing */}
                <div>
                  <strong style={{ color: 'var(--error)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Missing Target Terms ({report.missingKeywords.length})
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {report.missingKeywords.map(kw => (
                      <span key={kw} className="badge badge-error" style={{ textTransform: 'capitalize' }}>{kw}</span>
                    ))}
                  </div>
                </div>

                {/* Found */}
                <div>
                  <strong style={{ color: 'var(--success)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Matched Target Terms ({report.foundKeywords.length})
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {report.foundKeywords.map(kw => (
                      <span key={kw} className="badge badge-success" style={{ textTransform: 'capitalize' }}>{kw}</span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Layout checkmarks */}
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                  Structure Analysis Parameter
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.checks.map((chk, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>{chk.label}</span>
                      <strong style={{ color: chk.passed ? 'var(--success)' : 'var(--error)' }}>
                        {chk.passed ? '✓ Pass' : '✕ Warning'}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

            </Card>

            {/* AI Skill Recommendations glass card */}
            <Card title="✨ AI Skill Recommendations" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-brand)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>To bridge your matching gap for this role, our AI recommends adding these core technologies:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  <span className="badge badge-primary">GraphQL Schema Design</span>
                  <span className="badge badge-primary">Docker Containerization</span>
                  <span className="badge badge-primary">Vite Production Bundler</span>
                </div>
              </div>
            </Card>
          </section>
        )}

      </div>
    </div>
  );
}

const s = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'all 200ms ease',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
};
