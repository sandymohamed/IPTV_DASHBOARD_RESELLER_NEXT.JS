import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import DashboardHomeClient, { DashboardStats } from '@/components/dashboard/home/DashboardHomeClient';

async function fetchDashboard(): Promise<{ stats: DashboardStats | null; error: string | null }> {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  const baseUrl = API_BASE_URL.replace(/\/$/, '');

  if (!token) {
    return { stats: null, error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const response = await fetch(`${baseUrl}/main/dashbord`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { stats: null, error: 'Your session has expired. Please sign in again.' };
      }
      const text = await response.text();
      throw new Error(text || 'Failed to load dashboard data');
    }

    const data = await response.json();
    return { stats: data as DashboardStats, error: null };
  } catch (error: any) {
    return { stats: null, error: error.message || 'Failed to load dashboard data' };
  }
}

export default async function HomePage() {
  const { stats, error } = await fetchDashboard();
  return <DashboardHomeClient stats={stats} error={error} />;
}
