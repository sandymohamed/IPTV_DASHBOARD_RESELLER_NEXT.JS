
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';
import { PATH_AFTER_LOGIN } from '@/lib/config';

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user || (!session.user.adminid && !session.user.id)) {
    redirect('/auth/login');
  }

  // Redirect to the home dashboard page
  redirect(PATH_AFTER_LOGIN);
}