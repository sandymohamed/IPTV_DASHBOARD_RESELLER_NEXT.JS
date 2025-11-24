export const dynamic = 'force-dynamic';
import { getAllSubInvoices } from '@/app/api/payments/route';
import SubInvoicesListClient from '@/components/dashboard/payments/SubInvoicesListClient';

export default async function SubInvoicesListPage({ searchParams }: {
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

    const data = await getAllSubInvoices({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '30'),
      order: searchParams.order as string || 'trans_id:desc',
      searchTerm: Object.keys(searchTerm).length > 0 ? searchTerm : undefined,
      date1: searchParams.date1 as string || undefined,
      date2: searchParams.date2 as string || undefined,
      view_sub: searchParams.view_sub ? parseInt(searchParams.view_sub as string) : 0,
    });

    console.log("data from direct function call", data);
    initialData = data.result || [];
    totalCount = data.total || 0;

  } catch (error) {
    console.error("Error fetching Sub-Invoices:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load Sub-Invoices';
  }

  return <SubInvoicesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}
