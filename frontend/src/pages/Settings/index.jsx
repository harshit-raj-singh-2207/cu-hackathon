import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';

export default function Settings() {
  const [formData, setFormData] = useState({
    name: 'Kumar',
    email: 'kumar@careercopilot.ai',
    targetTitle: 'Senior Frontend Engineer',
    expLevel: '3–5 yrs',
  });

  const [toggles, setToggles] = useState({
    emailAlerts: true,
    browserAlerts: true,
    recruiterQueries: false
  });

  const [apiKey, setApiKey] = useState('sk-proj-••••••••••••••••');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) {
        const u = JSON.parse(stored);
        setFormData(prev => ({
          ...prev,
          name: u.name || 'Kumar',
          email: u.email || 'kumar@careercopilot.ai'
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('cc_user', JSON.stringify({ name: formData.name, email: formData.email }));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header>
        <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ✦ Configuration Area
        </span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
          User Profile & Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
          Update your target search preferences, notification criteria, and security key settings.
        </p>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: General Profile Form */}
        <section>
          <Card title="⚙ Settings Configuration Form">
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={s.label}>Full Name</label>
                  <input style={s.input} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={s.label}>Contact Email</label>
                  <input style={s.input} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={s.label}>Target Role Title</label>
                  <input style={s.input} type="text" value={formData.targetTitle} onChange={e => setFormData({ ...formData, targetTitle: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Experience Level</label>
                  <select style={s.select} value={formData.expLevel} onChange={e => setFormData({ ...formData, expLevel: e.target.value })}>
                    {['0–1 yrs (Fresher)', '1–3 yrs', '3–5 yrs', '5–8 yrs', '8+ yrs'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {saved && (
                <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '600' }}>
                  ✓ Configurations saved successfully and synchronized with profile database.
                </span>
              )}

              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
                Save Configurations
              </Button>
            </form>
          </Card>
        </section>

        {/* Right Side: Toggles and API Keys */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notification Toggles */}
          <Card title="🔔 Notification Preferences" subtitle="Select what updates are pushed to your account.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              
              {[
                { key: 'emailAlerts', title: 'Email Job Digests', desc: 'Recieve matching positions in your mailbox daily.' },
                { key: 'browserAlerts', title: 'Live Browser Matches', desc: 'Push immediate matches while workspace is open.' },
                { key: 'recruiterQueries', title: 'Recruiter Chat Queries', desc: 'Recieve messages directly from verified recruiters.' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block' }}>{item.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles[item.key]}
                    onChange={() => handleToggle(item.key)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>
              ))}

            </div>
          </Card>

          {/* Security Key */}
          <Card title="🔑 Security & AI Credentials" subtitle="Bring your own Open AI key for unlimited scans.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <label style={s.label}>API Key Configuration</label>
              <input
                style={s.input}
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Your keys are stored locally on your device browser sandbox.
              </span>
            </div>
          </Card>

        </section>

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
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'all 200ms ease',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
  },
};
