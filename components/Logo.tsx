'use client';

import NextLink from 'next/link';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  sx?: object;
}

export default function Logo({ sx }: LogoProps) {
  return (
    <NextLink href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          overflow: 'hidden',

          ...sx,
        }}
      >
        <Box
          component="img"
          src="/logo/logo_single.svg"
          alt="Logo"
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
          sx={{
            width: 40,
            height: 40,
            overflow: 'hidden',
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          IPTV Dashboard
        </Typography>
      </Box>
    </NextLink>
  );
}
