'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Stack as MuiStack,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { getMags, updateMag, deleteMag, getMagById } from '@/lib/services/magsService';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import DeleteConfirmation from '@/components/DeleteConfirmation';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'ID', label: 'ID', minWidth: 60 },
  { id: 'Live', label: 'Live', minWidth: 80, align: 'center', format: (value: number) => (
    <Chip size="small" label={value > 0 ? 'Online' : 'Offline'} color={value > 0 ? 'success' : 'default'} />
  )},
  { id: 'Reseller', label: 'Reseller', minWidth: 120 },
  { id: 'Mac', label: 'Mac', minWidth: 120 },
  { id: 'userName', label: 'User Name', minWidth: 120 },
  { id: 'password', label: 'Password', minWidth: 100 },
  { id: 'expire', label: 'Expire', minWidth: 120, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }},
  { id: 'status', label: 'Status', minWidth: 100, align: 'center', format: (value: number) => (
    <Chip size="small" label={value === 1 ? 'Active' : 'Inactive'} color={value === 1 ? 'success' : 'error'} />
  )},
  { id: 'watching', label: 'Watching', minWidth: 100, align: 'center' },
  { id: 'ip', label: 'IP', minWidth: 120, align: 'center' },
  { id: 'package', label: 'Package', minWidth: 120, align: 'center', format: (value: any) => (
    <Chip size="small" label={value || 'N/A'} color="secondary" variant="outlined" />
  )},
  { id: 'Notes', label: 'Notes', minWidth: 100 },
  { id: 'connection', label: 'MaxCon', minWidth: 100, align: 'right' },
  { id: 'Options', label: 'Options', minWidth: 140, format: (_: any, row: any) => <RowActions row={row} /> },
];

export default function MagsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mags, setMags] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchMags = async () => {
      try {
        setLoading(true);
        const result = await getMags({ page: page + 1, pageSize: rowsPerPage });
        setMags(result.data || []);
        setTotal(result.total || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load mags');
      } finally {
        setLoading(false);
      }
    };

    fetchMags();
  }, [page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Typography variant="h4">Mags List</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/mags/create')}
        >
          Create Mag
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 200px)',
        }}
      >
        <TableContainer 
          sx={{ 
            maxHeight: 'calc(100vh - 300px)',
            overflowX: 'auto',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px',
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 1300 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ 
                      minWidth: column.minWidth,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      backgroundColor: 'background.paper',
                      zIndex: 10,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                mags.map((row) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id || row.ID}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell 
                            key={column.id} 
                            align={column.align || 'left'}
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {column.format ? column.format(value, row) : (value !== null && value !== undefined ? String(value) : 'N/A')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'background.paper',
            zIndex: 5,
          }}
        />
      </Paper>
    </Box>
  );
}

