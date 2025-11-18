import { Box, Typography, Card, CardContent, Grid, Divider } from '@mui/material';
import { getServerSession } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  const user = session.user as any;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Account Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Profile Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1">{user.adm_username || user.name || user.email || 'N/A'}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{user.email || user.adm_username || 'N/A'}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Admin Name
                </Typography>
                <Typography variant="body1">{user.admin_name || user.adm_username || user.name || 'N/A'}</Typography>
              </Box>

              {user.balance !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Balance
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    ${user.balance}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Account Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Account ID
                </Typography>
                <Typography variant="body1">{user.id || user.adminid || 'N/A'}</Typography>
              </Box>

              {user.status !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {user.status === 1 ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
