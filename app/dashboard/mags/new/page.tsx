import { redirect } from 'next/navigation';
import MagsCreateForm from '@/components/dashboard/mags/MagsCreateForm';
import { AuthFetchError } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';
import { getCachedPackages } from '@/lib/services/packagesService.server';

export const dynamic = 'force-dynamic';

export default async function MagsCreatePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/mags/new');
  }

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
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/mags/new');
    }
    console.error('Error fetching packages:', error);
  }

  // Handle templates result
  if (templatesResult.status === 'fulfilled') {
    templates = templatesResult.value?.rows || [];
  } else {
    console.error('Error fetching templates:', templatesResult.reason);
  }

  return <MagsCreateForm packages={packages} templates={templates} />;
}

