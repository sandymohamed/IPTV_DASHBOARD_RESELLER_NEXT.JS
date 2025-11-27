import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

/**
 * Caches streaming servers query for 5 minutes
 * Streaming servers rarely change, so we can cache aggressively
 */
export async function getStreamingServer() {
  return unstable_cache(
    async () => {
      const servers: any = await db.query(`SELECT * FROM streaming_servers ORDER BY id ASC LIMIT 1`);
      return servers && servers.length > 0 ? servers[0] : null;
    },
    ['streaming-server'], // Cache key
    { revalidate: 300 } // Cache for 5 minutes
  )();
}

