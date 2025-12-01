export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { getTemplatesList } from '@/app/api/templates/route';
import TemplatesListClient from '@/components/dashboard/templates/TemplatesListClient';

async function TemplatesListContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const data = await getTemplatesList({
      page: parseInt((searchParams.page as string) || '1'),
      pageSize: parseInt((searchParams.pageSize as string) || '100'),
      searchTerm: (searchParams.search as string) || '',
    });

    initialData = data.rows || [];
    totalCount = data.total || 0;
  } catch (error) {
    console.error('Error fetching Templates:', error);
    initialError = error instanceof Error ? error.message : 'Failed to load Templates';
  }

  return <TemplatesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}

export default async function TemplatesListPage({
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
      <TemplatesListContent searchParams={searchParams} />
    </Suspense>
  );
}