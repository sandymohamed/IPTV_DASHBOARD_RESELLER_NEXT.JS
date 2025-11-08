'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Main from './Main';
import RouteLoader from '@/components/loading/RouteLoader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_COLLAPSED_KEY = 'nav-collapsed';

function DashboardLayout({ children }: DashboardLayoutProps) {
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
      <Header onOpenNav={handleOpenNav} onToggleNav={handleToggleNav} navCollapsed={navCollapsed} />
      <Sidebar openNav={openNav} onCloseNav={handleCloseNav} navCollapsed={navCollapsed} />
      <Main navCollapsed={navCollapsed}>{children}</Main>
    </Box>
  );
}

export default memo(DashboardLayout);
