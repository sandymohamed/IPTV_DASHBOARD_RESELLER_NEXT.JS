'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { getAllTransResellers } from '@/lib/services/transactionsService';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'id', label: 'id', minWidth: 60 },
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
  { id: 'amount', label: 'Amount', minWidth: 120, align: 'right', format: (value: number) => {
    const amount = typeof value === 'number' ? value : parseFloat(value);
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
  { id: 'Notes', label: ' Notes', minWidth: 200 },
];

export default function PaymentsSubResellersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const result = await getAllTransResellers({ page: page + 1, pageSize: rowsPerPage });
        setTransactions(result.result || []);
        setTotal(result.total || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
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
      <Typography variant="h4" sx={{ mb: 5 }}>
        Sub-Resellers Payments
      </Typography>

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
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 800 }}>
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
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((row) => {
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
