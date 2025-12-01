import { redirect } from 'next/navigation';
import CodesCreateForm from '@/components/dashboard/codes/CodesCreateForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getSubResellers } from '@/lib/services/subResellersService';

export const dynamic = 'force-dynamic';

export default async function CodesCreatePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/codes/add-code');
  }

  let packages: any[] = [];
  let resellers: any[] = [];

  if (session?.user?.member_group_id) {
    try {
      const response = await fetchWithAuth<any>(`/packages/${session?.user.member_group_id}`);
      packages = response?.data || response?.result || response || [];
    } catch (error) {
      if (error instanceof AuthFetchError && (error as any).status === 401) {
        redirect('/auth/login?redirect=/dashboard/codes/add-code');
      }
      console.error('Error fetching packages:', error);
      packages = [];
    }
  }

  try {
    const resellersResult = await getSubResellers({ page: 1, pageSize: 1000 });
    resellers = resellersResult?.data || [];
  } catch (error) {
    console.error('Error fetching resellers:', error);
    resellers = [];
  }

  return <CodesCreateForm packages={packages} resellers={resellers} user={session.user} />;
}
