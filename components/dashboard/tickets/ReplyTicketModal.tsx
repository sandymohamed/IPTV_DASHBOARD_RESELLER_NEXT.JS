'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import { getTicketHistoryList, updateTicketHistory, type TicketReply } from '@/lib/services/ticketsService';
import { fDateTime } from '@/lib/utils/formatTime';

const replySchema = yup.object().shape({
  message: yup.string().required('Message is required').min(1, 'Message cannot be empty'),
});

interface ReplyTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: any;
  user?: any;
  onReplyAdded?: () => void;
}

export default function ReplyTicketModal({ open, onClose, ticket, user, onReplyAdded }: ReplyTicketModalProps) {
  const [history, setHistory] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  const fetchHistory = async () => {
    if (!ticket?.id) return;
    
    setLoading(true);
    try {
      const data = await getTicketHistoryList(ticket.id);
      setHistory(data || []);
    } catch (error: any) {
      showToast.error('Failed to load ticket history');
      console.error('Error fetching ticket history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticket?.id) {
      fetchHistory();
    }
  }, [open, ticket?.id]);

  const onSubmit = async (data: { message: string }) => {
    if (!ticket?.id || !user) return;

    setSubmitting(true);
    try {
      const memberId = user.adminid || user.id;
      await updateTicketHistory(ticket.id, memberId, data.message);
      
      showToast.success('Reply added successfully!');
      reset();
      await fetchHistory();
      onReplyAdded?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Can't add reply, Please try again!";
      showToast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <MessageIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">Ticket: {ticket?.title || 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {ticket?.id}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Add Reply Form */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Add Reply
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Controller
                  name="message"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Your Reply"
                      multiline
                      rows={4}
                      fullWidth
                      required
                      error={!!errors.message}
                      helperText={errors.message?.message}
                      placeholder="Type your reply here..."
                    />
                  )}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>

          <Divider />

          {/* Ticket History */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Ticket History
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : history.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Typography variant="body2" color="text.secondary">
                  No replies yet. Be the first to reply!
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {history.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      position: 'relative',
                      '&::before': index < history.length - 1 ? {
                        content: '""',
                        position: 'absolute',
                        left: '20px',
                        top: '48px',
                        bottom: '-16px',
                        width: '2px',
                        bgcolor: 'divider',
                      } : {},
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: item.admin_reply ? 'primary.main' : 'secondary.main',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {item.adm_username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: item.admin_reply ? 'secondary.darker' : 'action.hover',
                          borderRadius: 2,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.adm_username || 'Unknown User'}
                            </Typography>
                            {item.admin_reply && (
                              <Chip
                                label="Admin"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {fDateTime(item.date * 1000)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {item.message}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

