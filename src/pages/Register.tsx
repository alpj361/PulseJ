import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_SCOPES, getCallbackUrl } from '../config/auth';
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
  InputAdornment,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Register() {
  const [step, setStep] = useState(1); // 1: código, 2: registro completo
  const [validatedCode, setValidatedCode] = useState('');
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Verificar si hay un mensaje de error en los parámetros de URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam === 'not_registered' && messageParam) {
      setError(decodeURIComponent(messageParam));
    } else if (errorParam === 'invalid_code' && messageParam) {
      setError(decodeURIComponent(messageParam));
    } else if (errorParam === 'profile_creation_failed' && messageParam) {
      setError(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  const validateInvitationCode = async (code: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        user_type: data.user_type,
        credits: data.credits,
        description: data.description
      };
    } catch (error) {
      // Fallback temporal para desarrollo - códigos de ejemplo con configuraciones
      const validCodes: Record<string, any> = {
        'JOURNALIST2024': { user_type: 'Beta', credits: 150, description: 'Código de desarrollo para periodistas' },
        'PRESS-INVITE': { user_type: 'Alpha', credits: 300, description: 'Código de desarrollo para prensa' },
        'MEDIA-ACCESS': { user_type: 'Creador', credits: 500, description: 'Código de desarrollo para medios' }
      };
      
      const codeData = validCodes[code.toUpperCase()];
      return codeData || null;
    }
  };

  const handleCodeValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar código de invitación
    if (!invitationCode.trim()) {
      setError('El código de invitación es requerido');
      setLoading(false);
      return;
    }

    const codeData = await validateInvitationCode(invitationCode);
    if (!codeData) {
      setError('Código de invitación inválido o ya utilizado');
      setLoading(false);
      return;
    }

    // Si es válido, guardar el código y sus datos, y avanzar al paso 2
    setValidatedCode(invitationCode);
    setStep(2);
    setLoading(false);
    setError(null);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Obtener datos del código validado
      const codeData = await validateInvitationCode(validatedCode);
      if (!codeData) {
        setError('El código de invitación ya no es válido');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      
      // Si el registro fue exitoso, guardar datos en profiles con configuración del código
      if (data.user) {
        await supabase.from('profiles').upsert({ 
          id: data.user.id,
          email: data.user.email,
          phone,
          user_type: codeData.user_type,
          credits: codeData.credits
        });

        // Marcar código como usado
        try {
          const { data: markResult, error: markError } = await supabase.rpc('mark_invitation_code_used', {
            invitation_code: validatedCode,
            user_id: data.user.id
          });
          
          if (markError) {
            console.log('⚠️ Error marcando código como usado con RPC:', markError);
            
            // Fallback: marcar directamente en la tabla
            const { error: directUpdateError } = await supabase
              .from('invitation_codes')
              .update({
                used: true,
                used_by: data.user.id,
                used_at: new Date().toISOString(),
                current_uses: 1
              })
              .eq('code', validatedCode);
              
            if (directUpdateError) {
              console.error('❌ Error marcando código directamente:', directUpdateError);
              // Mostrar warning pero continuar con el registro
              setError('⚠️ Advertencia: El código puede seguir siendo válido para otros usuarios');
            } else {
              console.log('✅ Código marcado como usado directamente en la tabla');
            }
          } else {
            console.log('✅ Código marcado como usado con RPC:', markResult);
          }
        } catch (codeError) {
          console.log('⚠️ Error marcando código como usado (catch):', codeError);
          
          // Fallback directo
          try {
            const { error: directUpdateError } = await supabase
              .from('invitation_codes')
              .update({
                used: true,
                used_by: data.user.id,
                used_at: new Date().toISOString(),
                current_uses: 1
              })
              .eq('code', validatedCode);
              
            if (directUpdateError) {
              console.error('❌ Error en fallback directo:', directUpdateError);
            } else {
              console.log('✅ Código marcado como usado con fallback directo');
            }
          } catch (fallbackError) {
            console.error('❌ Error en fallback:', fallbackError);
          }
        }
      }
      
      setSuccess(`Se ha enviado un enlace de confirmación a tu correo electrónico. Tu cuenta será de tipo ${codeData.user_type} con ${codeData.credits} créditos.`);
      
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
    // El código ya está validado, proceder con Google
    try {
      // Obtener URL de callback usando la configuración centralizada
      const baseCallbackUrl = getCallbackUrl();
      const callbackUrl = `${baseCallbackUrl}?code=${validatedCode}`;
      
      console.log('🔧 Register Environment:', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        validatedCode: validatedCode
      });
      console.log('🔧 Register Callback URL:', callbackUrl);

      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: GOOGLE_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        console.error('❌ Error en Google Register:', error);
        throw error;
      }
      
      console.log('✅ Google Register OAuth iniciado correctamente');
    } catch (error: any) {
      console.error('❌ Error completo en handleGoogleRegister:', error);
      setError('Error al registrarse con Google: ' + error.message);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setValidatedCode('');
    setError(null);
  };

  // Renderizar paso 1: Validación de código
  if (step === 1) {
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
            maxWidth: 'sm',
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
              Acceso por Invitación
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ingresa tu código único para continuar con el registro
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={0} sx={{ mt: 3, mb: 4 }}>
            <Step>
              <StepLabel>Código de Invitación</StepLabel>
            </Step>
            <Step>
              <StepLabel>Crear Cuenta</StepLabel>
            </Step>
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleCodeValidation}>
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
              autoFocus
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              endIcon={<ArrowForwardIcon />}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Siguiente'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes cuenta?{' '}
              <Link component={RouterLink} to="/login" color="primary" underline="hover">
                Iniciar sesión
              </Link>
            </Typography>
          </Box>

          {/* Enlace a términos y condiciones */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Al continuar, aceptas nuestros{' '}
              <Link component={RouterLink} to="/terms" color="primary" underline="hover">
                Términos y Condiciones
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Renderizar paso 2: Registro completo
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
            Crear tu cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Código validado: <strong>{validatedCode}</strong>
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={1} sx={{ mt: 3, mb: 4 }}>
          <Step completed>
            <StepLabel>Código de Invitación</StepLabel>
          </Step>
          <Step>
            <StepLabel>Crear Cuenta</StepLabel>
          </Step>
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Opciones de registro */}
        <Box sx={{ mb: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleRegister}
            disabled={loading}
            sx={{ mb: 2, py: 1.5 }}
          >
            Continuar con Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              O regístrate con email
            </Typography>
          </Divider>
        </Box>

        {/* Formulario de email */}
        <Box component="form" onSubmit={handleEmailRegister}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email-address"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
          </Button>
        </Box>

        {/* Botón para volver atrás */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={goBackToStep1}
            color="secondary"
            variant="text"
            size="small"
          >
            Cambiar código de invitación
          </Button>
        </Box>

        {/* Enlace a términos y condiciones */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Al crear tu cuenta, aceptas nuestros{' '}
            <Link component={RouterLink} to="/terms" color="primary" underline="hover">
              Términos y Condiciones
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 