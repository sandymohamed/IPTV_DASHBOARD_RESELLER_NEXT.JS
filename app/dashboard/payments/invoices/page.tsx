export const dynamic = 'force-dynamic';
import { getAllInvoicesList } from '@/app/api/payments/route';
import InvoicesListClient from '@/components/dashboard/payments/InvoicesListClient';

export default async function InvoicesListPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const data = await getAllInvoicesList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '100'),
      order: searchParams.order as string || 'trans_id:desc',
      Notes: searchParams.Notes as string || '',
      date1: searchParams.date1 as string || '',
      date2: searchParams.date2 as string || '',
      admin: searchParams.admin ? parseInt(searchParams.admin as string) : 0,
      depit: searchParams.depit as string || undefined,
    });

    console.log("data from direct function call", data);
    initialData = data.result || [];
    totalCount = data.total || 0;

  } catch (error) {
    console.error("Error fetching Invoices:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load Invoices';
  }

  return <InvoicesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}
