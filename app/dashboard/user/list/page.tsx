
// app/users/page.tsx
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { getUsersList } from '@/app/api/users/route';
import UserListClient from '@/components/dashboard/user/UserListClient';

async function UserListContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let initialUsers: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    // ✅ Direct function call - no HTTP overhead
    const usersData = await getUsersList({
      page: parseInt((searchParams.page as string) || '1'),
      pageSize: parseInt((searchParams.pageSize as string) || '10'),
      searchTerm: (searchParams.search as string) || '',
      active_connections: searchParams.active_connections
        ? parseInt(searchParams.active_connections as string)
        : undefined,
      is_trial: searchParams.is_trial ? parseInt(searchParams.is_trial as string) : undefined,
    });

    initialUsers = usersData?.rows || [];
    totalCount = usersData?.total || 0;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Don't throw - return error state instead to prevent error page
    initialError = error instanceof Error ? error.message : 'Failed to load users';
  }

  return <UserListClient initialUsers={initialUsers} totalCount={totalCount} initialError={initialError} />;
}

export default async function UserListPage({
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
      <UserListContent searchParams={searchParams} />
    </Suspense>
  );
}