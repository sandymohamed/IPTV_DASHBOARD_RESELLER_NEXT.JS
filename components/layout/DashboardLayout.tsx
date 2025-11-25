'use client';

import { useState, memo, useCallback, useEffect, Suspense } from 'react';
import { Box } from '@mui/material';
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
  const [openNav, setOpenNav] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

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
      </Box>
    </DashboardUserProvider>
  );
}

export default memo(DashboardLayout);
