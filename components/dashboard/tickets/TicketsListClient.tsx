'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import { useRouter } from 'next/navigation';
import { fDate } from '@/lib/utils/formatTime';
import ReplyTicketModal from './ReplyTicketModal';

type TicketRow = Record<string, any>;

type Column = {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: TicketRow) => React.ReactNode;
};

type TicketsListClientProps = {
  rows: TicketRow[];
  error?: string | null;
  user?: any;
};

const columns: readonly Column[] = [
  { id: 'id', label: 'ID', minWidth: 60 },
  {
    id: 'status',
    label: 'Status',
    minWidth: 100,
    format: (value: number) => (value === 1 ? 'Open' : 'Closed'),
  },
  {
    id: 'date',
    label: 'Date',
    minWidth: 100,
    align: 'center',
    format: (value: string) => {
      if (!value) return 'N/A';
      try {
        return fDate(Number(value) * 1000);
      } catch (error) {
        return value;
      }
    },
  },
  { id: 'member_id', label: 'Owner', minWidth: 100 },
  { id: 'title', label: 'Subject', minWidth: 100 },
  {
    id: 'message',
    label: 'Last Reply',
    minWidth: 150,
    align: 'center',
   
  },
  {
    id: 'options',
    label: 'Options',
    minWidth: 100,
    align: 'center',
  },
];

export default function TicketsListClient({ rows, error, user }: TicketsListClientProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  const data = useMemo(() => rows ?? [], [rows]);

  const handleOpenReplyModal = (ticket: TicketRow) => {
    setSelectedTicket(ticket);
    setReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setReplyModalOpen(false);
    setSelectedTicket(null);
  };

  const handleReplyAdded = () => {
    // Refresh the page data
    router.refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Typography variant="h4">Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/tickets/create')}
        >
          Create Ticket
        </Button>
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
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table stickyHeader aria-label="tickets table" sx={{ minWidth: 800 }}>
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
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                data
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        // Special handling for options column
                        if (column.id === 'options') {
                          return (
                            <TableCell
                              key={column.id}
                              align={column.align || 'left'}
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              <Tooltip title="Add Reply">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleOpenReplyModal(row)}
                                >
                                  <MessageIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          );
                        }
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
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(+event.target.value);
            setPage(0);
          }}
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

      <ReplyTicketModal
        open={replyModalOpen}
        onClose={handleCloseReplyModal}
        ticket={selectedTicket}
        user={user}
        onReplyAdded={handleReplyAdded}
      />
    </Box>
  );
}

