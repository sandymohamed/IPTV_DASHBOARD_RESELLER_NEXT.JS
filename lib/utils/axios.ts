import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { getToken, setSession } from './auth';

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, logout and redirect
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await setSession(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(
      (error.response && error.response.data) || error.message || 'Something went wrong'
    );
  }
);

export default axiosInstance;
