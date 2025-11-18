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
  TableRow,
} from '@mui/material';
import { fetchWithAuth } from '@/lib/server/fetchWithAuth';

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

type UserActivityResponse = {
  data?: Array<Record<string, any>>;
  result?: Array<Record<string, any>>;
};

export const dynamic = 'force-dynamic';

export default async function UserActivityLogsPage() {
  let logs: Array<Record<string, any>> = [];
  let errorMessage: string | null = null;

  try {
    const response = await fetchWithAuth<UserActivityResponse>('/user_activity', {
      method: 'POST',
    });

    logs = response?.data ?? response?.result ?? [];
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'We could not load the activity logs. Please try again later.';
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 5 }}>
        User Activity Logs
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
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
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table stickyHeader aria-label="activity logs table" sx={{ minWidth: 1000 }}>
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
                logs.map((row, index) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.activity_id || index}>
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}