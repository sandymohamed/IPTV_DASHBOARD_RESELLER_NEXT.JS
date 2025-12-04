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
  Button,
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
  { id: 'type', label: 'Type', minWidth: 100, format: (value: number) => {
    const types: { [key: number]: string } = {
      1: 'Topup',
      2: 'Credit',
      3: 'Bonus',
      4: 'Transfer'
    };
    return types[value] || String(value);
  }},
  { id: 'admin', label: 'Reseller', minWidth: 150, format: (value: any, row: any) => {
    return row.admin_name || value || 'N/A';
  }},
  { id: 'credit', label: 'Credit', minWidth: 120, align: 'right', format: (value: number) => {
    const amount = typeof value === 'number' ? value : parseFloat(String(value || 0));
    return `$${isNaN(amount) ? '0.00' : amount.toFixed(2)}`;
  }},
  { id: 'depit', label: 'Debit', minWidth: 120, align: 'right', format: (value: number) => {
    const amount = typeof value === 'number' ? value : parseFloat(String(value || 0));
    return `$${isNaN(amount) ? '0.00' : amount.toFixed(2)}`;
  }},
  { id: 'dateadded', label: 'Date', minWidth: 150, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }},
  { id: 'Notes', label: 'Notes', minWidth: 200 },
];

interface PaymentsSubResellersClientProps {
  initialData: any[];
  totalCount?: number;
  initialError?: string | null;
}

export default function PaymentsSubResellersClient({ initialData, totalCount = 0, initialError = null }: PaymentsSubResellersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(initialError);
  const [tableData, setTableData] = useState<any[]>(initialData);
  const [total, setTotal] = useState(totalCount);

  // Get current params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '100');
  const currentSearchTxt = searchParams.get('search_txt') || '';
  const currentAdmin = searchParams.get('admin') || '';
  const currentType = searchParams.get('type') || '2';

  // Local state for search inputs (debounced)
  const [searchTxt, setSearchTxt] = useState(currentSearchTxt);
  const [admin, setAdmin] = useState(currentAdmin);
  const [type, setType] = useState(currentType);

  useEffect(() => {
    setTableData(initialData);
    setError(initialError);
    setTotal(totalCount);
    setSearchTxt(currentSearchTxt);
    setAdmin(currentAdmin);
    setType(currentType);
  }, [initialData, initialError, totalCount, currentSearchTxt, currentAdmin, currentType]);

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
      router.push(`/dashboard/payments/sub-resellers?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    updateSearchParams({ page: newPage + 1 });
  }, [updateSearchParams]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = +event.target.value;
    updateSearchParams({ pageSize: newPageSize, page: 1 });
  }, [updateSearchParams]);

  const handleSearch = useCallback((field: 'search_txt' | 'admin' | 'type', searchTerm: string | number) => {
    updateSearchParams({ [field]: searchTerm || null, page: 1 });
  }, [updateSearchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchTxt('');
    setAdmin('');
    setType('2');
    startTransition(() => {
      router.push('/dashboard/payments/sub-resellers');
    });
  }, [router]);

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

  // Type change is immediate
  useEffect(() => {
    if (type !== currentType) {
      handleSearch('type', type);
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Sub-Resellers Payments
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
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                label="Type"
              >
                <MenuItem value="1">Topup</MenuItem>
                <MenuItem value="2">Credit</MenuItem>
                <MenuItem value="3">Bonus</MenuItem>
                <MenuItem value="4">Transfer</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {(currentSearchTxt || currentAdmin || currentType !== '2') && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearSearch}
                disabled={isPending}
              >
                Clear Search
              </Button>
            </Box>
          )}
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
          <Table stickyHeader aria-label="payments table" sx={{ minWidth: 800 }}>
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
          rowsPerPageOptions={[10, 25, 100, 500]}
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

