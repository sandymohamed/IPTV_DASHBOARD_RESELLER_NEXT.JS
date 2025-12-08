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
          throw new Error('Email and password are required')
        }

        try {
          const ipAddress = '127.0.0.1'

          const result = await loginUser({
            email: credentials.email as string,
            password: credentials.password as string,
            ipAddress
          })

          if (result.success && !result.resetRequired) {
            if (!JWT_SECRET) {
              throw new Error('JWT_SECRET is not configured')
            }

            // Ensure resellers is a string for backend compatibility
            const userForToken = { ...result.user };
            if (userForToken.resellers !== undefined) {
              if (Array.isArray(userForToken.resellers)) {
                userForToken.resellers = userForToken.resellers.join(',');
              } else if (typeof userForToken.resellers !== 'string') {
                userForToken.resellers = String(userForToken.resellers || '');
              }
            } else {
              userForToken.resellers = '';
            }

            const apiToken = jwt.sign(userForToken, JWT_SECRET, { expiresIn: "1h" })

            const userData = {
              ...result.user,
              id: result.user.adminid.toString(),
              email: result.user.adm_username,
              name: result.user.adm_username,
              apiToken,
            }

            return userData;
          }

          return null
        } catch (error: any) {
          if (error?.code === 'ECONNREFUSED') {
            throw new Error('Database connection failed. Please contact the administrator.')
          }

          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  jwt: {
    secret: JWT_SECRET,
    maxAge: 60 * 60, // 1 hour
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
        // Include ALL user data from token in session, explicitly including balance
        const userData = {
          ...(token.user as any), // Spread all user data from token (includes balance)
          ...session.user, // Merge with session user (overwrites with token data)
          id: (token.user as any)?.id || token.adminid?.toString() || session.user?.id || '',
          email: (token.user as any)?.email || (token.user as any)?.adm_username || session.user?.email || '',
          name: (token.user as any)?.name || (token.user as any)?.adm_username || session.user?.name || '',
          balance: (token.user as any)?.balance ?? null, // Explicitly include balance
          adminid: (token.user as any)?.adminid || token.adminid || null,
          adm_username: (token.user as any)?.adm_username || null,
        }

        session.user = userData

        // Use apiToken from token if available, otherwise generate it
        if (token.apiToken) {
          session.apiToken = token.apiToken as string
        } else if (token.user && JWT_SECRET) {
          // Ensure resellers is a string for backend compatibility before generating apiToken
          const userForToken = { ...(token.user as any) };
          if (userForToken.resellers !== undefined) {
            if (Array.isArray(userForToken.resellers)) {
              userForToken.resellers = userForToken.resellers.join(',');
            } else if (typeof userForToken.resellers !== 'string') {
              userForToken.resellers = String(userForToken.resellers || '');
            }
          } else {
            userForToken.resellers = '';
          }
          // Generate apiToken on-demand from all user data
          session.apiToken = jwt.sign(userForToken, JWT_SECRET, { expiresIn: "1h" })
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
import { cache } from 'react'

// Cache session per request to avoid multiple calls
export const getServerSession = cache(async () => {
  return _getServerSession(authOptions)
})

export { authOptions }