import axios from 'axios';

// Use the Vite proxy (/api → http://localhost:3000/api)
// In production, set VITE_API_URL env variable
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Global response error handling
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

// ─── Auth ────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) => api.post('/api/auth/login',    { email, password }),
  register: (email: string, password: string) => api.post('/api/auth/register', { email, password }),
};

// ─── Dashboard ───────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/api/dashboard/summary'),
  getTrends:  () => api.get('/api/dashboard/trends'),
};

// ─── Financial Records ───────────────────────────
export const recordsApi = {
  getAll:  (params?: Record<string, string>) => api.get('/api/records', { params }),
  create:  (data: any)  => api.post('/api/records', data),
  update:  (id: string, data: any) => api.put(`/api/records/${id}`, data),
  delete:  (id: string) => api.delete(`/api/records/${id}`),
};

// ─── Users ───────────────────────────────────────
export const usersApi = {
  getAll:  ()                       => api.get('/api/users'),
  update:  (id: string, data: any)  => api.patch(`/api/users/${id}`, data),
};

export default api;
