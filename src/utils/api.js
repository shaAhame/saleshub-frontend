import axios from 'axios';
import { getToken, clearSession } from './session';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status;
    const isLogin = err.config?.url?.includes('/auth/login');
    // 401 = token invalid/expired, 403 on /auth/me = account blocked → force logout
    if (!isLogin && (status === 401 || (status === 403 && err.config?.url?.includes('/auth/me')))) {
      clearSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
