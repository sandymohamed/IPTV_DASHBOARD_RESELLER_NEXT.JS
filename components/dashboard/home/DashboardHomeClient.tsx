'use client';

import { useMemo, useState, useCallback, useTransition, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import TvIcon from '@mui/icons-material/Tv';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SearchIcon from '@mui/icons-material/Search';
import { useDashboardUser } from '@/lib/contexts/DashboardUserContext';
import { useLoading } from '@/lib/contexts/LoadingContext';
import { signOut } from 'next-auth/react';
import { fDate } from '@/lib/utils/formatTime';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface DashboardStats {
  total_lines: number;
  total_mags: number;
  total_enigmas: number;
  online_users: number;
  created_today?: number;
  created_month?: number;
  open_connections?: number;
  active_subscriptions?: number;
  expired_week?: Array<{
    id: number;
    username: string;
    exp_date: number;
    reseller_notes?: string;
    type?: string;
  }>;
  expired?: Array<{
    id: number;
    username: string;
    exp_date: number;
    reseller_notes?: string;
    type?: string;
  }>;
  [key: string]: any;
}

interface DashboardHomeClientProps {
  stats: DashboardStats | null;
  error?: string | null;
  movies?: any[];
  series?: any[];
}


const expiredTableColumns = [
  { id: 'ID', label: 'ID', minWidth: 80 },
  { id: 'Type', label: 'Type', minWidth: 100 },
  { id: 'username', label: 'Username', minWidth: 150 },
  { id: 'Date', label: 'Date', minWidth: 150 },
  { id: 'Notes', label: 'Notes', minWidth: 200 },
];

const moviesTableColumns = [
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'stream_display_name', label: 'Title', minWidth: 200 },
  { id: 'stream_icon', label: 'Icon', minWidth: 100 },
  { id: 'category_id', label: 'Category', minWidth: 100 },
  { id: 'added', label: 'Added Date', minWidth: 150 },
];

const seriesTableColumns = [
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'title', label: 'Title', minWidth: 200 },
  { id: 'cover', label: 'Cover', minWidth: 100 },
  { id: 'genre', label: 'Genre', minWidth: 150 },
  { id: 'rating', label: 'Rating', minWidth: 100 },
  { id: 'releaseDate', label: 'Release Date', minWidth: 150 },
];

