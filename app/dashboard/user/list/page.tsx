export const dynamic = 'force-dynamic';

import UserListClient from '@/components/dashboard/user/UserListClient';
import { fetchWithAuth, AuthFetchError } from '@/lib/server/fetchWithAuth';
import { User } from '@/lib/services/userService';

interface UsersResponse {
  result?: User[];
  data?: User[];
  total?: number;
  [key: string]: any;
}

export default async function UserListPage() {
  let initialUsers: User[] = [];
  let initialError: string | null = null;

  try {
    const response = await fetchWithAuth<UsersResponse>('users/page', {
      method: 'POST',
      body: JSON.stringify({ page: 1, pageSize: 100, searchTerm: {} }),
    });

    initialUsers = (response?.result || response?.data || []) as User[];
  } catch (error) {
    if (error instanceof AuthFetchError) {
      initialError = error.status === 401 ? 'SESSION_EXPIRED' : error.message;
    } else if (error instanceof Error) {
      initialError = error.message;
    } else {
      initialError = 'Failed to load users';
    }
  }

  return <UserListClient initialUsers={initialUsers} initialError={initialError} />;
}
