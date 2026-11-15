import axios from 'axios';

// In development, Vite proxies /api to the Task-2 API (localhost:5001).
// In production, VITE_API_URL is the API's origin (without /api); leave it
// empty when the API is served from the same domain.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

// Attach the login token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task2_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 while logged in means the session has ended. Instead of reloading
// the page (which throws away whatever the user was doing and any message on
// screen), announce it: AuthContext listens, signs the user out, and the
// router takes them to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('task2_token')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Turns any failed request into a sentence that can be shown to the user.
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK' || error?.response?.status === 502) {
    return 'Cannot reach the server. Check that the API is running, then try again.';
  }
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
