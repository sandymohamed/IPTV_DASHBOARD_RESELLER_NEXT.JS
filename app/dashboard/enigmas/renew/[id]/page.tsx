import { redirect } from 'next/navigation';
import EnigmasRenewForm from '@/components/dashboard/enigmas/EnigmasRenewForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';

export const dynamic = 'force-dynamic';

export default async function EnigmasRenewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/enigmas/renew/' + params.id);
  }

  let currentEnigma: any = null;
  let packages: any[] = [];
  let templates: any[] = [];
  const balance = (session?.user as any)?.balance || 0;

  try {
    // Fetch enigma by ID
    const enigmaResponse = await fetchWithAuth<any>(`/enigmas/${params.id}`);
    currentEnigma = enigmaResponse?.result || enigmaResponse?.data || enigmaResponse;

    // Fetch packages
    if (session?.user?.member_group_id) {
      const packagesResponse = await fetchWithAuth<any>(`/packages/${session?.user.member_group_id}`);
      packages = packagesResponse?.data || packagesResponse?.result || packagesResponse || [];
    }

    // Fetch templates
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/enigmas/renew/' + params.id);
    }
    console.error('Error fetching enigma data:', error);
  }

  if (!currentEnigma) {
    return (
      <div>
        <h1>Enigma device not found</h1>
        <p>The Enigma device you are trying to renew does not exist.</p>
      </div>
    );
  }

  return <EnigmasRenewForm currentEnigma={currentEnigma} packages={packages} templates={templates} balance={balance} />;
}

