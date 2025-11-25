'use client';

import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { useSession, getSession } from 'next-auth/react';

// Create Axios instance with authentication interceptor
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header dynamically
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get session token dynamically for each request
    try {
      const session = await getSession();
      const apiToken = (session as any)?.apiToken;
      if (apiToken) {
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
    } catch (error) {
      console.error('Failed to get session for axios request:', error);
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

// Default export - automatically includes authentication token from NextAuth session
// This instance gets the token dynamically on each request
// Server components should use fetchWithAuth instead
export default axiosInstance;
