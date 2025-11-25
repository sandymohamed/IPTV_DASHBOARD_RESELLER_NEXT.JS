'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  Box,
  Typography,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CancelIcon from '@mui/icons-material/Cancel';
import TvIcon from '@mui/icons-material/Tv';
import AndroidIcon from '@mui/icons-material/Android';
import Menu from '@mui/material/Menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { updateMag, deleteMag, getMagById, renewMag, lockUnlockMag, killMagConnections } from '@/lib/services/magsService';
import { useApiClient } from '@/lib/hooks/useApiClient';
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
  { id: 'id', label: 'ID', minWidth: 60 },
  {
    id: 'active_connections',
    label: 'Live',
    minWidth: 80,
    align: 'center',
    format: (value: number) => (
      <Chip size="small" label={value > 0 ? 'Online' : 'Offline'} color={value > 0 ? 'success' : 'default'} />
    ),
  },
  { id: 'owner_name', label: 'Reseller', minWidth: 120 },
  { id: 'mac', label: 'Mac', minWidth: 120 },
  { id: 'username', label: 'User Name', minWidth: 120 },
  { id: 'password', label: 'Password', minWidth: 100 },
  {
    id: 'exp_date',
    label: 'Expire',
    minWidth: 120,
    align: 'center',
    format: (value: string | number) => {
      if (!value) return 'N/A';
      try {
        const date = typeof value === 'number' ? new Date(value) : new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    },
  },
  {
    id: 'enabled',
    label: 'Status',
    minWidth: 100,
    align: 'center',
    format: (value: number) => (
      <Chip size="small" label={value === 1 ? 'Active' : 'Inactive'} color={value === 1 ? 'success' : 'error'} />
    ),
  },
  { id: 'stream_display_name', label: 'Watching', minWidth: 100, align: 'center' },
  { id: 'user_ip', label: 'IP', minWidth: 120, align: 'center' },
  {
    id: 'package_name',
    label: 'Package',
    minWidth: 120,
    align: 'center',
    format: (value: any) => <Chip size="small" label={value || 'N/A'} color="secondary" variant="outlined" />,
  },
  { id: 'reseller_notes', label: 'Notes', minWidth: 100 },
  { id: 'max_connections', label: 'MaxCon', minWidth: 100, align: 'right' },
  { id: 'options', label: 'Options', minWidth: 140 },
];

interface MagsListClientProps {
  initialMags: any[];
  totalCount?: number;
  initialError?: string | null;
}

