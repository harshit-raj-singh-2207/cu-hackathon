import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from './Button';

export default function FloatingAssistant() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState([
    { role: 'assistant', text: "Hello! Ask me any quick questions on interview strategies, job matching fit, or resume revisions." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Hide on /coding page to avoid overlapping the AI Coach panel
  if (location.pathname.startsWith('/coding')) {
    return null;
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setChat(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    let reply = "I suggest optimizing your experience section by adding percentages (e.g. page speed +22%) and practicing standard STAR behavioral questions.";
    const query = userText.toLowerCase();
    if (query.includes('stripe') || query.includes('job')) {
      reply = "Stripe has a 96% fit matching with your profile. Make sure to emphasize modular APIs and clean state components in React.";
    } else if (query.includes('resume') || query.includes('ats')) {
      reply = "Check your resume format: ensure it uses a single-column layout, lacks image headers, and lists technical keywords clearly.";
    }

    setTimeout(() => {
      setLoading(false);
      setChat(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'var(--font-sans)' }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 8px 32px var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 200ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          💬
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div style={{
          width: '320px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>✨ Career Copilot Quick Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', boxSizing: 'border-box' }}>
            {chat.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    background: isUser ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#fff',
                    lineHeight: '1.5',
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assistant is compiling guidance...</div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <Button type="submit" variant="primary" size="sm" style={{ padding: '6px 12px' }}>Send</Button>
          </form>
        </div>
      )}
    </div>
  );
}
