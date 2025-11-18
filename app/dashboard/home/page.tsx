export const dynamic = 'force-dynamic';

import DashboardHomeClient, { DashboardStats } from '@/components/dashboard/home/DashboardHomeClient';
import { fetchWithAuth, AuthFetchError } from '@/lib/server/fetchWithAuth';

export default async function HomePage() {
  let stats: DashboardStats | null = null;
  let error: string | null = null;

  try {
    const data = await fetchWithAuth<DashboardStats>('/main/dashbord', { method: 'GET' });
    stats = data;
  } catch (err) {
    if (err instanceof AuthFetchError) {
      console.log("******err", err);
      error = err.status === 401 ? 'SESSION_EXPIRED' : err.message;
    } else if (err instanceof Error) {
      error = err.message;
    } else {
      error = 'Failed to load dashboard data';
    }
  }

  return <DashboardHomeClient stats={stats} error={error} />;
}
