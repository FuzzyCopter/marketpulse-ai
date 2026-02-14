import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mp_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — refresh token or clear auth state (no hard redirects)
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth endpoints to avoid loops
    if (originalRequest?.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('mp_refresh_token');

      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('mp_access_token', data.accessToken);
          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(originalRequest);
        } catch {
          isRefreshing = false;
          localStorage.removeItem('mp_access_token');
          localStorage.removeItem('mp_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
