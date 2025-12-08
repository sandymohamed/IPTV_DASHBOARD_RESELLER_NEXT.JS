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
import { updateEnigmaAction } from '@/app/dashboard/enigmas/edit/[id]/actions';
import PackageInfoCard from '@/components/dashboard/PackageInfoCard';

const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
});

const enigmaSchema: yup.ObjectSchema<EnigmaFormData> = yup
  .object({
    mac: yup
      .string()
      .required('Device MAC Address is required')
      .matches(
        /^[a-fA-F0-9]{2}(?:[:-]?[a-fA-F0-9]{2}){5}(?:,[a-fA-F0-9]{2}(?:[:-]?[a-fA-F0-9]{2}){5})*$/,
        'Invalid MAC Address format'
      ),
    forced_country: yup.string().required('Allowed Country is required'),
    reseller_notes: yup.string().optional(),
    template_id: yup.string().optional(),
    custom: yup.boolean().optional(),
  })
  .required();

export interface EnigmasEditFormProps {
  currentEnigma: any;
  templates?: any[];
}

interface EnigmaFormData {
  mac: string;
  forced_country: string;
  reseller_notes?: string;
  template_id?: string;
  custom?: boolean;
}

export default function EnigmasEditForm({ currentEnigma, templates = [] }: EnigmasEditFormProps) {
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

  // Get current package from enigma data
  const currentPackage = useMemo(() => {
    return currentEnigma?.packages?.[0] || null;
  }, [currentEnigma]);

  // Initialize form data from currentEnigma (similar to reference code lines 108-140)
  useEffect(() => {
    if (currentEnigma) {
      // Set bouquets from current enigma
      if (currentEnigma.bouquet) {
        try {
          const bouquets = Array.isArray(currentEnigma.bouquet) 
            ? currentEnigma.bouquet 
            : (typeof currentEnigma.bouquet === 'string' ? JSON.parse(currentEnigma.bouquet) : []);
          setSelectedBouquets(bouquets || []);
        } catch (err) {
          console.error('Error parsing bouquets:', err);
        }
      }

      // Set template if exists
      if (currentEnigma.template_id !== undefined && currentEnigma.template_id !== null) {
        setSelectedTemplateId(currentEnigma.template_id.toString());
        // If template_id is 0, set custom to false (show drag-drop bouquets)
        if (currentEnigma.template_id === 0) {
          setCustomBouquet(false);
        } else {
          setCustomBouquet(true);
        }
      }

      // Load bouquets from package if available
      if (currentEnigma.packages && currentEnigma.packages[0]?.bouquetsdata) {
        const packageBouquets = currentEnigma.packages[0].bouquetsdata || [];
        
        // If new_order exists, reorder bouquets based on it (like reference code lines 123-128)
        if (currentEnigma.new_order && Array.isArray(currentEnigma.new_order) && currentEnigma.new_order.length > 0) {
          const orderedBouquets: any[] = [];
          // Add bouquets in the order specified by new_order
          currentEnigma.new_order.forEach((orderId: number) => {
            const item = packageBouquets.find((b: any) => b.id === orderId);
            if (item) orderedBouquets.push(item);
          });
          // Add any remaining bouquets not in new_order
          packageBouquets.forEach((b: any) => {
            if (!currentEnigma.new_order.includes(b.id)) {
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
  }, [currentEnigma]);

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
      mac: currentEnigma?.mac || '',
      forced_country: currentEnigma?.forced_country || 'ALL',
      reseller_notes: currentEnigma?.reseller_notes || '',
      template_id: currentEnigma?.template_id?.toString() || '',
      custom: currentEnigma?.template_id !== undefined && currentEnigma?.template_id !== null && currentEnigma?.template_id !== 0,
    }),
    [currentEnigma]
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnigmaFormData>({
    resolver: yupResolver(enigmaSchema) as unknown as Resolver<EnigmaFormData>,
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
        if (currentEnigma?.bouquet) {
          try {
            const bouquets = Array.isArray(currentEnigma.bouquet) 
              ? currentEnigma.bouquet 
              : JSON.parse(currentEnigma.bouquet);
            setSelectedBouquets(bouquets || []);
          } catch (err) {
            console.error('Error parsing bouquets:', err);
          }
        }
      }
      return newValue;
    });
  }, [currentEnigma]);

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

  const onSubmit = async (data: EnigmaFormData) => {
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
        mac: data.mac,
        forced_country: data.forced_country,
        reseller_notes: data.reseller_notes || '',
        bouquet: allOrder.length > 0 
          ? allOrder.filter((item) => selectedBouquets.includes(item))
          : selectedBouquets,
        new_order: allOrder.length > 0 ? allOrder : selectedBouquets,
        template_id: selectedTemplateId ? parseInt(selectedTemplateId) : 0,
      };

      const result = await updateEnigmaAction(currentEnigma.id, payload);

      if (result.success) {
        showToast.success(result.message || 'Enigma device updated successfully');
        setSuccess(result.message || 'Enigma device updated successfully');
        router.push('/dashboard/enigmas/list');
      } else {
        const message = result.error || 'Unable to update Enigma device';
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

  if (!currentEnigma) {
    return (
      <Box>
        <Alert severity="error">Enigma device not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mr: 2 }} disabled={submitting}>
          Back
        </Button>
        <Typography variant="h4">Edit Enigma Device: {currentEnigma.mac || currentEnigma.username}</Typography>
      </Box>

      {/* Alerts */}
      {(error || success) && (
        <Box sx={{ mb: 3, maxWidth: 1200, mx: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Two Column Layout: Form on Left, Package Info on Right */}
      <Grid container spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Left Column - Form */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="mac"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Device MAC Address"
                        fullWidth
                        disabled
                        error={!!errors.mac}
                        helperText={errors.mac?.message}
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

                  {(currentPackage && customBouquetValue && availableTemplates.length > 0) && (
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
        </Grid>

        {/* Right Column - Package Info */}
        <Grid item xs={12} lg={5}>
          <PackageInfoCard selectedPackage={currentPackage} />
        </Grid>
      </Grid>

      {/* Full-width card for bouquets selection */}
      {(currentPackage && !customBouquetValue && allBouquets.length > 0) && (
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

