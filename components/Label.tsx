'use client';

import { forwardRef } from 'react';
import { useTheme, alpha, styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const StyledLabel = styled(Box)<{
  ownerState: {
    color?: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
    variant?: 'filled' | 'outlined' | 'ghost' | 'soft';
  };
}>(({ theme, ownerState }) => {
  const isLight = theme.palette.mode === 'light';
  const { color = 'default', variant = 'soft' } = ownerState;

  const filledVariant = variant === 'filled';
  const outlinedVariant = variant === 'outlined';
  const softVariant = variant === 'soft';

  const defaultStyle = {
    ...(color === 'default' && {
      ...(outlinedVariant && {
        backgroundColor: 'transparent',
        color: theme.palette.text.primary,
        border: `1px solid ${alpha(theme.palette.grey[500], 0.32)}`,
      }),
      ...(softVariant && {
        color: isLight ? theme.palette.text.primary : theme.palette.common.white,
        backgroundColor: alpha(theme.palette.grey[500], 0.16),
      }),
    }),
  };

  const colorStyle = {
    ...(color !== 'default' && {
      ...(filledVariant && {
        color: theme.palette[color]?.contrastText || theme.palette.common.white,
        backgroundColor: theme.palette[color]?.main || theme.palette.grey[500],
      }),
      ...(outlinedVariant && {
        backgroundColor: 'transparent',
        color: theme.palette[color]?.main || theme.palette.grey[500],
        border: `1px solid ${theme.palette[color]?.main || theme.palette.grey[500]}`,
      }),
      ...(softVariant && {
        color: theme.palette[color]?.[isLight ? 'dark' : 'light'] || theme.palette.grey[500],
        backgroundColor: alpha(theme.palette[color]?.main || theme.palette.grey[500], 0.16),
      }),
      ...(variant === 'ghost' && {
        color: theme.palette[color]?.main || theme.palette.grey[500],
        backgroundColor: 'transparent',
      }),
    }),
  };

  return {
    height: 24,
    minWidth: 22,
    lineHeight: 0,
    borderRadius: 6,
    cursor: 'default',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    justifyContent: 'center',
    textTransform: 'capitalize',
    padding: theme.spacing(0, 1),
    color: theme.palette.grey[800],
    fontSize: theme.typography.pxToRem(12),
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.grey[300],
    fontWeight: theme.typography.fontWeightBold,
    ...colorStyle,
    ...defaultStyle,
  };
});

interface LabelProps {
  children: React.ReactNode;
  color?: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  variant?: 'filled' | 'outlined' | 'ghost' | 'soft';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sx?: object;
  [key: string]: any;
}

const Label = forwardRef<HTMLDivElement, LabelProps>(
  ({ children, color = 'default', variant = 'soft', startIcon, endIcon, sx, ...other }, ref) => {
    const theme = useTheme();

    const iconStyle = {
      width: 16,
      height: 16,
      '& svg, img': { width: 1, height: 1, objectFit: 'cover' },
    };

    return (
      <StyledLabel
        ref={ref}
        component="span"
        ownerState={{ color, variant }}
        sx={{
          ...(startIcon && { pl: 0.75 }),
          ...(endIcon && { pr: 0.75 }),
          fontSize: `${theme.typography.pxToRem(11)}`,
          ...sx,
        }}
        {...other}
      >
        {startIcon && <Box sx={{ mr: 0.75, ...iconStyle }}>{startIcon}</Box>}
        {children}
        {endIcon && <Box sx={{ ml: 0.75, ...iconStyle }}>{endIcon}</Box>}
      </StyledLabel>
    );
  }
);

Label.displayName = 'Label';

export default Label;

