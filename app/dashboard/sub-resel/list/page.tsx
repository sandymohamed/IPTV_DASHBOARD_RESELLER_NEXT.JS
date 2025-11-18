'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
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
  IconButton,
  Menu,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentIcon from '@mui/icons-material/Payment';
import { getSubResellers, updateSubReseller, deleteSubReseller, getSubResellerById, suspendSubReseller, addCreditsToSubReseller, getAllMemberGroupsName } from '@/lib/services/subResellersService';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { showToast } from '@/lib/utils/toast';
import { useDashboardUser } from '@/lib/contexts/DashboardUserContext';
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
  { id: 'mfather', label: 'Main Father', minWidth: 120 },
  { id: 'father', label: 'Father', minWidth: 120 },
  { id: 'fName', label: 'Full Name', minWidth: 150 },
  { id: 'userName', label: 'User Name', minWidth: 120 },
  { id: 'GroupMember', label: 'Group Member', minWidth: 120 },
  { id: 'Users', label: 'Users', minWidth: 80, align: 'center', format: (value: number) => (
    <Chip size="small" label={value || 0} color="primary" variant="outlined" />
  )},
  { id: 'ip', label: 'IP', minWidth: 120, align: 'center' },
  { id: 'Credits', label: 'Credits', minWidth: 100, align: 'right', format: (value: number) => (
    <Chip size="small" label={value || 0} color={value > 0 ? 'success' : 'default'} />
  )},
  { id: 'Createdat', label: 'Created at', minWidth: 120, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }},
  { id: 'lastLogin', label: 'Last Login', minWidth: 120, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }},
  { id: 'Notes', label: 'Notes', minWidth: 150 },
  { id: 'Options', label: 'Options', minWidth: 140, format: (_: any, row: any) => <RowActions row={row} /> },
];

