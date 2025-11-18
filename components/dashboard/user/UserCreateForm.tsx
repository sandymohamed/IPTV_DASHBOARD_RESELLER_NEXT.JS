'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { countries } from '@/lib/constants/countries';
import { showToast } from '@/lib/utils/toast';
import { createUserAction } from '@/app/dashboard/user/new/actions';

const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
});

const userSchema: yup.ObjectSchema<UserFormData> = yup
  .object({
    username: yup.string().optional(),
    password: yup.string().optional(),
    forced_country: yup.string().required('Allowed Country is required'),
    reseller_notes: yup.string().optional(),
    pkg: yup.string().required('Package is required'),
    is_trial: yup.number().required('Type status is required'),
  })
  .required();

export interface UserCreateFormProps {
  packages: any[];
}

interface UserFormData {
  username?: string;
  password?: string;
  forced_country: string;
  reseller_notes?: string;
  pkg: string;
  is_trial: number;
}

export default function UserCreateForm({ packages }: UserCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);

  const defaultValues = useMemo(
    () => ({
      username: '',
      password: '',
      forced_country: 'ALL',
      reseller_notes: '',
      pkg: '',
      is_trial: 0,
    }),
    []
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema) as unknown as Resolver<UserFormData>,
    defaultValues,
  });

  const selectedPackageId = watch('pkg');
  const availablePackages = useMemo(() => packages ?? [], [packages]);

  const selectedPackage = useMemo(
    () =>
      availablePackages.find(
        (pkg) => pkg.id?.toString() === selectedPackageId || pkg.package_id?.toString() === selectedPackageId
      ),
    [availablePackages, selectedPackageId]
  );

  useEffect(() => {
    if (selectedPackage?.bouquetsdata) {
      setAllBouquets(selectedPackage.bouquetsdata || []);
      setSelectedBouquets([]);
      setNewOrderLive([]);
      setNewOrderVod([]);
      setNewOrderSeries([]);
    } else {
      setAllBouquets([]);
    }
  }, [selectedPackage]);

  const bouquets = useMemo(() => {
    if (!allBouquets || allBouquets.length === 0) {
      return { bouquetsLive: [], bouquetsVODS: [], bouquetsSeries: [] };
    }

    const bouquetsLive = allBouquets.filter(
      (x) =>
        x.bouquet_name?.toLowerCase().indexOf('vod') === -1 &&
        x.bouquet_name?.toLowerCase().indexOf('series') === -1
    );

    const bouquetsVODS = allBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('vod') !== -1);
    const bouquetsSeries = allBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('series') !== -1);

    return { bouquetsLive, bouquetsVODS, bouquetsSeries };
  }, [allBouquets]);

  const handleSelectedBouquet = useCallback((id: number) => {
    setSelectedBouquets((prev) => {
      const isAlreadySelected = prev.includes(id);
      return isAlreadySelected ? prev.filter((item) => item !== id) : [...prev, id];
    });
  }, []);

  const handleNewOrderLive = useCallback((newItems: any[]) => {
    setNewOrderLive(newItems.map((item) => item.id));
  }, []);

  const handleNewOrderVod = useCallback((newItems: any[]) => {
    setNewOrderVod(newItems.map((item) => item.id));
  }, []);

  const handleNewOrderSeries = useCallback((newItems: any[]) => {
    setNewOrderSeries(newItems.map((item) => item.id));
  }, []);

  const handleSelectAll = useCallback((items: any[]) => {
    const ids = items.map((item) => item.id);
    setSelectedBouquets((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const handleSelectNone = useCallback((items: any[]) => {
    const ids = new Set(items.map((item) => item.id));
    setSelectedBouquets((prev) => prev.filter((id) => !ids.has(id)));
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet');
        return;
      }

      const newOrder = [...newOrderLive, ...newOrderVod, ...newOrderSeries];

      const payload = {
        username: data.username || undefined,
        password: data.password || undefined,
        forced_country: data.forced_country,
        reseller_notes: data.reseller_notes || '',
        pkg: data.pkg,
        is_trial: data.is_trial,
        bouquet: selectedBouquets,
        new_order: newOrder.length > 0 ? newOrder : undefined,
      };

      const result = await createUserAction(payload);

      if (result.success) {
        showToast.success(result.message || 'User created successfully');
        setSuccess(result.message || 'User created successfully');
        setTimeout(() => {
          router.push('/dashboard/user/list');
        }, 1200);
      } else {
        const message = result.error || 'Unable to create user';
        showToast.error(message);
        setError(message);
      }
    } catch (error: any) {
      const message = error?.message || 'An error occurred. Please try again.';
      showToast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mr: 2 }} disabled={submitting}>
          Back
        </Button>
        <Typography variant="h4">Create User</Typography>
      </Box>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Username (Optional)"
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password (Optional)"
                    type="password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />

              <Controller
                name="forced_country"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.forced_country}>
                    <InputLabel>Allowed Country</InputLabel>
                    <Select {...field} label="Allowed Country">
                      {countries.map((country) => (
                        <MenuItem key={country.id} value={country.id}>
                          {country.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.forced_country && (
                      <FormHelperText>{errors.forced_country.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="pkg"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.pkg}>
                    <InputLabel>Package</InputLabel>
                    <Select {...field} label="Package">
                      {availablePackages.map((pkg) => (
                        <MenuItem
                          key={pkg.id || pkg.package_id}
                          value={pkg.id?.toString() || pkg.package_id?.toString()}
                        >
                          {pkg.package_name || pkg.name} - {pkg.is_trial ? 'Trial' : 'Official'}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.pkg && <FormHelperText>{errors.pkg.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              {selectedPackage && (
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Package Info:
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Max Connections: {selectedPackage.max_connections || 0}
                    </Typography>
                    <Typography variant="body2">
                      Duration: {selectedPackage.official_duration || 0} {selectedPackage.official_duration_in || ''}
                    </Typography>
                    <Typography variant="body2">
                      Price: {selectedPackage.official_credits || 0} credits
                    </Typography>
                  </Stack>
                </Card>
              )}

              <Controller
                name="is_trial"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.is_trial}>
                    <InputLabel>Type</InputLabel>
                    <Select {...field} label="Type">
                      <MenuItem value={0}>Official</MenuItem>
                      <MenuItem value={1}>Trial</MenuItem>
                    </Select>
                    {errors.is_trial && <FormHelperText>{errors.is_trial.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="reseller_notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.reseller_notes}
                    helperText={errors.reseller_notes?.message}
                  />
                )}
              />

              {selectedPackage && allBouquets.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Select Bouquets
                  </Typography>
                  <Grid container spacing={2} sx={{ rowGap: 0, columnGap: 0 }}>
                    {bouquets.bouquetsLive.length > 0 && (
                      <Grid item xs={12} sm={6} md={4}>
                        <DragDropCheckbox
                          initial={bouquets.bouquetsLive}
                          title="LIVE"
                          selected={selectedBouquets}
                          handleSelectedBouquet={handleSelectedBouquet}
                          handleSelectAll={handleSelectAll}
                          handleSelectNone={handleSelectNone}
                          handleNewOrder={handleNewOrderLive}
                        />
                      </Grid>
                    )}

                    {bouquets.bouquetsVODS.length > 0 && (
                      <Grid item xs={12} sm={6} md={4}>
                        <DragDropCheckbox
                          initial={bouquets.bouquetsVODS}
                          title="VOD"
                          selected={selectedBouquets}
                          handleSelectedBouquet={handleSelectedBouquet}
                          handleSelectAll={handleSelectAll}
                          handleSelectNone={handleSelectNone}
                          handleNewOrder={handleNewOrderVod}
                        />
                      </Grid>
                    )}

                    {bouquets.bouquetsSeries.length > 0 && (
                      <Grid item xs={12} sm={6} md={4}>
                        <DragDropCheckbox
                          initial={bouquets.bouquetsSeries}
                          title="SERIES"
                          selected={selectedBouquets}
                          handleSelectedBouquet={handleSelectedBouquet}
                          handleSelectAll={handleSelectAll}
                          handleSelectNone={handleSelectNone}
                          handleNewOrder={handleNewOrderSeries}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

