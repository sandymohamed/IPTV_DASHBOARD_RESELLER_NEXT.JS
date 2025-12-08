'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import dynamic from 'next/dynamic';
import { getTemplates } from '@/lib/services/templatesService';
import { renewEnigmaAction } from '@/app/dashboard/enigmas/renew/[id]/actions';
import PackageInfoCard from '@/components/dashboard/PackageInfoCard';

const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
});

const renewSchema: yup.ObjectSchema<RenewFormData> = yup
  .object({
    pkg: yup.string().required('Package is required'),
    package_id_type: yup.string().required('Package type is required'),
    template_id: yup.string().optional(),
    custom: yup.boolean().optional(),
    reseller_notes: yup.string().optional(),
  })
  .required();

export interface EnigmasRenewFormProps {
  currentEnigma: any;
  packages: any[];
  templates?: any[];
  balance?: number;
}

interface RenewFormData {
  pkg: string;
  package_id_type: string;
  template_id?: string;
  custom?: boolean;
  reseller_notes?: string;
}

export default function EnigmasRenewForm({ 
  currentEnigma, 
  packages = [], 
  templates = [],
  balance: initialBalance = 0 
}: EnigmasRenewFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packageTypes, setPackageTypes] = useState<any[]>([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState<number>(0);
  const [expDate, setExpDate] = useState<Date | null>(null);
  const [balance, setBalance] = useState<number>(initialBalance);
  
  // Template and bouquet states
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

  // Fetch balance if not provided
  useEffect(() => {
    if (initialBalance === 0) {
      fetch('/api/session')
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.balance !== undefined) {
            setBalance(data.user.balance);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch balance:', err);
        });
    }
  }, [initialBalance]);

  // Initialize template if enigma has one
  useEffect(() => {
    if (currentEnigma?.template_id) {
      setSelectedTemplateId(currentEnigma.template_id.toString());
      setCustomBouquet(true); // Template requires custom toggle ON
    } else {
      // Load enigma's current bouquets if they have any
      if (currentEnigma?.bouquet) {
        try {
          const bouquets = Array.isArray(currentEnigma.bouquet) 
            ? currentEnigma.bouquet 
            : (typeof currentEnigma.bouquet === 'string' ? JSON.parse(currentEnigma.bouquet) : []);
          setSelectedBouquets(bouquets || []);
        } catch (err) {
          console.error('Error parsing bouquets:', err);
        }
      }
      setCustomBouquet(false); // No template = custom OFF, show bouquets
    }
  }, [currentEnigma]);

  const defaultValues = useMemo(
    () => ({
      pkg: currentEnigma?.pkg?.toString() || '',
      package_id_type: '0',
      template_id: currentEnigma?.template_id?.toString() || '',
      custom: !currentEnigma?.template_id,
      reseller_notes: currentEnigma?.reseller_notes || '',
    }),
    [currentEnigma]
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RenewFormData>({
    resolver: yupResolver(renewSchema) as unknown as Resolver<RenewFormData>,
    defaultValues,
  });

  const selectedPackageId = watch('pkg');
  const selectedTypeValue = watch('package_id_type');
  const customBouquetValue = watch('custom');
  const selectedTemplate = watch('template_id');

  // Sync customBouquet state with form value
  useEffect(() => {
    setCustomBouquet(customBouquetValue !== false);
  }, [customBouquetValue]);

  // Update selected package when package ID changes
  useEffect(() => {
    if (selectedPackageId) {
      const pkg = packages.find(
        (p) => p.id?.toString() === selectedPackageId || p.package_id?.toString() === selectedPackageId
      );
      setSelectedPackage(pkg || null);

      if (pkg) {
        const types: any[] = [];

        // Add official type only (no trial for renew)
        if (pkg.is_official) {
          types.push({
            is_trial: 0,
            is_official: 1,
            official_duration: pkg.official_duration,
            official_duration_in: pkg.official_duration_in,
            credit: pkg.official_credits,
            value: `Official Use - [Credits price] ${pkg.official_credits} - [Duration] ${pkg.official_duration} ${pkg.official_duration_in}`,
          });
        }

        setPackageTypes(types);
        setSelectedTypeIndex(0);

        // Load package bouquets
        if (pkg.bouquetsdata && Array.isArray(pkg.bouquetsdata)) {
          setAllBouquets(pkg.bouquetsdata);
        }

        // Calculate expiration date
        if (types.length > 0 && currentEnigma?.exp_date) {
          const exp = Number(currentEnigma.exp_date);
          const nowSec = Date.now() / 1000;
          let currentDate = new Date();

          if (exp > nowSec) {
            currentDate = new Date(exp * 1000);
          } else {
            currentDate = new Date(Date.now() + exp * 1000);
          }

          const selectedType = types[0];
          if (selectedType.is_official && selectedType.official_duration_in === 'months') {
            currentDate.setMonth(currentDate.getMonth() + selectedType.official_duration);
            setExpDate(currentDate);
          } else if (selectedType.is_official && selectedType.official_duration_in === 'years') {
            currentDate.setMonth(currentDate.getMonth() + selectedType.official_duration * 12);
            setExpDate(currentDate);
          } else if (selectedType.is_official && selectedType.official_duration_in === 'days') {
            const totalHours = selectedType.official_duration * 24;
            currentDate.setHours(currentDate.getHours() + totalHours);
            setExpDate(currentDate);
          }
        }
      }
    }
  }, [selectedPackageId, packages, currentEnigma]);

  // Update expiration date when type changes
  useEffect(() => {
    if (selectedTypeValue && packageTypes.length > 0) {
      const typeIndex = parseInt(selectedTypeValue, 10);
      setSelectedTypeIndex(typeIndex);
      const selectedType = packageTypes[typeIndex];

      if (selectedType && currentEnigma?.exp_date) {
        const exp = Number(currentEnigma.exp_date);
        const nowSec = Date.now() / 1000;
        let currentDate = new Date();

        if (exp > nowSec) {
          currentDate = new Date(exp * 1000);
        } else {
          currentDate = new Date();
        }

        if (selectedType.is_official && selectedType.official_duration_in === 'months') {
          currentDate.setMonth(currentDate.getMonth() + selectedType.official_duration);
          setExpDate(currentDate);
        } else if (selectedType.is_official && selectedType.official_duration_in === 'years') {
          currentDate.setMonth(currentDate.getMonth() + selectedType.official_duration * 12);
          setExpDate(currentDate);
        } else if (selectedType.is_official && selectedType.official_duration_in === 'days') {
          const totalHours = selectedType.official_duration * 24;
          currentDate.setHours(currentDate.getHours() + totalHours);
          setExpDate(currentDate);
        }
      }
    }
  }, [selectedTypeValue, packageTypes, currentEnigma]);

  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      // If no template selected, enable custom bouquet mode
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
        // Restore package bouquets
        if (selectedPackage?.bouquetsdata) {
          setAllBouquets(selectedPackage.bouquetsdata || []);
          setSelectedBouquets([]);
        }
      }
      return newValue;
    });
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

  const onSubmit = async (data: RenewFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const selectedType = packageTypes[selectedTypeIndex];

      if (!selectedType || !selectedType.is_official) {
        showToast.error("Can't renew trial package");
        setError("Can't renew trial package");
        return;
      }

      // Validate bouquets (only if custom bouquet and no template)
      if (!selectedTemplateId && selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet or choose a template');
        return;
      }

      const totalCredits = selectedType.credit;

      if (balance - totalCredits < 0) {
        showToast.error('Your Credits is not allowed to own this package');
        setError('Your Credits is not allowed to own this package');
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

      const userLogs = `[<b>ResellerPanel</b> -> <u>Renew Official Enigma -> ${selectedPackage?.package_name} Cost ${selectedType.credit}`;

      const payload = {
        pkg: data.pkg,
        exp_date: expDate ? Math.floor(expDate.getTime() / 1000) : undefined,
        user_logs: userLogs,
        created_by: currentEnigma.created_by,
        is_trial: 0,
        bouquet: selectedTemplateId 
          ? selectedBouquets 
          : allOrder.length > 0 
            ? allOrder.filter((item) => selectedBouquets.includes(item))
            : selectedBouquets,
        new_order: allOrder.length > 0 ? allOrder : selectedBouquets,
        template_id: selectedTemplateId ? parseInt(selectedTemplateId) : 0,
        reseller_notes: data.reseller_notes || '',
      };

      const result = await renewEnigmaAction(currentEnigma.id, payload);

      if (result.success) {
        showToast.success(result.message || 'Enigma device renewed successfully');
        setSuccess(result.message || 'Enigma device renewed successfully');
        router.push('/dashboard/enigmas/list');
      } else {
        const message = result.error || 'Unable to renew Enigma device';
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
        <Typography variant="h4">Renew Enigma Device: {currentEnigma.mac || currentEnigma.username}</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ maxWidth: 800 }}>
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
                    name="pkg"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.pkg}>
                        <InputLabel>Select Package</InputLabel>
                        <Select {...field} label="Select Package">
                          {packages.map((pkg) => (
                            <MenuItem
                              key={pkg.id || pkg.package_id}
                              value={pkg.id?.toString() || pkg.package_id?.toString()}
                            >
                              {pkg.package_name || pkg.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.pkg && <FormHelperText>{errors.pkg.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />

                  {selectedPackage && packageTypes.length > 0 && (
                    <Controller
                      name="package_id_type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.package_id_type}>
                          <InputLabel>Select Type</InputLabel>
                          <Select {...field} label="Select Type">
                            {packageTypes.map((type, index) => (
                              <MenuItem key={index} value={index.toString()}>
                                {type.value}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.package_id_type && (
                            <FormHelperText>{errors.package_id_type.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  )}

                  {selectedPackage && (
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
                                // If enabling custom, clear template selection
                                if (e.target.checked) {
                                  setSelectedTemplateId('');
                                }
                              }}
                            />
                          }
                          label="Custom bouquet"
                        />
                      )}
                    />
                  )}

                  {selectedPackage && customBouquet && availableTemplates.length > 0 && (
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
                              const templateValue = e.target.value;
                              handleTemplateChange(templateValue);
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

                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button variant="outlined" onClick={() => router.back()} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                      {submitting ? 'Renewing...' : 'Renew Enigma Device'}
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Full-width card for bouquets selection */}
        {selectedPackage && !customBouquet && allBouquets.length > 0 && (
          <Grid item xs={12}>
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
          </Grid>
        )}

        <Grid item xs={12} md={4}>
          <PackageInfoCard selectedPackage={selectedPackage} balance={balance} />
        </Grid>
      </Grid>
    </Box>
  );
}

