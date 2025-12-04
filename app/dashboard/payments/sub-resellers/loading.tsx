import { Box, Card, CardContent, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Table>
              <TableHead>
                <TableRow>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableCell key={i}>
                      <Skeleton variant="text" width="80%" height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row}>
                    {[1, 2, 3, 4, 5].map((cell) => (
                      <TableCell key={cell}>
                        <Skeleton variant="text" width="60%" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

