import { redirect } from 'next/navigation';
import TicketsCreateForm from '@/components/dashboard/tickets/TicketsCreateForm';
import { getServerSession } from '@/lib/auth/auth';

export const dynamic = 'force-dynamic';

export default async function TicketsCreatePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/tickets/create');
  }

  return <TicketsCreateForm user={session.user} />;
}

