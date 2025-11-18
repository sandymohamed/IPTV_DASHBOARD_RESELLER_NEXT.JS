// components/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     if (!isLoading && !user && !pathname?.startsWith('/auth/login')) {
//       router.push(`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`);
//     }
//   }, [user, isLoading, pathname, router]);

//   if (isLoading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!user) {
//     return null;
//   }

  return <> hiiiiiiiiii {children}</>;
}