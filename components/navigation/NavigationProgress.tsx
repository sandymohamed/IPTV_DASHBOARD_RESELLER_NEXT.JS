'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, LinearProgress } from '@mui/material';

/**
 * NavigationProgress - Shows a progress bar at the top during navigation
 * This component intercepts navigation events and shows loading feedback
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (isPending) {
      // Navigation started
      setShowProgress(true);
      setProgress(10);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            return 80; // Keep at 80% until page actually loads
          }
          return prev + Math.random() * 8;
        });
      }, 150);

      return () => {
        clearInterval(interval);
      };
    } else {
      // Navigation completed
      setProgress(100);
      const timeout = setTimeout(() => {
        setShowProgress(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [isPending, pathname]);

  // Intercept all navigation events
  useEffect(() => {
    // Create a mutation observer to watch for navigation links
    const observer = new MutationObserver(() => {
      // Check if any links are being clicked
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('//') && href.startsWith('/')) {
            startTransition(() => {
              // Trigger transition for navigation
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  if (!showProgress) return null;

  return (
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
            backgroundColor: (theme) => theme.palette.primary.main,
            transition: progress === 100 
              ? 'transform 0.3s ease-out' 
              : 'transform 0.1s linear',
          },
        }}
      />
    </Box>
  );
}

