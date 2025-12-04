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
  CircularProgress,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import { updateTemplate } from '@/lib/services/templatesService';
import dynamic from 'next/dynamic';

const DragDropCheckbox = dynamic(() => import('@/components/form/DragDropCheckbox'), {
  ssr: false,
});

const templateSchema: yup.ObjectSchema<TemplateFormData> = yup
  .object({
    title: yup.string().required('Template Title is required'),
    package: yup.string().required('Package is required'),
  })
  .required();

export interface TemplateEditFormProps {
  currentTemplate: any;
  packages: any[];
}

interface TemplateFormData {
  title: string;
  package: string;
}

export default function TemplateEditForm({ currentTemplate, packages }: TemplateEditFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);



  useEffect(() => {
    console.log('currentTemplate', currentTemplate);
    console.log('packages', packages);
    console.log('selectedBouquets', selectedBouquets);
    console.log('newOrderLive', newOrderLive);
    console.log('newOrderVod', newOrderVod);
    console.log('newOrderSeries', newOrderSeries);
   }, [currentTemplate,packages, selectedBouquets, newOrderLive, newOrderVod, newOrderSeries, ]);


  const availablePackages = useMemo(() => packages ?? [], [packages]);

  // Get package value - ensure it's a string to match MenuItem values
  const getPackageValue = useCallback((pkgId: any) => {
    if (!pkgId) return '';
    // First try to find matching package by ID to get the correct format
    if (availablePackages.length > 0) {
      const pkg = availablePackages.find(
        (p) => String(p.id) === String(pkgId) || String(p.package_id) === String(pkgId) || Number(p.id) === Number(pkgId) || Number(p.package_id) === Number(pkgId)
      );
      if (pkg) return String(pkg.id);
    }
    // Fallback: return as string
    return String(pkgId);
  }, [availablePackages]);

  // Initialize default values - use template package value directly as string
  const defaultValues = useMemo(
    () => ({
      title: currentTemplate?.title || '',
      package: currentTemplate?.package ? String(currentTemplate.package) : '',
    }),
    [currentTemplate]
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: yupResolver(templateSchema),
    defaultValues,
  });

  const selectedPackageId = watch('package');

  // Update package value when packages load to ensure it matches MenuItem format
  useEffect(() => {
    if (mounted && currentTemplate?.package && availablePackages.length > 0) {
      const correctPackageValue = getPackageValue(currentTemplate.package);
      if (correctPackageValue && correctPackageValue !== selectedPackageId) {
        setValue('package', correctPackageValue, { shouldValidate: false });
      }
    }
  }, [mounted, currentTemplate, availablePackages, getPackageValue, setValue, selectedPackageId]);

  // Initialize bouquets from current template when packages are loaded
  useEffect(() => {
    if (!mounted || !currentTemplate || !availablePackages || availablePackages.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏳ Waiting for data to load:', {
          mounted,
          hasTemplate: !!currentTemplate,
          packagesCount: availablePackages?.length || 0,
        });
      }
      return;
    }
    
    try {
      // Set selected bouquets from template
      if (currentTemplate.bouquets) {
        const bouquetsData =
          typeof currentTemplate.bouquets === 'string'
            ? JSON.parse(currentTemplate.bouquets)
            : currentTemplate.bouquets;
        setSelectedBouquets(Array.isArray(bouquetsData) ? bouquetsData : []);
      }

      // Find the package that matches the template's package
      const templatePackageId = currentTemplate.package;
      const currentPackageData = availablePackages.find(
        (item) => 
          String(item.id) === String(templatePackageId) || 
          String(item.package_id) === String(templatePackageId) ||
          Number(item.id) === Number(templatePackageId) ||
          Number(item.package_id) === Number(templatePackageId)
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Template Edit - Initializing bouquets:', {
          templatePackageId,
          foundPackage: currentPackageData ? {
            id: currentPackageData.id,
            name: currentPackageData.package_name,
            hasBouquetsData: !!currentPackageData.bouquetsdata,
            bouquetsCount: Array.isArray(currentPackageData.bouquetsdata) ? currentPackageData.bouquetsdata.length : 0,
          } : 'NOT FOUND',
          availablePackageIds: availablePackages.map(p => ({ id: p.id, name: p.package_name })),
        });
      }

      if (currentPackageData?.bouquetsdata && Array.isArray(currentPackageData.bouquetsdata) && currentPackageData.bouquetsdata.length > 0) {
        let orderedBouquets: any[] = [];
        
        // If template has new_order, use it to order bouquets (like React version)
        if (currentTemplate.new_order) {
          try {
            const parsedOrder = typeof currentTemplate.new_order === 'string' 
              ? JSON.parse(currentTemplate.new_order) 
              : currentTemplate.new_order;
            
            if (Array.isArray(parsedOrder)) {
              // Create ordered array based on new_order
              parsedOrder.forEach((orderId: number) => {
                const item = currentPackageData.bouquetsdata.find((data: any) => data.id === orderId);
                if (item) orderedBouquets.push(item);
              });
            }
            
            // Use ordered bouquets if available, otherwise use all bouquets
            setAllBouquets(orderedBouquets.length > 0 ? orderedBouquets : currentPackageData.bouquetsdata);
            
            // Initialize order states for drag and drop components
            if (orderedBouquets.length > 0) {
              const bouquetsLive = orderedBouquets.filter(
                (x) =>
                  x.bouquet_name?.toLowerCase().indexOf('vod') === -1 &&
                  x.bouquet_name?.toLowerCase().indexOf('series') === -1
              );
              const bouquetsVODS = orderedBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('vod') !== -1);
              const bouquetsSeries = orderedBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('series') !== -1);
              
              setNewOrderLive(bouquetsLive.map((item) => item.id));
              setNewOrderVod(bouquetsVODS.map((item) => item.id));
              setNewOrderSeries(bouquetsSeries.map((item) => item.id));
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Loaded ordered bouquets:', orderedBouquets.length);
            }
          } catch (err) {
            console.error('Error parsing new_order:', err);
            setAllBouquets(currentPackageData.bouquetsdata || []);
          }
        } else {
          setAllBouquets(currentPackageData.bouquetsdata || []);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Loaded bouquets (no order):', currentPackageData.bouquetsdata.length);
          }
        }
      } else {
        console.warn('⚠️ Package not found or has no bouquetsdata:', {
          templatePackageId,
          availablePackageIds: availablePackages.map(p => p.id),
          foundPackage: currentPackageData ? { id: currentPackageData.id, hasBouquets: !!currentPackageData.bouquetsdata } : 'NOT FOUND',
        });
      }
    } catch (error) {
      console.error('Error parsing template data:', error);
    }
  }, [currentTemplate, availablePackages, mounted]);

  // Update bouquets when package selection changes (user selects different package)
  useEffect(() => {
    if (!mounted || !selectedPackageId) return;
    
    // Only update if the selected package is different from the template's original package
    const templatePackageId = currentTemplate?.package?.toString();
    if (selectedPackageId === templatePackageId) {
      // Don't reload bouquets if it's the same package - they're already loaded
      return;
    }
    
    // Find package directly from availablePackages array
    const foundPackage = availablePackages.find(
      (pkg) => {
        const pkgId = pkg?.id;
        const searchId = selectedPackageId?.toString();
        
        return (
          String(pkgId) === String(searchId) ||
          Number(pkgId) === Number(searchId) ||
          pkgId?.toString() === searchId?.toString()
        );
      }
    );
    
    if (foundPackage?.bouquetsdata && Array.isArray(foundPackage.bouquetsdata) && foundPackage.bouquetsdata.length > 0) {
      setAllBouquets(foundPackage.bouquetsdata);
      // Don't reset selected bouquets when package changes in edit mode
    } else {
      setAllBouquets([]);
    }
  }, [selectedPackageId, availablePackages, mounted, currentTemplate]);

  const bouquets = useMemo(() => {
    if (!allBouquets || allBouquets.length === 0) {
      return { bouquetsLive: [], bouquetsVODS: [], bouquetsSeries: [] };
    }

    // Filter bouquets by category - allBouquets is already ordered from new_order if available
    const bouquetsLive = allBouquets.filter(
      (x) =>
        x.bouquet_name?.toLowerCase().indexOf('vod') === -1 &&
        x.bouquet_name?.toLowerCase().indexOf('series') === -1
    );

    const bouquetsVODS = allBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('vod') !== -1);
    const bouquetsSeries = allBouquets.filter((x) => x.bouquet_name?.toLowerCase().indexOf('series') !== -1);

    // If we have order states initialized, use them to order bouquets within each category
    let orderedLive = bouquetsLive;
    let orderedVod = bouquetsVODS;
    let orderedSeries = bouquetsSeries;

    if (newOrderLive.length > 0) {
      const orderMap = new Map(newOrderLive.map((id, idx) => [id, idx]));
      orderedLive = [...bouquetsLive].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Infinity;
        const orderB = orderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    }

    if (newOrderVod.length > 0) {
      const orderMap = new Map(newOrderVod.map((id, idx) => [id, idx]));
      orderedVod = [...bouquetsVODS].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Infinity;
        const orderB = orderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    }

    if (newOrderSeries.length > 0) {
      const orderMap = new Map(newOrderSeries.map((id, idx) => [id, idx]));
      orderedSeries = [...bouquetsSeries].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Infinity;
        const orderB = orderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    }

    return { bouquetsLive: orderedLive, bouquetsVODS: orderedVod, bouquetsSeries: orderedSeries };
  }, [allBouquets, newOrderLive, newOrderVod, newOrderSeries]);

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

  const onSubmit = async (data: TemplateFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (selectedBouquets.length < 1) {
        showToast.error('You have to select at least one bouquet');
        return;
      }

      const arrayLive = [...newOrderLive];
      const arrayVod = [...newOrderVod];
      const arraySeries = [...newOrderSeries];

      if (newOrderLive.length < 1) {
        bouquets.bouquetsLive.forEach((item) => arrayLive.push(item.id));
      }

      if (newOrderVod.length < 1) {
        bouquets.bouquetsVODS.forEach((item) => arrayVod.push(item.id));
      }

      if (newOrderSeries.length < 1) {
        bouquets.bouquetsSeries.forEach((item) => arraySeries.push(item.id));
      }

      const allOrder = [...arrayLive, ...arrayVod, ...arraySeries];
      const selectedBouquetsOrder = allOrder.filter((item) => selectedBouquets.includes(item));

      const payload = {
        title: data.title,
        bouquets: JSON.stringify(selectedBouquetsOrder),
        new_order: JSON.stringify(allOrder),
        package: data.package,
      };

      const result = await updateTemplate(currentTemplate.id, payload);

      if (result?.success || result?.data?.success) {
        showToast.success(result?.data?.message || result?.message || 'Template updated successfully');
        setSuccess('Template updated successfully');
        setTimeout(() => {
          router.push('/dashboard/templates/list');
          router.refresh();
        }, 500);
      } else {
        const message = result?.error || result?.data?.error || 'Unable to update template';
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

  if (!currentTemplate) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Template Title"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="package"
                  control={control}
                  render={({ field }) => {
                    // Ensure the field value matches the MenuItem value format
                    const fieldValue = field.value ? String(field.value) : '';
                    return (
                      <FormControl fullWidth error={!!errors.package}>
                        <InputLabel>Select Package</InputLabel>
                        <Select 
                          {...field} 
                          label="Select Package"
                          value={fieldValue}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {availablePackages.map((pkg) => (
                            <MenuItem key={pkg.id} value={String(pkg.id)}>
                              {pkg.package_name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.package && <FormHelperText>{errors.package.message}</FormHelperText>}
                      </FormControl>
                    );
                  }}
                />

                {mounted && allBouquets.length > 0 && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                      },
                      gap: 2,
                    }}
                  >
                    {bouquets.bouquetsLive.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsLive}
                        title="LIVE"
                        handleNewOrder={handleNewOrderLive}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}

                    {bouquets.bouquetsVODS.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsVODS}
                        title="VOD"
                        handleNewOrder={handleNewOrderVod}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}

                    {bouquets.bouquetsSeries.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsSeries}
                        title="SERIES"
                        handleNewOrder={handleNewOrderSeries}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}
                  </Box>
                )}

                {mounted && selectedPackageId && allBouquets.length === 0 && (
                  <Alert severity="info">
                    No bouquets available for this package. Please select a different package.
                  </Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => router.back()} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </form>
  );
}

