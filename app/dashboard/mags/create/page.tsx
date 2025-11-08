'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Grid from '@mui/material/Grid';
import { createMag } from '@/lib/services/magsService';
import { getPackagesMembersList } from '@/lib/services/packagesService';
import { countries } from '@/lib/constants/countries';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { showToast } from '@/lib/utils/toast';

// Dynamic import for code splitting and better performance
const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
  loading: () => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const magSchema: yup.ObjectSchema<MagFormData> = yup
  .object({
    mac: yup
      .string()
      .required('Device MAC Address is required')
      .matches(
        /^[a-fA-F0-9]{2}(?:[:-]?[a-fA-F0-9]{2}){5}(?:,[a-fA-F0-9]{2}(?:[:-]?[a-fA-F0-9]{2}){5})*$/,
        'Invalid MAC Address format (e.g., 00:11:22:33:44:55)'
      ),
    forced_country: yup.string().required('Allowed Country is required'),
    reseller_notes: yup.string().optional(),
    pkg: yup.string().required('Package is required'),
    is_trial: yup.number().required('Type status is required'),
  })
  .required();

interface MagFormData {
  mac: string;
  forced_country: string;
  reseller_notes?: string;
  pkg: string;
  is_trial: number;
}

export default function MagsCreatePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);

  const defaultValues = useMemo(
    () => ({
      mac: '',
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
  } = useForm<MagFormData>({
    resolver: yupResolver(magSchema) as unknown as Resolver<MagFormData>,
    defaultValues,
  });

  const selectedPackageId = watch('pkg');
  const selectedPackage = packages.find((pkg) => pkg.id?.toString() === selectedPackageId || pkg.package_id?.toString() === selectedPackageId);

  // Categorize bouquets
  const bouquets = useMemo(() => {
    if (!allBouquets || allBouquets.length === 0) {
      return { bouquetsLive: [], bouquetsVODS: [], bouquetsSeries: [] };
    }

    const bouquetsLive = allBouquets.filter(
      (x) =>
        x.bouquet_name?.toLowerCase().indexOf('vod') === -1 &&
        x.bouquet_name?.toLowerCase().indexOf('series') === -1
    );

    const bouquetsVODS = allBouquets.filter(
      (x) => x.bouquet_name?.toLowerCase().indexOf('vod') !== -1
    );

    const bouquetsSeries = allBouquets.filter(
      (x) => x.bouquet_name?.toLowerCase().indexOf('series') !== -1
    );

    return { bouquetsLive, bouquetsVODS, bouquetsSeries };
  }, [allBouquets]);

  // Load bouquets when package changes
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

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        if (user?.member_group_id) {
          const packagesList = await getPackagesMembersList(user.member_group_id);
          setPackages(packagesList || []);
        }
      } catch (err: any) {
        setError('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    if (user?.member_group_id) {
      fetchPackages();
    }
  }, [user?.member_group_id]);

  // Memoized bouquet handlers for better performance
  const handleSelectedBouquet = useCallback((id: number) => {
    setSelectedBouquets((prev) => {
      const isAlreadySelected = prev.includes(id);
      return isAlreadySelected
        ? prev.filter((item) => item !== id)
        : [...prev, id];
    });
  }, []);

  const handleNewOrderLive = useCallback((newItems: any[]) => {
    const totalItemsIDs = newItems.map((item) => item.id);
    setNewOrderLive(totalItemsIDs);
  }, []);

  const handleNewOrderVod = useCallback((newItems: any[]) => {
    const totalItemsIDs = newItems.map((item) => item.id);
    setNewOrderVod(totalItemsIDs);
  }, []);

  const handleNewOrderSeries = useCallback((newItems: any[]) => {
    const totalItemsIDs = newItems.map((item) => item.id);
    setNewOrderSeries(totalItemsIDs);
  }, []);

  const handleSelectAll = useCallback((totalItems: any[]) => {
    const totalItemsIDs = totalItems.map((item) => item.id);
    setSelectedBouquets((prev) => {
      const totalIDs = [...prev, ...totalItemsIDs];
      return [...new Set(totalIDs)];
    });
  }, []);

  const handleSelectNone = useCallback((totalItems: any[]) => {
    setSelectedBouquets((prev) => {
      let arr = [...prev];
      totalItems.forEach((item) => {
        arr = arr.filter((selectedId) => selectedId !== item.id);
      });
      return arr;
    });
  }, []);

  const onSubmit = async (data: MagFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet');
        setSubmitting(false);
        return;
      }

      // Combine all new orders
      const newOrder = [...newOrderLive, ...newOrderVod, ...newOrderSeries];

      const submitData: any = {
        mac: data.mac,
        forced_country: data.forced_country,
        reseller_notes: data.reseller_notes || '',
        pkg: data.pkg,
        is_trial: data.is_trial,
        bouquet: selectedBouquets,
        new_order: newOrder.length > 0 ? newOrder : undefined,
      };

      const response = await createMag(submitData);

      if (response?.data?.success || response?.success) {
        showToast.success(response?.data?.message || response?.message || 'MAG device created successfully');
        updateUser();
        setTimeout(() => {
          router.push('/dashboard/mags/list');
        }, 1500);
      } else {
        showToast.error(response?.data?.error || response?.message || 'Unable to create MAG device');
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
          Create MAG Device
        </Typography>
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

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <Controller
                  name="mac"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Device MAC Address *"
                      placeholder="00:11:22:33:44:55"
                      fullWidth
                      error={!!errors.mac}
                      helperText={errors.mac?.message || 'Format: 00:11:22:33:44:55 or 00-11-22-33-44-55'}
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
                        {packages.map((pkg) => (
                          <MenuItem key={pkg.id || pkg.package_id} value={pkg.id?.toString() || pkg.package_id?.toString()}>
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
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Package Info:</Typography>
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

                {/* Bouquets Section */}
                {selectedPackage && allBouquets.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Select Bouquets
                    </Typography>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        rowGap: 0,
                        columnGap: 0,
                      }}
                    >
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
                    {submitting ? 'Creating...' : 'Create MAG Device'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}