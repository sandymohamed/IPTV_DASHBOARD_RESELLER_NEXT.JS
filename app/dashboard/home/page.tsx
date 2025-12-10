export const dynamic = 'force-dynamic';

import DashboardHomeClient, { DashboardStats } from '@/components/dashboard/home/DashboardHomeClient';
import { fetchWithAuth, AuthFetchError } from '@/lib/server/fetchWithAuth';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';

export default async function HomePage() {
  let stats: DashboardStats | null = null;
  let error: string | null = null;
  let movies: any[] = [];
  let series: any[] = [];

  try {
    console.log("try 3333")
    const data = await fetchWithAuth<DashboardStats>('/main/dashbord', { method: 'GET' });
    stats = data;
    console.log("stats 1111", stats)
  } catch (err) {
    console.log("err 2222", err)
    if (err instanceof AuthFetchError) {
      error = err.status === 401 ? 'SESSION_EXPIRED' : err.message;
    } else if (err instanceof Error) {
      error = err.message;
    } else {
      error = 'Failed to load dashboard data';
    }
  }

  // Fetch movies and series from database
  try {
    const session = await getServerSession();
    if (session?.user) {
      const [moviesData, seriesData] = await Promise.allSettled([
        db.query(
          `SELECT 
            id,
            stream_display_name,
            stream_icon,
            stream_source,
            category_id,
            added,
            notes
          FROM streams 
          WHERE type = 2 
          ORDER BY added DESC 
          LIMIT 10`
        ),
        db.query(
          `SELECT 
            id,
            title,
            category_id,
            cover,
            cover_big,
            genre,
            plot,
            cast,
            rating,
            director,
            releaseDate,
            last_modified,
            tmdb_id
          FROM series 
          ORDER BY last_modified DESC 
          LIMIT 10`
        ),
      ]);

      if (moviesData.status === 'fulfilled') {
        movies = moviesData.value || [];
      } else {
        console.error('Error fetching movies:', moviesData.reason);
      }

      if (seriesData.status === 'fulfilled') {
        series = seriesData.value || [];
      } else {
        console.error('Error fetching series:', seriesData.reason);
      }
    }
  } catch (err) {
    console.error('Error fetching movies/series:', err);
    // Don't set error, just log it - these are optional data
  }

  return <DashboardHomeClient stats={stats} error={error} movies={movies} series={series} />;
}
