// lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginUser } from '../services/authService'
import { JWT_SECRET } from '../utils/auth'
import jwt from 'jsonwebtoken'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {

        if (!credentials?.email || !credentials?.password) {
          // console.error('🟠 [AUTH] Missing credentials')
          throw new Error('Email and password are required')
        }

        try {
          // Get IP address for rate limiting
          // TODO: Note: In production, you'd get this from headers
          const ipAddress = '127.0.0.1' // You'll need to extract this properly

          const result = await loginUser({
            email: credentials.email as string,
            password: credentials.password as string,
            ipAddress
          })


          if (result.success && !result.resetRequired) {
            // Generate JWT token for API calls (same as the login API route)
            if (!JWT_SECRET) {
              console.error('🟠 [AUTH] JWT_SECRET is not configured')
              throw new Error('JWT_SECRET is not configured')
            }

            const apiToken = jwt.sign(result.user, JWT_SECRET, { expiresIn: "24h" })

            // Store ALL user data with API token
            const userData = {
              ...result.user, // Include all user data
              id: result.user.adminid.toString(),
              email: result.user.adm_username,
              name: result.user.adm_username,
              apiToken, // Store the API token for fetchWithAuth
            }

            return userData;
          }

          return null
        } catch (error: any) {
          console.error('🟠 [AUTH] ❌ Error in authorize:', error)
          console.error('🟠 [AUTH] Error details:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
          })

          // If it's a database connection error, provide a more helpful message
          if (error?.code === 'ECONNREFUSED') {
            console.error('🟠 [AUTH] Database connection failed. Please check your database configuration.')
            throw new Error('Database connection failed. Please contact the administrator.')
          }

          // For other errors, return null to show generic error
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: JWT_SECRET,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store ALL user data in token
        token.user = user;

        // Store apiToken if present
        if ((user as any).apiToken) {
          token.apiToken = (user as any).apiToken
        }

        // Ensure adminid is accessible at root level for convenience
        token.adminid = (user as any).adminid || (user as any).adminid
      }

      // Ensure adminid persists even if user object is not present
      if (!token.adminid && token.user) {
        token.adminid = (token.user as any).adminid
      }

      return token
    },
    async session({ session, token }) {
      // Always return session with ALL user data if token has it
      if (token.user || token.adminid) {
        // Include ALL user data from token in session
        const userData = {
          ...(token.user as any), // Spread all user data from token
          ...session.user, // Merge with session user (overwrites with token data)
          id: (token.user as any)?.id || token.adminid?.toString() || session.user?.id || '',
          email: (token.user as any)?.email || (token.user as any)?.adm_username || session.user?.email || '',
          name: (token.user as any)?.name || (token.user as any)?.adm_username || session.user?.name || '',
        }

        session.user = userData

        // Use apiToken from token if available, otherwise generate it
        if (token.apiToken) {
          session.apiToken = token.apiToken as string
        } else if (token.user && JWT_SECRET) {
          // Generate apiToken on-demand from all user data
          session.apiToken = jwt.sign(token.user, JWT_SECRET, { expiresIn: "24h" })
        }

      } else {
        // If no user data in token, return empty session
        session.user = null as any
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  // Enable edge compatibility
  ...(process.env.NEXTAUTH_URL?.startsWith('https://') && {
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true
        }
      }
    }
  })
}

const handler = NextAuth(authOptions)

export default handler

// Export getServerSession for server-side usage
import { getServerSession as _getServerSession } from 'next-auth/next'

export async function getServerSession() {
  return _getServerSession(authOptions)
}

export { authOptions }