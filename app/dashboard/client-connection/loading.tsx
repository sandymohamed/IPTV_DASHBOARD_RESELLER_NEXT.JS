import { Box, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 5 }} />
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 200px)',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" width="80%" height={24} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((row) => (
                <TableRow key={row}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" width="60%" height={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

