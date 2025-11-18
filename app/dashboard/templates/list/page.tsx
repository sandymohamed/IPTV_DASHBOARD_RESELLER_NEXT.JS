import TemplatesListClient from '@/components/dashboard/templates/TemplatesListClient';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';

type TemplatesResponse = {
  data?: Array<Record<string, any>>;
  result?: Array<Record<string, any>>;
};

export const dynamic = 'force-dynamic';

export default async function TemplatesListPage() {
  try {
    const response = await fetchWithAuth<TemplatesResponse>('/templates', {
      method: 'GET',
    });

    const rows = response?.data ?? response?.result ?? [];

    return <TemplatesListClient rows={rows} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'We could not load the templates list. Please try again later.';

    return <TemplatesListClient rows={[]} error={message} />;
  }
}