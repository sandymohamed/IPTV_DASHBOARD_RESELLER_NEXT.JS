// import { redirect } from 'next/navigation';
// import { isAuthenticated } from '@/lib/auth/session';
// import { getLoginRedirect } from '@/lib/auth/utils';

// export default async function DashboardPage() {
//   const authenticated = await isAuthenticated();

//   if (!authenticated) {
//     redirect(getLoginRedirect('/dashboard'));
//   }

//   return (
//     <div>
//       <h1>Dashboard</h1>
//       <p>Welcome to your dashboard!</p>
//     </div>
//   );
// }


import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth';

export default async function DashboardPage() {
  console.log('🟢 [DASHBOARD] Page rendering...')
  
  try {
    console.log('🟢 [DASHBOARD] Getting server session...')
    const session = await getServerSession();

    console.log('🟢 [DASHBOARD] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAdminid: !!session?.user?.adminid,
      hasId: !!session?.user?.id,
      userKeys: session?.user ? Object.keys(session.user) : 'none'
    })

    if (!session?.user || (!session.user.adminid && !session.user.id)) {
      console.warn('🟢 [DASHBOARD] ⚠️ No valid session, redirecting to login')
      redirect('/auth/login');
    }

    console.log('🟢 [DASHBOARD] ✅ Session valid, rendering dashboard')
    console.log('🟢 [DASHBOARD] User:', {
      id: session.user.id,
      adminid: session.user.adminid,
      email: session.user.email,
      name: session.user.name
    })

    return (
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard, {session.user.name || session.user.email}! You are authenticated.</p>
      </div>
    );
  } catch (error) {
    console.error('🟢 [DASHBOARD] ❌ Error:', error);
    redirect('/auth/login');
  }
}