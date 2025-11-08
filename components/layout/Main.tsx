'use client';

import { Box, Container } from '@mui/material';
import { HEADER, NAV } from '@/lib/config';
import { useTheme } from '@mui/material/styles';

interface MainProps {
  children: React.ReactNode;
  navCollapsed?: boolean;
}

export default function Main({ children, navCollapsed = false }: MainProps) {
  const theme = useTheme();
  const sidebarWidth = navCollapsed ? NAV.W_DASHBOARD_MINI : NAV.W_DASHBOARD;

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        pt: `${HEADER.H_DASHBOARD_DESKTOP + 24}px`,
        pb: 3,
        px: { xs: 1, sm: 2, md: 3 },
        width: { 
          xs: '100%',
          lg: `calc(100% - ${sidebarWidth}px)` 
        },
        ml: { xs: 0 },
        bgcolor: 'background.default',
        overflow: 'hidden',
        position: 'relative',
        transition: theme.transitions.create(['width'], {
          duration: theme.transitions.duration.shorter,
        }),
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