export default function MagsListClient({ initialMags, totalCount = 0, initialError = null }: MagsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const [mags, setMags] = useState<any[]>(initialMags);
  const [total, setTotal] = useState(totalCount);
  
  // Get current params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '100');
  const currentSearch = searchParams.get('search') || '';
  const currentActiveConnections = searchParams.get('active_connections');
  const currentIsTrial = searchParams.get('is_trial');
  
  // Local state for search input (debounced)
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setMags(initialMags);
    setError(initialError);
    setTotal(totalCount);
    setSearchInput(currentSearch);
  }, [initialMags, initialError, totalCount, currentSearch]);

  // Helper function to update URL search params
  const updateSearchParams = useCallback((updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    startTransition(() => {
      router.push(`/dashboard/mags/list?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    updateSearchParams({ page: newPage + 1 }); // MUI uses 0-based, server uses 1-based
  }, [updateSearchParams]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = +event.target.value;
    updateSearchParams({ pageSize: newPageSize, page: 1 }); // Reset to page 1 when changing page size
  }, [updateSearchParams]);

  const handleSearch = useCallback((searchTerm: string) => {
    updateSearchParams({ search: searchTerm || null, page: 1 }); // Reset to page 1 when searching
  }, [updateSearchParams]);

  const handleFilterChange = useCallback((filterName: string, value: string | number | null) => {
    updateSearchParams({ [filterName]: value, page: 1 }); // Reset to page 1 when filtering
  }, [updateSearchParams]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        handleSearch(searchInput);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Mags List</Typography>
          {total > 0 && (
            <Typography variant="body2" color="text.secondary">
              Total: {total.toLocaleString()} mags
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/dashboard/mags/create')}>
          Create Mag
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <MuiStack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Search"
            placeholder="Search by username, password, notes, IP, or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchInput('');
                      handleSearch('');
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Online Status</InputLabel>
            <Select
              value={currentActiveConnections || ''}
              label="Online Status"
              onChange={(e: SelectChangeEvent) => 
                handleFilterChange('active_connections', e.target.value || null)
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Online</MenuItem>
              <MenuItem value="0">Offline</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Trial Status</InputLabel>
            <Select
              value={currentIsTrial || ''}
              label="Trial Status"
              onChange={(e: SelectChangeEvent) => 
                handleFilterChange('is_trial', e.target.value || null)
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Trial</MenuItem>
              <MenuItem value="0">Not Trial</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => {
              setSearchInput('');
              updateSearchParams({ 
                search: null, 
                active_connections: null, 
                is_trial: null, 
                page: 1 
              });
            }}
          >
            Clear Filters
          </Button>
        </MuiStack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
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
                {columns?.map((column) => (
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
                mags?.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns?.map((column) => {
                      const value = row[column.id];
                      if (column.id === 'options') {
                        return (
                          <TableCell key={column.id} align={column.align || 'left'} sx={{ whiteSpace: 'nowrap' }}>
                            <RowActions row={row} />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={column.id} align={column.align || 'left'} sx={{ whiteSpace: 'nowrap' }}>
                          {column.format ? column.format(value, row) : value ?? 'N/A'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={currentPageSize}
          page={currentPage - 1} // MUI uses 0-based, server uses 1-based
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          disabled={isPending}
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
  const apiClient = useApiClient();
  const [busy, setBusy] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openM3U, setOpenM3U] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openConfirmEnable, setOpenConfirmEnable] = useState(false);
  const [openConfirmLock, setOpenConfirmLock] = useState(false);
  const [openConfirmKill, setOpenConfirmKill] = useState(false);
  const [openTV, setOpenTV] = useState(false);
  const [openAndroid, setOpenAndroid] = useState(false);
  
  const id = row.id;
  const status = row.enabled;
  const enabled = status === 1;
  const admin_enabled = row.admin_enabled !== undefined ? row.admin_enabled === 1 : true;
  const download = row.download;

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setOpenEdit(true);
    handleClosePopover();
  };

  const handleRenew = () => {
    router.push(`/dashboard/mags/renew/${id}`);
    handleClosePopover();
  };

  const handleM3U = () => {
    setOpenM3U(true);
    handleClosePopover();
  };

  const handleEnableDisable = async () => {
    try {
      setBusy(true);
      await updateMag(apiClient, String(id), { status: enabled ? 0 : 1 });
      showToast.success(enabled ? 'Device disabled successfully' : 'Device enabled successfully');
      setOpenConfirmEnable(false);
      router.refresh();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update device status');
    } finally {
      setBusy(false);
    }
  };

  const handleLockUnlock = async () => {
    try {
      setBusy(true);
      await lockUnlockMag(apiClient, String(id));
      showToast.success(admin_enabled ? 'Device unlocked successfully' : 'Device locked successfully');
      setOpenConfirmLock(false);
      router.refresh();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update lock status');
    } finally {
      setBusy(false);
    }
  };

  const handleKill = async () => {
    try {
      setBusy(true);
      await killMagConnections(apiClient, String(id));
      showToast.success('Device connections killed successfully');
      setOpenConfirmKill(false);
      router.refresh();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to kill connections');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      await deleteMag(apiClient, String(id));
      showToast.success('Device deleted successfully');
      setOpenDelete(false);
      router.refresh();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to delete device');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <IconButton onClick={handleOpenPopover} disabled={busy}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ width: 310 }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleRenew}>
          <RefreshIcon sx={{ mr: 1, fontSize: 20 }} />
          Renew
        </MenuItem>

        {download && download.length > 0 && (
          <MenuItem onClick={handleM3U}>
            <FileCopyIcon sx={{ mr: 1, fontSize: 20 }} />
            M3U File
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setOpenConfirmEnable(true);
            handleClosePopover();
          }}
          sx={{ color: 'warning.main' }}
        >
          {!enabled ? <ToggleOnIcon sx={{ mr: 1, fontSize: 20 }} /> : <ToggleOffIcon sx={{ mr: 1, fontSize: 20 }} />}
          {!enabled ? 'Enable' : 'Disable'}
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenConfirmLock(true);
            handleClosePopover();
          }}
          sx={{ color: !admin_enabled ? 'success.main' : 'warning.main' }}
        >
          {!admin_enabled ? (
            <LockOpenIcon sx={{ mr: 1, fontSize: 20 }} />
          ) : (
            <LockIcon sx={{ mr: 1, fontSize: 20 }} />
          )}
          {!admin_enabled ? 'Unlock' : 'Lock'}
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenConfirmKill(true);
            handleClosePopover();
          }}
          sx={{ color: 'error.main' }}
        >
          <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
          Kill
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenDelete(true);
            handleClosePopover();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Remove
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenTV(true);
            handleClosePopover();
          }}
          sx={{ color: 'info.main' }}
        >
          <TvIcon sx={{ mr: 1, fontSize: 20 }} />
          Upload To Smart TV
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenAndroid(true);
            handleClosePopover();
          }}
          sx={{ color: 'success.main' }}
        >
          <AndroidIcon sx={{ mr: 1, fontSize: 20 }} />
          Upload To Android
        </MenuItem>
      </Menu>

      {openEdit && (
        <EditMagDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          deviceId={id}
          onSaved={async () => {
            setOpenEdit(false);
            router.refresh();
          }}
        />
      )}

      {openM3U && download && (
        <M3UDialog open={openM3U} onClose={() => setOpenM3U(false)} downloadData={download} />
      )}

      <DeleteConfirmation
        open={openConfirmEnable}
        onClose={() => setOpenConfirmEnable(false)}
        onConfirm={handleEnableDisable}
        title={!enabled ? 'Enable' : 'Disable'}
        message={!enabled ? 'Are you sure you want to enable this device?' : 'Are you sure you want to disable this device?'}
        itemName={row.username || row.mac || `Device #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openConfirmLock}
        onClose={() => setOpenConfirmLock(false)}
        onConfirm={handleLockUnlock}
        title={!admin_enabled ? 'Unlock' : 'Lock'}
        message={!admin_enabled ? 'Are you sure you want to unlock this device?' : 'Are you sure you want to lock this device?'}
        itemName={row.username || row.mac || `Device #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openConfirmKill}
        onClose={() => setOpenConfirmKill(false)}
        onConfirm={handleKill}
        title="Kill Connections"
        message="Are you sure you want to kill all active connections for this device?"
        itemName={row.username || row.mac || `Device #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete Device"
        message="Are you sure you want to delete this device? This action cannot be undone and will permanently remove the device and all associated data."
        itemName={row.username || row.mac || `Device #${id}`}
        loading={busy}
      />

      {openTV && (
        <Dialog open={openTV} onClose={() => setOpenTV(false)}>
          <DialogTitle>Upload To Smart TV</DialogTitle>
          <DialogContent>
            <Typography>Smart TV upload functionality coming soon...</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTV(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {openAndroid && (
        <Dialog open={openAndroid} onClose={() => setOpenAndroid(false)}>
          <DialogTitle>Upload To Android</DialogTitle>
          <DialogContent>
            <Typography>Android upload functionality coming soon...</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAndroid(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
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

function EditMagDialog({
  open,
  onClose,
  deviceId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  deviceId: string | number;
  onSaved: () => void | Promise<void>;
}) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<EditMagForm>({
    resolver: yupResolver(editMagSchema),
  });

  useEffect(() => {
    if (open && deviceId) {
      const fetchDevice = async () => {
        try {
          setLoading(true);
          const data = await getMagById(apiClient, String(deviceId));
          setDeviceData(data);
          reset({
            userName: data?.username || '',
            password: '',
            Notes: data?.reseller_notes || '',
            status: data?.enabled ?? 1,
          });
        } catch (error) {
          console.error('Failed to fetch device:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDevice();
    } else if (!open) {
      // Reset form when dialog closes
      reset({
        userName: '',
        password: '',
        Notes: '',
        status: 1,
      });
      setDeviceData(null);
    }
  }, [open, deviceId, reset, apiClient]);

  const onSubmit = async (data: EditMagForm) => {
    if (!deviceId) return;
    try {
      await updateMag(apiClient, String(deviceId), data);
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
            <CircularProgress size={24} />
          </Box>
        ) : (
          <MuiStack spacing={2}>
            <TextField label="User Name" {...register('userName')} fullWidth />
            <TextField
              label="Password"
              type="password"
              {...register('password')}
              fullWidth
              placeholder="Leave empty to keep current"
            />
            <TextField
              label="Notes"
              {...register('Notes')}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" {...(register('status') as any)}>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </MuiStack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting || loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting || loading}>
          Save
        </Button>
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

  const handleFormatChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedFormat(value);
    setLink(value);
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard
        .writeText(link)
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
            <Select value={selectedFormat} onChange={handleFormatChange} label="Output Format">
              {downloadData &&
                downloadData.map((item: any, index: number) => (
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
            <Button variant="outlined" startIcon={<FileCopyIcon />} onClick={handleCopy} disabled={!link} color="warning">
              Copy
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!link}>
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

