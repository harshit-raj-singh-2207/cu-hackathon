import React, { useState, useEffect } from 'react';


const ACTIONS = [
  { label: 'Search job matches & roles', href: '/jobs', category: 'Jobs', icon: '💼' },
  { label: 'Analyze resume keywords & formats', href: '/resume', category: 'Resume', icon: '📄' },
  { label: 'Score resume ATS index matching', href: '/ats', category: 'ATS', icon: '🎯' },
  { label: 'Conduct AI Mock Interview round', href: '/interview', category: 'Interview', icon: '🎤' },
  { label: 'Solve Daily Coding Challenge', href: '/coding', category: 'Coding', icon: '💻' },
  { label: 'Chat with AI Career Twin Coach', href: '/twin', category: 'AI Twin', icon: '🤖' },
  { label: 'Access Personalized Career Roadmap', href: '/roadmap', category: 'Roadmap', icon: '🗺️' },
  { label: 'Ace Recruiter Arena prep loops', href: '/recruiter', category: 'Recruiter', icon: '🏢' },
  { label: 'View Conversion Funnel Analytics', href: '/analytics', category: 'Analytics', icon: '📊' },
  { label: 'Manage Portfolio & Certifications', href: '/profile', category: 'Profile', icon: '👤' },
  { label: 'Edit Account Workspace Settings', href: '/settings', category: 'Settings', icon: '⚙️' }
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');


  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (href) => {
    setIsOpen(false);
    setSearch('');
    // Use navigate parameter or force window redirect to load sections cleanly
    window.location.href = href;
  };

  if (!isOpen) return null;

  const filtered = ACTIONS.filter(act => 
    act.label.toLowerCase().includes(search.toLowerCase()) || 
    act.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      paddingLeft: '20px',
      paddingRight: '20px',
    }}>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Palette Box */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        animation: 'scaleIn 150ms ease-out',
      }}>
        {/* Search input header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '18px', marginRight: '12px' }}>🔍</span>
          <input
            type="text"
            placeholder="Type a command or route to search... (e.g. Stripe, Resume)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
            autoFocus
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>ESC</span>
        </div>

        {/* Matches list */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matches found for "{search}"
            </div>
          ) : (
            filtered.map((act, i) => (
              <div
                key={i}
                onClick={() => handleAction(act.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span style={{ fontSize: '18px' }}>{act.icon}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13px', display: 'block' }}>{act.label}</strong>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Go to {act.category}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>➔</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
