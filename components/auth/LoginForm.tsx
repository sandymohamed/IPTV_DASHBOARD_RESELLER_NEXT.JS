'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Stack,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Box,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { PATH_AFTER_LOGIN } from '@/lib/config';

const loginSchema = yup.object().shape({
  email: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        // Wait for state to update and use window.location for reliable redirect
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = PATH_AFTER_LOGIN;
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Username"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Stack>
    </form>
  );
}
