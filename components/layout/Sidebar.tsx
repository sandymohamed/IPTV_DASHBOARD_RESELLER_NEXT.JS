'use client';

import { memo, useMemo } from 'react';
import { Box, Drawer, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NAV } from '@/lib/config';
import Logo from '../Logo';
import NavSection from '../nav-section/NavSection';
import { navConfig } from '@/lib/navigation/config';

interface SidebarProps {
  openNav: boolean;
  onCloseNav: () => void;
  navCollapsed: boolean;
}

// Custom Scrollbar component
const CustomScrollbar = memo(function CustomScrollbar({ children, sx, ...other }: { children: React.ReactNode; sx?: any; [key: string]: any }) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        overflow: 'auto',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
});

function Sidebar({ openNav, onCloseNav, navCollapsed }: SidebarProps) {
  const theme = useTheme();

  const sidebarWidth = navCollapsed ? NAV.W_DASHBOARD_MINI : NAV.W_DASHBOARD;

  const renderContent = useMemo(() => (
    <CustomScrollbar
      sx={{
        height: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        spacing={3}
        sx={{
          pt: 3,
          pb: 2,
          px: navCollapsed ? 1.5 : 2.5,
          flexShrink: 0,
          alignItems: navCollapsed ? 'center' : 'flex-start',
        }}
      >
        <Logo sx={{ width: navCollapsed ? 40 : 'auto' }} />
      </Stack>

      <NavSection data={navConfig} navCollapsed={navCollapsed} />
    </CustomScrollbar>
  ), [navCollapsed]);

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: sidebarWidth },
      }}
    >
      <Drawer
        open
        variant="permanent"
        PaperProps={{
          sx: {
            zIndex: 1000,
            width: sidebarWidth,
            bgcolor: 'background.default',
            borderRight: `dashed 1px ${theme.palette.divider}`,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            transition: theme.transitions.create('width', {
              duration: theme.transitions.duration.shorter,
            }),
            display: { xs: 'none', md: 'none', lg: 'block' },
          },
        }}
      >
        {renderContent}
      </Drawer>

      <Drawer
        open={openNav}
        onClose={onCloseNav}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: NAV.W_DASHBOARD,
            bgcolor: 'background.default',
            zIndex: 1200,
          },
        }}
        sx={{
          display: { lg: 'none' },
          zIndex: 1200,
        }}
      >
        {renderContent}
      </Drawer>
    </Box>
  );
}

export default memo(Sidebar);
