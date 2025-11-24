'use client';

import { AppBar, Toolbar, IconButton, Stack, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useState, memo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HEADER, NAV } from '@/lib/config';
import ThemeToggle from '../ThemeToggle';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  onOpenNav: () => void;
  onToggleNav: () => void;
  navCollapsed: boolean;
  user: any;
}

function Header({ onOpenNav, onToggleNav, navCollapsed, user }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(async () => {
    handleMenuClose();
    startTransition(async () => {
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    });
  }, [handleMenuClose, startTransition]);

  const handleProfile = useCallback(() => {
    handleMenuClose();
    router.push('/dashboard/account');
  }, [handleMenuClose, router]);

  const sidebarWidth = navCollapsed ? NAV.W_DASHBOARD_MINI : NAV.W_DASHBOARD;

  return (
    <AppBar
      position="fixed"
      sx={{
        boxShadow: 'none',
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        bgcolor: '#ffffff',
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'margin-left'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...{
          width: { xs: '100%', lg: `calc(100% - ${sidebarWidth}px)` },
          height: { xs: HEADER.H_MOBILE, lg: HEADER.H_DASHBOARD_DESKTOP },
          ml: { xs: 0, lg: `${sidebarWidth}px` },
        },
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { xs: 2, lg: 3 },
        }}
      >
        <IconButton
          onClick={onOpenNav}
          sx={{
            mr: 1,
            color: '#6366f1',
            display: { lg: 'none' },
            '&:hover': {
              color: '#4f46e5',
              bgcolor: 'rgba(99, 102, 241, 0.08)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          onClick={onToggleNav}
          sx={{
            mr: 1,
            color: '#6366f1',
            display: { xs: 'none', lg: 'inline-flex' },
            '&:hover': {
              color: '#4f46e5',
              bgcolor: 'rgba(99, 102, 241, 0.08)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="center" spacing={2}>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.adm_username || user.name || user.email}
              </Typography>
              {user.balance !== undefined && (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                  ${user.balance}
                </Typography>
              )}
            </Box>
          )}
          
          <IconButton onClick={handleMenuOpen} size="small">
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
              }}
            >
              {user?.adm_username?.[0] || user?.name?.[0] || user?.email?.[0] || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleProfile}>
              <AccountCircleIcon sx={{ mr: 1, color: '#10b981' }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout} disabled={isPending}>
              <LogoutIcon sx={{ mr: 1, color: '#ef4444' }} />
              Logout
            </MenuItem>
          </Menu>

          <ThemeToggle />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default memo(Header);
