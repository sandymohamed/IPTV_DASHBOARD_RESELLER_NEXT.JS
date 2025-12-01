'use client';

import { useMemo, useTransition, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { deleteCode } from '@/lib/services/codesService';
import { showToast } from '@/lib/utils/toast';
import DeleteConfirmation from '@/components/DeleteConfirmation';

interface CodesListClientProps {
  initialData: any[];
  totalCount?: number;
  initialError?: string | null;
}

type Column = {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: Record<string, any>) => ReactNode;
};

const DEFAULT_PAGE_SIZE = 10;

const columns: readonly Column[] = [
  { id: 'trans_id', label: 'ID', minWidth: 60 },
  { id: 'admin_name', label: 'Reseller', minWidth: 120 },
  { id: 'trans_name', label: 'Transaction Name', minWidth: 150 },
  { id: 'totCodes', label: 'Total Codes', minWidth: 100, align: 'center', format: (value: number) => (
    <Typography variant="body2" fontWeight={600}>{value || 0}</Typography>
  )},
  { id: 'totAct', label: 'Active Codes', minWidth: 100, align: 'center', format: (value: number) => (
    <Typography variant="body2" color="success.main" fontWeight={600}>{value || 0}</Typography>
  )},
  {
    id: 'trans_date',
    label: 'Transaction Date',
    minWidth: 150,
    align: 'center',
    format: (value: string | number) => formatDate(value),
  },
  { id: 'options', label: 'Options', minWidth: 100 },
];

function formatDate(value: string | number) {
  if (!value) return 'N/A';
  try {
    // Handle Unix timestamp (seconds)
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      const timestamp = typeof value === 'string' ? parseInt(value) : value;
      // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds
      if (timestamp < 946684800000) {
        return new Date(timestamp * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    }
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return String(value);
  }
}

export default function CodesListClient({ initialData, totalCount = 0, initialError = null }: CodesListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(initialError);
  const [tableData, setTableData] = useState<any[]>(initialData);
  const [total, setTotal] = useState(totalCount);

  // Get current params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '10');
  const currentNameSearch = searchParams.get('name') || '';
  const currentAdminSearch = searchParams.get('admin') || '';
  const currentDate1 = searchParams.get('date1') || '';
  const currentDate2 = searchParams.get('date2') || '';

  // Local state for search inputs (debounced)
  const [nameSearch, setNameSearch] = useState(currentNameSearch);
  const [adminSearch, setAdminSearch] = useState(currentAdminSearch);
  const [date1Search, setDate1Search] = useState(currentDate1);
  const [date2Search, setDate2Search] = useState(currentDate2);

  useEffect(() => {
    setTableData(initialData);
    setError(initialError);
    setTotal(totalCount);
    setNameSearch(currentNameSearch);
    setAdminSearch(currentAdminSearch);
    setDate1Search(currentDate1);
    setDate2Search(currentDate2);
  }, [initialData, initialError, totalCount, currentNameSearch, currentAdminSearch, currentDate1, currentDate2]);

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
      router.push(`/dashboard/codes/list?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    updateSearchParams({ page: newPage + 1 }); // MUI uses 0-based, server uses 1-based
  }, [updateSearchParams]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = +event.target.value;
    updateSearchParams({ pageSize: newPageSize, page: 1 }); // Reset to page 1 when changing page size
  }, [updateSearchParams]);

  const handleSearch = useCallback((field: 'name' | 'admin' | 'date1' | 'date2', searchTerm: string) => {
    updateSearchParams({ [field]: searchTerm || null, page: 1 }); // Reset to page 1 when searching
  }, [updateSearchParams]);

  // Debounced search handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameSearch !== currentNameSearch) {
        handleSearch('name', nameSearch);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [nameSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adminSearch !== currentAdminSearch) {
        handleSearch('admin', adminSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [adminSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (date1Search !== currentDate1 || date2Search !== currentDate2) {
      const timer = setTimeout(() => {
        updateSearchParams({ 
          date1: date1Search || null, 
          date2: date2Search || null, 
          page: 1 
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [date1Search, date2Search]); // eslint-disable-line react-hooks/exhaustive-deps

  const tableRows = useMemo(() => tableData ?? [], [tableData]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
        spacing={2}
      >
        <Box>
          <Typography variant="h4">Codes List</Typography>
          {total > 0 && (
            <Typography variant="body2" color="text.secondary">
              Total: {total.toLocaleString()} codes
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/codes/add-code')}
        >
          Create Code
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Bars */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search by transaction name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton edge="start" size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: nameSearch && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        setNameSearch('');
                        handleSearch('name', '');
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              placeholder="Admin ID..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton edge="start" size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: adminSearch && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        setAdminSearch('');
                        handleSearch('admin', '');
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Date From"
              type="date"
              value={date1Search}
              onChange={(e) => setDate1Search(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Date To"
              type="date"
              value={date2Search}
              onChange={(e) => setDate2Search(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {isPending && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.6)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        <TableContainer
          sx={{
            maxHeight: 'calc(100vh - 300px)',
            overflowX: 'auto',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              height: 8,
              width: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
            },
          }}
        >
          <Table stickyHeader aria-label="codes transactions table" sx={{ minWidth: 650 }}>
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
              {tableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row, index) => (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.trans_id ?? row.id ?? `row-${index}`}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      if (column.id === 'options') {
                        return (
                          <TableCell key={column.id} align={column.align || 'left'} sx={{ whiteSpace: 'nowrap' }}>
                            <RowActions row={row} />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align || 'left'}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {column.format
                            ? column.format(value, row)
                            : value !== null && value !== undefined
                            ? String(value)
                            : 'N/A'}
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
  const [openDelete, setOpenDelete] = useState(false);

  const id = row.trans_id || row.id;

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/dashboard/codes/edit/${id}`);
    handleClosePopover();
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      const response = await deleteCode(String(id));
      if (response?.success || response?.data?.success) {
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
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenDelete(true);
            handleClosePopover();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      <DeleteConfirmation
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete Code Transaction"
        message="Are you sure you want to delete this code transaction? This action cannot be undone and will permanently remove the transaction and all associated codes."
        itemName={row.trans_name || `Transaction #${id}`}
        loading={busy}
      />
    </>
  );
}
