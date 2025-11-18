'use client';

import { useMemo, useTransition, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

export type CodesListClientProps = {
  rows: Array<Record<string, any>>;
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

type Column = {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: Record<string, any>) => ReactNode;
};

const DEFAULT_PAGE_SIZE = 10;

const columns: readonly Column[] = [
  { id: 'id', label: 'Id', minWidth: 60 },
  { id: 'online', label: 'Online', minWidth: 80, align: 'center' },
  { id: 'admin_name', label: 'Reseller', minWidth: 120 },
  { id: 'fullname', label: 'Fullname', minWidth: 120 },
  { id: 'code', label: 'Code', minWidth: 100 },
  { id: 'pkg', label: 'Days', minWidth: 80, align: 'center' },
  { id: 'forced_country', label: 'Lock', minWidth: 80, align: 'center' },
  { id: 'transid', label: 'TransId', minWidth: 100 },
  { id: 'mac_type', label: 'Status', minWidth: 100, align: 'center' },
  { id: 'mac', label: 'Mac', minWidth: 120 },
  { id: 'serial', label: 'Serial', minWidth: 120 },
  {
    id: 'date_start',
    label: 'Start',
    minWidth: 120,
    align: 'center',
    format: (value: string) => formatDate(value),
  },
  {
    id: 'date_expire',
    label: 'Expire',
    minWidth: 120,
    align: 'center',
    format: (value: string) => formatDate(value),
  },
  { id: 'inputBy', label: 'Input', minWidth: 100 },
  { id: 'options', label: 'Options', minWidth: 100 },
];

function formatDate(value: string) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return value;
  }
}

function useQueryUpdater(defaultPageSize: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQuery = (nextPage: number, nextPageSize: number) => {
    const params = new URLSearchParams(searchParams);

    if (nextPage <= 0) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage + 1));
    }

    if (nextPageSize === defaultPageSize) {
      params.delete('pageSize');
    } else {
      params.set('pageSize', String(nextPageSize));
    }

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return { updateQuery, isPending } as const;
}

export default function CodesListClient({
  rows,
  total,
  page,
  pageSize,
  error,
}: CodesListClientProps) {
  const router = useRouter();
  const { updateQuery, isPending } = useQueryUpdater(DEFAULT_PAGE_SIZE);
  const tableRows = useMemo(() => rows ?? [], [rows]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
        spacing={2}
      >
        <Typography variant="h4">Codes List</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/codes/add-code')}
        >
          Create Code
        </Button>
      </Stack>

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
          position: 'relative',
        }}
      >
        {isPending && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.6)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        <TableContainer
          sx={{
            maxHeight: 'calc(100vh - 300px)',
            overflowX: 'auto',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              height: 8,
              width: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
            },
          }}
        >
          <Table stickyHeader aria-label="codes table" sx={{ minWidth: 1400 }}>
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
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row, index) => (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.id ?? `${row.code ?? 'row'}-${index}`}
                  >
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
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page < 0 ? 0 : page}
          onPageChange={(_event, newPage) => updateQuery(newPage, pageSize)}
          onRowsPerPageChange={(event) => {
            const nextRows = Number(event.target.value);
            updateQuery(0, nextRows);
          }}
        />
      </Paper>
    </Box>
  );
}
