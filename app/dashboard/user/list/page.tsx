// export const dynamic = 'force-dynamic';

// import UserListClient from '@/components/dashboard/user/UserListClient';
// import { fetchWithAuth, AuthFetchError } from '@/lib/server/fetchWithAuth';
// import { User } from '@/lib/services/userService';

// interface UsersResponse {
//   result?: User[];
//   data?: User[];
//   total?: number;
//   [key: string]: any;
// }

// export default async function UserListPage() {
//   let initialUsers: User[] = [];
//   let initialError: string | null = null;

//   try {
//     const response = await fetch('/api/users').then(res => res.json()).then(data => {
//       console.log("data from api/users", data)
//       initialUsers = data.result || data.data || []
//     })

//     console.log("response from api/users", response)

//     // const response = await fetchWithAuth<UsersResponse>('users/page', {
//     //   method: 'POST',
//     //   body: JSON.stringify({ page: 1, pageSize: 100, searchTerm: {} }),
//     // });

//     // initialUsers = (response?.result || response?.data || []) as User[];
//   } catch (error) {
//     if (error instanceof AuthFetchError) {
//       initialError = error.status === 401 ? 'SESSION_EXPIRED' : error.message;
//     } else if (error instanceof Error) {
//       initialError = error.message;
//     } else {
//       initialError = 'Failed to load users';
//     }
//   }

//   return <UserListClient initialUsers={initialUsers} initialError={initialError} />;
// }


// app/users/page.tsx - SIMPLIFIED VERSION
export const dynamic = 'force-dynamic';

import UserListClient from '@/components/dashboard/user/UserListClient';
import { getUsersList } from '@/app/api/users/route';

export default async function UserListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  
  let initialUsers: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    // ✅ Direct function call - no HTTP overhead
    const usersData = await getUsersList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '10'),
      searchTerm: searchParams.search as string || '',
      active_connections: searchParams.active_connections ? parseInt(searchParams.active_connections as string) : undefined,
      is_trial: searchParams.is_trial ? parseInt(searchParams.is_trial as string) : undefined
    });
    
    console.log("data from direct function call", usersData);
    initialUsers = usersData.rows || [];
    totalCount = usersData.total || 0;
    
  } catch (error) {
    console.error("Error fetching users:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load users';
  }

  return <UserListClient initialUsers={initialUsers} totalCount={totalCount} initialError={initialError} />;
}