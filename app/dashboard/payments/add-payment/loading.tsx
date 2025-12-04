'use client';

import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="rectangular" width={100} height={40} sx={{ mr: 2, borderRadius: 1 }} />
        <Skeleton variant="text" width={200} height={40} />
      </Box>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

