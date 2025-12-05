import TicketsListClient from '@/components/dashboard/tickets/TicketsListClient';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';
import { getServerSession } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

type TicketsResponse = {
  data?: Array<Record<string, any>>;
  result?: Array<Record<string, any>>;
};

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard/tickets');
  }

  let tickets: Array<Record<string, any>> = [];
  let errorMessage: string | null = null;

  try {
    const response = await fetchWithAuth<TicketsResponse>('/ticketss/manage/tickets', {
      method: 'GET',
    });

    tickets = response?.data ?? response?.result ?? [];
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'We could not load the tickets list. Please try again later.';
  }

  return <TicketsListClient rows={tickets} error={errorMessage} user={session.user} />;
}