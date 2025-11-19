'use client';

import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { useSession } from 'next-auth/react';

// Create Axios instance (without interceptors - we'll add them per-request)
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client-side axios instance that uses NextAuth session
// This should be used in client components
export function createAuthenticatedAxios(apiToken: string | undefined) {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add Authorization header
  instance.interceptors.request.use(
    (config) => {
      if (apiToken) {
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401, redirect to login
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
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

  return instance;
}

// Hook to get authenticated axios instance in client components
export function useAuthenticatedAxios() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken;
  
  return createAuthenticatedAxios(apiToken);
}

// Default export for backward compatibility (but won't have auth token)
// Server components should use fetchWithAuth instead
export default axiosInstance;
