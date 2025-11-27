import { redirect } from 'next/navigation';
import EnigmasEditForm from '@/components/dashboard/enigmas/EnigmasEditForm';
import { AuthFetchError, fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { getTemplatesList } from '@/app/api/templates/route';

export const dynamic = 'force-dynamic';

export default async function EnigmasEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/enigmas/edit/' + params.id);
  }

  let currentEnigma: any = null;
  let templates: any[] = [];

  try {
    // Fetch enigma by ID
    const enigmaResponse = await fetchWithAuth<any>(`/enigmas/${params.id}`);
    currentEnigma = enigmaResponse?.result || enigmaResponse?.data || enigmaResponse;

    // Fetch templates
    const templatesData = await getTemplatesList({ page: 1, pageSize: 100 });
    templates = templatesData?.rows || [];
  } catch (error) {
    if (error instanceof AuthFetchError && (error as any).status === 401) {
      redirect('/auth/login?redirect=/dashboard/enigmas/edit/' + params.id);
    }
    console.error('Error fetching enigma data:', error);
  }

  if (!currentEnigma) {
    return (
      <div>
        <h1>Enigma device not found</h1>
        <p>The Enigma device you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <EnigmasEditForm currentEnigma={currentEnigma} templates={templates} />;
}

