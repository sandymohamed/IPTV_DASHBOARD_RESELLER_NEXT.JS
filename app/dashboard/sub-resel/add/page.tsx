'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createSubReseller, getAllMemberGroupsName } from '@/lib/services/subResellersService';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { showToast } from '@/lib/utils/toast';

const levelOptions = [
  { id: 2, value: 'Super Reseller' },
  { id: 3, value: 'Reseller' },
  { id: 4, value: 'Reset Codes Only' },
  { id: 6, value: 'Reseller With Sub-resel' },
  { id: 7, value: 'Sub Reseller' },
  { id: 10, value: 'Support Only' },
];

interface SubResellerFormData {
  fullname: string;
  adm_username: string;
  adm_password: string;
  email?: string;
  level: string;
  member_group_id?: string;
  notes: string;
}

const subResellerSchema: yup.ObjectSchema<SubResellerFormData> = yup
  .object({
    fullname: yup.string().required('Full Name is required'),
    adm_username: yup.string().required('Username is required'),
    adm_password: yup.string().required('Password is required'),
    email: yup.string().email('Email must be a valid email address').optional(),
    level: yup.string().required('Level is required'),
    member_group_id: yup.string().optional(),
    notes: yup.string().required('Notes is required'),
  })
  .required();

export default function SubResellersCreatePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberGroups, setMemberGroups] = useState<any[]>([]);

  const defaultValues = useMemo(
    () => ({
      fullname: '',
      adm_username: '',
      adm_password: '',
      email: '',
      level: '',
      member_group_id: user?.member_group_id?.toString() || '',
      notes: '',
    }),
    [user]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SubResellerFormData>({
    resolver: yupResolver(subResellerSchema) as unknown as any,
    defaultValues,
  });

  useEffect(() => {
    const fetchMemberGroups = async () => {
      try {
        setLoading(true);
        const groups = await getAllMemberGroupsName();
        setMemberGroups(groups || []);
      } catch (error) {
        console.error('Failed to load member groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberGroups();
  }, []);

  const onSubmit = async (data: SubResellerFormData) => {
    try {
      setSubmitting(true);

      const submitData: any = {
        ...data,
        balance: 0,
      };

      if (user?.level !== 1) {
        submitData.member_group_id = user?.member_group_id;
      }

      if (!submitData.email) {
        delete submitData.email;
      }

      const response = await createSubReseller(submitData);

      if (response?.data?.success || response?.success) {
        showToast.success(response?.data?.message || response?.message || 'Sub-reseller created successfully');
        setTimeout(() => {
          router.push('/dashboard/sub-resel/list');
        }, 1500);
      } else {
        showToast.error(response?.data?.result || response?.data?.error || response?.message || 'Unable to create sub-reseller');
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.error || err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          Create Sub-Reseller
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 1000, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={3}>
                    <Controller
                      name="fullname"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Full Name *"
                          fullWidth
                          error={!!errors.fullname}
                          helperText={errors.fullname?.message}
                        />
                      )}
                    />

                    <Controller
                      name="adm_username"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Username *"
                          fullWidth
                          error={!!errors.adm_username}
                          helperText={errors.adm_username?.message}
                        />
                      )}
                    />

                    <Controller
                      name="adm_password"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Password *"
                          type="password"
                          fullWidth
                          error={!!errors.adm_password}
                          helperText={errors.adm_password?.message}
                        />
                      )}
                    />

                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email"
                          type="email"
                          fullWidth
                          error={!!errors.email}
                          helperText={errors.email?.message}
                        />
                      )}
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Stack spacing={3}>
                    <Controller
                      name="level"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.level}>
                          <InputLabel>Level *</InputLabel>
                          <Select {...field} label="Level *">
                            <MenuItem value="">Select Level</MenuItem>
                            {levelOptions.map((level) => (
                              <MenuItem key={level.id} value={level.id.toString()}>
                                {level.value}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.level && (
                            <FormHelperText>{errors.level.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />

                    {user?.level === 1 && (
                      <Controller
                        name="member_group_id"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.member_group_id}>
                            <InputLabel>Resellers Group</InputLabel>
                            <Select {...field} label="Resellers Group">
                              <MenuItem value="">Select Group</MenuItem>
                              {memberGroups.map((member) => (
                                <MenuItem key={member.group_id} value={member.group_id.toString()}>
                                  {member.group_name}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.member_group_id && (
                              <FormHelperText>{errors.member_group_id.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    )}

                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Notes *"
                          fullWidth
                          multiline
                          rows={4}
                          error={!!errors.notes}
                          helperText={errors.notes?.message}
                        />
                      )}
                    />
                  </Stack>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Sub-Reseller'}
                </Button>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}