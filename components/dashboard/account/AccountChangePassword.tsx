'use client';

import { useState } from 'react';
import * as Yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Info } from '@mui/icons-material';
import { changePassword } from '@/lib/services/userService';
import { showToast } from '@/lib/utils/toast';
import { signOut } from 'next-auth/react';
import { useLoading } from '@/lib/contexts/LoadingContext';

const ChangePasswordSchema = Yup.object().shape({
  old_pass: Yup.string().required('Old Password is required'),
  new_pwd: Yup.string()
    .min(4, 'Password must be at least 4 characters')
    .required('New Password is required'),
  new_pwd2: Yup.string()
    .oneOf([Yup.ref('new_pwd')], 'Passwords must match')
    .required('Confirm Password is required'),
});

interface ChangePasswordFormData {
  old_pass: string;
  new_pwd: string;
  new_pwd2: string;
}

export default function AccountChangePassword() {
  const { setLoading } = useLoading();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(ChangePasswordSchema),
    defaultValues: {
      old_pass: '',
      new_pwd: '',
      new_pwd2: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      const response = await changePassword(data);
      
      if (response?.success) {
        showToast.success('Password changed successfully! Please login again.');
        reset();
        // Logout and redirect to login immediately
        setLoading(true);
        await signOut({ callbackUrl: '/auth/login', redirect: true });
      } else {
        showToast.error(
          `Unable to change password: ${response?.data?.message || response?.message || 'Unknown error'}`
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to change password. Please try again.';
      showToast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Change Password
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3} alignItems="flex-end">
            <Controller
              name="old_pass"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type={showOldPassword ? 'text' : 'password'}
                  label="Old Password"
                  error={!!errors.old_pass}
                  helperText={errors.old_pass?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          edge="end"
                          size="small"
                        >
                          {showOldPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="new_pwd"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  error={!!errors.new_pwd}
                  helperText={
                    errors.new_pwd?.message || (
                      <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
                        <Info fontSize="small" />
                        <span>Password must be minimum 4+ characters</span>
                      </Stack>
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="new_pwd2"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  error={!!errors.new_pwd2}
                  helperText={errors.new_pwd2?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 150 }}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}

