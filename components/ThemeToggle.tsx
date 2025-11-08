'use client';

import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { alpha, useTheme } from '@mui/material/styles';
import { useSettingsContext } from '@/lib/contexts/SettingsContext';

export default function ThemeToggle() {
  const { themeMode, onToggleMode } = useSettingsContext();
  const theme = useTheme();
  const isLight = themeMode === 'light';

  const hoverBg = isLight ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.common.white, 0.16);
  const baseBg = isLight ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.common.white, 0.08);
  const borderColor = isLight
    ? alpha(theme.palette.primary.main, 0.24)
    : alpha(theme.palette.common.white, 0.24);

  return (
    <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
      <IconButton
        onClick={onToggleMode}
        sx={{
          bgcolor: baseBg,
          color: isLight ? theme.palette.primary.dark : theme.palette.common.white,
          border: `1px solid ${borderColor}`,
          boxShadow: theme.shadows.z8,
          '&:hover': {
            bgcolor: hoverBg,
          },
        }}
      >
        {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
