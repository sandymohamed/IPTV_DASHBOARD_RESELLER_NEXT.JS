export const dynamic = 'force-dynamic';

import MagsListClient from '@/components/dashboard/mags/MagsListClient';
import { getMagsList } from '@/app/api/mags/route';

export default async function MagsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  
  let initialMags: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const magsData = await getMagsList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '100'),
      searchTerm: searchParams.search as string || '',
      active_connections: searchParams.active_connections ? parseInt(searchParams.active_connections as string) : undefined,
      is_trial: searchParams.is_trial ? parseInt(searchParams.is_trial as string) : undefined
    });
    
    console.log("data from direct function call", magsData);
    initialMags = magsData.rows || [];
    totalCount = magsData.total || 0;
    
  } catch (error) {
    console.error("Error fetching mags:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load mags';
  }

  return <MagsListClient initialMags={initialMags} totalCount={totalCount} initialError={initialError} />;
}
