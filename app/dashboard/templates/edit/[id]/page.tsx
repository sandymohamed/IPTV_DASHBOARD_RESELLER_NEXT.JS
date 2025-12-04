import { redirect } from 'next/navigation';
import TemplateEditForm from '@/components/dashboard/templates/TemplateEditForm';
import { getServerSession } from '@/lib/auth/auth';
import { getCachedPackages } from '@/lib/services/packagesService';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';

export const dynamic = 'force-dynamic';

export default async function TemplatesEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/templates/edit/' + params.id);
  }

  let currentTemplate: any = null;
  let packages: any[] = [];

  try {
    // Fetch template by ID
    const templateResponse = await fetchWithAuth<any>(`/templates/${params.id}`);
    currentTemplate = templateResponse?.result || templateResponse?.data || templateResponse;

    // Fetch packages (cached)
    if (session?.user?.member_group_id) {
      packages = await getCachedPackages(session.user.member_group_id);
    }

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Template Edit Page - Data loaded:', {
        templateId: params.id,
        template: currentTemplate ? {
          id: currentTemplate.id,
          title: currentTemplate.title,
          package: currentTemplate.package,
          hasBouquets: !!currentTemplate.bouquets,
          hasNewOrder: !!currentTemplate.new_order,
        } : 'NOT FOUND',
        packagesCount: packages.length,
        firstPackage: packages[0] ? {
          id: packages[0].id,
          name: packages[0].package_name,
          hasBouquetsData: !!packages[0].bouquetsdata,
          bouquetsCount: Array.isArray(packages[0].bouquetsdata) ? packages[0].bouquetsdata.length : 0,
        } : 'NO PACKAGES',
      });
    }
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/templates/edit/' + params.id);
    }
    console.error('Error fetching template data:', error);
  }

  if (!currentTemplate) {
    return (
      <div>
        <h1>Template not found</h1>
        <p>The template you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <TemplateEditForm currentTemplate={currentTemplate} packages={packages} />;
}

