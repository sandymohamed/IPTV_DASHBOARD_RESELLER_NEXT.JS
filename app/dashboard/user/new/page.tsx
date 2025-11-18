import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import UserCreateForm from '@/components/dashboard/user/UserCreateForm';


export default async function UserCreatePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  let packages: any[] = [];

  // if (user?.member_group_id) {
  //   try {
  //     const response = await fetchWithAuth<any>(`/packages/${user.member_group_id}`);
  //     packages = response?.data || response?.result || response || [];
  //   } catch (error) {
  //     if (error instanceof AuthFetchError && error.status === 401) {
  //       redirect(buildLoginRedirect('/dashboard/user/new'));
  //     }
  //     packages = [];
  //   }
  // }

  return <UserCreateForm packages={packages} />;
}

