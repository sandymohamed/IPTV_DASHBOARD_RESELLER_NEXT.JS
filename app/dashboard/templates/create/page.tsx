import { redirect } from 'next/navigation';
import TemplateCreateForm from '@/components/dashboard/templates/TemplateCreateForm';
import { getServerSession } from '@/lib/auth/auth';
import { getCachedPackages } from '@/lib/services/packagesService';

export const dynamic = 'force-dynamic';

export default async function TemplatesCreatePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/templates/create');
  }

  let packages: any[] = [];

  if (session?.user?.member_group_id) {
    try {
      packages = await getCachedPackages(session.user.member_group_id);
    } catch (error) {
      console.error('Error fetching packages:', error);
      packages = [];
    }
  }

  return <TemplateCreateForm packages={packages} />;
}
