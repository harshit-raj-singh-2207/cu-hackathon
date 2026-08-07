import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/navbar.css';

const NAV_LINKS = [
  { to: '/',          label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs',      label: 'Jobs' },
  { to: '/resume',    label: 'Resume' },
  { to: '/roadmap',   label: 'Roadmap' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cc_user');
    window.location.href = '/';
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">

          {/* ── Logo ── */}
          <a href="/" className="navbar__brand">
            <div className="navbar__logo-mark">CC</div>
            <span className="navbar__logo-text">CareerCopilot</span>
          </a>

          {/* ── Desktop Links ── */}
          <div className="navbar__links">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.to;
              return (
                <a
                  key={link.to}
                  href={link.to}
                  className={`navbar__link${isActive ? ' navbar__link--active' : ''}`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* ── Actions ── */}
          <div className="navbar__actions">
            {user ? (
              <>
                <a href="/profile" className="navbar__avatar">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </a>
                <button onClick={handleLogout} className="navbar__logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="navbar__signin-link">
                  Sign In
                </a>
                <a href="/register" className="navbar__cta-link">
                  Get Started <span>→</span>
                </a>
              </>
            )}

            {/* ── Hamburger (mobile) ── */}
            <button
              className={`navbar__hamburger${mobileOpen ? ' navbar__hamburger--open' : ''}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className="navbar__hamburger-line" />
              <span className="navbar__hamburger-line" />
              <span className="navbar__hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div className={`navbar__mobile-menu${mobileOpen ? ' navbar__mobile-menu--open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.to}
            href={link.to}
            className={`navbar__mobile-link${pathname === link.to ? ' navbar__mobile-link--active' : ''}`}
          >
            {link.label}
          </a>
        ))}
        <div className="navbar__mobile-divider" />
        <div className="navbar__mobile-actions">
          {user ? (
            <button onClick={handleLogout} className="navbar__logout-btn" style={{ width: '100%' }}>
              Logout
            </button>
          ) : (
            <>
              <a href="/login" className="navbar__mobile-link">Sign In</a>
              <a href="/register" className="navbar__mobile-cta">Get Started →</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
