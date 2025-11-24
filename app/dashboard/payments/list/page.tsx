export const dynamic = 'force-dynamic';
import { getAllTransactions } from '@/app/api/payments/route';
import PaymentsListClient from '@/components/dashboard/payments/PaymentsListClient';

export default async function PaymentsListPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    // Parse search term from URL params
    const searchTerm: { search_txt?: string; admin?: number; type?: number } = {};
    if (searchParams.search_txt) {
      searchTerm.search_txt = searchParams.search_txt as string;
    }
    if (searchParams.admin) {
      searchTerm.admin = parseInt(searchParams.admin as string);
    }
    if (searchParams.type) {
      searchTerm.type = parseInt(searchParams.type as string);
    }

    const data = await getAllTransactions({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '100'),
      searchTerm: Object.keys(searchTerm).length > 0 ? searchTerm : undefined,
    });

    // console.log("data from direct function call", data);
    initialData = data.result || [];
    totalCount = data.totalLength || 0;

  } catch (error) {
    console.error("Error fetching Payments:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load Payments';
  }

  return <PaymentsListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}