import { apiRequest, clearAuthSession } from './api';

/* ── Helper: check if the backend is reachable ─────────────── */
let _backendAlive = null; // null = unknown, true/false = cached

async function isBackendUp() {
  if (_backendAlive !== null) return _backendAlive;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/health', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    _backendAlive = res.ok;
  } catch {
    _backendAlive = false;
  }
  // Re-check after 30 seconds
  setTimeout(() => { _backendAlive = null; }, 30000);
  return _backendAlive;
}


/* ── Mock auth helpers ─────────────────────────────────────── */
function mockUser(email, name) {
  return {
    id: 'mock-user-' + Date.now(),
    email,
    name: name || email.split('@')[0],
    role: 'Student / Fresher',
    avatar: null,
    created_at: new Date().toISOString(),
  };
}

function mockTokens() {
  return {
    access_token: 'mock-access-' + Date.now(),
    refresh_token: 'mock-refresh-' + Date.now(),
  };
}

/* ── Login ─────────────────────────────────────────────────── */
export async function login(email, password) {
  const backendUp = await isBackendUp();

  if (backendUp) {
    // Real backend flow
    try {
      const tokens = await apiRequest('/auth/login/json', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('cc_access_token', tokens.access_token);
      localStorage.setItem('cc_refresh_token', tokens.refresh_token);
      const user = await apiRequest('/auth/me');
      localStorage.setItem('cc_user', JSON.stringify(user));
      return user;
    } catch (error) {
      clearAuthSession();
      throw error;
    }
  }

  // Mock / offline mode — accept any credentials
  console.info('[Auth] Backend offline — using mock login.');
  const tokens = mockTokens();
  localStorage.setItem('cc_access_token', tokens.access_token);
  localStorage.setItem('cc_refresh_token', tokens.refresh_token);

  // Check if the user registered locally before
  const stored = localStorage.getItem('cc_registered_users');
  const registeredUsers = stored ? JSON.parse(stored) : [];
  const match = registeredUsers.find((u) => u.email === email);

  const user = match
    ? { ...match, id: match.id || 'mock-user-' + Date.now() }
    : mockUser(email);

  localStorage.setItem('cc_user', JSON.stringify(user));
  return user;
}

/* ── Register ──────────────────────────────────────────────── */
export async function register(name, email, password) {
  const backendUp = await isBackendUp();

  if (backendUp) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Mock / offline mode
  console.info('[Auth] Backend offline — using mock registration.');
  const stored = localStorage.getItem('cc_registered_users');
  const registeredUsers = stored ? JSON.parse(stored) : [];

  if (registeredUsers.some((u) => u.email === email)) {
    throw new Error('An account with this email already exists.');
  }

  const user = mockUser(email, name);
  registeredUsers.push(user);
  localStorage.setItem('cc_registered_users', JSON.stringify(registeredUsers));
  return { message: 'Registration successful', user };
}

/* ── Logout ────────────────────────────────────────────────── */
export async function logout() {
  const backendUp = await isBackendUp();
  if (backendUp) {
    try {
      await apiRequest('/auth/logout', { method: 'POST' }, false);
    } catch { /* ignore */ }
  }
  clearAuthSession();
}
