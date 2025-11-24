'use client';

import * as React from 'react';
import { useCallback, useMemo, useState, useTransition, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  IconButton,
  InputAdornment,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter, useSearchParams } from 'next/navigation';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'trans_id', label: 'ID', minWidth: 60 },
  { id: 'admin', label: 'Reseller', minWidth: 150, format: (value: any, row: any) => {
    return row.admin_name || value || 'N/A';
  }},
  { id: 'dateadded', label: 'Date', minWidth: 150, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }},
  { id: 'depit', label: 'Amount', minWidth: 120, align: 'right', format: (value: number) => {
    const amount = typeof value === 'number' ? value : parseFloat(String(value || 0));
    return `$${(isNaN(amount) ? 0 : amount).toFixed(2)}`;
  }},
  { id: 'Notes', label: 'Notes', minWidth: 200 },
];

interface SubInvoicesListClientProps {
  initialData: any[];
  totalCount?: number;
  initialError?: string | null;
}

export default function SubInvoicesListClient({ initialData, totalCount = 0, initialError = null }: SubInvoicesListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(initialError);
  const [tableData, setTableData] = useState<any[]>(initialData);
  const [total, setTotal] = useState(totalCount);

  // Get current params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '30');
  const currentSearchTxt = searchParams.get('search_txt') || '';
  const currentAdmin = searchParams.get('admin') || '';
  const currentDate1 = searchParams.get('date1') || '';
  const currentDate2 = searchParams.get('date2') || '';
  const currentViewSub = searchParams.get('view_sub') || '0';

  // Local state for search inputs (debounced)
  const [searchTxt, setSearchTxt] = useState(currentSearchTxt);
  const [admin, setAdmin] = useState(currentAdmin);
  const [date1, setDate1] = useState(currentDate1);
  const [date2, setDate2] = useState(currentDate2);
  const [viewSub, setViewSub] = useState(currentViewSub);

  useEffect(() => {
    setTableData(initialData);
    setError(initialError);
    setTotal(totalCount);
    setSearchTxt(currentSearchTxt);
    setAdmin(currentAdmin);
    setDate1(currentDate1);
    setDate2(currentDate2);
    setViewSub(currentViewSub);
  }, [initialData, initialError, totalCount, currentSearchTxt, currentAdmin, currentDate1, currentDate2, currentViewSub]);

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
      router.push(`/dashboard/payments/sub-invoices?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    updateSearchParams({ page: newPage + 1 });
  }, [updateSearchParams]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = +event.target.value;
    updateSearchParams({ pageSize: newPageSize, page: 1 });
  }, [updateSearchParams]);

  const handleSearch = useCallback((field: 'search_txt' | 'admin' | 'view_sub', searchTerm: string | number) => {
    updateSearchParams({ [field]: searchTerm || null, page: 1 });
  }, [updateSearchParams]);

  // Debounced search handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTxt !== currentSearchTxt) {
        handleSearch('search_txt', searchTxt);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTxt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      if (admin !== currentAdmin) {
        handleSearch('admin', admin);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [admin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (date1 !== currentDate1 || date2 !== currentDate2) {
      const timer = setTimeout(() => {
        updateSearchParams({ 
          date1: date1 || null, 
          date2: date2 || null, 
          page: 1 
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [date1, date2]); // eslint-disable-line react-hooks/exhaustive-deps

  // View sub change is immediate
  useEffect(() => {
    if (viewSub !== currentViewSub) {
      handleSearch('view_sub', viewSub);
    }
  }, [viewSub]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Sub-Invoices List
      </Typography>

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
              placeholder="Search by transaction ID or notes..."
              value={searchTxt}
              onChange={(e) => setSearchTxt(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton edge="start" size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: searchTxt && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        setSearchTxt('');
                        handleSearch('search_txt', '');
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
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton edge="start" size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: admin && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        setAdmin('');
                        handleSearch('admin', '');
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>View Sub</InputLabel>
              <Select
                value={viewSub}
                onChange={(e) => setViewSub(e.target.value)}
                label="View Sub"
              >
                <MenuItem value="0">Main Only</MenuItem>
                <MenuItem value="1">Include Sub</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Date From"
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Date To"
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
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
          <Table stickyHeader aria-label="sub-invoices table" sx={{ minWidth: 800 }}>
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
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.trans_id || row.id}>
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 30, 100]}
          component="div"
          count={total}
          rowsPerPage={currentPageSize}
          page={currentPage - 1}
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

