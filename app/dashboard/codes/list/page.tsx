import CodesListClient from '@/components/dashboard/codes/CodesListClient';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';

type CodesListPageProps = {
  searchParams?: {
    page?: string;
    pageSize?: string;
  };
};

type CodesPageResponse = {
  data?: Array<Record<string, any>>;
  result?: Array<Record<string, any>>;
  total?: number;
};

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export default async function CodesListPage({ searchParams }: CodesListPageProps) {
  const pageParam = Number(searchParams?.page ?? DEFAULT_PAGE);
  const pageSizeParam = Number(searchParams?.pageSize ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : DEFAULT_PAGE_SIZE;

  try {
    const response = await fetchWithAuth<CodesPageResponse>('/codes/page', {
      method: 'POST',
      body: JSON.stringify({
        page,
        pageSize,
      }),
    });

    const rows = response?.data ?? response?.result ?? [];
    const total = response?.total ?? rows.length;

    return (
      <CodesListClient
        rows={rows}
        total={total}
        page={Math.max(page - 1, 0)}
        pageSize={pageSize}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'We could not load the codes list. Please try again.';

    return (
      <CodesListClient
        rows={[]}
        total={0}
        page={0}
        pageSize={pageSize}
        error={message}
      />
    );
  }
}