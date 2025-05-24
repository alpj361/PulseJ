import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  Link,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export default function Register() {
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googleWarning, setGoogleWarning] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateInvitationCode = async (code: string): Promise<boolean> => {
    // TODO: Implementar validación real con backend
    // Por ahora, validación temporal de ejemplo
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .single();
      
      return !error && data;
    } catch (error) {
      // Fallback temporal para desarrollo - códigos de ejemplo
      const validCodes = ['JOURNALIST2024', 'PRESS-INVITE', 'MEDIA-ACCESS'];
      return validCodes.includes(code.toUpperCase());
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validar código de invitación
    if (!invitationCode.trim()) {
      setError('El código de invitación es requerido');
      setLoading(false);
      return;
    }

    const isValidCode = await validateInvitationCode(invitationCode);
    if (!isValidCode) {
      setError('Código de invitación inválido o ya utilizado');
      setLoading(false);
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      
      // Si el registro fue exitoso, guardar el número en profiles y marcar código como usado
      if (data.user) {
        await supabase.from('profiles').upsert({ 
          id: data.user.id, 
          phone,
          invitation_code: invitationCode 
        });

        // TODO: Marcar código de invitación como usado
        try {
          await supabase
            .from('invitation_codes')
            .update({ used: true, used_by: data.user.id, used_at: new Date().toISOString() })
            .eq('code', invitationCode);
        } catch (codeError) {
          console.log('Error marcando código como usado:', codeError);
        }
      }
      
      setSuccess('Se ha enviado un enlace de confirmación a tu correo electrónico.');
      
      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleWarning(true);
    // Aquí puedes iniciar el flujo de Google si lo deseas
    await supabase.auth.signInWithOAuth({ provider: 'google' });
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
            Crear una cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Necesitas un código de invitación para registrarte •{' '}
            <Link component={RouterLink} to="/login" color="primary" underline="hover">
              ¿Ya tienes cuenta?
            </Link>
          </Typography>
        </Box>

        {googleWarning && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            Si te registras with Google, también necesitarás proporcionar un código de invitación válido.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister} sx={{ mt: 4 }}>
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
            id="invitation-code"
            label="Código de invitación único"
            name="invitationCode"
            placeholder="Ej: JOURNALIST2024"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VpnKeyIcon color="primary" />
                </InputAdornment>
              ),
            }}
            helperText="Solicita tu código de invitación al administrador"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Número de teléfono"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirm-password"
            label="Confirmar contraseña"
            type="password"
            id="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, position: 'relative' }}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              O regístrate con
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleRegister}
            sx={{ mt: 2, py: 1.5 }}
          >
            Google
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 