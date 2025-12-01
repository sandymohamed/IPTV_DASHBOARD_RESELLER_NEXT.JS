import { redirect } from 'next/navigation';
import CodesEditForm from '@/components/dashboard/codes/CodesEditForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getCodeById } from '@/lib/services/codesService';

export const dynamic = 'force-dynamic';

export default async function CodesEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/codes/edit/' + params.id);
  }

  let currentCode: any = null;
  let packages: any[] = [];
  let resellers: any[] = [];

  try {
    // Fetch code by ID
    currentCode = await getCodeById(params.id);

    // Fetch packages (cached)
    if (session?.user?.member_group_id) {
      const { getCachedPackages } = await import('@/lib/services/packagesService');
      packages = await getCachedPackages(session.user.member_group_id);
    }

    // Fetch resellers
    const { getSubResellers } = await import('@/lib/services/subResellersService');
    const resellersResult = await getSubResellers({ page: 1, pageSize: 1000 });
    resellers = resellersResult?.data || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/codes/edit/' + params.id);
    }
    console.error('Error fetching code data:', error);
  }

  if (!currentCode) {
    return (
      <div>
        <h1>Code not found</h1>
        <p>The code you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <CodesEditForm currentCode={currentCode} packages={packages} resellers={resellers} user={session.user} />;
}

