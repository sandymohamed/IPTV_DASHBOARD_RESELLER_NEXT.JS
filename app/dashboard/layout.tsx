export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  console.log("from layout")
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Prepare user data for the layout
  const user = {
    id: session.user.id,
    adminid: session.user.adminid,
    email: session.user.email,
    name: session.user.name,
    adm_username: (session.user as any).adm_username,
    balance: (session.user as any).balance,
  };

  console.log("user from layout", user);
  
  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}
