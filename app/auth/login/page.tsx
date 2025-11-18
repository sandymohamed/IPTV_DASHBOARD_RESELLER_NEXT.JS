// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    console.log('🔵 [LOGIN PAGE] Component mounted')
    console.log('🔵 [LOGIN PAGE] Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    console.log('🔵 [LOGIN PAGE] From parameter:', from)
    console.log('🔵 [LOGIN PAGE] All search params:', Object.fromEntries(searchParams.entries()))
  }, [from, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔵 [LOGIN PAGE] Form submitted')
    console.log('🔵 [LOGIN PAGE] Email:', email)
    console.log('🔵 [LOGIN PAGE] Redirect target (from):', from)
    console.log('🔵 [LOGIN PAGE] Current URL:', window.location.href)
    
    setLoading(true)
    setError('')

    try {
      console.log('🔵 [LOGIN PAGE] Calling signIn with credentials...')
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: from,
      })

      console.log('🔵 [LOGIN PAGE] signIn result:', JSON.stringify(result, null, 2))
      console.log('🔵 [LOGIN PAGE] Result details:', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
        type: typeof result
      })

      if (result?.error) {
        console.error('🔴 [LOGIN PAGE] Login failed with error:', result.error)
        setError('Invalid credentials. Please check your username and password.')
        setLoading(false)
      } else {
        console.log('🟢 [LOGIN PAGE] Login successful! Starting session verification...')
        console.log('🟢 [LOGIN PAGE] Will redirect to:', from)
        
        // Wait for session to be available, then redirect
        const redirectWithSession = async () => {
          let attempts = 0
          const maxAttempts = 10 // Increased attempts
          
          console.log(`🟡 [LOGIN PAGE] Starting session check loop (max ${maxAttempts} attempts)`)
          
          while (attempts < maxAttempts) {
            try {
              console.log(`🟡 [LOGIN PAGE] Session check attempt ${attempts + 1}/${maxAttempts}`)
              
              const sessionRes = await fetch('/api/auth/session', { 
                cache: 'no-store',
                credentials: 'include',
                headers: {
                  'Cache-Control': 'no-cache'
                }
              })
              
              console.log(`🟡 [LOGIN PAGE] Session response status:`, sessionRes.status)
              console.log(`🟡 [LOGIN PAGE] Session response headers:`, {
                contentType: sessionRes.headers.get('content-type'),
                cookies: document.cookie
              })
              
              const sessionData = await sessionRes.json()
              
              console.log(`🟡 [LOGIN PAGE] Session data received:`, JSON.stringify(sessionData, null, 2))
              console.log(`🟡 [LOGIN PAGE] Session user check:`, {
                hasUser: !!sessionData?.user,
                hasAdminid: !!sessionData?.user?.adminid,
                hasId: !!sessionData?.user?.id,
                userKeys: sessionData?.user ? Object.keys(sessionData.user) : 'none'
              })
              
              if (sessionData?.user && (sessionData.user.adminid || sessionData.user.id)) {
                console.log('🟢 [LOGIN PAGE] ✅ Session confirmed! User data:', {
                  id: sessionData.user.id,
                  adminid: sessionData.user.adminid,
                  email: sessionData.user.email
                })
                console.log('🟢 [LOGIN PAGE] About to redirect to:', from)
                console.log('🟢 [LOGIN PAGE] Using window.location.replace...')
                
                // Small delay to ensure logs are visible
                await new Promise(resolve => setTimeout(resolve, 100))
                
                window.location.replace(from)
                console.log('🟢 [LOGIN PAGE] Redirect command executed')
                return
              } else {
                console.warn(`🟡 [LOGIN PAGE] Session check ${attempts + 1}: User data not ready yet`)
                console.warn(`🟡 [LOGIN PAGE] Session data:`, sessionData)
              }
              
              attempts++
              if (attempts < maxAttempts) {
                console.log(`🟡 [LOGIN PAGE] Waiting 300ms before next attempt...`)
                await new Promise(resolve => setTimeout(resolve, 300))
              }
            } catch (err) {
              console.error(`🔴 [LOGIN PAGE] Session check error on attempt ${attempts + 1}:`, err)
              attempts++
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 300))
              }
            }
          }
          
          // If session check failed, redirect anyway
          console.warn('🟡 [LOGIN PAGE] ⚠️ Session check timeout after', maxAttempts, 'attempts')
          console.warn('🟡 [LOGIN PAGE] Redirecting anyway to:', from)
          console.warn('🟡 [LOGIN PAGE] Current cookies:', document.cookie)
          
          window.location.replace(from)
          console.log('🟡 [LOGIN PAGE] Fallback redirect executed')
        }
        
        // Start checking for session
        redirectWithSession()
      }
    } catch (error) {
      console.error('🔴 [LOGIN PAGE] Exception during login:', error)
      setError('An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="sr-only">
              Email address Or Username
            </label>
            <input
              id="username"
              name="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}