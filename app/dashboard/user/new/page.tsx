import { redirect } from 'next/navigation';
// import { cookies } from 'next/headers';

import UserCreateForm from '@/components/dashboard/user/UserCreateForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';


export default async function UserCreatePage() {
  const session = await getServerSession();


  let packages: any[] = [];

  if (session?.user?.member_group_id) {
    try {
      const response = await fetchWithAuth<any>(`/packages/${session?.user.member_group_id}`);
      console.log("response from packages", response);
      packages = response?.data || response?.result || response || [];
    } catch (error) {
      if (error instanceof AuthFetchError && (error as any).status === 401) {
        redirect('/auth/login?redirect=/dashboard/user/new');
      }
      packages = [];
    }
  }

  return <UserCreateForm packages={packages} />;
}

