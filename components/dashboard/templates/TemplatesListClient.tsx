'use client';

import { useCallback, useMemo, useState, useTransition, useEffect } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditNotifications } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { showToast } from '@/lib/utils/toast';
import { deleteTemplate } from '@/lib/services/templatesService';
import DeleteConfirmation from '@/components/DeleteConfirmation';

type TemplateRow = Record<string, any>;

type Column = {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: TemplateRow) => React.ReactNode;
};


const columns: readonly Column[] = [
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'name', label: 'Name', minWidth: 200 },
  {
    id: 'created_at',
    label: 'Created At',
    minWidth: 150,
    align: 'center',
    format: (value: string) => {
      if (!value) return 'N/A';
      try {
        return new Date(value).toLocaleDateString();
      } catch (error) {
        return value;
      }
    },
  },
  { id: 'options', label: 'Options', minWidth: 100 },
];
interface TemplatesListClientProps {
  initialData: any[];
  totalCount?: number;
  initialError?: string | null;
}

export default function TemplatesListClient({ initialData, totalCount = 0, initialError = null }: TemplatesListClientProps) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(initialError);
  const [tableData, setTableData] = useState<any[]>(initialData);
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
    setTableData(initialData);
    setError(initialError);
    setTotal(totalCount);
    setSearchInput(currentSearch);
  }, [initialData, initialError, totalCount, currentSearch]);

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
      router.push(`/dashboard/templates/list?${params.toString()}`);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Typography variant="h4">Templates Bouquets List</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/templates/create')}
        >
          Create Template
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
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table stickyHeader aria-label="templates table" sx={{ minWidth: 650 }}>
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
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                tableData
                  ?.map((row) => (
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
  // const apiClient = useApiClient();
  const [busy, setBusy] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const id = row.id;



  return (
    <MuiStack direction="row" spacing={1} alignItems="center">

      <Tooltip title="Edit">
        <span>
          <Button variant="text" size="small" onClick={() => setOpenEdit(true)} disabled={busy}>
            <EditNotifications fontSize="small" />
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


      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={async () => {
          try {
            setBusy(true);
            // await deleteTemplate(apiClient, String(id));
            showToast.success('Template deleted successfully');
            setOpenDelete(false);
            router.refresh();
          } catch (error: any) {
            showToast.error(error?.message || 'Failed to delete template');
            setBusy(false);
          }
        }}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone and will permanently remove the Template and all associated data."
        itemName={row.username || row.mac || `Template #${id}`}
        loading={busy}
      />
    </MuiStack>
  );
}


// type EditMagForm = {
//   userName?: string;
//   password?: string;
//   Notes?: string;
//   status?: number;
// };

// const editMagSchema: yup.ObjectSchema<EditMagForm> = yup
//   .object({
//     userName: yup.string().optional(),
//     password: yup.string().optional(),
//     Notes: yup.string().optional(),
//     status: yup.number().oneOf([0, 1]).optional(),
//   })
//   .required();

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

  // const apiClient = useApiClient();
  // const [loading, setLoading] = useState(false);
  // const [deviceData, setDeviceData] = useState<any>(null);
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { isSubmitting },
  //   reset,
  // } = useForm<EditMagForm>({
  //   resolver: yupResolver(editMagSchema),
  // });

  // useEffect(() => {
  //   if (open && deviceId) {
  //     const fetchDevice = async () => {
  //       try {
  //         setLoading(true);
  //         const data = await getMagById(apiClient, String(deviceId));
  //         setDeviceData(data);
  //         reset({
  //           userName: data?.username || '',
  //           password: '',
  //           Notes: data?.reseller_notes || '',
  //           status: data?.enabled ?? 1,
  //         });
  //       } catch (error) {
  //         console.error('Failed to fetch device:', error);
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     fetchDevice();
  //   }
  // }, [open, deviceId, reset, apiClient]);

  // const onSubmit = async (data: EditMagForm) => {
  //   if (!deviceId) return;
  //   try {
  //     await updateMag(apiClient, String(deviceId), data);
  //     showToast.success('Device updated successfully');
  //     await onSaved();
  //   } catch (error: any) {
  //     showToast.error(error?.message || 'Failed to update device');
  //   }
  // };

  // return (
  //   <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
  //     <DialogTitle>Edit MAG</DialogTitle>
  //     <DialogContent sx={{ pt: 2 }}>
  //       {loading ? (
  //         <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
  //           <CircularProgress size={24} />
  //         </Box>
  //       ) : (
  //         <MuiStack spacing={2}>
  //           <TextField label="User Name" {...register('userName')} fullWidth defaultValue={deviceData?.username || ''} />
  //           <TextField
  //             label="Password"
  //             type="password"
  //             {...register('password')}
  //             fullWidth
  //             placeholder="Leave empty to keep current"
  //           />
  //           <TextField
  //             label="Notes"
  //             {...register('Notes')}
  //             fullWidth
  //             multiline
  //             rows={3}
  //             defaultValue={deviceData?.reseller_notes || ''}
  //           />
  //           <FormControl fullWidth>
  //             <InputLabel>Status</InputLabel>
  //             <Select label="Status" defaultValue={deviceData?.enabled ?? 1} {...(register('status') as any)}>
  //               <MenuItem value={1}>Active</MenuItem>
  //               <MenuItem value={0}>Inactive</MenuItem>
  //             </Select>
  //           </FormControl>
  //         </MuiStack>
  //       )}
  //     </DialogContent>
  //     <DialogActions>
  //       <Button onClick={onClose} disabled={isSubmitting || loading}>
  //         Cancel
  //       </Button>
  //       <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting || loading}>
  //         Save
  //       </Button>
  //     </DialogActions>
  //   </Dialog>
  // );


  return <h2>EDIT TEMPLATE</h2>
}


