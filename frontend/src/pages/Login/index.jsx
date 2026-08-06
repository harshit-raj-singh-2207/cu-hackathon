import React, { useState } from 'react';
import '../../styles/auth.css';
import { login } from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMockSSO = (provider) => {
    setError(`${provider} login is not configured. Use your email and password.`);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-logo-row" style={{ justifyContent: 'center' }}>
          <div className="auth-logo-mark">CC</div>
          <span className="auth-logo-text">CareerCopilot</span>
        </div>

        <h1 className="auth-title" style={{ textAlign: 'center' }}>Sign in to CareerCopilot</h1>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
          Welcome back. Access your AI career workspace.
        </p>

        {/* OAuth Buttons */}
        <div className="auth-oauth-row">
          <button type="button" className="auth-oauth-btn" onClick={() => handleMockSSO('Google')}>
            <span style={{ color: '#ea4335', fontWeight: 900, fontSize: 16 }}>G</span>
            <span>Continue with Google</span>
          </button>
          <button type="button" className="auth-oauth-btn" onClick={() => handleMockSSO('LinkedIn')}>
            <span style={{ color: '#0077b5', fontWeight: 900, fontSize: 14 }}>in</span>
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span>or sign in with email</span>
          <span className="auth-divider__line" />
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="auth-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className={`auth-input${error && !email ? ' auth-input--error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
              <a href="/" className="auth-forgot-link">Forgot?</a>
            </div>
            <input
              id="login-password"
              type="password"
              className={`auth-input${error && password.length < 6 ? ' auth-input--error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <span className="auth-field-error">{error}</span>}

          <button
            type="submit"
            className="auth-btn-primary auth-btn-primary--full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Trust strip */}
        <div className="auth-trust-strip">
          <span className="auth-trust-item">🔒 SSL Encrypted</span>
          <span className="auth-trust-item">🛡️ SOC 2 Compliant</span>
          <span className="auth-trust-item">⚡ 2.4M+ Users</span>
        </div>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <a href="/register">Get started</a>
        </p>
      </div>
    </div>
  );
}