export default function SubResellersListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subResellers, setSubResellers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchSubResellers = async () => {
      try {
        setLoading(true);
        const result = await getSubResellers({ page: page + 1, pageSize: rowsPerPage });
        setSubResellers(result.data || []);
        setTotal(result.total || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load sub-resellers');
      } finally {
        setLoading(false);
      }
    };

    fetchSubResellers();
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
        <Typography variant="h4">Subresellers List</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/sub-resel/add')}
        >
          Create Subreseller
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
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 1400 }}>
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
              {subResellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                subResellers.map((row) => {
                    return (
                      <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
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
  const { user } = useDashboardUser();
  const [busy, setBusy] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [openSuspend, setOpenSuspend] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const id = row.id || row.adminid;
  const suspend = row.suspend;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSuspend = async (action: string) => {
    try {
      setBusy(true);
      const sus = suspend ? 'off' : 'on';
      await suspendSubReseller(String(id), sus as 'on' | 'off', action);
      showToast.success(suspend ? 'Unsuspended successfully' : 'Suspended successfully');
      window.location.reload();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to suspend/unsuspend');
    } finally {
      setBusy(false);
      setOpenSuspend(false);
      handleMenuClose();
    }
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          disabled={busy}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { router.push(`/dashboard/sub-resel/${id}`); handleMenuClose(); }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => { setOpenEdit(true); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { setOpenPayment(true); handleMenuClose(); }}>
          <PaymentIcon fontSize="small" sx={{ mr: 1 }} />
          Payment
        </MenuItem>
        <MenuItem onClick={() => { setOpenSuspend(true); handleMenuClose(); }}>
          {suspend ? <LockOpenIcon fontSize="small" sx={{ mr: 1 }} /> : <LockIcon fontSize="small" sx={{ mr: 1 }} />}
          {suspend ? 'Unsuspend' : 'Suspend'}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setOpenDelete(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {openEdit && (
        <EditSubResellerDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          subResellerId={id}
          onSaved={() => {
            setOpenEdit(false);
            window.location.reload();
          }}
        />
      )}

      {openPayment && (
        <PaymentCreditsDialog
          open={openPayment}
          onClose={() => setOpenPayment(false)}
          subResellerId={id}
          subResellerName={row.userName || row.adm_username}
          onSaved={() => {
            setOpenPayment(false);
            window.location.reload();
          }}
        />
      )}

      {openSuspend && (
        <SuspendDialog
          open={openSuspend}
          onClose={() => setOpenSuspend(false)}
          onSuspend={handleSuspend}
          isSuspended={suspend}
        />
      )}

      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={async () => {
          try {
            setBusy(true);
            await deleteSubReseller(String(id));
            showToast.success('Sub-reseller deleted successfully');
            setOpenDelete(false);
            window.location.reload();
          } catch (error: any) {
            showToast.error(error?.message || 'Failed to delete');
            setBusy(false);
          }
        }}
        title="Delete Sub-Reseller"
        message="Are you sure you want to delete this sub-reseller? This action cannot be undone and will permanently remove the sub-reseller and all associated data."
        itemName={row.fullname || row.adm_username || `Sub-reseller #${id}`}
        loading={busy}
      />
    </>
  );
}

type EditSubResellerForm = {
  fullname?: string;
  adm_username?: string;
  adm_password?: string;
  email?: string;
  level?: string;
  member_group_id?: string;
  notes?: string;
};

const editSubResellerSchema: yup.ObjectSchema<EditSubResellerForm> = yup
  .object({
    fullname: yup.string().optional(),
    adm_username: yup.string().optional(),
    adm_password: yup.string().optional(),
    email: yup.string().email().optional(),
    level: yup.string().optional(),
    member_group_id: yup.string().optional(),
    notes: yup.string().optional(),
  })
  .required();

function EditSubResellerDialog({ open, onClose, subResellerId, onSaved }: { open: boolean; onClose: () => void; subResellerId: string | number; onSaved: () => void | Promise<void> }) {
  const { user } = useDashboardUser();
  const [loading, setLoading] = useState(false);
  const [subResellerData, setSubResellerData] = useState<any>(null);
  const [memberGroups, setMemberGroups] = useState<any[]>([]);
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<EditSubResellerForm>({
    resolver: yupResolver(editSubResellerSchema),
  });

  const levelOptions = [
    { id: 2, value: 'Super Reseller' },
    { id: 3, value: 'Reseller' },
    { id: 4, value: 'Reset Codes Only' },
    { id: 6, value: 'Reseller With Sub-resel' },
    { id: 7, value: 'Sub Reseller' },
    { id: 10, value: 'Support Only' },
  ];

  useEffect(() => {
    if (open && subResellerId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [data, groups] = await Promise.all([
            getSubResellerById(String(subResellerId)),
            getAllMemberGroupsName(),
          ]);
          setSubResellerData(data);
          setMemberGroups(groups || []);
          reset({
            fullname: data?.fullname || '',
            adm_username: data?.adm_username || '',
            adm_password: '',
            email: data?.email || '',
            level: data?.level?.toString() || '',
            member_group_id: data?.member_group_id?.toString() || user?.member_group_id?.toString() || '',
            notes: data?.notes || '',
          });
        } catch (error) {
          console.error('Failed to fetch data:', error);
          showToast.error('Failed to load sub-reseller data');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open, subResellerId, reset, user]);

  const onSubmit = async (data: EditSubResellerForm) => {
    if (!subResellerId) return;
    try {
      if (!data.adm_password) {
        delete data.adm_password;
      }
      await updateSubReseller(String(subResellerId), data);
      showToast.success('Sub-reseller updated successfully');
      await onSaved();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update sub-reseller');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Sub-Reseller</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MuiStack spacing={2}>
            <TextField label="Full Name" {...register('fullname')} fullWidth defaultValue={subResellerData?.fullname || ''} />
            <TextField label="Username" {...register('adm_username')} fullWidth defaultValue={subResellerData?.adm_username || ''} />
            <TextField label="Password" type="password" {...register('adm_password')} fullWidth placeholder="Leave empty to keep current" />
            <TextField label="Email" type="email" {...register('email')} fullWidth defaultValue={subResellerData?.email || ''} />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select label="Level" defaultValue={subResellerData?.level?.toString() || ''} {...register('level') as any}>
                {levelOptions.map((level) => (
                  <MenuItem key={level.id} value={level.id.toString()}>
                    {level.value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {user?.level === 1 && (
              <FormControl fullWidth>
                <InputLabel>Resellers Group</InputLabel>
                <Select label="Resellers Group" defaultValue={subResellerData?.member_group_id?.toString() || user?.member_group_id?.toString() || ''} {...register('member_group_id') as any}>
                  {memberGroups.map((group) => (
                    <MenuItem key={group.group_id} value={group.group_id.toString()}>
                      {group.group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField label="Notes" {...register('notes')} fullWidth multiline rows={3} defaultValue={subResellerData?.notes || ''} />
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

function PaymentCreditsDialog({ open, onClose, subResellerId, subResellerName, onSaved }: { open: boolean; onClose: () => void; subResellerId: string | number; subResellerName: string; onSaved: () => void | Promise<void> }) {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<{ credits: number; notes?: string }>({
    defaultValues: { credits: 0, notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ credits: 0, notes: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: { credits: number; notes?: string }) => {
    try {
      await addCreditsToSubReseller(String(subResellerId), data);
      showToast.success(`Credits added successfully to ${subResellerName}`);
      await onSaved();
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to add credits');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Credits to {subResellerName}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <MuiStack spacing={2}>
          <TextField label="Credits" type="number" {...register('credits', { valueAsNumber: true })} fullWidth required />
          <TextField label="Notes" {...register('notes')} fullWidth multiline rows={3} />
        </MuiStack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>Add Credits</Button>
      </DialogActions>
    </Dialog>
  );
}

function SuspendDialog({ open, onClose, onSuspend, isSuspended }: { open: boolean; onClose: () => void; onSuspend: (action: string) => void; isSuspended: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isSuspended ? 'Unsuspend' : 'Suspend'} Sub-Reseller</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography>How do you want to {isSuspended ? 'unsuspend' : 'suspend'}?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSuspend('resel_only')} variant="contained" color="info">
          {isSuspended ? 'Unsuspend' : 'Suspend'} Reseller Only
        </Button>
        <Button onClick={() => onSuspend('resel_users')} variant="contained" color="warning">
          {isSuspended ? 'Unsuspend' : 'Suspend'} Reseller & Users
        </Button>
      </DialogActions>
    </Dialog>
  );
}