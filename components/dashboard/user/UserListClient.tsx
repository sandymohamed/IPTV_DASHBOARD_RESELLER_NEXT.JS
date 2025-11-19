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
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { User, updateUser, deleteUser, getUserById } from '@/lib/services/userService';
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
  { id: 'userName', label: 'User name', minWidth: 120 },
  { id: 'password', label: 'Password', minWidth: 100 },
  {
    id: 'exp_date',
    label: 'Expired date',
    minWidth: 120,
    align: 'center',
    format: (value: string) => {
      if (!value) return 'N/A';
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    },
  },
  {
    id: 'status',
    label: 'Status',
    minWidth: 100,
    align: 'center',
    format: (value: number) => (
      <Chip size="small" label={value === 1 ? 'Active' : 'Inactive'} color={value === 1 ? 'success' : 'error'} />
    ),
  },
  { id: 'Notes', label: ' Notes', minWidth: 100 },
  { id: 'maxConnection', label: 'Conn', minWidth: 80, align: 'center' },
  { id: 'watching', label: 'Watching', minWidth: 100, align: 'center' },
  { id: 'IP', label: 'IP', minWidth: 120, align: 'center' },
  { id: 'owner', label: 'Owner', minWidth: 100, align: 'center' },
  {
    id: 'package',
    label: 'Package',
    minWidth: 120,
    align: 'center',
    format: (value: any) => <Chip size="small" label={value || 'N/A'} color="secondary" variant="outlined" />,
  },
  { id: 'options', label: 'Options', minWidth: 140 },
];

interface UserListClientProps {
  initialUsers: User[];
  initialError?: string | null;
}

export default function UserListClient({ initialUsers, initialError = null }: UserListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setUsers(initialUsers);
    setError(initialError);

    console.log("initialUsers", initialUsers);
    console.log("initialError", initialError);

  
  }, [initialUsers, initialError]);


  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Typography variant="h4">Users List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/dashboard/user/new')}>
          Create User
        </Button>
      </Box>


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
                users?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => (
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
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={users?.length || 0}
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
          <Button variant="text" size="small" onClick={() => router.push(`/dashboard/user/${id}`)} disabled={busy}>
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
                await updateUser(String(id), { status: status === 1 ? 0 : 1 });
                showToast.success(status === 1 ? 'User disabled successfully' : 'User enabled successfully');
                router.refresh();
              } catch (error: any) {
                showToast.error(error?.message || 'Failed to update user status');
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
          <Button color="error" variant="text" size="small" onClick={() => setOpenDelete(true)} disabled={busy}>
            <DeleteIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>

      {openEdit && (
        <EditUserDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          userId={id}
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
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={async () => {
          try {
            setBusy(true);
            await deleteUser(String(id));
            showToast.success('User deleted successfully');
            setOpenDelete(false);
            router.refresh();
          } catch (error: any) {
            showToast.error(error?.message || 'Failed to delete user');
            setBusy(false);
          }
        }}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user and all associated data."
        itemName={row.userName || `User #${id}`}
        loading={busy}
      />
    </MuiStack>
  );
}

type EditUserForm = {
  userName?: string;
  password?: string;
  Notes?: string;
  status?: number;
};

const editUserSchema: yup.ObjectSchema<EditUserForm> = yup
  .object({
    userName: yup.string().optional(),
    password: yup.string().optional(),
    Notes: yup.string().optional(),
    status: yup.number().oneOf([0, 1]).optional(),
  })
  .required();

function EditUserDialog({
  open,
  onClose,
  userId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | number;
  onSaved: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<EditUserForm>({
    resolver: yupResolver(editUserSchema),
  });

  useEffect(() => {
    if (open && userId) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const data = await getUserById(String(userId));
          setUserData(data);
          reset({
            userName: data?.userName || '',
            password: '',
            Notes: data?.Notes || data?.reseller_notes || '',
            status: data?.status ?? 1,
          });
        } catch (error) {
          console.error('Failed to fetch user:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [open, userId, reset]);

  const onSubmit = async (data: EditUserForm) => {
    if (!userId) return;
    try {
      await updateUser(String(userId), data);
      showToast.success('User updated successfully');
      await onSaved();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update user');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <MuiStack spacing={2}>
            <TextField label="Username" {...register('userName')} fullWidth defaultValue={userData?.userName || ''} />
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
              defaultValue={userData?.Notes || userData?.reseller_notes || ''}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" defaultValue={userData?.status ?? 1} {...(register('status') as any)}>
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

