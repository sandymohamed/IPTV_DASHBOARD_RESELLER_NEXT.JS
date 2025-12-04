import { redirect } from 'next/navigation';
import MagsRenewForm from '@/components/dashboard/mags/MagsRenewForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';

export const dynamic = 'force-dynamic';

export default async function MagsRenewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/mags/renew/' + params.id);
  }

  let currentMag: any = null;
  let packages: any[] = [];
  let templates: any[] = [];
  const balance = (session?.user as any)?.balance || 0;

  try {
    // Fetch mag by ID
    const magResponse = await fetchWithAuth<any>(`/mags/${params.id}`);
    currentMag = magResponse?.result || magResponse?.data || magResponse;

    // Fetch packages (cached)
    if (session?.user?.member_group_id) {
      const { getCachedPackages } = await import('@/lib/services/packagesService.server');
      packages = await getCachedPackages(session.user.member_group_id);
    }

    // Fetch templates
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/mags/renew/' + params.id);
    }
    console.error('Error fetching mag data:', error);
  }

  if (!currentMag) {
    return (
      <div>
        <h1>MAG device not found</h1>
        <p>The MAG device you are trying to renew does not exist.</p>
      </div>
    );
  }

  return <MagsRenewForm currentMag={currentMag} packages={packages} templates={templates} balance={balance} />;
}

