import { redirect } from 'next/navigation';
import MagsEditForm from '@/components/dashboard/mags/MagsEditForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';

export const dynamic = 'force-dynamic';

export default async function MagsEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/mags/edit/' + params.id);
  }

  let currentMag: any = null;
  let templates: any[] = [];

  try {
    // Fetch mag by ID
    const magResponse = await fetchWithAuth<any>(`/mags/${params.id}`);
    currentMag = magResponse?.result || magResponse?.data || magResponse;

    // Fetch templates
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/mags/edit/' + params.id);
    }
    console.error('Error fetching mag data:', error);
  }

  if (!currentMag) {
    return (
      <div>
        <h1>MAG device not found</h1>
        <p>The MAG device you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <MagsEditForm currentMag={currentMag} templates={templates} />;
}

