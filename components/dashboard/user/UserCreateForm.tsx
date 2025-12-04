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
import { Switch, FormControlLabel } from '@mui/material';
import { getTemplates } from '@/lib/services/templatesService';

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
    template_id: yup.string().optional(),
    custom: yup.boolean().optional(),
  })
  .required();

export interface UserCreateFormProps {
  packages: any[];
  templates?: any[];
}

interface UserFormData {
  username?: string;
  password?: string;
  forced_country: string;
  reseller_notes?: string;
  pkg: string;
  is_trial: number;
  template_id?: string;
  custom?: boolean;
}

export default function UserCreateForm({ packages, templates = [] }: UserCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>(templates);
  const [customBouquet, setCustomBouquet] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fetch templates on mount if not provided
  useEffect(() => {
    if (templates.length === 0) {
      getTemplates().then((data) => {
        setAvailableTemplates(data || []);
      }).catch((err) => {
        console.error('Failed to fetch templates:', err);
      });
    }
  }, [templates.length]);

  const defaultValues = useMemo(
    () => ({
      username: '',
      password: '',
      forced_country: 'ALL',
      reseller_notes: '',
      pkg: '',
      is_trial: 0,
      template_id: '',
      custom: true,
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
  const customBouquetValue = watch('custom');
   const availablePackages = useMemo(() => packages ?? [], [packages]);

  // Sync customBouquet state with form value
  useEffect(() => {
    setCustomBouquet(customBouquetValue !== false);
  }, [customBouquetValue]);

  const selectedPackage = useMemo(
    () =>
      availablePackages.find(
        (pkg) => pkg.id?.toString() === selectedPackageId || pkg.package_id?.toString() === selectedPackageId
      ),
    [availablePackages, selectedPackageId]
  );


  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      // If no template selected, reset to custom bouquet mode
      setCustomBouquet(true);
      // Restore package bouquets if available
      if (selectedPackage?.bouquetsdata) {
        setAllBouquets(selectedPackage.bouquetsdata || []);
      }
      return;
    }

    const template = availableTemplates.find((t) => t.id?.toString() === templateId);
    if (template) {
      // If template has bouquetsdata, use it
      if (template.bouquetsdata && Array.isArray(template.bouquetsdata)) {
        setAllBouquets(template.bouquetsdata);
      }

      if (template.bouquets) {
        try {
          const bouquetIds = typeof template.bouquets === 'string'
            ? JSON.parse(template.bouquets)
            : template.bouquets;
          setSelectedBouquets(Array.isArray(bouquetIds) ? bouquetIds : []);
          // Disable custom bouquet mode when template is selected
          setCustomBouquet(false);
        } catch (err) {
          console.error('Error parsing template bouquets:', err);
          setSelectedBouquets([]);
        }
      }
    }
  }, [availableTemplates, selectedPackage]);

  // Handle custom bouquet toggle
  const handleCustomChange = useCallback(() => {
    setCustomBouquet((prev) => {
      const newValue = !prev;
      if (newValue) {
        // Reset template selection when switching to custom
        setSelectedTemplateId('');
        setSelectedBouquets([]);
      }
      return newValue;
    });
  }, []);


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

      // Validate bouquets
      if (!selectedTemplateId && selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet or choose a template');
        return;
      }

      // Build order arrays - fill with all bouquets if no order specified
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

      const payload = {
        username: data.username || undefined,
        password: data.password || undefined,
        forced_country: data.forced_country,
        reseller_notes: data.reseller_notes || '',
        pkg: data.pkg,
        is_trial: data.is_trial,
        bouquet: selectedTemplateId 
          ? selectedBouquets 
          : allOrder.length > 0 
            ? allOrder.filter((item) => selectedBouquets.includes(item))
            : selectedBouquets,
        new_order: allOrder.length > 0 ? allOrder : selectedBouquets,
        template_id: selectedTemplateId ? parseInt(selectedTemplateId) : 0,
      };

      const result = await createUserAction(payload);

      if (result.success) {
        showToast.success(result.message || 'User created successfully');
        setSuccess(result.message || 'User created successfully');
        router.push('/dashboard/user/list');
        router.refresh(); // Force refresh server data
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
                    label="Reseller Notes"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.reseller_notes}
                    helperText={errors.reseller_notes?.message}
                  />
                )}
              />
                {selectedPackage && (
                <Controller
                  name="custom"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={customBouquet && !selectedTemplateId}
                          onChange={(e) => {
                            field.onChange(e);
                            handleCustomChange();
                            // If enabling custom, clear template selection
                            if (e.target.checked) {
                              setSelectedTemplateId('');
                            }
                          }}
                          disabled={!!selectedTemplateId}
                        />
                      }
                      label="Custom bouquet"
                    />
                  )}
                />
              )}

              {(selectedPackage && customBouquetValue && availableTemplates.length > 0 )&& (
                <Controller
                  name="template_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.template_id}>
                      <InputLabel>Select Template (Optional)</InputLabel>
                      <Select
                        {...field}
                        label="Select Template (Optional)"
                        value={selectedTemplateId || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          const templateValue = e.target.value;
                          handleTemplateChange(templateValue);
                          // If template is selected, turn off custom bouquet mode
                          if (templateValue) {
                            setCustomBouquet(false);
                          }
                        }}
                      >
                        <MenuItem value="">None - Use Custom Bouquets</MenuItem>
                        {availableTemplates.map((template) => (
                          <MenuItem key={template.id} value={template.id?.toString()}>
                            {template.title || template.name || `Template ${template.id}`}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.template_id && (
                        <FormHelperText>{errors.template_id.message}</FormHelperText>
                      )}
                      <FormHelperText>
                        Select a template to use predefined bouquets, or leave as &quot;None&quot; to select custom bouquets below
                      </FormHelperText>
                    </FormControl>
                  )}
                />
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

      {/* Full-width card for bouquets selection */}
      {(selectedPackage && !customBouquetValue && allBouquets.length > 0) && (
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select Bouquets
            </Typography>
            <Grid container spacing={3}>
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