function RowActions({ row }: { row: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openM3U, setOpenM3U] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const id = row.id || row.ID;
  const status = row.status;
  const download = row.download;

  return (
    <MuiStack direction="row" spacing={1} alignItems="center">
      <Tooltip title="View">
        <span>
          <Button variant="text" size="small" onClick={() => router.push(`/dashboard/mags/${id}`)} disabled={busy}>
            <VisibilityIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Edit">
        <span>
          <Button variant="text" size="small" onClick={() => setOpenEdit(true)} disabled={busy}>
            <EditIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>
      {download && download.length > 0 && (
        <Tooltip title="M3U File">
          <span>
            <Button variant="text" size="small" onClick={() => setOpenM3U(true)} disabled={busy}>
              <FileCopyIcon fontSize="small" />
            </Button>
          </span>
        </Tooltip>
      )}
      <Tooltip title={status === 1 ? 'Disable' : 'Enable'}>
        <span>
          <Button
            variant="text"
            size="small"
            onClick={async () => {
              try {
                setBusy(true);
                await updateMag(String(id), { status: status === 1 ? 0 : 1 });
                showToast.success(status === 1 ? 'Device disabled successfully' : 'Device enabled successfully');
                window.location.reload();
              } catch (error: any) {
                showToast.error(error?.message || 'Failed to update device status');
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {status === 1 ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Delete">
        <span>
          <Button
            color="error"
            variant="text"
            size="small"
            onClick={() => setOpenDelete(true)}
            disabled={busy}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>

      {openEdit && (
        <EditMagDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          deviceId={id}
          onSaved={() => {
            setOpenEdit(false);
            window.location.reload();
          }}
        />
      )}

      {openM3U && download && (
        <M3UDialog
          open={openM3U}
          onClose={() => setOpenM3U(false)}
          downloadData={download}
        />
      )}

      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={async () => {
          try {
            setBusy(true);
            await deleteMag(String(id));
            showToast.success('Device deleted successfully');
            setOpenDelete(false);
            window.location.reload();
          } catch (error: any) {
            showToast.error(error?.message || 'Failed to delete device');
            setBusy(false);
          }
        }}
        title="Delete Device"
        message="Are you sure you want to delete this device? This action cannot be undone and will permanently remove the device and all associated data."
        itemName={row.userName || row.Mac || `Device #${id}`}
        loading={busy}
      />
    </MuiStack>
  );
}

type EditMagForm = {
  userName?: string;
  password?: string;
  Notes?: string;
  status?: number;
};

const editMagSchema: yup.ObjectSchema<EditMagForm> = yup
  .object({
    userName: yup.string().optional(),
    password: yup.string().optional(),
    Notes: yup.string().optional(),
    status: yup.number().oneOf([0, 1]).optional(),
  })
  .required();

function EditMagDialog({ open, onClose, deviceId, onSaved }: { open: boolean; onClose: () => void; deviceId: string | number; onSaved: () => void | Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<EditMagForm>({
    resolver: yupResolver(editMagSchema),
  });

  useEffect(() => {
    if (open && deviceId) {
      const fetchDevice = async () => {
        try {
          setLoading(true);
          const data = await getMagById(String(deviceId));
          setDeviceData(data);
          reset({
            userName: data?.userName || '',
            password: '',
            Notes: data?.Notes || data?.reseller_notes || '',
            status: data?.status ?? 1,
          });
        } catch (error) {
          console.error('Failed to fetch device:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDevice();
    }
  }, [open, deviceId, reset]);

  const onSubmit = async (data: EditMagForm) => {
    if (!deviceId) return;
    try {
      await updateMag(String(deviceId), data);
      showToast.success('Device updated successfully');
      await onSaved();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update device');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit MAG</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MuiStack spacing={2}>
            <TextField label="User Name" {...register('userName')} fullWidth defaultValue={deviceData?.userName || ''} />
            <TextField label="Password" type="password" {...register('password')} fullWidth placeholder="Leave empty to keep current" />
            <TextField label="Notes" {...register('Notes')} fullWidth multiline rows={3} defaultValue={deviceData?.Notes || deviceData?.reseller_notes || ''} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" defaultValue={deviceData?.status ?? 1} {...register('status') as any}>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </MuiStack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting || loading}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting || loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function M3UDialog({ open, onClose, downloadData }: { open: boolean; onClose: () => void; downloadData: any[] }) {
  const [selectedFormat, setSelectedFormat] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (downloadData && downloadData.length > 0) {
      setSelectedFormat(downloadData[0].download);
      setLink(downloadData[0].download);
    }
  }, [downloadData]);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    const value = event.target.value as string;
    setSelectedFormat(value);
    setLink(value);
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link)
        .then(() => {
          showToast.success('M3U link copied to clipboard');
        })
        .catch((error) => {
          console.error('Failed to copy:', error);
          showToast.error('Failed to copy link');
        });
    }
  };

  const handleDownload = () => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Download Playlist</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <MuiStack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Output Format</InputLabel>
            <Select
              value={selectedFormat}
              onChange={handleFormatChange}
              label="Output Format"
            >
              {downloadData && downloadData.map((item: any, index: number) => (
                <MenuItem key={index} value={item.download}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            value={link}
            label="M3U Link"
            fullWidth
            multiline
            rows={3}
            InputProps={{
              readOnly: true,
            }}
          />
          <MuiStack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<FileCopyIcon />}
              onClick={handleCopy}
              disabled={!link}
              color="warning"
            >
              Copy
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={!link}
            >
              Download
            </Button>
          </MuiStack>
        </MuiStack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}