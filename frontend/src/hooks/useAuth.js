import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing auth state from localStorage.
 * Lightweight alternative to AuthContext for components that just need to check auth.
 */
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_access_token');
    localStorage.removeItem('cc_refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('cc_access_token');
  }, []);

  return { user, isAuthenticated, logout, getToken };
}
