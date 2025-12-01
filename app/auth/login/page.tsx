// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  Alert,
  Avatar,
  CircularProgress,
  alpha,
} from '@mui/material'
import { Visibility, VisibilityOff, Person, Lock, ErrorOutline } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 50%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite reverse',
        },
        '@keyframes float': {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '50%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
        },
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            boxShadow: theme.shadows[24],
            borderRadius: 4,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[24],
            },
          }}
        >
          <CardContent>
            <Stack spacing={4}>
              {/* Header */}
              <Stack spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  }}
                >
                  <Person sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center',
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Sign in to continue to your account
                </Typography>
              </Stack>

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Email/Username Input */}
                  <TextField
                    fullWidth
                    label="Email or Username"
                    id="username"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      },
                    }}
                  />

                  {/* Password Input */}
                  <TextField
                    fullWidth
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      },
                    }}
                  />

                  {/* Remember Me & Forgot Password */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2">Remember me</Typography>
                      }
                    />
                    <Link
                      href="#"
                      variant="body2"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Stack>

                  {/* Error Message */}
                  {error && (
                    <Alert
                      severity="error"
                      icon={<ErrorOutline />}
                      sx={{
                        borderRadius: 2,
                        animation: 'slideIn 0.3s ease',
                        '@keyframes slideIn': {
                          from: {
                            opacity: 0,
                            transform: 'translateY(-10px)',
                          },
                          to: {
                            opacity: 1,
                            transform: 'translateY(0)',
                          },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`,
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                      },
                    }}
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </Stack>
              </Box>

              {/* Divider */}
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  New to our platform?
                </Typography>
              </Divider>

              {/* Sign Up Link */}
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?
                </Typography>
                <Link
                  href="#"
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up for free
                </Link>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}