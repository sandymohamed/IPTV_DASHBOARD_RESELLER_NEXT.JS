export const dynamic = 'force-dynamic';

import EnigmasListClient from '@/components/dashboard/enigmas/EnigmasListClient';
import { getEnigmasList } from '@/app/api/enigmas/route';

export default async function EnigmasListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  
  let initialEnigmas: any[] = [];
  let totalCount = 0;
  let initialError: string | null = null;

  try {
    const enigmasData = await getEnigmasList({
      page: parseInt(searchParams.page as string || '1'),
      pageSize: parseInt(searchParams.pageSize as string || '100'),
      searchTerm: searchParams.search as string || '',
      active_connections: searchParams.active_connections ? parseInt(searchParams.active_connections as string) : undefined,
      is_trial: searchParams.is_trial ? parseInt(searchParams.is_trial as string) : undefined
    });
    
    // console.log("data from direct function call", enigmasData);
    initialEnigmas = enigmasData.rows || [];
    totalCount = enigmasData.total || 0;
    
  } catch (error) {
    console.error("Error fetching enigmas:", error);
    initialError = error instanceof Error ? error.message : 'Failed to load enigmas';
  }

  return <EnigmasListClient initialEnigmas={initialEnigmas} totalCount={totalCount} initialError={initialError} />;
}
