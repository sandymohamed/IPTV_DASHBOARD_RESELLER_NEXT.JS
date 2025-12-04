export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { getClientConnections } from '@/app/api/client-connection/route';
import ClientConnectionClient from '@/components/dashboard/client-connection/ClientConnectionClient';

async function ClientConnectionContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialConnections: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const data = await getClientConnections({
      page: parseInt((searchParams.page as string) || '1'),
      pageSize: parseInt((searchParams.pageSize as string) || '100'),
    });

    initialConnections = data?.result || [];
    totalCount = data?.total || data?.pagination || 0;
  } catch (error) {
    console.error('Error fetching client connections:', error);
    initialError = error instanceof Error ? error.message : 'Failed to load client connections';
  }

  return (
    <ClientConnectionClient
      initialConnections={initialConnections}
      totalCount={totalCount}
      initialError={initialError}
    />
  );
}

export default async function ClientConnectionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      }
    >
      <ClientConnectionContent searchParams={searchParams} />
    </Suspense>
  );
}