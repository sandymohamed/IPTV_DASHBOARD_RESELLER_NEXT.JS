'use client';

import { useMemo, useState, useCallback, useTransition } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import TvIcon from '@mui/icons-material/Tv';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useDashboardUser } from '@/lib/contexts/DashboardUserContext';
import { signOut } from 'next-auth/react';

export interface DashboardStats {
  total_lines: number;
  total_mags: number;
  total_enigmas: number;
  online_users: number;
  [key: string]: any;
}

interface DashboardHomeClientProps {
  stats: DashboardStats | null;
  error?: string | null;
}

interface TableData {
  name: string;
  total: number;
  online: number;
  percentage: number;
}

const columns = [
  { id: 'name', label: 'User Type', minWidth: 170 },
  { id: 'total', label: 'Total Users', minWidth: 170, align: 'right' as const },
  { id: 'online', label: 'Online Users', minWidth: 170, align: 'right' as const },
  { id: 'percentage', label: 'Online %', minWidth: 170, align: 'right' as const },
];

export default function DashboardHomeClient({ stats, error }: DashboardHomeClientProps) {
  const { user } = useDashboardUser();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();
  const handleReAuth = useCallback(() => {
    startTransition(async () => {
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    });
  }, [startTransition]);

  const tableRows = useMemo<TableData[]>(() => {
    if (!stats) return [];

    const totalUsers =
      (stats.total_lines || 0) + (stats.total_mags || 0) + (stats.total_enigmas || 0);

    const baseRows: TableData[] = [
      {
        name: 'Lines',
        total: stats.total_lines || 0,
        online: 0,
        percentage: 0,
      },
      {
        name: 'MAG Devices',
        total: stats.total_mags || 0,
        online: 0,
        percentage: 0,
      },
      {
        name: 'Enigma Devices',
        total: stats.total_enigmas || 0,
        online: 0,
        percentage: 0,
      },
    ];

    const onlineUsers = stats.online_users || 0;
    if (totalUsers > 0) {
      baseRows.forEach((row) => {
        row.online = Math.round((onlineUsers * row.total) / totalUsers);
        row.percentage = row.total > 0 ? (row.online / row.total) * 100 : 0;
      });
    }

    return baseRows;
  }, [stats]);

  const totalUsers =
    (stats?.total_lines || 0) + (stats?.total_mags || 0) + (stats?.total_enigmas || 0);
  const onlinePercentage =
    totalUsers > 0 ? Math.round(((stats?.online_users || 0) / totalUsers) * 100) : 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  if (error === 'SESSION_EXPIRED') {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your session has expired. Please sign in again.
          <Button
            variant="contained"
            color="primary"
            sx={{ ml: 2 }}
            onClick={handleReAuth}
            disabled={isPending}
          >
            Go to Login
          </Button>
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome back, {user?.adm_username || user?.name || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s an overview of your IPTV dashboard
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Total Lines
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.total_lines?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Total Mags
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.total_mags?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <DevicesIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Total Enigmas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.total_enigmas?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <TvIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Online Users
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.online_users?.toLocaleString() ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {onlinePercentage}% of total
                  </Typography>
                </Box>
                <AccountTreeIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            User Statistics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed breakdown of your user base
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="dashboard statistics table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell 
                    key={column.id} 
                    align={column.align} 
                    style={{ minWidth: column.minWidth }}
                    sx={{ 
                      fontWeight: 600,
                      bgcolor: 'background.default',
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow 
                    hover 
                    role="checkbox" 
                    tabIndex={-1} 
                    key={row.name}
                    sx={{
                      '&:nth-of-type(odd)': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell align="right">{row.total.toLocaleString('en-US')}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        component="span" 
                        sx={{ 
                          color: row.online > 0 ? 'success.main' : 'text.secondary',
                          fontWeight: 600 
                        }}
                      >
                        {row.online.toLocaleString('en-US')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        component="span" 
                        sx={{ 
                          color: row.percentage > 50 ? 'success.main' : row.percentage > 25 ? 'warning.main' : 'text.secondary',
                          fontWeight: 600 
                        }}
                      >
                        {`${row.percentage.toFixed(1)}%`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={tableRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

