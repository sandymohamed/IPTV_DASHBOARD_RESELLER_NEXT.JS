'use client';

import { Box, Container, Typography, Stack } from '@mui/material';
import LoginForm from '@/components/auth/LoginForm';
import GuestGuard from '@/components/auth/GuestGuard';

export default function LoginPage() {
  return (
    <GuestGuard>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={3} sx={{ mb: 5 }}>
            <Typography variant="h4" textAlign="center">
              Sign in to IPTV Dashboard
            </Typography>
          </Stack>
          <LoginForm />
        </Container>
      </Box>
    </GuestGuard>
  );
}
