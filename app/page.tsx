import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';

export default async function HomePage() {
  try {
    const session = await getServerSession();

    if (session?.user && (session.user.adminid )) {
      redirect('/dashboard');
    } else {
      redirect('/auth/login');
    }
  } catch (error) {
    console.log("error from home page", error);
    redirect('/auth/login');
  }
}