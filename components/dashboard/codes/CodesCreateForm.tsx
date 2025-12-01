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
  Checkbox,
  FormControlLabel,
  Autocomplete,
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
import { createCode } from '@/lib/services/codesService';
import { getSubResellers } from '@/lib/services/subResellersService';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';

const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
});

const codeSchema: yup.ObjectSchema<CodeFormData> = yup
  .object({
    fullname: yup.string().required('Full name is required'),
    adminid: yup.mixed().nullable(),
    mobile: yup.string().nullable(),
    notes: yup.string().nullable(),
    period: yup.number().nullable(),
    package: yup.number().nullable(),
    num: yup.number().required('Number of codes is required').min(1, 'At least 1 code').max(1000, 'Maximum 1000 codes'),
    length: yup.number().required('Code length is required').oneOf([10, 12, 14, 16], 'Length must be 10, 12, 14, or 16'),
    forced_country: yup.string().nullable(),
    allowed_uagent: yup.string().nullable(),
    output: yup.string().required('Output Format is required'),
    islam_pkg: yup.boolean().default(false),
  })
  .required();

export interface CodesCreateFormProps {
  packages: any[];
  resellers?: any[];
  user?: any;
}

interface CodeFormData {
  fullname: string;
  adminid: any;
  mobile?: string;
  notes?: string;
  period?: number;
  package?: number;
  num: number;
  length: number;
  forced_country?: string;
  allowed_uagent?: string;
  output: string;
  islam_pkg?: boolean;
}

