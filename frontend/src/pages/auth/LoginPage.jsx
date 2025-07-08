import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import { SchoolTwoTone, LoginRounded } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Branding */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white', textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <SchoolTwoTone sx={{ fontSize: 48, mr: 2 }} />
                <Typography variant="h3" component="h1" fontWeight="bold">
                  Student Success Platform
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
                Empowering students to achieve their academic and career goals
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.8 }}>
                Track student progress, manage surveys, analyze performance metrics, 
                and facilitate meaningful connections between students and their aspirations.
              </Typography>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Card sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <LoginRounded />
                  </Avatar>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign in to continue to your dashboard
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      variant="outlined"
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      variant="outlined"
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Stack>
                </form>

                {/* Demo Credentials */}
                <Paper sx={{ mt: 4, p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Demo Credentials:
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDemoLogin('admin@test.com', 'admin123')}
                    >
                      Admin Demo
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDemoLogin('user@test.com', 'user123')}
                    >
                      User Demo
                    </Button>
                  </Stack>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage;