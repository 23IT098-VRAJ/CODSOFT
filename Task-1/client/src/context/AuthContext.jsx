import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import { useToast } from '../components/Toast';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user')) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  // Read synchronously so a page refresh never flashes the logged-out UI.
  const [user, setUser] = useState(readStoredUser);
  const { showToast } = useToast();

  const persist = useCallback((nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    (token, nextUser) => {
      localStorage.setItem('token', token);
      persist(nextUser);
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // On load, confirm the stored session with the server. This also picks up
  // changes made elsewhere (e.g. the account was promoted to admin).
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then(({ data }) => persist(data.user))
      .catch(() => {}); // a 401 is handled by the listener below
  }, [persist]);

  // The axios interceptor fires this when any request comes back 401.
  useEffect(() => {
    const onExpired = () => {
      logout();
      showToast('Your session has expired. Please log in again.', 'info');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout, showToast]);

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'admin', login, logout, updateUser: persist }),
    [user, login, logout, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
