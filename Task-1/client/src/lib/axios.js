import axios from 'axios';

// VITE_API_URL lets a split deployment (e.g. Vercel + Render) point at a
// remote API. Without it: same-origin /api in production, localhost in dev.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token on any request signs the user out everywhere.
// AuthContext listens for this event; login/register failures are excluded
// because a 401 there just means "wrong password".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt && localStorage.getItem('token')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Turns any failed request into a sentence that can be shown to the user.
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.';
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  return fallback;
};

// Field-level validation errors from the API as { fieldName: message }.
export const fieldErrors = (error) => {
  const out = {};
  for (const e of error?.response?.data?.errors || []) {
    const key = String(e.field || '').split('.').pop();
    if (key && !out[key]) out[key] = e.message;
  }
  return out;
};

export default api;