export default function CodesCreateForm({ packages, resellers = [], user }: CodesCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);
  const [resellersList, setResellersList] = useState<any[]>(resellers);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    if (resellers.length === 0) {
      getSubResellers({ page: 1, pageSize: 1000 }).then((result) => {
        if (result.data && result.data.length >= 0) {
          const formattedData = result.data.map((item: any) => ({
            id: item.adminid || item.id,
            label: item.admin_name || item.adm_username || item.username || 'Unknown',
            value: item.adminid || item.id,
          }));
          setResellersList(formattedData);
        }
      }).catch((err) => {
        console.error('Failed to fetch resellers:', err);
      });
    }
  }, [resellers.length]);

  const defaultValues = useMemo(
    () => ({
      fullname: '',
      adminid: user ? { id: user.adminid || user.id, label: user.admin_name || user.adm_username, value: user.adminid || user.id } : null,
      mobile: '',
      notes: '',
      period: null,
      package: null,
      num: 1,
      length: 14,
      forced_country: 'ALL',
      allowed_uagent: '',
      output: 'ts',
      islam_pkg: false,
    }),
    [user]
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CodeFormData>({
    resolver: yupResolver(codeSchema) as unknown as Resolver<CodeFormData>,
    defaultValues,
  });

  const watchPackage = watch('package');
  const watchAdminid = watch('adminid');

  useEffect(() => {
    if (watchPackage) {
      setSelectedPackageId(watchPackage.toString());
      const selectedPackage = packages.find(
        (pkg) => pkg.id?.toString() === watchPackage.toString() || pkg.package_id?.toString() === watchPackage.toString()
      );
      if (selectedPackage?.bouquetsdata) {
        setAllBouquets(selectedPackage.bouquetsdata || []);
        setSelectedBouquets([]);
        setNewOrderLive([]);
        setNewOrderVod([]);
        setNewOrderSeries([]);
      }
    }
  }, [watchPackage, packages]);

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

  const onSubmit = async (data: CodeFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Validate bouquets
      if (selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet');
        return;
      }

      // Build order arrays
      const arrayLive = [...newOrderLive];
      const arrayVod = [...newOrderVod];
      const arraySeries = [...newOrderSeries];

      if (newOrderLive.length < 1 && bouquets.bouquetsLive.length > 0) {
        bouquets.bouquetsLive.forEach((item) => arrayLive.push(item.id));
      }

      if (newOrderVod.length < 1 && bouquets.bouquetsVODS.length > 0) {
        bouquets.bouquetsVODS.forEach((item) => arrayVod.push(item.id));
      }

      if (newOrderSeries.length < 1 && bouquets.bouquetsSeries.length > 0) {
        bouquets.bouquetsSeries.forEach((item) => arraySeries.push(item.id));
      }

      const allOrder = [...arrayLive, ...arrayVod, ...arraySeries];

      const payload: any = {
        fullname: data.fullname,
        adminid: data.adminid?.value || data.adminid?.id || data.adminid,
        mobile: data.mobile || '',
        notes: data.notes || '',
        period: data.period || null,
        package: data.package || null,
        num: data.num,
        length: data.length,
        bouquets: allOrder.length > 0 
          ? allOrder.filter((item) => selectedBouquets.includes(item))
          : selectedBouquets,
        new_order: allOrder.length > 0 ? allOrder : selectedBouquets,
        forced_country: data.forced_country || 'ALL',
        allowed_uagent: data.allowed_uagent || '',
        output: data.output,
        islam_pkg: data.islam_pkg || false,
      };

      const response = await createCode(payload);

      if (response?.success || response?.data?.success) {
        const message = response?.message || response?.data?.message || `${data.num} codes created successfully`;
        showToast.success(message);
        setSuccess(message);
        setTimeout(() => {
          router.push('/dashboard/codes/list');
        }, 1200);
      } else {
        const errorMsg = response?.error || response?.data?.error || 'Unable to create codes';
        showToast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.error || 'An error occurred. Please try again.';
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
        <Typography variant="h4">Create Code</Typography>
      </Box>

      <Card sx={{ maxWidth: 1200, mx: 'auto' }}>
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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="adminid"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={resellersList}
                        getOptionLabel={(option) => option.label || option}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        onChange={(_, newValue) => field.onChange(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="From Reseller"
                            error={!!errors.adminid}
                            helperText={errors.adminid?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="mobile"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mobile"
                        fullWidth
                        error={!!errors.mobile}
                        helperText={errors.mobile?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="num"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Number of Codes *"
                        type="number"
                        fullWidth
                        inputProps={{ min: 1, max: 1000 }}
                        error={!!errors.num}
                        helperText={errors.num?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="length"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.length}>
                        <InputLabel>Code Length *</InputLabel>
                        <Select {...field} label="Code Length *">
                          <MenuItem value={10}>10 digits</MenuItem>
                          <MenuItem value={12}>12 digits</MenuItem>
                          <MenuItem value={14}>14 digits</MenuItem>
                          <MenuItem value={16}>16 digits</MenuItem>
                        </Select>
                        {errors.length && <FormHelperText>{errors.length.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="allowed_uagent"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Allowed User Agents"
                        fullWidth
                        error={!!errors.allowed_uagent}
                        helperText={errors.allowed_uagent?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="output"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.output}>
                        <InputLabel>Output Format *</InputLabel>
                        <Select {...field} label="Output Format *">
                          <MenuItem value="m3u8">HLS</MenuItem>
                          <MenuItem value="ts">MPEGTS</MenuItem>
                        </Select>
                        {errors.output && <FormHelperText>{errors.output.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="package"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.package}>
                        <InputLabel>Select Package</InputLabel>
                        <Select {...field} label="Select Package">
                          <MenuItem value="">None</MenuItem>
                          {packages.map((pkg) => (
                            <MenuItem
                              key={pkg.id || pkg.package_id}
                              value={pkg.id?.toString() || pkg.package_id?.toString()}
                            >
                              {pkg.package_name || pkg.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.package && <FormHelperText>{errors.package.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                {watchAdminid === 0 && user?.member_group_id === 0 && (
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="period"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.period}>
                          <InputLabel>Period (Days)</InputLabel>
                          <Select {...field} label="Period (Days)">
                            <MenuItem value="">Select Period</MenuItem>
                            <MenuItem value={30}>1 Month (30 days)</MenuItem>
                            <MenuItem value={60}>2 Months (60 days)</MenuItem>
                            <MenuItem value={90}>3 Months (90 days)</MenuItem>
                            <MenuItem value={180}>6 Months (180 days)</MenuItem>
                            <MenuItem value={365}>1 Year (365 days)</MenuItem>
                            <MenuItem value={101}>1 Day Free</MenuItem>
                            <MenuItem value={103}>3 Days Free</MenuItem>
                            <MenuItem value={107}>7 Days Free</MenuItem>
                          </Select>
                          {errors.period && <FormHelperText>{errors.period.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Notes"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="islam_pkg"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Islamic Package"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {selectedPackageId && allBouquets.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Select Bouquets
                  </Typography>
                  <Grid container spacing={2}>
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
                  {submitting ? 'Creating...' : 'Create Codes'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

