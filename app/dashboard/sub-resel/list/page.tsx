export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { getSubResellersList } from '@/app/api/resellers/route';
import SubResellersListClient from '@/components/dashboard/sub-resel/SubResellersListClient';

async function SubResellersListContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    // Parse search term from URL params
    const searchTerm: { username?: string; admin_name?: string } = {};
    if (searchParams.username) {
      searchTerm.username = searchParams.username as string;
    }
    if (searchParams.admin_name) {
      searchTerm.admin_name = searchParams.admin_name as string;
    }

    const data = await getSubResellersList({
      page: parseInt((searchParams.page as string) || '1'),
      pageSize: parseInt((searchParams.pageSize as string) || '10'),
      searchTerm: Object.keys(searchTerm).length > 0 ? searchTerm : undefined,
    });

    initialData = data.result || [];
    totalCount = data.totalLength || 0;
  } catch (error) {
    console.error('Error fetching Sub-Resellers:', error);
    initialError = error instanceof Error ? error.message : 'Failed to load Sub-Resellers';
  }

  return <SubResellersListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}

export default async function SubResellersListPage({
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
      <SubResellersListContent searchParams={searchParams} />
    </Suspense>
  );
}





