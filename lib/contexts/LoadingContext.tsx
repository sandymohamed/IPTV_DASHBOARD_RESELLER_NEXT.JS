'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';
import { setLoadingHandler } from '@/lib/utils/axios';

interface LoadingContextType {
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Register the loading handler with axios
  useEffect(() => {
    setLoadingHandler(setLoading);
    return () => {
      setLoadingHandler(() => {});
    };
  }, [setLoading]);

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading }}>
      {children}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={48} />
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Loading...
          </Typography>
        </Box>
      </Backdrop>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

