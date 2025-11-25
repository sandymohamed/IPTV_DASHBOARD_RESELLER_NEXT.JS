'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

/**
 * Custom hook for navigation that triggers the loading indicator
 * Use this instead of router.push() directly for better UX
 */
export function useNavigationWithLoader() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (path: string) => {
    // Trigger loading indicator
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation-start', { detail: { path } }));
    }
    
    startTransition(() => {
      router.push(path);
    });
  };

  const replace = (path: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigation-start', { detail: { path } }));
    }
    
    startTransition(() => {
      router.replace(path);
    });
  };

  return {
    navigate,
    replace,
    router,
    isPending,
  };
}

