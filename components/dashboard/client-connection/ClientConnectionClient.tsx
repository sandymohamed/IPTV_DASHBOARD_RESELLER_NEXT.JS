'use client';

import * as React from 'react';
import { useCallback, useState, useTransition, useEffect } from 'react';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useSearchParams } from 'next/navigation';
import { spliceLongText } from '@/components/hooks/useSpliceLongText';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'user_id', label: 'ID', minWidth: 80, align: 'center' },
  { id: 'divergence', label: 'Status', minWidth: 100, align: 'center', format: (value: number) => {
    if (value <= 10) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (value <= 50) {
      return <CheckCircleIcon sx={{ color: 'primary.main' }} />;
    } else {
      return <CheckCircleIcon sx={{ color: 'error.main' }} />;
    }
  }},
  { id: 'username', label: 'Username/Device', minWidth: 150 },
  { id: 'stream_display_name', label: 'Channel', minWidth: 200 },
  { id: 'user_ip', label: 'IP', minWidth: 120, align: 'center' },
  { id: 'geoip_country_code', label: 'Flag', minWidth: 80, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    return (
      <Box 
        component="img" 
        src={`/assets/flags_country/${value.toUpperCase()}.png`} 
        alt={value}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.endsWith('unknown.png')) {
            target.src = '/assets/flags_country/unknown.png';
          }
        }}
        sx={{ 
          width: '24px', 
          height: '16px',
          objectFit: 'cover',
          borderRadius: '2px',
        }}
      />
    );
  }},
  { id: 'user_agent', label: 'User Agent', minWidth: 200, format: (value: string) => {
    return <>{ spliceLongText(value, 50)}</>;
  }},
  { id: 'date_start', label: 'Time Online', minWidth: 150, align: 'center', format: (value: number) => {
    if (!value) return 'N/A';
    try {
      const dateObj = new Date(value * 1000);
      return dateObj.toLocaleString();
    } catch {
      return 'N/A';
    }
  }},
  { id: 'type', label: 'Type', minWidth: 100 },
];

interface ClientConnectionClientProps {
  initialConnections: any[];
  totalCount?: number;
  initialError?: string | null;
}

export default function ClientConnectionClient({
  initialConnections,
  totalCount = 0,
  initialError = null,
}: ClientConnectionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(initialError);
  const [connections, setConnections] = useState<any[]>(initialConnections);
  const [total, setTotal] = useState(totalCount);

  // Get current params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '100');

  useEffect(() => {
    setConnections(initialConnections);
    setError(initialError);
    setTotal(totalCount);
  }, [initialConnections, initialError, totalCount]);

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
      router.push(`/dashboard/client-connection?${params.toString()}`);
    });
  }, [router, searchParams]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    updateSearchParams({ page: newPage + 1 }); // MUI uses 0-based, server uses 1-based
  }, [updateSearchParams]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = +event.target.value;
    updateSearchParams({ pageSize: newPageSize, page: 1 }); // Reset to page 1 when changing page size
  }, [updateSearchParams]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Box>
          <Typography variant="h4">Client Connections</Typography>
          {total > 0 && (
            <Typography variant="body2" color="text.secondary">
              Total: {total.toLocaleString()} connections
            </Typography>
          )}
        </Box>
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
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 1200 }}>
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
              {connections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                connections.map((row, index) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.user_id || index}>
                      {columns.map((column) => {
                        const value = row[column.id];
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {total > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={currentPage - 1} // MUI uses 0-based, server uses 1-based
            onPageChange={handleChangePage}
            rowsPerPage={currentPageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[50, 100, 200, 500]}
            sx={{
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          />
        )}
      </Paper>
    </Box>
  );
}

