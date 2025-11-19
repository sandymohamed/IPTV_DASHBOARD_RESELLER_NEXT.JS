'use client';

import { authOptions } from '@/lib/auth/auth';
import { SessionProvider } from 'next-auth/react';
import { redirect } from 'next/navigation';


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = authOptions.session

  console.log('🔵 [AUTH PROVIDER] Session:', session)
  console.log('🔵 [AUTH PROVIDER] authOptions:', authOptions)

  if (!session) {
    redirect('/login')
    
  }
  return <SessionProvider>{children}</SessionProvider>;
}
