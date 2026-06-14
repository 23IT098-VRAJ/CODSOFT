import axios from 'axios';

// In development, Vite proxies /api to localhost:5000 automatically.
// In production, VITE_API_URL points to the deployed backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task2_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear local storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('task2_token');
      localStorage.removeItem('task2_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
