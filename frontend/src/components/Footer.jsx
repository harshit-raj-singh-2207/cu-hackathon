import React from 'react';

const FOOTER_LINKS = {
  Product:  ['Resume Analyzer','ATS Checker','Mock Interview','Coding Practice','Job Recommendations','Career Roadmap'],
  Company:  ['About Us','Blog','Careers','Press Kit','Partners','Contact'],
  Resources:['Documentation','Help Center','Community','API','Status','Changelog'],
  Legal:    ['Privacy Policy','Terms of Service','Cookie Policy','GDPR','Security'],
};

export default function Footer() {
  return (
    <footer style={{ background: '#f0f6ff', borderTop: '1px solid rgba(0, 0, 0, 0.08)', fontFamily: 'var(--font-sans)', width: '100%' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '64px 24px 32px' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '56px' }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '900',
                fontSize: '14px'
              }}>CC</div>
              <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.02em' }}>CareerCopilot</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.75', marginBottom: '20px', maxWidth: '280px' }}>
              Accelerate your professional trajectory with premium AI resume engineering, automated ATS analysis, dynamic mock interviews, and tailored recommendations.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['in', '𝕏', '▶', '◈'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([cat, links]) => (
            <div key={cat}>
              <p style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px'
              }}>{cat}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.map(l => (
                  <li key={l} style={{ marginBottom: '10px' }}>
                    <a
                      href="#"
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'color 200ms ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            © {new Date().getFullYear()} CareerCopilot AI Pvt. Ltd. · Made with ❤️ in Bengaluru
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Cookies'].map(l => (
              <a
                key={l}
                href="#"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'color 200ms ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
