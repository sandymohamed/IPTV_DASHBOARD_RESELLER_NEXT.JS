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
/**
 * ============================================================================
 * MIDDLEWARE - NAVIGATION CYCLE DOCUMENTATION
 * ============================================================================
 * 
 * This middleware intercepts all requests matching the configured paths and
 * enforces authentication-based routing. It runs on the Edge runtime before
 * any page or API route is executed.
 * 
 * ============================================================================
 * COMPLETE NAVIGATION CYCLE FLOW
 * ============================================================================
 * 
 * 1. REQUEST INTERCEPTION
 *    └─> User navigates to any URL (e.g., /dashboard/payments)
 *    └─> Next.js checks if path matches middleware config matcher
 *    └─> If matched, middleware function executes BEFORE page/API route
 * 
 * 2. PATH CLASSIFICATION
 *    └─> Middleware categorizes the path as PUBLIC or PROTECTED:
 *        • PUBLIC: /auth/login, /auth/register, /auth/error, /_next/*, 
 *                  /api/auth/*, /public/*, static files (contains '.')
 *        • PROTECTED: Everything else (dashboard, profile, settings, etc.)
 * 
 * 3. AUTHENTICATION CHECK (Cookie-Based Detection)
 *    └─> Middleware checks for NextAuth session cookies:
 *        • Single token: 'next-auth.session-token' or '__Secure-next-auth.session-token'
 *        • Chunked tokens: 'next-auth.session-token.0', '.1', '.2', etc.
 *          (NextAuth splits large cookies >4KB into chunks)
 *    └─> Result: isLoggedIn = true if ANY session cookie exists
 * 
 * 4. DECISION TREE & REDIRECT LOGIC
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  SCENARIO A: User is LOGGED IN + tries to access LOGIN page │
 *    └─────────────────────────────────────────────────────────────┘
 *    │
 *    ├─> Check for redirect parameters:
 *    │   • 'from' query param (saved destination from previous redirect)
 *    │   • 'callbackUrl' query param (NextAuth callback)
 *    │   • Default: '/dashboard'
 *    │
 *    └─> Redirect to destination (if valid and not login page)
 *        └─> Prevents logged-in users from seeing login form
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  SCENARIO B: User is NOT LOGGED IN + tries PROTECTED route  │
 *    └─────────────────────────────────────────────────────────────┘
 *    │
 *    ├─> Build login URL with 'from' parameter:
 *    │   • Original path saved as: /auth/login?from=/dashboard/payments
 *    │
 *    └─> Redirect to login page
 *        └─> After login, user can be redirected back to original destination
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  SCENARIO C: User is LOGGED IN + tries PROTECTED route      │
 *    └─────────────────────────────────────────────────────────────┘
 *    │
 *    └─> Allow request to proceed (NextResponse.next())
 *        └─> Page/API route executes normally
 * 
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  SCENARIO D: User accesses PUBLIC route                     │
 *    └─────────────────────────────────────────────────────────────┘
 *    │
 *    └─> Always allow (no authentication required)
 *        └─> Login/register pages accessible to everyone
 * 
 * ============================================================================
 * TYPICAL USER JOURNEYS
 * ============================================================================
 * 
 * JOURNEY 1: First-time visitor accessing dashboard
 * ─────────────────────────────────────────────────
 * 1. User navigates: /dashboard/payments
 * 2. Middleware: isPublicPath=false, isLoggedIn=false
 * 3. Redirect: /auth/login?from=/dashboard/payments
 * 4. User logs in successfully
 * 5. NextAuth redirects to: /auth/login?callbackUrl=/dashboard/payments
 * 6. Middleware: isPublicPath=true, isLoggedIn=true
 * 7. Redirect: /dashboard/payments (from callbackUrl)
 * 8. User sees dashboard
 * 
 * JOURNEY 2: Logged-in user accessing dashboard
 * ──────────────────────────────────────────────
 * 1. User navigates: /dashboard/payments
 * 2. Middleware: isPublicPath=false, isLoggedIn=true
 * 3. Allow: Request proceeds to page
 * 4. User sees dashboard immediately
 * 
 * JOURNEY 3: Logged-in user accidentally visits login page
 * ────────────────────────────────────────────────────────
 * 1. User navigates: /auth/login
 * 2. Middleware: isPublicPath=true, isLoggedIn=true
 * 3. Redirect: /dashboard (default) or callbackUrl/from param
 * 4. User sees dashboard (not login form)
 * 
 * JOURNEY 4: User logs out and tries to access protected route
 * ─────────────────────────────────────────────────────────────
 * 1. User logs out (session cookie deleted)
 * 2. User navigates: /dashboard/payments
 * 3. Middleware: isPublicPath=false, isLoggedIn=false
 * 4. Redirect: /auth/login?from=/dashboard/payments
 * 5. User sees login page
 * 
 * ============================================================================
 * COOKIE DETECTION MECHANISM
 * ============================================================================
 * 
 * NextAuth stores session data in HTTP-only cookies. When the session data
 * exceeds 4KB, NextAuth automatically splits it into multiple cookies:
 * 
 * • Small session: 'next-auth.session-token' (single cookie)
 * • Large session: 'next-auth.session-token.0', '.1', '.2', etc. (chunked)
 * 
 * The middleware checks for BOTH patterns to ensure authentication works
 * regardless of session size. This is critical because:
 * - Edge runtime cannot access full session object (only cookies)
 * - We need to detect authentication status before page loads
 * - Cookie-based detection is fast and works in Edge runtime
 * 
 * ============================================================================
 * PERFORMANCE CONSIDERATIONS
 * ============================================================================
 * 
 * • Middleware runs on Edge runtime (fast, global CDN)
 * • Cookie checks are synchronous and instant
 * • No database queries or API calls in middleware
 * • Only matches specific paths (configured in matcher)
 * • Static files bypass middleware entirely
 * 
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 * 
 * The 'matcher' config determines which paths trigger middleware:
 * - /dashboard/:path* - All dashboard routes
 * - /profile/:path* - All profile routes
 * - /settings/:path* - All settings routes
 * - /auth/login - Login page (to redirect logged-in users)
 * - /auth/register - Register page
 * - / - Root path
 * 
 * Paths NOT in matcher bypass middleware entirely (faster).
 * 
 * ============================================================================
 */

// // middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   const path = request.nextUrl.pathname
//   const method = request.method
  
//   console.log('🟣 [MIDDLEWARE] Request:', {
//     path,
//     method,
//     url: request.url,
//     searchParams: Object.fromEntries(request.nextUrl.searchParams)
//   })
  
//   // Public paths that don't require authentication
//   const isPublicPath = 
//     path === '/auth/login' || 
//     path === '/auth/register' ||
//     path === '/auth/error' ||
//     path.startsWith('/_next') ||
//     path.startsWith('/api/auth') ||
//     path.startsWith('/public') ||
//     path.includes('.') // Static files

//   console.log('🟣 [MIDDLEWARE] Path check:', {
//     path,
//     isPublicPath,
//     isStatic: path.includes('.')
//   })

//   // Check for NextAuth session cookie (works in Edge runtime)
//   // NextAuth splits large cookies into chunks (e.g., .0, .1, .2) when they exceed 4KB
//   const allCookies = request.cookies.getAll()
//   const cookieNames = allCookies.map(c => c.name)
  
//   // Check for single session token OR chunked session tokens
//   const hasSingleToken = !!(
//     request.cookies.get('next-auth.session-token')?.value ||
//     request.cookies.get('__Secure-next-auth.session-token')?.value
//   )
  
//   // Check for chunked tokens (next-auth.session-token.0, .1, .2, etc.)
//   const hasChunkedTokens = cookieNames.some(name => 
//     name.startsWith('next-auth.session-token.') || 
//     name.startsWith('__Secure-next-auth.session-token.')
//   )
  
//   const isLoggedIn = hasSingleToken || hasChunkedTokens

//   console.log('🟣 [MIDDLEWARE] Session check:', {
//     hasSingleToken,
//     hasChunkedTokens,
//     isLoggedIn,
//     allCookies: cookieNames,
//     sessionCookieNames: cookieNames.filter(name => 
//       name.includes('session-token')
//     )
//   })

//   // Redirect logged-in users away from login page
//   // But allow them to complete the login flow first
//   if (path === '/auth/login' && isLoggedIn) {
//     // Check if there's a 'from' parameter to redirect to
//     const fromParam = request.nextUrl.searchParams.get('from')
//     const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
//     const redirectTo = fromParam || callbackUrl || '/dashboard'
    
//     console.log('🟣 [MIDDLEWARE] Logged-in user on login page, redirecting:', {
//       fromParam,
//       callbackUrl,
//       redirectTo,
//       finalRedirect: redirectTo && redirectTo !== '/auth/login' ? redirectTo : null
//     })
    
//     // Only redirect if we have a valid destination
//     if (redirectTo && redirectTo !== '/auth/login') {
//       const redirectUrl = new URL(redirectTo, request.url)
//       console.log('🟣 [MIDDLEWARE] Redirecting to:', redirectUrl.toString())
//       return NextResponse.redirect(redirectUrl)
//     }
//   }

//   // Redirect non-logged-in users to login for protected routes
//   if (!isPublicPath && !isLoggedIn) {
//     const loginUrl = new URL('/auth/login', request.url)
//     loginUrl.searchParams.set('from', path)
    
//     console.log('🟣 [MIDDLEWARE] Unauthenticated user accessing protected route:', {
//       path,
//       redirectingTo: loginUrl.toString()
//     })
    
//     return NextResponse.redirect(loginUrl)
//   }

//   console.log('🟣 [MIDDLEWARE] Allowing request to proceed:', path)
//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     '/dashboard/:path*',
//     '/profile/:path*',
//     '/settings/:path*',
//     '/auth/login',
//     '/auth/register',
//     '/'
//   ]
// }


