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
  Icon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getOpenConnections } from '@/lib/services/dashboardService';

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
      <Box component="img" 
        src={`/assets/flags_country/${value}.png`} 
        alt={value}
        sx={{ width: '24px', height: '16px' }}
      />
    );
  }},
  { id: 'user_agent', label: 'User Agent', minWidth: 200 },
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

export default function ClientConnectionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const data = await getOpenConnections();
        setConnections(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load connections');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
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
        Client Connections
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