'use client';

import { useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { alpha, createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { useSettingsContext } from '@/lib/contexts/SettingsContext';
import palette from './palette';
import typography from './typography';
import shadows from './shadows';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useSettingsContext();

  const theme = useMemo(() => {
    const paletteConfig = palette(themeMode);
    const shadowsConfig = shadows(themeMode);
    const dividerColor = alpha(paletteConfig.grey[500], 0.12);
    const subtleOverlay =
      themeMode === 'light' ? '0 10px 30px rgba(145, 158, 171, 0.16)' : '0 10px 30px rgba(15, 23, 42, 0.28)';

    return createTheme({
      palette: paletteConfig,
      typography,
      shape: { borderRadius: 10 },
      shadows: shadowsConfig,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: paletteConfig.background.default,
              color: paletteConfig.text.primary,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderRadius: 16,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: paletteConfig.background.paper,
              borderRadius: 18,
              border: themeMode === 'light' ? `1px solid ${dividerColor}` : `1px solid ${alpha('#1f2937', 0.4)}`,
              boxShadow: subtleOverlay,
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              '&:hover': {
                boxShadow:
                  themeMode === 'light'
                    ? '0 16px 40px rgba(145, 158, 171, 0.2)'
                    : '0 18px 36px rgba(15, 23, 42, 0.35)',
                transform: 'translateY(-2px)',
              },
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              backgroundColor: paletteConfig.background.paper,
              borderRadius: 16,
              border: `1px solid ${dividerColor}`,
              boxShadow: subtleOverlay,
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              backgroundColor: alpha(paletteConfig.primary.main, 0.06),
              '& .MuiTableCell-head': {
                color: paletteConfig.primary.darker,
                fontWeight: 600,
              },
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              '&:nth-of-type(odd)': {
                backgroundColor: alpha(paletteConfig.primary.main, themeMode === 'light' ? 0.04 : 0.02),
              },
              '&:hover': {
                backgroundColor: alpha(paletteConfig.primary.main, themeMode === 'light' ? 0.08 : 0.06),
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              transition: 'background-color 0.2s ease, color 0.2s ease',
            },
          },
        },
      },
    });
  }, [themeMode]);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
