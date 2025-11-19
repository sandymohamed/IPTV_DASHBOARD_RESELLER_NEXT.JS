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
import { PATH_AFTER_LOGIN } from '@/lib/config';

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user || (!session.user.adminid && !session.user.id)) {
    redirect('/auth/login');
  }

  // Redirect to the home dashboard page
  redirect(PATH_AFTER_LOGIN);
}