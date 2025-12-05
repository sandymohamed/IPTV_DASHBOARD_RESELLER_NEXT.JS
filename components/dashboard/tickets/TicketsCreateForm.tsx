'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import { createTicket } from '@/lib/services/ticketsService';

const ticketSchema = yup.object().shape({
  title: yup.string().required('Subject is required'),
  message: yup.string().required('Message is required'),
});

interface TicketFormData {
  title: string;
  message: string;
}

interface TicketsCreateFormProps {
  user?: any;
}

export default function TicketsCreateForm({ user }: TicketsCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TicketFormData>({
    resolver: yupResolver(ticketSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setSubmitting(true);
    try {
      const adminid = user?.adminid || user?.id;
      await createTicket({
        title: data.title,
        message: data.message,
        member_id: adminid,
        adminid: adminid, // Pass adminid so the initial reply is marked as admin reply
      });

      showToast.success('Ticket created successfully!');
      reset();
      router.push('/dashboard/tickets');
      router.refresh();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Can't create ticket, Please try again!";
      showToast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4">Create Ticket</Typography>
      </Stack>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Subject"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />

              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Message"
                    fullWidth
                    required
                    multiline
                    rows={8}
                    error={!!errors.message}
                    helperText={errors.message?.message}
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
                  startIcon={submitting ? <CircularProgress size={16} /> : null}
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

