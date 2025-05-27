import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_SCOPES } from '../config/auth';
import Logo from '../components/common/Logo';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/auth/verify');
    }
  }, [user, navigate]);

  // Verificar si hay mensajes de error en los parámetros de URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    
    if (errorParam === 'auth_failed') {
      setError('Error en la autenticación. Por favor, intenta de nuevo.');
    } else if (errorParam === 'callback_failed') {
      setError('Error procesando la autenticación. Por favor, intenta de nuevo.');
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      navigate('/auth/verify');
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Primero intentamos obtener la información del usuario de Google sin hacer login
      // Para esto, usaremos un flujo temporal que nos permita verificar el email
      
      // Construir URL de callback basada en la ubicación actual
      const currentUrl = new URL(window.location.href);
      const callbackUrl = `${currentUrl.protocol}//${currentUrl.host}/auth/callback`;
      
      console.log('Current URL:', window.location.href);
      console.log('Callback URL:', callbackUrl);
      console.log('Scopes solicitados:', GOOGLE_SCOPES);

      // Iniciamos el flujo de OAuth con Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: GOOGLE_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Error en signInWithOAuth:', error);
        throw error;
      }

      // Nota: La verificación del usuario se hará en el callback
      // porque necesitamos el email del usuario de Google primero
      
    } catch (error: any) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
        py: 6,
        px: { xs: 2, sm: 4 }
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 'md',
          width: '100%',
          p: { xs: 3, sm: 5 },
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Logo />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
          >
            Iniciar sesión
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            O{' '}
            <Link component={RouterLink} to="/register" color="primary" underline="hover">
              regístrate si no tienes cuenta
            </Link>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 4 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email-address"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, position: 'relative' }}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              O continúa con
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ mt: 2, py: 1.5 }}
          >
            Iniciar sesión con Google
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Solo para usuarios ya registrados con código de acceso
          </Typography>
        </Box>

        {/* Enlace a términos y condiciones */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Al usar esta plataforma, aceptas nuestros{' '}
            <Link component={RouterLink} to="/terms" color="primary" underline="hover">
              Términos y Condiciones
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 