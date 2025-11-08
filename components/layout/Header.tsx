'use client';

import { AppBar, Toolbar, IconButton, Stack, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsContext } from '@/lib/contexts/SettingsContext';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { HEADER, NAV } from '@/lib/config';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  onOpenNav: () => void;
  onToggleNav: () => void;
  navCollapsed: boolean;
}

function Header({ onOpenNav, onToggleNav, navCollapsed }: HeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    handleMenuClose();
    logout();
  }, [handleMenuClose, logout]);

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
        bgcolor: 'background.paper',
        borderBottom: `dashed 1px ${theme.palette.divider}`,
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
            color: 'text.primary',
            display: { lg: 'none' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          onClick={onToggleNav}
          sx={{
            mr: 1,
            color: 'text.primary',
            display: { xs: 'none', lg: 'inline-flex' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="center" spacing={2}>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.admin_name || user.username}
              </Typography>
              {user.balance !== undefined && (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                  ${user.balance}
                </Typography>
              )}
            </Box>
          )}
          
          <IconButton onClick={handleMenuOpen} size="small">
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.admin_name?.[0] || user?.username?.[0] || 'U'}
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
              <AccountCircleIcon sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
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
