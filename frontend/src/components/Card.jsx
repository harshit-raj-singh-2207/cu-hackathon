import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  action,
  glow = false,
  interactive = false,
  style = {},
  className = '',
  onClick,
  ...props
}) {
  const cardStyle = {
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick || interactive ? 'pointer' : 'default',
    ...style,
  };

  const handleMouseEnter = (e) => {
    if (!interactive && !onClick) return;
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.08), 0 0 20px rgba(37, 99, 235, 0.08)';
    if (glow) {
      const shine = e.currentTarget.querySelector('.card-shine');
      if (shine) shine.style.opacity = '0.15';
    }
  };

  const handleMouseLeave = (e) => {
    if (!interactive && !onClick) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.boxShadow = 'none';
    if (glow) {
      const shine = e.currentTarget.querySelector('.card-shine');
      if (shine) shine.style.opacity = '0';
    }
  };

  return (
    <article
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`card-custom ${className}`}
      {...props}
    >
      {/* Background glow orb */}
      {glow && (
        <div
          className="card-shine"
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 300ms ease',
          }}
        />
      )}

      {/* Header */}
      {(title || subtitle || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  marginBottom: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </article>
  );
}
