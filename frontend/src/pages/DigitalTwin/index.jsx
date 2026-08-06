import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';

const MOCK_ANSWERS = {
  default: "I am your CareerCopilot Digital Twin. I have analyzed your resume, Git logs, and project parameters. Ask me anything about salary, resume optimization, or interview scheduling.",
  rewrite: "Here is an optimized rewrite for your payment experience bullet:\n\n*\"Architected transactional payment pipeline processing ₹40Cr weekly, reducing Time-To-Interactive (TTI) indices by 32% via React lazy-loading and bundle splits.\"*\n\nThis introduces clear metrics, active action verbs, and identifies key rendering speeds.",
  jobs: "I recommend focusing on Stripe (96% match) and Razorpay (91% match). Your experience with payment processors and React architecture matches their core criteria. I suggest applying with your tailored resume immediately.",
  interview: "Sure! Let's mock a behavioral round. Here is a target question:\n\n*\"Tell me about a time you optimized rendering metrics in React. What was the impact?\"*\n\nTake a moment to draft your Situation-Task-Action-Result (STAR) response below, and I will score it."
};

export default function DigitalTwin() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: MOCK_ANSWERS.default }
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // User Message
    const userMsg = { role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTyping(true);

    // Formulate answer based on matches
    let answerText = "I have scanned that request. As your career twin, I suggest focusing on building high-performance design patterns, adding specific metrics to your resume, and scheduling a mock interview to practice speaking.";
    const lowText = text.toLowerCase();
    if (lowText.includes('rewrite') || lowText.includes('bullet') || lowText.includes('resume')) {
      answerText = MOCK_ANSWERS.rewrite;
    } else if (lowText.includes('job') || lowText.includes('apply') || lowText.includes('recommend')) {
      answerText = MOCK_ANSWERS.jobs;
    } else if (lowText.includes('mock') || lowText.includes('interview') || lowText.includes('question')) {
      answerText = MOCK_ANSWERS.interview;
    }

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: answerText }]);
    }, 1500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', height: 'calc(100vh - 120px)', alignItems: 'stretch', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Col 1: ChatGPT Panel */}
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Card
          title="🤖 AI Career Twin Co-Pilot"
          subtitle="Interactive career chatbot answering queries and optimizing resumes."
          style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}
        >
          {/* Messages feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '10px 4px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '16px',
              maxHeight: '380px',
            }}
          >
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      background: isUser ? 'var(--primary)' : 'var(--bg-surface-2)',
                      border: isUser ? 'none' : '1px solid var(--border)',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '12px 16px',
                      color: isUser ? '#fff' : 'var(--text-secondary)',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Typing bubble */}
            {typing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 2px', padding: '12px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce-dot 1.4s infinite both' }} />
                  <div style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce-dot 1.4s infinite both 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce-dot 1.4s infinite both 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Prompt quick items */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              { text: '✍ Rewrite resume bullet', key: 'rewrite' },
              { text: '💼 Which jobs fit best?', key: 'jobs' },
              { text: '🎤 Run a mock interview', key: 'interview' }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => handleSendMessage(p.text)}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-surface-3)';
                  e.currentTarget.style.borderColor = 'var(--border-brand)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-surface-2)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {p.text}
              </button>
            ))}
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              placeholder="Ask your twin to optimize profiles, practice coding, or review goals..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={s.input}
            />
            <Button type="submit" variant="primary" style={{ padding: '10px 24px' }}>
              Send
            </Button>
          </form>

        </Card>
      </section>

      {/* Col 2: Info details */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card title="⚡ Carrier Twin Synchronization" subtitle="Audit metrics matching your Git logs & profile details.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Sync bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Profile Sync Level</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '750' }}>94%</span>
              </div>
              <ProgressBar percent={94} height="7px" glow />
            </div>

            {/* Profile parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '4px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Linked Data Sources</strong>
              {[
                { label: 'Resume Profile Index', val: 'arjun_sharma_cv.pdf', status: 'Linked' },
                { label: 'GitHub Repository metrics', val: 'github.com/arjunsharma', status: 'Synced 4h ago' },
                { label: 'Weekly DSA practice', val: '142 Problems Solved', status: 'Linked' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{item.val}</span>
                  </div>
                  <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '12px' }}>{item.status}</span>
                </div>
              ))}
            </div>

          </div>
        </Card>

        {/* AI Twin Recommendations card */}
        <Card title="💡 Twin Directives" subtitle="Actionable items generated by your AI twin.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>🎯</span>
              <span>Complete <strong>2 more mock rounds</strong> to boost synchronization to 98%.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>💻</span>
              <span>Integrate your <strong>latest dynamic programming commits</strong> from GitHub.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>💳</span>
              <span>Your payment gateways experience is highly aligned with <strong>Stripe's loop criteria</strong>.</span>
            </div>
          </div>
        </Card>
      </section>

    </div>
  );
}

const s = {
  input: {
    flex: 1,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
  },
};
styleInject(`
@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0); }
  40%           { transform: scale(1); }
}
`);

function styleInject(css) {
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  document.head.appendChild(style);
}
