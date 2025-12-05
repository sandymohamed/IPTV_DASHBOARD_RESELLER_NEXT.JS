'use client';

import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { useSession, getSession } from 'next-auth/react';

// Global loading state management
let loadingCount = 0;
let setLoadingGlobal: ((loading: boolean) => void) | null = null;

export function setLoadingHandler(handler: (loading: boolean) => void) {
  setLoadingGlobal = handler;
}

function incrementLoading() {
  loadingCount++;
  if (setLoadingGlobal && loadingCount === 1) {
    setLoadingGlobal(true);
  }
}

function decrementLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (setLoadingGlobal && loadingCount === 0) {
    setLoadingGlobal(false);
  }
}

// Create Axios instance with authentication interceptor
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header dynamically and show loading
axiosInstance.interceptors.request.use(
  async (config) => {
    // Show loading indicator
    incrementLoading();
    
    // Get session token dynamically for each request
    try {
      const session = await getSession();
      const apiToken = (session as any)?.apiToken;
      if (apiToken) {
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
    } catch (error) {
      // Silently fail
    }
    return config;
  },
  (error) => {
    decrementLoading();
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and hide loading
axiosInstance.interceptors.response.use(
  (response) => {
    decrementLoading();
    return response;
  },
  async (error) => {
    decrementLoading();
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


  

  // Request interceptor to add Authorization header and show loading
  instance.interceptors.request.use(
    (config) => {
      incrementLoading();
      if (apiToken) {
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
      return config;
    },
    (error) => {
      decrementLoading();
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors and hide loading
  instance.interceptors.response.use(
    (response) => {
      decrementLoading();
      return response;
    },
    async (error) => {
      decrementLoading();
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
