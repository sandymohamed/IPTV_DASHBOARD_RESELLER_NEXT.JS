export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';
// import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
