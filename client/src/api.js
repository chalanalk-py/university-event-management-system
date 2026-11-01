import axios from 'axios';

// Resolve backend server URL from environment or default to localhost
export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Construct base API URL
export const API_BASE = `${SERVER_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
