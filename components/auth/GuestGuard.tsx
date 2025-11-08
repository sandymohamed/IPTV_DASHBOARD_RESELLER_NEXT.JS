'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { PATH_AFTER_LOGIN } from '@/lib/config';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * Guard for pages that should only be accessible when NOT authenticated (like login)
 */
export default function GuestGuard({ children }: GuestGuardProps) {
  const { isInitialized, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(PATH_AFTER_LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

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

  // If authenticated, don't render children (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
