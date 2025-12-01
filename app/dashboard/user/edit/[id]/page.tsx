import { redirect } from 'next/navigation';
import UserEditForm from '@/components/dashboard/user/UserEditForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';
import { getCachedPackages } from '@/lib/services/packagesService';

export const dynamic = 'force-dynamic';

export default async function UserEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/user/edit/' + params.id);
  }

  let currentUser: any = null;
  let packages: any[] = [];
  let templates: any[] = [];

  try {
    // Fetch user by ID
    const userResponse = await fetchWithAuth<any>(`/users/${params.id}`);
    currentUser = userResponse?.result || userResponse?.data || userResponse;

    // Fetch packages (cached)
    if (session?.user?.member_group_id) {
      packages = await getCachedPackages(session.user.member_group_id);
    }

    // Fetch templates
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/user/edit/' + params.id);
    }
    console.error('Error fetching user data:', error);
  }

  if (!currentUser) {
    return (
      <div>
        <h1>User not found</h1>
        <p>The user you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <UserEditForm currentUser={currentUser} packages={packages} templates={templates} />;
}

