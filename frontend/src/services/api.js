export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

export function clearAuthSession() {
  localStorage.removeItem('cc_access_token');
  localStorage.removeItem('cc_refresh_token');
  localStorage.removeItem('cc_user');
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('cc_refresh_token');
  if (!refreshToken) return null;
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  localStorage.setItem('cc_access_token', data.access_token);
  return data.access_token;
}

export async function apiRequest(path, options = {}, retry = true) {
  const token = localStorage.getItem('cc_access_token');
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest(path, options, false);
    clearAuthSession();
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = Array.isArray(data?.detail) ? data.detail.map(item => item.msg).join(', ') : data?.detail;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
  return data;
}
