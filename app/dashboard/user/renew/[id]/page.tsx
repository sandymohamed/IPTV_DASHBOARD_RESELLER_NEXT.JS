import { redirect } from 'next/navigation';
import UserRenewForm from '@/components/dashboard/user/UserRenewForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';

export const dynamic = 'force-dynamic';

export default async function UserRenewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/user/renew/' + params.id);
  }

  let currentUser: any = null;
  let packages: any[] = [];
  let templates: any[] = [];
  const balance = (session?.user as any)?.balance || 0;

  try {
    // Fetch user by ID
    const userResponse = await fetchWithAuth<any>(`/users/${params.id}`);
    currentUser = userResponse?.result || userResponse?.data || userResponse;

    // Fetch packages (cached)
    if (session?.user?.member_group_id) {
      const { getCachedPackages } = await import('@/lib/services/packagesService');
      packages = await getCachedPackages(session.user.member_group_id);
    }

    // Fetch templates
    try {
      const templatesResponse = await fetchWithAuth<any>('/templates');
      templates = templatesResponse?.data || templatesResponse?.result || templatesResponse || [];
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/user/renew/' + params.id);
    }
    console.error('Error fetching user data:', error);
  }

  if (!currentUser) {
    return (
      <div>
        <h1>User not found</h1>
        <p>The user you are trying to renew does not exist.</p>
      </div>
    );
  }

  return <UserRenewForm currentUser={currentUser} packages={packages} templates={templates} balance={balance} />;
}

