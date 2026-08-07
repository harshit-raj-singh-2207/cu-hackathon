import React from 'react';

export default function Loader({ type = 'page', lines = 3, style = {} }) {
  if (type === 'skeleton') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: i === 0 ? '24px' : '14px',
              width: i === 0 ? '40%' : i === lines - 1 ? '60%' : '90%',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'card-skeleton') {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          ...style
        }}
      >
        <Loader type="skeleton" lines={lines} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        ...style
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid rgba(124, 58, 237, 0.1)',
          borderTopColor: '#7c3aed',
          borderRightColor: '#06b6d4',
          animation: 'spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        }}
      />
    </div>
  );
}
