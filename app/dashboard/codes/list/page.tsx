export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { fetchTransactionsList } from '@/app/api/codes/route';
import CodesListClient from '@/components/dashboard/codes/CodesListClient';

async function CodesListContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const data = await fetchTransactionsList({
      page: parseInt((searchParams.page as string) || '1'),
      pageSize: parseInt((searchParams.pageSize as string) || '10'),
      name: (searchParams.name as string) || undefined,
      admin: searchParams.admin ? parseInt(searchParams.admin as string) : undefined,
      date1: (searchParams.date1 as string) || undefined,
      date2: (searchParams.date2 as string) || undefined,
      id: searchParams.id ? parseInt(searchParams.id as string) : undefined,
      order: (searchParams.order as string) || undefined,
    });

    initialData = data.rows || [];
    totalCount = data.totalLength || 0;
  } catch (error) {
    console.error('Error fetching Codes Transactions:', error);
    initialError = error instanceof Error ? error.message : 'Failed to load Codes Transactions';
  }

  return <CodesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}

export default async function CodesListPage({
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
      <CodesListContent searchParams={searchParams} />
    </Suspense>
  );
}