'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { PATH_AFTER_LOGIN } from '@/lib/config';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isInitialized, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const loginPath = '/auth/login';
      const currentPath = pathname || '/';
      
      // Don't redirect if already on login page
      if (currentPath !== loginPath) {
        router.push(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [isInitialized, isAuthenticated, router, pathname]);

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
