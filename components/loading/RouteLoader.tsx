'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, CircularProgress, LinearProgress } from '@mui/material';

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 50);

    // Complete loading after route change
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }, 300);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '4px',
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: '4px',
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      />
    </Box>
  );
}

