// app/login/page.tsx
'use client'

import { useState } from 'react'
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

  Alert,
  Avatar,
  CircularProgress,
  alpha,
} from '@mui/material'
import { Visibility, VisibilityOff, Person, Lock, ErrorOutline } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const from = searchParams.get('from') || searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: from,
      })

      if (result?.error) {
        setError('Invalid credentials. Please check your username and password.')
        setLoading(false)
      } else {
        // Redirect immediately - NextAuth handles session
        router.push(from)
        router.refresh()
      }
    } catch (error) {
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
                        '& input': {
                          color: theme.palette.text.primary,
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
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
                        '& input': {
                          color: theme.palette.text.primary,
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />


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




            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}