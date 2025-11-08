'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

interface DeleteConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteConfirmation({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item?',
  itemName,
  loading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmationProps) {
  const theme = useTheme();

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[24],
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 3,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'error.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeleteOutlineIcon sx={{ color: 'error.main', fontSize: 28 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        {!loading && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'warning.lighter',
            border: `1px solid ${theme.palette.warning.light}`,
            borderRadius: 2,
            p: 2.5,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <WarningAmberIcon
              sx={{
                color: 'warning.main',
                fontSize: 28,
                mt: 0.25,
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: 'warning.darker' }}>
                This action cannot be undone
              </Typography>
              <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                {message}
              </Typography>
              {itemName && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
                    Item to delete:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {itemName}
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            px: 3,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? undefined : <DeleteOutlineIcon />}
          sx={{
            minWidth: 120,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            px: 3,
            boxShadow: theme.shadows[4],
            '&:hover': {
              boxShadow: theme.shadows[8],
            },
          }}
        >
          {loading ? 'Deleting...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

