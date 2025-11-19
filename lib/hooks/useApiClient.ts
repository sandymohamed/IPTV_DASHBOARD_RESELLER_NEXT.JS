'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { createAuthenticatedAxios } from '@/lib/utils/axios';

/**
 * Hook to get an authenticated axios instance for client components
 * This automatically includes the apiToken from NextAuth session
 */
export function useApiClient() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken;
  
  return useMemo(() => {
    return createAuthenticatedAxios(apiToken);
  }, [apiToken]);
}

