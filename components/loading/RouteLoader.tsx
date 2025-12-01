'use client';

import { useEffect, useState, useTransition, startTransition as reactStartTransition } from 'react';
import { usePathname } from 'next/navigation';
import { Box, LinearProgress, Backdrop } from '@mui/material';

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Track navigation start via link clicks and custom events
  useEffect(() => {

    console.log("from RouteLoader")

    let progressInterval: NodeJS.Timeout | null = null;
    let startTimeout: NodeJS.Timeout | null = null;

    const startLoading = () => {
      // Delay showing loader for fast navigations (< 200ms)
      startTimeout = setTimeout(() => {
        setLoading(true);
        setProgress(0);
        
        // Simulate progress
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) return 85;
            return prev + Math.random() * 8;
          });
        }, 100);
      }, 200);
    };

    const stopLoading = () => {
      // Clear delayed start if navigation completed quickly
      if (startTimeout) {
        clearTimeout(startTimeout);
        startTimeout = null;
      }
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200); // Reduced from 300ms
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="/"]');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Only intercept internal navigation
        if (href && !href.startsWith('//') && href !== pathname) {
          startLoading();
        }
      }
    };

    // Listen for programmatic navigation
    const handleNavigationStart = () => {
      startLoading();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('navigation-start', handleNavigationStart);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('navigation-start', handleNavigationStart);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (startTimeout) {
        clearTimeout(startTimeout);
      }
    };
  }, [pathname]);

  // Complete loading when pathname changes (page loaded)
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timeout = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [pathname, loading]);

  if (!loading) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 13000,
          height: '3px',
          pointerEvents: 'none',
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: '3px',
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'primary.main',
              transition: progress === 100 
                ? 'transform 0.3s ease-out' 
                : 'transform 0.1s linear',
            },
          }}
        />
      </Box>

      {/* Subtle backdrop overlay - removed to reduce perceived lag */}
    </>
  );
}

