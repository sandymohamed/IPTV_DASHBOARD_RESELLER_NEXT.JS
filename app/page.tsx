// import { redirect } from 'next/navigation';
// import { getLoginRedirect } from '@/lib/auth/utils';
// import { isAuthenticated } from '@/lib/auth/session';

// export default async function HomePage() {
//   const authenticated = await isAuthenticated();
  
//   if (authenticated) {
//     redirect('/dashboard');
//   } else {
//     redirect(getLoginRedirect('/'));
//   }
// }

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';

export default async function HomePage() {
  console.log('🔵 [ROOT PAGE] Page rendering...')
  
  try {
    console.log('🔵 [ROOT PAGE] Getting server session...')
    const session = await getServerSession();

    console.log('🔵 [ROOT PAGE] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAdminid: !!session?.user?.adminid,
      hasId: !!session?.user?.id
    })

    if (session?.user && (session.user.adminid || session.user.id)) {
      console.log('🔵 [ROOT PAGE] ✅ User authenticated, redirecting to dashboard')
      redirect('/dashboard');
    } else {
      console.log('🔵 [ROOT PAGE] ⚠️ No valid session, redirecting to login')
      redirect('/auth/login');
    }
  } catch (error) {
    console.error('🔵 [ROOT PAGE] ❌ Error:', error);
    redirect('/auth/login');
  }
}