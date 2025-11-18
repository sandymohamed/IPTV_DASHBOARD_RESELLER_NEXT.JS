'use client';

// NOTE: Legacy client-side auth context kept only for reference during the SSR migration.
// Prefer the server-based helpers in `lib/auth/session.ts` for new work.

import { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import axiosInstance from '@/lib/utils/axios';
import { isValidToken, setSession, getToken } from '@/lib/utils/auth';

interface User {
  id: string;
  adminid: string;
  email: string;
  username?: string;
  admin_name?: string;
  balance?: number;
  permissions?: string;
  [key: string]: any;
}

interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: () => Promise<void>;
}

const initialState: AuthState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
};

type AuthAction =
  | { type: 'INITIAL'; payload: { isAuthenticated: boolean; user: User | null } }
  | { type: 'LOGIN'; payload: User }
  | { type: 'UPDATE'; payload: User }
  | { type: 'LOGOUT' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INITIAL':
      return {
        isInitialized: true,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    case 'UPDATE':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isInitializing, setIsInitializing] = useState(false);

  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (state.isInitialized || isInitializing) return;
    setIsInitializing(true);

    try {
      const token = getToken();

      if (token && isValidToken(token)) {
        try {
          const response = await axiosInstance.get('/auth/my_account');
          const { payload } = response.data;

          await setSession(token);

          dispatch({
            type: 'INITIAL',
            payload: {
              isAuthenticated: true,
              user: payload,
            },
          });
        } catch (error) {
          await setSession(null);
          dispatch({
            type: 'INITIAL',
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } else {
        dispatch({
          type: 'INITIAL',
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'INITIAL',
        payload: {
          isAuthenticated: false,
          user: null,
        },
      });
    } finally {
      setIsInitializing(false);
    }
  }, [state.isInitialized, isInitializing]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // const response = await axiosInstance.post('/auth/login', {
      const response = await axiosInstance.post('/auth/login_perr', {
        email,
        password,
        ipAddress: '',
      });

      const { success, result, payload } = response.data;

      if (success) {
        await setSession(result);
        dispatch({
          type: 'LOGIN',
          payload,
        });
        return { success: true };
      } else {
        return { success: false, error: result || 'Login failed' };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  }, []);

  const updateUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/auth/my_account');
      const { payload } = response.data;

      dispatch({
        type: 'UPDATE',
        payload,
      });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    await setSession(null);
    dispatch({ type: 'LOGOUT' });
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath || '/')}`;
      window.location.href = loginUrl;
    }
  }, []);

  const memoizedValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
