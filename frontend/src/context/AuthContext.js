import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const userData = await loginApi(email, password);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const result = await registerApi(name, email, password);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
