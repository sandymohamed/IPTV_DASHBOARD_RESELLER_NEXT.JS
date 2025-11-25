'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Box, LinearProgress, Backdrop } from '@mui/material';

interface NavigationContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Intercept all link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="/"]');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Only intercept internal navigation
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          setIsNavigating(true);
          setProgress(0);
        }
      }
    };

    // Intercept programmatic navigation (router.push, etc.)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      setIsNavigating(true);
      setProgress(0);
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      setIsNavigating(true);
      setProgress(0);
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('popstate', () => {
      setIsNavigating(true);
      setProgress(0);
    });

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', () => {
        setIsNavigating(true);
        setProgress(0);
      });
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (isNavigating) {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            return 85; // Keep at 85% until actual load
          }
          return prev + Math.random() * 10;
        });
      }, 100);

      // Complete after pathname actually changes (page loaded)
      const timeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsNavigating(false);
          setProgress(0);
        }, 200);
      }, 500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [pathname, isNavigating]);

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating: setIsNavigating }}>
      {/* Top Progress Bar */}
      {isNavigating && (
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
      )}

      {/* Subtle backdrop */}
      {isNavigating && (
        <Backdrop
          open={true}
          sx={{
            position: 'fixed',
            zIndex: 12000,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            backdropFilter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {children}
    </NavigationContext.Provider>
  );
}

