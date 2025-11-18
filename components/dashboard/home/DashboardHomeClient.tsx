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
import { logoutAction } from '@/lib/auth/actions';
import { useDashboardUser } from '@/lib/contexts/DashboardUserContext';

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
    const currentPath =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/dashboard/home';
    startTransition(() => {
      logoutAction(currentPath);
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
      <Typography variant="h4" sx={{ mb: 5 }}>
        Welcome, {user?.admin_name || user?.username || 'User'}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Lines</Typography>
              </Box>
              <Typography variant="h4">{stats?.total_lines ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DevicesIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Mags</Typography>
              </Box>
              <Typography variant="h4">{stats?.total_mags ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TvIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Enigmas</Typography>
              </Box>
              <Typography variant="h4">{stats?.total_enigmas ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountTreeIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Online Users</Typography>
              </Box>
              <Typography variant="h4">{stats?.online_users ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {onlinePercentage}% of total users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="dashboard statistics table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.total.toLocaleString('en-US')}</TableCell>
                    <TableCell align="right">{row.online.toLocaleString('en-US')}</TableCell>
                    <TableCell align="right">{`${row.percentage.toFixed(1)}%`}</TableCell>
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

