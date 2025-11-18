// // middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { auth } from './lib/auth/auth'

// export async function middleware(request: NextRequest) {
//   // Get the pathname of the request
//   const path = request.nextUrl.pathname
  
//   // Define public paths that don't require authentication
//   const isPublicPath = path === '/login' || path === '/register' || path.startsWith('/_next') || path.startsWith('/api/auth')
  
//   // Get the session (this runs on the edge)
//   const session = await auth()
//   const isLoggedIn = !!session?.user

//   // Redirect logic for authenticated users trying to access public paths
//   if (isPublicPath && isLoggedIn) {
//     return NextResponse.redirect(new URL('/dashboard', request.url))
//   }

//   // Redirect logic for unauthenticated users trying to access protected paths
//   if (!isPublicPath && !isLoggedIn) {
//     const loginUrl = new URL('/login', request.url)
//     loginUrl.searchParams.set('from', path)
//     return NextResponse.redirect(loginUrl)
//   }

//   return NextResponse.next()
// }

// // Configure which paths the middleware should run on
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api/auth (auth API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public folder
//      */
//     '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }


// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method
  
  console.log('🟣 [MIDDLEWARE] Request:', {
    path,
    method,
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams)
  })
  
  // Public paths that don't require authentication
  const isPublicPath = 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path === '/auth/error' ||
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/public') ||
    path.includes('.') // Static files

  console.log('🟣 [MIDDLEWARE] Path check:', {
    path,
    isPublicPath,
    isStatic: path.includes('.')
  })

  // Check for NextAuth session cookie (works in Edge runtime)
  // NextAuth splits large cookies into chunks (e.g., .0, .1, .2) when they exceed 4KB
  const allCookies = request.cookies.getAll()
  const cookieNames = allCookies.map(c => c.name)
  
  // Check for single session token OR chunked session tokens
  const hasSingleToken = !!(
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value
  )
  
  // Check for chunked tokens (next-auth.session-token.0, .1, .2, etc.)
  const hasChunkedTokens = cookieNames.some(name => 
    name.startsWith('next-auth.session-token.') || 
    name.startsWith('__Secure-next-auth.session-token.')
  )
  
  const isLoggedIn = hasSingleToken || hasChunkedTokens

  console.log('🟣 [MIDDLEWARE] Session check:', {
    hasSingleToken,
    hasChunkedTokens,
    isLoggedIn,
    allCookies: cookieNames,
    sessionCookieNames: cookieNames.filter(name => 
      name.includes('session-token')
    )
  })

  // Redirect logged-in users away from login page
  // But allow them to complete the login flow first
  if (path === '/auth/login' && isLoggedIn) {
    // Check if there's a 'from' parameter to redirect to
    const fromParam = request.nextUrl.searchParams.get('from')
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
    const redirectTo = fromParam || callbackUrl || '/dashboard'
    
    console.log('🟣 [MIDDLEWARE] Logged-in user on login page, redirecting:', {
      fromParam,
      callbackUrl,
      redirectTo,
      finalRedirect: redirectTo && redirectTo !== '/auth/login' ? redirectTo : null
    })
    
    // Only redirect if we have a valid destination
    if (redirectTo && redirectTo !== '/auth/login') {
      const redirectUrl = new URL(redirectTo, request.url)
      console.log('🟣 [MIDDLEWARE] Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect non-logged-in users to login for protected routes
  if (!isPublicPath && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', path)
    
    console.log('🟣 [MIDDLEWARE] Unauthenticated user accessing protected route:', {
      path,
      redirectingTo: loginUrl.toString()
    })
    
    return NextResponse.redirect(loginUrl)
  }

  console.log('🟣 [MIDDLEWARE] Allowing request to proceed:', path)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/auth/login',
    '/auth/register',
    '/'
  ]
}