export default function DashboardHomeClient({ stats, error, movies = [], series = [] }: DashboardHomeClientProps) {
  const { user } = useDashboardUser();
  const { setLoading } = useLoading();
  const [expiredWeekPage, setExpiredWeekPage] = useState(0);
  const [expiredWeekRowsPerPage, setExpiredWeekRowsPerPage] = useState(10);
  const [expiredPage, setExpiredPage] = useState(0);
  const [expiredRowsPerPage, setExpiredRowsPerPage] = useState(10);
  const [expiredWeekFilter, setExpiredWeekFilter] = useState('');
  const [expiredFilter, setExpiredFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  // Automatically redirect to login when session expires
  useEffect(() => {
    if (error === 'SESSION_EXPIRED') {
      setLoading(true);
      startTransition(async () => {
        await signOut({
          callbackUrl: '/auth/login',
          redirect: true
        });
      });
    }
  }, [error, setLoading, startTransition]);

  const handleReAuth = useCallback(() => {
    setLoading(true);
    startTransition(async () => {
      await signOut({
        callbackUrl: '/auth/login',
        redirect: true
      });
    });
  }, [startTransition, setLoading]);

  // Filter expired week data
  const filteredExpiredWeek = useMemo(() => {
    if (!stats?.expired_week) return [];

    if (!expiredWeekFilter) return stats.expired_week;
    return stats.expired_week.filter((item) =>
      item.username?.toLowerCase().includes(expiredWeekFilter.toLowerCase())
    );
  }, [stats?.expired_week, expiredWeekFilter]);

  // Filter expired data
  const filteredExpired = useMemo(() => {
    if (!stats?.expired) return [];
    if (!expiredFilter) return stats.expired;
    return stats.expired.filter((item) =>
      item.username?.toLowerCase().includes(expiredFilter.toLowerCase())
    );
  }, [stats?.expired, expiredFilter]);

  const totalUsers =
    (stats?.total_lines || 0) + (stats?.total_mags || 0) + (stats?.total_enigmas || 0);
  const onlinePercentage =
    totalUsers > 0 ? Math.round(((stats?.online_users || 0) / totalUsers) * 100) : 0;

  // Chart data for pie chart
  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      {
        name: 'Lines',
        value: stats.total_lines || 0,
        color: '#667eea',
        icon: <PeopleIcon />,
      },
      {
        name: 'MAG Devices',
        value: stats.total_mags || 0,
        color: '#f5576c',
        icon: <DevicesIcon />,
      },
      {
        name: 'Enigma Devices',
        value: stats.total_enigmas || 0,
        color: '#00f2fe',
        icon: <TvIcon />,
      },
      {
        name: 'Online Users',
        value: stats.online_users || 0,
        color: '#43e97b',
        icon: <AccountTreeIcon />,
      },
    ];
  }, [stats]);

  const handleExpiredWeekPageChange = (_event: unknown, newPage: number) => {
    setExpiredWeekPage(newPage);
  };

  const handleExpiredWeekRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExpiredWeekRowsPerPage(+event.target.value);
    setExpiredWeekPage(0);
  };

  const handleExpiredPageChange = (_event: unknown, newPage: number) => {
    setExpiredPage(newPage);
  };

  const handleExpiredRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExpiredRowsPerPage(+event.target.value);
    setExpiredPage(0);
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
          Welcome back, {user?.adm_username || user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s an overview of your IPTV dashboard
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Online Users */}
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

        {/* Created Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #00b8d9 0%, #00a8cc 100%)',
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
                    Created Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.created_today?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <CalendarTodayIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Created Month */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
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
                    Created Month
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.created_month?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <CalendarMonthIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Connections */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #ffab00 0%, #ff8f00 100%)',
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
                    Open Connections
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.open_connections?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <LinkIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Subscriptions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #212b36 0%, #161c24 100%)',
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
                    Active Subscriptions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats?.active_subscriptions?.toLocaleString() ?? 0}
                  </Typography>
                </Box>
                <FlashOnIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Lines */}
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

        {/* Total Mags */}
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

        {/* Total Enigmas */}
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
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Expiring in 1 week table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader title="Expiring in 1 week" />
            <Box sx={{ px: 2, pb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by username..."
                value={expiredWeekFilter}
                onChange={(e) => {
                  setExpiredWeekFilter(e.target.value);
                  setExpiredWeekPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {expiredTableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align="center"
                        sx={{ fontWeight: 600, bgcolor: 'background.default' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpiredWeek.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={expiredTableColumns.length} align="center" sx={{ py: 3 }}>
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpiredWeek
                      .slice(
                        expiredWeekPage * expiredWeekRowsPerPage,
                        expiredWeekPage * expiredWeekRowsPerPage + expiredWeekRowsPerPage
                      )
                      .map((row) => (
                        <TableRow
                          hover
                          key={row.id}
                          sx={{
                            borderBottom: '2px solid',
                            borderColor: 'divider',
                            '&:nth-of-type(odd)': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.id}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            <Chip label={row.type || 'M3U'} color="primary" size="small" />
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.username}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.exp_date ? fDate(row.exp_date * 1000) : 'N/A'}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.reseller_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredExpiredWeek.length}
              rowsPerPage={expiredWeekRowsPerPage}
              page={expiredWeekPage}
              onPageChange={handleExpiredWeekPageChange}
              onRowsPerPageChange={handleExpiredWeekRowsPerPageChange}
            />
          </Card>
        </Grid>

        {/* Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <CardHeader title="User Distribution" />
            <CardContent>
              <Box sx={{ height: 300, mb: 3, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack spacing={2}>
                {chartData.map((item) => (
                  <Stack key={item.name} direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: 'background.neutral',
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Stack spacing={0.5} flexGrow={1}>
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalUsers} total users
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle2">{item.value.toLocaleString()}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Expired table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader title="Expired" />
            <Box sx={{ px: 2, pb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by username..."
                value={expiredFilter}
                onChange={(e) => {
                  setExpiredFilter(e.target.value);
                  setExpiredPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {expiredTableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align="center"
                        sx={{ fontWeight: 600, bgcolor: 'background.default' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpired.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={expiredTableColumns.length} align="center" sx={{ py: 3 }}>
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpired
                      .slice(
                        expiredPage * expiredRowsPerPage,
                        expiredPage * expiredRowsPerPage + expiredRowsPerPage
                      )
                      .map((row) => (
                        <TableRow
                          hover
                          key={row.id}
                          sx={{
                            borderBottom: '2px solid',
                            borderColor: 'divider',
                            '&:nth-of-type(odd)': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.id}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            <Chip label={row.type || 'M3U'} color="error" size="small" />
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.username}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.exp_date ? fDate(row.exp_date * 1000) : 'N/A'}
                          </TableCell>
                          <TableCell align="center" sx={{ typography: 'caption' }}>
                            {row.reseller_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={filteredExpired.length}
              rowsPerPage={expiredRowsPerPage}
              page={expiredPage}
              onPageChange={handleExpiredPageChange}
              onRowsPerPageChange={handleExpiredRowsPerPageChange}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Movies and Series Tables */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Last 10 Movies */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader title="Last 10 New Movies" />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {moviesTableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align="center"
                        sx={{ fontWeight: 600, bgcolor: 'background.default' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={moviesTableColumns.length} align="center" sx={{ py: 3 }}>
                        No movies available
                      </TableCell>
                    </TableRow>
                  ) : (
                    movies.map((row) => (
                      <TableRow
                        hover
                        key={row.id}
                        sx={{
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          '&:nth-of-type(odd)': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.id}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.stream_display_name || 'N/A'}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.stream_icon ? (
                            <Avatar
                              src={row.stream_icon}
                              alt={row.stream_display_name}
                              sx={{ width: 40, height: 40, mx: 'auto' }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.category_id || '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.added ? fDate(row.added * 1000) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Last 10 Series */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader title="Last 10 New Series" />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {seriesTableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align="center"
                        sx={{ fontWeight: 600, bgcolor: 'background.default' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {series.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={seriesTableColumns.length} align="center" sx={{ py: 3 }}>
                        No series available
                      </TableCell>
                    </TableRow>
                  ) : (
                    series.map((row) => (
                      <TableRow
                        hover
                        key={row.id}
                        sx={{
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          '&:nth-of-type(odd)': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.id}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.title || 'N/A'}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.cover || row.cover_big ? (
                            <Avatar
                              src={row.cover_big || row.cover}
                              alt={row.title}
                              sx={{ width: 40, height: 40, mx: 'auto' }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.genre || '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.rating ? (
                            <Chip label={row.rating} color="primary" size="small" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ typography: 'caption' }}>
                          {row.releaseDate || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

