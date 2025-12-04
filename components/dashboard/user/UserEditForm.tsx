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
  Switch,
  FormControlLabel,
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
    template_id: yup.string().optional(),
    custom: yup.boolean().optional(),
  })
  .required();

export interface UserEditFormProps {
  currentUser: any;
  packages?: any[];
  templates?: any[];
}

interface UserFormData {
  username?: string;
  password?: string;
  forced_country: string;
  reseller_notes?: string;
  template_id?: string;
  custom?: boolean;
}

export default function UserEditForm({ currentUser, packages = [], templates = [] }: UserEditFormProps) {
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

  // Initialize form data from currentUser
  useEffect(() => {
    if (currentUser) {
      // Set bouquets from current user
      if (currentUser.bouquet) {
        try {
          const bouquets = Array.isArray(currentUser.bouquet) 
            ? currentUser.bouquet 
            : (typeof currentUser.bouquet === 'string' ? JSON.parse(currentUser.bouquet) : []);
          setSelectedBouquets(bouquets || []);
        } catch (err) {
          console.error('Error parsing bouquets:', err);
        }
      }

      // Set template if exists
      if (currentUser.template_id) {
        setSelectedTemplateId(currentUser.template_id.toString());
        setCustomBouquet(false);
      }

      // Load bouquets from package if available
      if (currentUser.packages && currentUser.packages[0]?.bouquetsdata) {
        const packageBouquets = currentUser.packages[0].bouquetsdata || [];
        
        // If new_order exists, reorder bouquets based on it (like reference code line 129-135)
        if (currentUser.new_order && Array.isArray(currentUser.new_order) && currentUser.new_order.length > 0) {
          const orderedBouquets: any[] = [];
          // Add bouquets in the order specified by new_order
          currentUser.new_order.forEach((orderId: number) => {
            const item = packageBouquets.find((b: any) => b.id === orderId);
            if (item) orderedBouquets.push(item);
          });
          // Add any remaining bouquets not in new_order
          packageBouquets.forEach((b: any) => {
            if (!currentUser.new_order.includes(b.id)) {
              orderedBouquets.push(b);
            }
          });
          setAllBouquets(orderedBouquets);
          
          // Build order arrays for Live, Vod, Series based on ordered bouquets
          const liveOrder: number[] = [];
          const vodOrder: number[] = [];
          const seriesOrder: number[] = [];
          
          orderedBouquets.forEach((b: any) => {
            const name = b.bouquet_name?.toLowerCase() || '';
            if (name.includes('vod')) {
              vodOrder.push(b.id);
            } else if (name.includes('series')) {
              seriesOrder.push(b.id);
            } else {
              liveOrder.push(b.id);
            }
          });
          
          setNewOrderLive(liveOrder);
          setNewOrderVod(vodOrder);
          setNewOrderSeries(seriesOrder);
        } else {
          // No new_order, use default order
          setAllBouquets(packageBouquets);
        }
      }
    }
  }, [currentUser]);

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
      username: currentUser?.username || '',
      password: currentUser?.password ||'',
      forced_country: currentUser?.forced_country || 'ALL',
      reseller_notes: currentUser?.reseller_notes || '',
      template_id: currentUser?.template_id?.toString() || '',
      custom: !currentUser?.template_id,
    }),
    [currentUser]
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

  const customBouquetValue = watch('custom');
  const selectedTemplate = watch('template_id');

  // Sync customBouquet state with form value
  useEffect(() => {
    setCustomBouquet(customBouquetValue !== false);
  }, [customBouquetValue]);

  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = availableTemplates.find((t) => t.id?.toString() === templateId);
    if (template && template.bouquets) {
      try {
        const bouquetIds = typeof template.bouquets === 'string' 
          ? JSON.parse(template.bouquets) 
          : template.bouquets;
        setSelectedBouquets(Array.isArray(bouquetIds) ? bouquetIds : []);
        
        // Load template bouquets data if available
        if (template.bouquetsdata) {
          setAllBouquets(template.bouquetsdata);
        }
      } catch (err) {
        console.error('Error parsing template bouquets:', err);
        setSelectedBouquets([]);
      }
    }
  }, [availableTemplates]);

  // Handle custom bouquet toggle
  const handleCustomChange = useCallback(() => {
    setCustomBouquet((prev) => {
      const newValue = !prev;
      if (newValue) {
        // Reset template selection when switching to custom
        setSelectedTemplateId('');
        // Restore original bouquets if switching back to custom
        if (currentUser?.bouquet) {
          try {
            const bouquets = Array.isArray(currentUser.bouquet) 
              ? currentUser.bouquet 
              : JSON.parse(currentUser.bouquet);
            setSelectedBouquets(bouquets || []);
          } catch (err) {
            console.error('Error parsing bouquets:', err);
          }
        }
      }
      return newValue;
    });
  }, [currentUser]);

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

      // Validate bouquets - either template selected OR custom bouquets selected
      if (!selectedTemplateId && selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet or choose a template');
        return;
      }

      const arrayLive = [...newOrderLive];
      const arrayVod = [...newOrderVod];
      const arraySeries = [...newOrderSeries];

      // Fill with all bouquets if no order specified
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
        username: data.username || undefined,
        password: data.password || undefined,
        forced_country: data.forced_country,
        reseller_notes: data.reseller_notes || '',
        bouquet: allOrder.length > 0 
          ? allOrder.filter((item) => selectedBouquets.includes(item))
          : selectedBouquets,
        new_order: allOrder.length > 0 ? allOrder : selectedBouquets,
        template_id: selectedTemplateId ? parseInt(selectedTemplateId) : 0,
      };

      // Remove undefined values
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const { updateUserAction } = await import('@/app/dashboard/user/edit/[id]/actions');
      const result = await updateUserAction(currentUser.id, payload);

      if (result.success) {
        showToast.success(result.message || 'User updated successfully');
        setSuccess(result.message || 'User updated successfully');
        router.push('/dashboard/user/list');
        router.refresh(); // Force refresh server data
      } else {
        const message = result.error || 'Unable to update user';
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

  if (!currentUser) {
    return (
      <Box>
        <Alert severity="error">User not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mr: 2 }} disabled={submitting}>
          Back
        </Button>
        <Typography variant="h4">Edit User: {currentUser.username}</Typography>
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
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Username"
                        fullWidth
                        disabled
                        error={!!errors.username}
                        helperText={errors.username?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Password"
                        fullWidth
                        error={!!errors.password}
                        helperText={errors.password?.message}
                      />
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

                <Grid item xs={12}>
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
                </Grid>
              </Grid>

              {allBouquets.length > 0 && (
                <>
                  <Controller
                    name="custom"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={customBouquet}
                            onChange={(e) => {
                              field.onChange(e);
                              handleCustomChange();
                            }}
                          />
                        }
                        label="Custom bouquet"
                      />
                    )}
                  />

                  {!customBouquet && availableTemplates.length > 0 && (
                    <Controller
                      name="template_id"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.template_id}>
                          <InputLabel>Select Template</InputLabel>
                          <Select
                            {...field}
                            label="Select Template"
                            value={selectedTemplateId || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              handleTemplateChange(e.target.value);
                            }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {availableTemplates.map((template) => (
                              <MenuItem key={template.id} value={template.id?.toString()}>
                                {template.title || template.name || `Template ${template.id}`}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.template_id && (
                            <FormHelperText>{errors.template_id.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  )}

                </>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Full-width card for bouquets selection */}
      {!selectedTemplateId && allBouquets.length > 0 && (
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Select Bouquets (Add/Remove/Reorder)
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

