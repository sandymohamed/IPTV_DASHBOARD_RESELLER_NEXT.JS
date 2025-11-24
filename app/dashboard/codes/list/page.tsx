export const dynamic = 'force-dynamic';
import { fetchTransactionsList } from '@/app/api/codes/route';
import CodesListClient from '@/components/dashboard/codes/CodesListClient';

export default async function CodesListPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  let initialData: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const data = await fetchTransactionsList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '10'),
      name: searchParams.name as string || undefined,
      admin: searchParams.admin ? parseInt(searchParams.admin as string) : undefined,
      date1: searchParams.date1 as string || undefined,
      date2: searchParams.date2 as string || undefined,
      id: searchParams.id ? parseInt(searchParams.id as string) : undefined,
      order: searchParams.order as string || undefined,
    });

    // console.log("data from direct function call", data);
    initialData = data.rows || [];
    totalCount = data.totalLength || 0;

  } catch (error) {
    console.error("Error fetching Codes Transactions:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load Codes Transactions';
  }

  return <CodesListClient initialData={initialData} totalCount={totalCount} initialError={initialError} />;
}