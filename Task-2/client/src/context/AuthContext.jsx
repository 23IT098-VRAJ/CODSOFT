import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return localStorage.getItem('task2_token') ? JSON.parse(localStorage.getItem('task2_user')) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Read synchronously, so a refresh never flashes the logged-out screen.
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback((nextUser) => {
    localStorage.setItem('task2_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    (data) => {
      localStorage.setItem('task2_token', data.token);
      persist(data.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('task2_token');
    localStorage.removeItem('task2_user');
    setUser(null);
  }, []);

  // On load, confirm the stored session with the server (and pick up a
  // changed name). A 401 here is handled by the listener below.
  useEffect(() => {
    if (!localStorage.getItem('task2_token')) return;
    api.get('/api/auth/me').then(({ data }) => persist(data.user)).catch(() => {});
  }, [persist]);

  // The axios interceptor fires this when any request comes back 401.
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout, updateUser: persist }),
    [user, login, logout, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
