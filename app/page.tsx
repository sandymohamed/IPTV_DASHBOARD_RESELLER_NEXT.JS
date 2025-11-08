'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { PATH_AFTER_LOGIN } from '@/lib/config';
import { Box, CircularProgress } from '@mui/material';

export default function HomePage() {
  const router = useRouter();
  const { isInitialized, isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.push(PATH_AFTER_LOGIN);
      } else {
        router.push('/auth/login');
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
