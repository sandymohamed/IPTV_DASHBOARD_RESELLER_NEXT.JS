import { redirect } from 'next/navigation';
import UserEditForm from '@/components/dashboard/user/UserEditForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';
import { getCachedPackages } from '@/lib/services/packagesService.server';

export const dynamic = 'force-dynamic';

export default async function UserEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/user/edit/' + params.id);
  }

  // Fetch user, packages, and templates in parallel for better performance
  const [userResult, packagesResult, templatesResult] = await Promise.allSettled([
    fetchWithAuth<any>(`/users/${params.id}`),
    session?.user?.member_group_id
      ? getCachedPackages(session.user.member_group_id)
      : Promise.resolve([]),
    getTemplatesList({ page: 1, pageSize: 100 }),
  ]);

  let currentUser: any = null;
  let packages: any[] = [];
  let templates: any[] = [];

  // Handle user result
  if (userResult.status === 'fulfilled') {
    currentUser = userResult.value?.result || userResult.value?.data || userResult.value;
  } else {
    const error = userResult.reason;
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/user/edit/' + params.id);
    }
    console.error('Error fetching user data:', error);
  }

  // Handle packages result
  if (packagesResult.status === 'fulfilled') {
    packages = packagesResult.value || [];
  } else {
    console.error('Error fetching packages:', packagesResult.reason);
  }

  // Handle templates result
  if (templatesResult.status === 'fulfilled') {
    templates = templatesResult.value?.rows || [];
  } else {
    console.error('Error fetching templates:', templatesResult.reason);
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

