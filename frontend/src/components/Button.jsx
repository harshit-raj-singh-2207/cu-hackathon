import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'glow'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  style = {},
  className = '',
  ...props
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '10px',
    fontWeight: '600',
    fontFamily: 'var(--font-sans)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    width: style.width || 'auto',
  };

  // Variant Styles
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-secondary)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
    },
    glow: {
      background: 'rgba(124, 58, 237, 0.15)',
      color: 'var(--primary-light)',
      border: '1px solid rgba(124, 58, 237, 0.3)',
      boxShadow: '0 0 15px rgba(124, 58, 237, 0.15)',
    }
  };

  // Size Styles
  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: '0.8rem',
    },
    md: {
      padding: '10px 18px',
      fontSize: '0.9rem',
    },
    lg: {
      padding: '14px 24px',
      fontSize: '1rem',
    }
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  const combinedStyles = {
    ...baseStyle,
    ...currentVariant,
    ...currentSize,
    ...style,
  };

  // Micro-interactions / hover via event listeners or simple style classes
  const handleMouseEnter = (e) => {
    if (disabled || loading) return;
    if (variant === 'primary') {
      e.currentTarget.style.filter = 'brightness(1.1)';
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.35)';
    } else if (variant === 'secondary' || variant === 'outline') {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    } else if (variant === 'ghost') {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.color = 'var(--text-primary)';
    } else if (variant === 'glow') {
      e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
      e.currentTarget.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.3)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled || loading) return;
    e.currentTarget.style.filter = 'none';
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.background = currentVariant.background;
    e.currentTarget.style.borderColor = currentVariant.border ? currentVariant.border.replace('1px solid ', '') : 'none';
    e.currentTarget.style.boxShadow = currentVariant.boxShadow || 'none';
    e.currentTarget.style.color = currentVariant.color;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={combinedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`btn-custom ${className}`}
      {...props}
    >
      {loading ? (
        <span style={spinnerStyle} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
        </>
      )}
    </button>
  );
}

const spinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#ffffff',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
  display: 'inline-block',
};
