import { redirect } from 'next/navigation';
// import { cookies } from 'next/headers';

import UserCreateForm from '@/components/dashboard/user/UserCreateForm';
import { AuthFetchError } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';
import { getCachedPackages } from '@/lib/services/packagesService.server';

export const dynamic = 'force-dynamic';

export default async function UserCreatePage() {
  const session = await getServerSession();

  // Fetch packages and templates in parallel for better performance
  const [packagesResult, templatesResult] = await Promise.allSettled([
    session?.user?.member_group_id
      ? getCachedPackages(session.user.member_group_id)
      : Promise.resolve([]),
    getTemplatesList({ page: 1, pageSize: 100 }),
  ]);

  let packages: any[] = [];
  let templates: any[] = [];

  // Handle packages result
  if (packagesResult.status === 'fulfilled') {
    packages = packagesResult.value || [];
  } else {
    const error = packagesResult.reason;
    // Check for 401 authentication errors and redirect to login immediately
    if (error instanceof AuthFetchError && error.status === 401) {
      redirect('/auth/login?redirect=/dashboard/user/new');
    }
    // Also check if error has the AuthFetchError structure (for cases where instance check fails)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AuthFetchError') {
      const authError = error as any;
      if (authError.status === 401) {
        redirect('/auth/login?redirect=/dashboard/user/new');
      }
    }
    console.error('Error fetching packages:', error);
  }

  // Handle templates result
  if (templatesResult.status === 'fulfilled') {
    templates = templatesResult.value?.rows || [];
  } else {
    console.error('Error fetching templates:', templatesResult.reason);
  }

  return <UserCreateForm packages={packages} templates={templates} />;
}

