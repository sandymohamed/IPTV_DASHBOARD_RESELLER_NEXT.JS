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
  TableRow,
} from '@mui/material';
import { getUserActivityLog } from '@/lib/services/logsService';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

const columns: readonly Column[] = [
  { id: 'username', label: 'Username', minWidth: 150 },
  { id: 'stream_display_name', label: 'Stream', minWidth: 200 },
  { id: 'server_name', label: 'Server', minWidth: 150 },
  { id: 'date_start', label: 'Start', minWidth: 180, align: 'center', format: (value: number) => {
    if (!value) return 'N/A';
    try {
      const dateObj = new Date(value * 1000);
      return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    } catch {
      return 'N/A';
    }
  }},
  { id: 'date_end', label: 'End', minWidth: 180, align: 'center', format: (value: number) => {
    if (!value) return 'N/A';
    try {
      const dateObj = new Date(value * 1000);
      return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    } catch {
      return 'N/A';
    }
  }},
  { id: 'user_ip', label: 'IP', minWidth: 120, align: 'center' },
  { id: 'geoip_country_code', label: 'Country', minWidth: 100, align: 'center', format: (value: string) => {
    if (!value) return 'N/A';
    return (
      <Box component="img" 
        src={`/assets/flags_country/${value}.png`} 
        alt={value}
        sx={{ width: '24px', height: '16px' }}
      />
    );
  }},
];

export default function UserActivityLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getUserActivityLog();
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

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
        User Activity Logs
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
          <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 1000 }}>
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
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((row, index) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.activity_id || index}>
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
      </Paper>
    </Box>
  );
}