export const dynamic = 'force-dynamic';
import { getTemplatesList } from '@/app/api/templates/route';
import TemplatesListClient from '@/components/dashboard/templates/TemplatesListClient';




export default async function TemplatesListPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;


  try {
    const data = await getTemplatesList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '100'),
      searchTerm: searchParams.search as string || '',
    });

    // console.log("data from direct function call", data);
    initialData = data.rows || [];
    totalCount = data.total || 0;

  } catch (error) {
    console.error("Error fetching Templates:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load Templates';
  }


  return <TemplatesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}