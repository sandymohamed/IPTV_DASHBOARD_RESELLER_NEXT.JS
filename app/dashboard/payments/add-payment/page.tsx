'use client';

import * as React from 'react';
import { useEffect, useState, useMemo, use } from 'react';
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
  Autocomplete,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSubResellers } from '@/lib/services/subResellersService';
import { addNewPayment } from '@/lib/services/transactionsService';
import { useAuthContext } from '@/lib/contexts/AuthContext';

// Cache for resellers list to avoid refetching
const resellersCache = {
  data: null as any[] | null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes
};

const getCachedResellers = async () => {
  const now = Date.now();
  if (resellersCache.data && (now - resellersCache.timestamp) < resellersCache.TTL) {
    return resellersCache.data;
  }
  
  const result = await getSubResellers({ page: 1, pageSize: 1000 });
  const formattedData = result.data.map((item: any) => ({
    id: item.adminid || item.id,
    label: item.admin_name || item.adm_username || item.username || 'Unknown',
    value: item.adminid || item.id,
  }));
  
  resellersCache.data = formattedData;
  resellersCache.timestamp = now;
  return formattedData;
};

const paymentSchema = yup.object().shape({
  adminid: yup.mixed().required('Reseller is required').nullable(),
  dateadded: yup.string().required('Date is required'),
  Notes: yup.string().nullable(),
  amount: yup.number().required('Amount is required').min(1, 'Minimum amount is 1'),
});

interface PaymentFormData {
  adminid: any;
  dateadded: string;
  Notes?: string;
  amount: number;
}

export default function AddPaymentPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resellersList, setResellersList] = useState<any[]>([]);

  const defaultValues = useMemo(
    () => ({
      adminid: null,
      dateadded: new Date().toISOString().split('T')[0],
      Notes: '',
      amount: 0,
    }),
    []
  );

  const form = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema) as any,
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    let cancelled = false;
    
    const fetchResellers = async () => {
      try {
        setLoading(true);
        const formattedData = await getCachedResellers();
        if (!cancelled) {
          setResellersList(formattedData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError('Failed to load resellers');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchResellers();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const submitData: any = {
        adminid: data.adminid?.id || data.adminid,
        dateadded: data.dateadded,
        Notes: data.Notes || '',
        amount: data.amount,
      };

      const response = await addNewPayment(submitData);

      if (response?.success) {
        setSuccess(response?.message || 'Payment added successfully');
        // Reset form immediately
        reset(defaultValues);
        // Update user in background (don't wait for it)
        updateUser();
        // Redirect immediately without delay
        router.push('/dashboard/payments/list');
      } else {
        setError(response?.data?.error || response?.message || 'Unable to create payment');
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
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
          Add Payment
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
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }} color="text.secondary">
                    Your Current Balance:
                    <Typography color="success.main" sx={{ mx: 2 }}>
                      {user?.balance || '0'}
                    </Typography>
                  </Typography>
                </Box>

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
                          label="Reseller"
                          error={!!errors.adminid}
                          helperText={errors.adminid?.message ? String(errors.adminid.message) : ''}
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="dateadded"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Date Added"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(newValue) => {
                        const dateStr = newValue ? newValue.toISOString().split('T')[0] : '';
                        field.onChange(dateStr);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Amount"
                      type="number"
                      fullWidth
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      inputProps={{ min: 1, step: 0.01 }}
                    />
                  )}
                />

                <Controller
                  name="Notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes"
                      fullWidth
                      multiline
                      rows={5}
                      error={!!errors.Notes}
                      helperText={errors.Notes?.message}
                    />
                  )}
                />

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
                    {submitting ? 'Submitting...' : 'Submit'}
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