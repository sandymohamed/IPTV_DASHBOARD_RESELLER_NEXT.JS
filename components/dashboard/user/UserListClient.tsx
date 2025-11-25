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
import {
  User,
  deleteUser,
  enableDisableUser,
  lockUnlockUser,
  killUserConnections
} from '@/lib/services/userService';
import { showToast } from '@/lib/utils/toast';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import ElapsedTimeCounter from './ElapsedTimeCounter';
import { useSpliceLongText } from '@/components/hooks/useSpliceLongText';
import Label from '@/components/Label';
import { fTimestamp } from '@/lib/utils/formatTime';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'id', label: 'id', minWidth: 60 },
  {
    id: 'active_connections',
    label: 'Online',
    minWidth: 80,
    align: 'center',
    format: (value: number) => (
      <Chip size="small" label={value > 0 ? 'Online' : 'Offline'} color={value > 0 ? 'success' : 'default'} />
    ),
  },
  {
    id: 'speed_Mbps',
    label: 'Speed',
    minWidth: 80,
    align: 'center',
    format: (value: number) => (
      <Chip size="small" label={`${value || 0} Mbps`} color={value > 50 ? 'warning' : 'primary'} />
    ),
  },
  { id: 'username', label: 'User name', minWidth: 120 },
  { id: 'password', label: 'Password', minWidth: 100 },
  {
    id: 'exp_date',
    label: 'Expired date',
    minWidth: 120,
    align: 'center',
    format: (value: string) => {
      if (!value) return 'N/A';
      try {
        return new Date(Number(value)).toLocaleDateString();
      } catch {
        return value;
      }
    },
  },

  {
    id: 'status',
    label: 'Status',
    minWidth: 120,
    align: 'center',
    format: (value: number, row: any) => {
      const { is_trial, exp_date, admin_enabled, enabled } = row;
      const expDateTimestamp = exp_date ? fTimestamp(typeof exp_date === 'number' && exp_date < 10000000000 ? exp_date * 1000 : exp_date) : 0;
      const nowTimestamp = fTimestamp(new Date());
      const isExpired = expDateTimestamp > 0 && expDateTimestamp < nowTimestamp && exp_date !== 0 && exp_date !== null;
      const isValid = expDateTimestamp > nowTimestamp;

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
          {is_trial === 1 && (
            <Label
              variant="filled"
              color="info"
              sx={{
                textTransform: 'uppercase',
                padding: '5px',
                height: '20px',
                fontSize: '0.7rem',
              }}
            >
              Trial
            </Label>
          )}

          {isExpired && (
            <Label variant="filled" color="error" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Expired
            </Label>
          )}

          {isValid && is_trial === 1 && (
            <Label variant="filled" color="success" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Enabled
            </Label>
          )}

          {isValid && admin_enabled === 1 && enabled === 0 && (
            <Label variant="filled" color="warning" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Banned
            </Label>
          )}

          {isValid && admin_enabled === 0 && enabled === 1 && (
            <Label variant="filled" color="warning" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Locked
            </Label>
          )}

          {isValid && admin_enabled === 0 && enabled === 0 && (
            <Label variant="filled" color="error" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Blocked
            </Label>
          )}

          {isValid && admin_enabled === 1 && enabled === 1 && is_trial === 0 && (
            <Label variant="filled" color="success" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Enabled
            </Label>
          )}
        </Box>
      );
    },
  },
  {
    id: 'max_connections',
    label: 'Conn',
    align: 'center',
    format: (value: number, row: any) => (
      <Chip size="small" label={`${row.active_connections} / ${row.max_connections}`} color="primary" variant="outlined" />
    ),
  },


  {
    id: 'watching',
    label: 'Watching',
    align: 'center',
    format: (value: any, row: any) => (
      <Typography variant="body2" color="text.secondary">
        {row.stream_display_name}
        {row.date_start && (
          <ElapsedTimeCounter dateStart={row.date_start} />
        )}
      </Typography>
    )
  },

  { id: 'user_ip', label: 'IP', align: 'center' },
  { id: 'owner_name', label: 'Owner', align: 'center' },
  {
    id: 'package_name',
    label: 'Package',
    minWidth: 120,
    align: 'center',
    format: (value: any) => <Chip size="small" label={value || 'N/A'} color="secondary" variant="outlined" />,
  },
  { id: 'reseller_notes', label: ' Notes', minWidth: 100, format: (value: string) => useSpliceLongText(value, 20) },

  { id: 'options', label: 'Options', minWidth: 140 },
];

interface UserListClientProps {
  initialUsers: User[];
  totalCount?: number;
  initialError?: string | null;
}

