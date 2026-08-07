import React, { useState, useEffect, useRef } from 'react';

export default function CursorGlow() {
  const [hoverType, setHoverType] = useState('none'); // 'none' | 'button' | 'card'
  const [visible, setVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const mousePos = useRef({ x: -100, y: -100 });
  const outerPos = useRef({ x: -100, y: -100 });
  const hoveredElementRef = useRef(null);
  
  // For velocity calculations (squash and stretch)
  const prevMousePos = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if device supports hover events
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    if (!hasMouse) return;

    setVisible(true);

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const btn = target.closest('a') || target.closest('button') || target.closest('.btn');
      const card = target.closest('.card-custom') || target.closest('.card') || target.closest('.rs-card');

      if (btn) {
        setHoverType('button');
        hoveredElementRef.current = btn;
      } else if (card) {
        setHoverType('card');
        hoveredElementRef.current = card;
      } else {
        setHoverType('none');
        hoveredElementRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -100, y: -100 };
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Lerp loop for smooth elastic movement (60fps)
    let rafId;
    const updateCursor = () => {
      let targetX = mousePos.current.x;
      let targetY = mousePos.current.y;

      // Magnetic effect: snap outer glow partially towards the hovered element center
      if (hoveredElementRef.current && hoverType === 'button') {
        const rect = hoveredElementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Blend mouse position and element center (60% snap weight)
        targetX = targetX + (centerX - targetX) * 0.45;
        targetY = targetY + (centerY - targetY) * 0.45;
      }

      // Linear Interpolation (lerp) formula: current + (target - current) * factor
      const lerpFactor = hoverType === 'button' ? 0.35 : 0.18; 
      outerPos.current.x += (targetX - outerPos.current.x) * lerpFactor;
      outerPos.current.y += (targetY - outerPos.current.y) * lerpFactor;

      // Velocity for squash & stretch
      velocity.current.x = mousePos.current.x - prevMousePos.current.x;
      velocity.current.y = mousePos.current.y - prevMousePos.current.y;
      
      prevMousePos.current.x = mousePos.current.x;
      prevMousePos.current.y = mousePos.current.y;

      // Calculate speed and angle
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
      const angle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI);
      
      // Squash and stretch amount (cap it so it doesn't stretch too much)
      const scaleX = 1 + Math.min(speed * 0.005, 0.4);
      const scaleY = 1 - Math.min(speed * 0.005, 0.2);

      // Disable stretch on button hover to maintain the magnetic circular feel
      const stretchTransform = hoverType === 'none' 
        ? `rotate(${angle}deg) scale(${scaleX}, ${scaleY})` 
        : '';

      // Update outer element transform style directly to bypass React render cycle overhead
      const outerEl = document.getElementById('cc-custom-cursor-outer');
      const innerEl = document.getElementById('cc-custom-cursor-inner');

      if (outerEl) {
        outerEl.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) ${stretchTransform}`;
      }
      if (innerEl) {
        innerEl.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(updateCursor);
    };

    rafId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, [hoverType]);

  if (!visible) return null;

  // Custom size/style values depending on active hover state
  const isHovered = hoverType !== 'none';
  const outerSize = hoverType === 'button' ? 56 : hoverType === 'card' ? 46 : 32;
  
  const outerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: `${outerSize}px`,
    height: `${outerSize}px`,
    marginTop: `-${outerSize / 2}px`,
    marginLeft: `-${outerSize / 2}px`,
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 999999,
    willChange: 'transform',
    // Gradient and box shadow
    background: hoverType === 'button'
      ? 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 75%)'
      : hoverType === 'card'
      ? 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 75%)'
      : 'rgba(37, 99, 235, 0.04)',
    backdropFilter: hoverType === 'button' ? 'blur(1px)' : 'none',
    border: hoverType === 'button'
      ? '1.5px solid rgba(14, 165, 233, 0.4)'
      : hoverType === 'card'
      ? '1.5px solid rgba(37, 99, 235, 0.3)'
      : '1.5px solid rgba(37, 99, 235, 0.15)',
    boxShadow: hoverType === 'button'
      ? '0 0 15px rgba(14, 165, 233, 0.3)'
      : 'none',
    transformOrigin: 'center center',
    transition: 'width 250ms cubic-bezier(0.25, 1, 0.5, 1), height 250ms cubic-bezier(0.25, 1, 0.5, 1), margin 250ms cubic-bezier(0.25, 1, 0.5, 1), background 250ms ease, border 250ms ease, box-shadow 250ms ease, backdrop-filter 250ms ease',
  };

  const innerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: isClicked ? '12px' : (isHovered ? '4px' : '7px'),
    height: isClicked ? '12px' : (isHovered ? '4px' : '7px'),
    marginTop: isClicked ? '-6px' : (isHovered ? '-2px' : '-3.5px'),
    marginLeft: isClicked ? '-6px' : (isHovered ? '-2px' : '-3.5px'),
    borderRadius: '50%',
    background: isClicked ? '#0ea5e9' : (hoverType === 'button' ? '#0ea5e9' : '#3b82f6'),
    pointerEvents: 'none',
    zIndex: 999999,
    willChange: 'transform, width, height',
    boxShadow: hoverType === 'button' || isClicked ? '0 0 12px #0ea5e9' : '0 0 6px #3b82f6',
    transition: 'width 200ms cubic-bezier(0.25, 1, 0.5, 1), height 200ms cubic-bezier(0.25, 1, 0.5, 1), margin 200ms cubic-bezier(0.25, 1, 0.5, 1), background 200ms ease, box-shadow 200ms ease',
  };

  return (
    <>
      <div id="cc-custom-cursor-outer" style={outerStyle} />
      <div id="cc-custom-cursor-inner" style={innerStyle} />
    </>
  );
}
