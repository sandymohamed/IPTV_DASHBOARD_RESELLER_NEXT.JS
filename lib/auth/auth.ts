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
        console.log('🟠 [AUTH] authorize() called')
        console.log('🟠 [AUTH] Credentials received:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          email: credentials?.email
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.error('🟠 [AUTH] Missing credentials')
          throw new Error('Email and password are required')
        }

        try {
          // Get IP address for rate limiting
          // TODO: Note: In production, you'd get this from headers
          const ipAddress = '127.0.0.1' // You'll need to extract this properly

          console.log('🟠 [AUTH] Calling loginUser service...')
          const result = await loginUser({
            email: credentials.email as string,
            password: credentials.password as string,
            ipAddress
          })

          console.log('🟠 [AUTH] loginUser result:', {
            success: result.success,
            resetRequired: result.resetRequired,
            hasUser: !!result.user,
            adminid: result.user?.adminid
          })

          if (result.success && !result.resetRequired) {
            // Generate JWT token for API calls (same as the login API route)
            if (!JWT_SECRET) {
              console.error('🟠 [AUTH] JWT_SECRET is not configured')
              throw new Error('JWT_SECRET is not configured')
            }
            
            console.log('🟠 [AUTH] Generating API token...')
            const apiToken = jwt.sign(result.user, JWT_SECRET, { expiresIn: "24h" })
            
            const userData = {
              id: result.user.adminid.toString(),
              email: result.user.adm_username,
              name: result.user.adm_username,
              apiToken, // Store the API token for fetchWithAuth
              adminid: result.user.adminid,
              adm_username: result.user.adm_username,
              // Only include essential fields, not the entire user object
              level: result.user.level,
              member_group_id: result.user.member_group_id,
            }
            
            console.log('🟠 [AUTH] ✅ Returning user data:', {
              id: userData.id,
              email: userData.email,
              adminid: userData.adminid,
              hasApiToken: !!userData.apiToken
            })
            
            return userData
          }

          // If login failed, return null (NextAuth will show error)
          console.warn('🟠 [AUTH] ⚠️ Login failed or reset required')
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
      console.log('🟡 [JWT CALLBACK] Called')
      console.log('🟡 [JWT CALLBACK] Input:', {
        hasUser: !!user,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : 'none',
        userKeys: user ? Object.keys(user) : 'none'
      })
      
      if (user) {
        console.log('🟡 [JWT CALLBACK] User provided, storing in token')
        // Store only essential data to keep token size small
        // NOTE: We don't store apiToken here to reduce size - it will be generated on-demand
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          adminid: (user as any).adminid,
          adm_username: (user as any).adm_username,
          level: (user as any).level,
          member_group_id: (user as any).member_group_id,
        }
        // Store apiToken only temporarily during initial login, not in subsequent calls
        // This reduces token size significantly
        if ((user as any).apiToken) {
          token.apiToken = (user as any).apiToken
        }
        token.adminid = (user as any).adminid || (user as any).adminid
        
        console.log('🟡 [JWT CALLBACK] Token updated with user data:', {
          userId: token.user.id,
          adminid: token.adminid,
          hasApiToken: !!token.apiToken,
          tokenSizeEstimate: JSON.stringify(token).length
        })
      } else {
        console.log('🟡 [JWT CALLBACK] No user provided (subsequent call)')
        // Remove apiToken from subsequent calls to reduce token size
        // It will be generated on-demand in the session callback
        if (token.apiToken) {
          delete token.apiToken
          console.log('🟡 [JWT CALLBACK] Removed apiToken to reduce token size')
        }
      }
      
      // Ensure adminid persists even if user object is not present
      if (!token.adminid && token.user) {
        token.adminid = (token.user as any).adminid
        console.log('🟡 [JWT CALLBACK] Restored adminid from token.user')
      }
      
      console.log('🟡 [JWT CALLBACK] Returning token:', {
        hasUser: !!token.user,
        hasAdminid: !!token.adminid,
        hasApiToken: !!token.apiToken,
        tokenSizeEstimate: JSON.stringify(token).length
      })
      
      return token
    },
    async session({ session, token }) {
      // Debug logging
      console.log('🔑 [SESSION CALLBACK] Called')
      console.log('🔑 [SESSION CALLBACK] Token:', {
        hasUser: !!token.user,
        hasAdminid: !!token.adminid,
        hasApiToken: !!token.apiToken,
        tokenUser: token.user ? Object.keys(token.user) : 'none'
      })
      
      // Always return session with user data if token has it
      if (token.user || token.adminid) {
        // Only include essential user data in session
        const userData = {
          ...session.user,
          id: token.user?.id || token.adminid?.toString() || session.user?.id || '',
          email: token.user?.email || session.user?.email || '',
          name: token.user?.name || session.user?.name || '',
          adminid: token.adminid || (token.user as any)?.adminid,
          adm_username: (token.user as any)?.adm_username,
          level: (token.user as any)?.level,
          member_group_id: (token.user as any)?.member_group_id,
        }
        
        session.user = userData
        
        // Generate apiToken on-demand if not already in token (to reduce JWT size)
        // If it's already in token (from initial login), use it; otherwise generate it
        if (token.apiToken) {
          session.apiToken = token.apiToken as string
          console.log('🔑 [SESSION CALLBACK] Using existing apiToken from token')
        } else if (token.user && JWT_SECRET) {
          // Generate apiToken on-demand from user data
          const userForToken = {
            adminid: userData.adminid,
            adm_username: userData.adm_username,
            email: userData.email,
            level: userData.level,
            member_group_id: userData.member_group_id,
          }
          session.apiToken = jwt.sign(userForToken, JWT_SECRET, { expiresIn: "24h" })
          console.log('🔑 [SESSION CALLBACK] Generated apiToken on-demand')
        } else {
          console.warn('🔑 [SESSION CALLBACK] ⚠️ Cannot generate apiToken - missing data or JWT_SECRET')
        }
        
        console.log('🔑 [SESSION CALLBACK] ✅ Returning user:', {
          id: userData.id,
          email: userData.email,
          adminid: userData.adminid,
          hasApiToken: !!session.apiToken
        })
      } else {
        console.warn('🔑 [SESSION CALLBACK] ⚠️ No user data in token')
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