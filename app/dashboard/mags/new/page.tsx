import { redirect } from 'next/navigation';
import MagsCreateForm from '@/components/dashboard/mags/MagsCreateForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';

export const dynamic = 'force-dynamic';

export default async function MagsCreatePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/mags/new');
  }

  let packages: any[] = [];
  let templates: any[] = [];

  if (session?.user?.member_group_id) {
    try {
      const response = await fetchWithAuth<any>(`/packages/${session?.user.member_group_id}`);
      packages = response?.data || response?.result || response || [];
    } catch (error) {
      if (error instanceof AuthFetchError && (error as any).status === 401) {
        redirect('/auth/login?redirect=/dashboard/mags/new');
      }
      packages = [];
    }
  }

  // Fetch templates
  try {
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    templates = [];
  }

  return <MagsCreateForm packages={packages} templates={templates} />;
}

