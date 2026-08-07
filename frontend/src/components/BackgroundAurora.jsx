import React, { useEffect, useRef } from 'react';

export default function BackgroundAurora() {
  const layerOrbsRef = useRef(null);
  const layerShapesRef = useRef(null);

  useEffect(() => {
    // Check if device supports hover/mouse events
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    if (!hasMouse) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const offsetX = clientX - centerX;
      const offsetY = clientY - centerY;

      // Apply subtle counter-move parallax translations to the orbs and shape layers
      if (layerOrbsRef.current) {
        layerOrbsRef.current.style.transform = `translate3d(${offsetX * -0.012}px, ${offsetY * -0.012}px, 0)`;
      }
      if (layerShapesRef.current) {
        layerShapesRef.current.style.transform = `translate3d(${offsetX * 0.022}px, ${offsetY * 0.022}px, 0)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -10,
      background: '#f0f6ff',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      
      {/* CSS Keyframes declaration */}
      <style>{`
        @keyframes ccFloatBlob1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -90px) scale(1.1); }
          66% { transform: translate(-40px, 50px) scale(0.92); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes ccFloatBlob2 {
          0% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-70px, 60px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1.05); }
        }
        @keyframes ccFloatBlob3 {
          0% { transform: translate(0px, 0px) scale(0.98); }
          33% { transform: translate(-50px, -60px) scale(1.08); }
          66% { transform: translate(50px, 40px) scale(0.92); }
          100% { transform: translate(0px, 0px) scale(0.98); }
        }
        @keyframes ccRiseParticle {
          0% { transform: translateY(105vh) translateX(0) scale(0.8); opacity: 0; }
          20% { opacity: 0.2; }
          80% { opacity: 0.2; }
          100% { transform: translateY(-10vh) translateX(60px) scale(1.1); opacity: 0; }
        }
        @keyframes ccSpinShape {
          0% { transform: rotate(0deg) translate(0, 0); }
          50% { transform: rotate(180deg) translate(20px, -20px); }
          100% { transform: rotate(360deg) translate(0, 0); }
        }
        @keyframes ccLightSweep {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
          15% { opacity: 0.15; }
          30% { transform: translateX(100%) translateY(100%) rotate(45deg); opacity: 0; }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); opacity: 0; }
        }
      `}</style>

      {/* Parallax Orbs Layer */}
      <div ref={layerOrbsRef} style={{ position: 'absolute', inset: 0, transition: 'transform 400ms cubic-bezier(0.1, 0.9, 0.2, 1)' }}>
        
        {/* Glowing Orb 1 - Purple */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0) 70%)',
          filter: 'blur(80px)',
          animation: 'ccFloatBlob1 25s infinite ease-in-out',
        }} />

        {/* Glowing Orb 2 - Cyan */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(14, 165, 233, 0) 70%)',
          filter: 'blur(85px)',
          animation: 'ccFloatBlob2 30s infinite ease-in-out',
        }} />

        {/* Glowing Orb 3 - Indigo */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '30%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(75px)',
          animation: 'ccFloatBlob3 28s infinite ease-in-out',
        }} />
      </div>

      {/* Sweeping Light Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '200%',
        height: '200%',
        background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.25), transparent)',
        animation: 'ccLightSweep 16s infinite linear',
        pointerEvents: 'none',
      }} />

      {/* Parallax Geometric Shapes Layer */}
      <div ref={layerShapesRef} style={{ position: 'absolute', inset: 0, transition: 'transform 600ms cubic-bezier(0.1, 0.9, 0.2, 1)' }}>
        
        {/* Hollow Overlapping Rings SVG */}
        <svg
          style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: '120px',
            height: '120px',
            opacity: 0.035,
            animation: 'ccSpinShape 45s infinite linear',
          }}
          viewBox="0 0 100 100"
        >
          <circle cx="45" cy="50" r="30" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
          <circle cx="55" cy="50" r="30" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        </svg>

        {/* Wireframe Triangle SVG */}
        <svg
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '12%',
            width: '80px',
            height: '80px',
            opacity: 0.03,
            animation: 'ccSpinShape 35s infinite linear reverse',
          }}
          viewBox="0 0 100 100"
        >
          <polygon points="50,15 90,85 10,85" fill="none" stroke="#2563eb" strokeWidth="2" />
        </svg>

        {/* Wireframe Square SVG */}
        <svg
          style={{
            position: 'absolute',
            top: '55%',
            right: '40%',
            width: '60px',
            height: '60px',
            opacity: 0.025,
            animation: 'ccSpinShape 40s infinite linear',
          }}
          viewBox="0 0 100 100"
        >
          <rect x="15" y="15" width="70" height="70" rx="6" fill="none" stroke="#6366f1" strokeWidth="2" />
        </svg>
      </div>

      {/* Soft Noise Texture Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.012,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      {/* Subtle floating particles (8 count) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const left = `${Math.random() * 95}%`;
        const size = `${Math.random() * 2.5 + 1.5}px`;
        const delay = `${Math.random() * 15}s`;
        const duration = `${Math.random() * 12 + 15}s`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              bottom: '-20px',
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.30)',
              boxShadow: '0 0 6px rgba(37, 99, 235, 0.20)',
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
              animation: `ccRiseParticle ${duration} linear infinite`,
              animationDelay: delay,
            }}
          />
        );
      })}

    </div>
  );
}
