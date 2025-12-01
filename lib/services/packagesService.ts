import axiosInstance from '@/lib/utils/axios';

export interface Package {
  id: string;
  package_name: string;
  official_credits: number;
  official_duration: number;
  official_duration_in: string;
  max_connections: number;
  is_trial: number;
  [key: string]: any;
}

export const getPackagesMembersList = async (memberGroupId: string): Promise<Package[]> => {
  try {
    const response = await axiosInstance.get(`/packages/${memberGroupId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return [];
  }
};

// In-memory cache to avoid Next.js 2MB cache limit
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const packagesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Server-side cached version using in-memory cache
export async function getCachedPackages(memberGroupId: string): Promise<any[]> {
  const cacheKey = `packages-${memberGroupId}`;
  const now = Date.now();
  
  // Clean up expired entries (older than 2x TTL)
  const expireTime = CACHE_TTL * 2;
  for (const [key, entry] of packagesCache.entries()) {
    if (now - entry.timestamp >= expireTime) {
      packagesCache.delete(key);
    }
  }
  
  // Check if we have valid cached data
  const cached = packagesCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  // Import fetchWithAuth dynamically to avoid client-side import
  const { fetchWithAuth } = await import('@/lib/server/fetchWithAuth');
  
  try {
    const response = await fetchWithAuth<any>(`/packages/${memberGroupId}`);
    const packages = response?.data || response?.result || response || [];
    
    // Store in cache
    packagesCache.set(cacheKey, {
      data: packages,
      timestamp: now,
    });
    
    return packages;
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    
    // If we have stale cache, return it anyway
    if (cached) {
      console.log('Returning stale cache data due to fetch error');
      return cached.data;
    }
    
    return [];
  }
}