export default function UserListClient({ initialUsers, totalCount = 0, initialError = null }: UserListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const [users, setUsers] = useState<User[]>(initialUsers);
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
    setUsers(initialUsers);
    setError(initialError);
    setTotal(totalCount);
    setSearchInput(currentSearch);
  }, [initialUsers, initialError, totalCount, currentSearch]);

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
      router.push(`/dashboard/user/list?${params.toString()}`);
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
          <Typography variant="h4">Users List</Typography>
          {total > 0 && (
            <Typography variant="body2" color="text.secondary">
              Total: {total.toLocaleString()} users
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/dashboard/user/new')}>
          Create User
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
          maxHeight: 'calc(100vh - 20px)',
        }}
      >
        <TableContainer
          sx={{
            maxHeight: 'calc(100vh - 330px)',
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
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 1200 }}>
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
                      color: 'white',
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((row) => (
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
  const [busy, setBusy] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openM3U, setOpenM3U] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openConfirmEnable, setOpenConfirmEnable] = useState(false);
  const [openConfirmLock, setOpenConfirmLock] = useState(false);
  const [openConfirmKill, setOpenConfirmKill] = useState(false);
  const [openTV, setOpenTV] = useState(false);
  const [openAndroid, setOpenAndroid] = useState(false);

  const id = row.id ;
  const enabled = row?.enabled;
  const admin_enabled = row.admin_enabled;
  const download = row.download;

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/dashboard/user/edit/${id}`);
    handleClosePopover();
  };

  const handleRenew = () => {
    router.push(`/dashboard/user/renew/${id}`);
    handleClosePopover();
  };

  const handleM3U = () => {
    setOpenM3U(true);
    handleClosePopover();
  };

  const handleEnableDisable = async () => {
    try {
      setBusy(true);
      const response = await enableDisableUser(String(id));
      if (response?.data?.success || response?.success) {
        showToast.success('Success!');
        setOpenConfirmEnable(false);
        router.refresh();
      } else {
        showToast.error('Failed, Please try again!');
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed, Please try again!');
    } finally {
      setBusy(false);
    }
  };

  const handleLockUnlock = async () => {
    try {
      setBusy(true);
      const response = await lockUnlockUser(String(id));
      if (response?.data?.success || response?.success) {
        showToast.success('Success!');
        setOpenConfirmLock(false);
        router.refresh();
      } else {
        showToast.error('Failed, Please try again!');
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed, Please try again!');
    } finally {
      setBusy(false);
    }
  };

  const handleKill = async () => {
    try {
      setBusy(true);
      const response = await killUserConnections(String(id));
      if (response?.data?.success || response?.success) {
        showToast.success('Success!');
        setOpenConfirmKill(false);
        router.refresh();
      } else {
        showToast.error('Failed, Please try again!');
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Failed, Please try again!');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      const response = await deleteUser(String(id));
      if (response?.data?.success || response?.success) {
        showToast.success('Delete success!');
        setOpenDelete(false);
        router.refresh();
      } else {
        showToast.error('Delete failed! try again');
      }
    } catch (error: any) {
      showToast.error(error?.message || 'Delete failed! try again');
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


      {openM3U && download && (
        <M3UDialog open={openM3U} onClose={() => setOpenM3U(false)} downloadData={download} />
      )}

      <DeleteConfirmation
        open={openConfirmEnable}
        onClose={() => setOpenConfirmEnable(false)}
        onConfirm={handleEnableDisable}
        title={!enabled ? 'Enable' : 'Disable'}
        message={!enabled ? 'Are you sure you want to enable this user?' : 'Are you sure you want to disable this user?'}
        confirmText={!enabled ? 'Enable' : 'Disable'}
        itemName={row.username || `User #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openConfirmLock}
        onClose={() => setOpenConfirmLock(false)}
        onConfirm={handleLockUnlock}
        title={!admin_enabled ? 'Unlock' : 'Lock'}
        message={!admin_enabled ? 'Are you sure you want to unlock this user?' : 'Are you sure you want to lock this user?'}
        confirmText={!admin_enabled ? 'Unlock' : 'Lock'}
        itemName={row.username || `User #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openConfirmKill}
        onClose={() => setOpenConfirmKill(false)}
        onConfirm={handleKill}
        title="Kill Connections"
        message="Are you sure you want to kill all active connections for this user?"
        confirmText="Kill"
        itemName={row.username || `User #${id}`}
        loading={busy}
      />

      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user and all associated data."
        itemName={row.username || `User #${id}`}
        loading={busy}
      />

      {/* TODO: Add Upload To Smart TV and Android dialogs */}
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

