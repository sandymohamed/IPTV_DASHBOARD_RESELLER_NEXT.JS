'use client';

import { useState, memo, useCallback, useEffect, Suspense, useRef } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Header from './Header';
import Sidebar from './Sidebar';
import Main from './Main';
import RouteLoader from '@/components/loading/RouteLoader';
import { DashboardUserProvider } from '@/lib/contexts/DashboardUserContext';
import DashboardLoading from '@/app/dashboard/loading';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
}

const NAV_COLLAPSED_KEY = 'nav-collapsed';

function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const theme = useTheme();
  const [openNav, setOpenNav] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(NAV_COLLAPSED_KEY);
      if (saved !== null) {
        setNavCollapsed(JSON.parse(saved));
      }
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify(navCollapsed));
    }
  }, [navCollapsed]);

  // Find and monitor the scrollable container
  useEffect(() => {
    const findScrollContainer = () => {
      // Find the main scrollable container in the Main component
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // Look for the scrollable box - it's the Box with overflowY: 'auto' inside Container
        const container = mainElement.querySelector('div[class*="MuiContainer"]');
        if (container) {
          const scrollableBox = container.querySelector('div[style*="overflow-y"]') as HTMLElement;
          if (scrollableBox) {
            const style = getComputedStyle(scrollableBox);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              scrollContainerRef.current = scrollableBox;
              return scrollableBox;
            }
          }
        }
        // Fallback: check all divs in main for scrollable ones
        const allDivs = mainElement.querySelectorAll('div');
        for (const div of allDivs) {
          const style = getComputedStyle(div);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            if (div.scrollHeight > div.clientHeight) {
              scrollContainerRef.current = div;
              return div;
            }
          }
        }
      }
      return null;
    };

    let cleanup: (() => void) | undefined;

    const checkScroll = () => {
      const container = findScrollContainer();
      
      if (!container) {
        setShowTopButton(false);
        setShowBottomButton(false);
        return;
      }

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        
        setShowTopButton(scrollTop > 100);
        setShowBottomButton(scrollTop + clientHeight < scrollHeight - 100);
      };

      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check

      cleanup = () => {
        container.removeEventListener('scroll', handleScroll);
      };
    };

    // Wait a bit for the DOM to be ready
    const timer = setTimeout(checkScroll, 200);

    // Also check when route changes or content updates
    const observer = new MutationObserver(() => {
      // Debounce the check
      setTimeout(checkScroll, 100);
    });

    const mainElement = document.querySelector('main');
    if (mainElement) {
      observer.observe(mainElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }

    // Also check on window resize
    const handleResize = () => {
      setTimeout(checkScroll, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [children, navCollapsed]);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleCloseNav = useCallback(() => {
    setOpenNav(false);
  }, []);

  const handleOpenNav = useCallback(() => {
    setOpenNav(true);
  }, []);

  const handleToggleNav = useCallback(() => {
    setNavCollapsed((prev) => !prev);
  }, []);

  return (
    <DashboardUserProvider user={user}>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <RouteLoader />
        <Header
          user={user}
          onOpenNav={handleOpenNav}
          onToggleNav={handleToggleNav}
          navCollapsed={navCollapsed}
        />
        <Sidebar openNav={openNav} onCloseNav={handleCloseNav} navCollapsed={navCollapsed} />
        <Main navCollapsed={navCollapsed}>
          <Suspense fallback={<DashboardLoading />}>
            {children}
          </Suspense>
        </Main>

        {/* Scroll Buttons */}
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            zIndex: theme.zIndex.speedDial,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {showTopButton && (
            <Tooltip title="Scroll to top" placement="left" arrow>
              <Fab
                color="primary"
                size="medium"
                onClick={scrollToTop}
                sx={{
                  boxShadow: theme.shadows[8],
                  '&:hover': {
                    boxShadow: theme.shadows[12],
                    transform: 'translateY(-2px)',
                  },
                  transition: theme.transitions.create(['transform', 'box-shadow'], {
                    duration: theme.transitions.duration.short,
                  }),
                }}
              >
                <KeyboardArrowUpIcon />
              </Fab>
            </Tooltip>
          )}

          {showBottomButton && (
            <Tooltip title="Scroll to bottom" placement="left" arrow>
              <Fab
                color="secondary"
                size="medium"
                onClick={scrollToBottom}
                sx={{
                  boxShadow: theme.shadows[8],
                  '&:hover': {
                    boxShadow: theme.shadows[12],
                    transform: 'translateY(2px)',
                  },
                  transition: theme.transitions.create(['transform', 'box-shadow'], {
                    duration: theme.transitions.duration.short,
                  }),
                }}
              >
                <KeyboardArrowDownIcon />
              </Fab>
            </Tooltip>
          )}
        </Box>
      </Box>
    </DashboardUserProvider>
  );
}

export default memo(DashboardLayout);
