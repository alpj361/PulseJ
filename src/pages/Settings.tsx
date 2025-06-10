import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  CircularProgress,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const translations = {
  es: {
    title: 'Configuración de Usuario',
    phoneLabel: 'Número de teléfono',
    phoneHelper: 'Ingresa tu número sin el código de país (+502)',
    phonePlaceholder: '1234 5678',
    saveButton: 'Guardar',
    saving: 'Guardando...',
    successMessage: 'Número actualizado correctamente',
    errorLoad: 'No se pudo cargar el perfil',
    errorSave: 'No se pudo guardar el número',
    guatemala: 'Guatemala',
    // Nuevas traducciones
    contactInfo: 'Información de Contacto',
    emailSection: 'Correo Electrónico',
    passwordSection: 'Cambiar Contraseña',
    dangerZone: 'Zona Peligrosa',
    newEmail: 'Nuevo correo electrónico',
    emailHelper: 'Se enviará un correo de confirmación a la nueva dirección',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    passwordHelper: 'La nueva contraseña debe tener al menos 6 caracteres',
    deleteAccount: 'Eliminar cuenta permanentemente',
    deleteWarning: 'Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.',
    backToDashboard: 'Regresar al Dashboard'
  },
  en: {
    title: 'User Settings',
    phoneLabel: 'Phone Number',
    phoneHelper: 'Enter your number without country code (+502)',
    phonePlaceholder: '1234 5678',
    saveButton: 'Save',
    saving: 'Saving...',
    successMessage: 'Number updated successfully',
    errorLoad: 'Could not load profile',
    errorSave: 'Could not save number',
    guatemala: 'Guatemala',
    // New translations
    contactInfo: 'Contact Information',
    emailSection: 'Email Address',
    passwordSection: 'Change Password',
    dangerZone: 'Danger Zone',
    newEmail: 'New email address',
    emailHelper: 'A confirmation email will be sent to the new address',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordHelper: 'New password must be at least 6 characters',
    deleteAccount: 'Delete account permanently',
    deleteWarning: 'This action will permanently delete your account and all your data. This cannot be undone.',
    backToDashboard: 'Back to Dashboard'
  }
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const t = translations[language];
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Add state for email and password management
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Función para extraer solo el número sin el prefijo +502
  const extractPhoneNumber = (fullPhone: string) => {
    if (!fullPhone) return '';
    // Si el número ya tiene +502, lo removemos
    if (fullPhone.startsWith('+502')) {
      return fullPhone.replace('+502', '').trim();
    }
    // Si solo tiene 502, lo removemos
    if (fullPhone.startsWith('502')) {
      return fullPhone.replace('502', '').trim();
    }
    return fullPhone;
  };

  // Función para formatear el número (agregar espacios cada 4 dígitos)
  const formatPhoneNumber = (number: string) => {
    // Remover todos los espacios y caracteres no numéricos excepto +
    const cleanNumber = number.replace(/[^\d]/g, '');
    // Formatear con espacios cada 4 dígitos
    return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      setSuccess('');
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
          
      if (error) {
          setError(t.errorLoad);
      } else if (data && data.phone) {
          // Extraer solo el número sin el prefijo +502
          const phoneNumber = extractPhoneNumber(data.phone);
          setPhone(phoneNumber);
        }
      } catch (err) {
        setError(t.errorLoad);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, t.errorLoad]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números y espacios, máximo 8 dígitos
    const cleanValue = value.replace(/[^\d\s]/g, '');
    if (cleanValue.replace(/\s/g, '').length <= 8) {
      setPhone(formatPhoneNumber(cleanValue));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validar que el número tenga 8 dígitos
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 8) {
      setError('El número debe tener 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Guardar con el prefijo +502
      const fullPhone = `+502${cleanPhone}`;
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, phone: fullPhone });

    if (error) {
        setError(t.errorSave);
    } else {
        setSuccess(t.successMessage);
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(t.errorSave);
    } finally {
    setLoading(false);
    }
  };

  // Function to handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Actualizar email en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) {
        setError(`No se pudo actualizar el correo electrónico: ${error.message}`);
      } else {
        setSuccess('Se ha enviado un correo de confirmación a tu nueva dirección. Verifica tu email para completar el cambio.');
        // Limpiar el campo después del éxito
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError('No se pudo actualizar el correo electrónico');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newPassword !== confirmPassword) return;

    // Validaciones adicionales
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Cambiar contraseña en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(`No se pudo cambiar la contraseña: ${error.message}`);
      } else {
        setSuccess('Contraseña actualizada correctamente');
        // Limpiar los campos después del éxito
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError('No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    // Segunda confirmación para mayor seguridad
    const confirmFinal = window.confirm('ÚLTIMA OPORTUNIDAD: ¿Realmente deseas eliminar permanentemente tu cuenta y todos tus datos?');
    if (!confirmFinal) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Primero eliminar datos del usuario de las tablas relacionadas
      // Eliminar items del codex del usuario
      await supabase
        .from('codex_items')
        .delete()
        .eq('user_id', user.id);

      // Eliminar perfil del usuario
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Finalmente eliminar el usuario de Auth (esto debe ser lo último)
      // Nota: La eliminación de usuario de Auth requiere permisos especiales
      // En producción, esto debería hacerse desde el backend con service_role key
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        // Si no se puede eliminar desde el frontend, mostrar instrucciones
        setError('Para eliminar tu cuenta, contacta al soporte. Tu perfil y datos han sido eliminados, pero la cuenta de acceso requiere eliminación manual.');
      } else {
        setSuccess('Cuenta eliminada correctamente');
        // Cerrar sesión después de eliminar
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err: any) {
      setError(`No se pudo eliminar la cuenta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Botón de regresar al Dashboard */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            variant="outlined"
            sx={{
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            {t.backToDashboard}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold" 
            color="primary.main"
            sx={{ mb: 1 }}
          >
            {t.title}
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* Sección de Teléfono */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            📱 Información de Contacto
          </Typography>
          <Box component="form" onSubmit={handleSave}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                {t.phoneLabel}
              </Typography>
              
              <TextField
                fullWidth
              id="phone"
              name="phone"
              type="tel"
              value={phone}
                onChange={handlePhoneChange}
                placeholder={t.phonePlaceholder}
                helperText={t.phoneHelper}
              required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            fontSize: '1.5rem',
                            lineHeight: 1,
                          }}
                        >
                          🇬🇹
                        </Box>
                        <Chip
                          label="+502"
                          size="small"
                          sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              fontSize: '0.875rem'
                            }
                          }}
                        />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              
              {phone && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Número completo: <strong>+502 {phone}</strong>
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
            type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !phone}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                py: 1.5,
                mt: 2,
                fontWeight: 'bold',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                },
              }}
          >
              {loading ? t.saving : t.saveButton}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Sección de Email */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            ✉️ Correo Electrónico
          </Typography>
          <Box component="form" onSubmit={handleEmailUpdate}>
            <TextField
              fullWidth
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Nuevo correo electrónico"
              placeholder="ejemplo@correo.com"
              helperText="Se enviará un correo de confirmación a la nueva dirección"
              required
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email || email === user?.email}
              sx={{ 
                mb: 2,
                background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E8E 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF5252 30%, #FF7979 90%)',
                },
              }}
            >
              Actualizar Correo Electrónico
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Sección de Contraseña */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            🔒 Cambiar Contraseña
          </Typography>
          <Box component="form" onSubmit={handleChangePassword}>
            <TextField
              fullWidth
              id="current-password"
              name="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              label="Contraseña actual"
              placeholder="Ingresa tu contraseña actual"
              required
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <TextField
              fullWidth
              id="new-password"
              name="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              label="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
              helperText="La nueva contraseña debe tener al menos 6 caracteres"
              required
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <TextField
              fullWidth
              id="confirm-password"
              name="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirmar nueva contraseña"
              placeholder="Repite la nueva contraseña"
              required
              disabled={loading}
              error={confirmPassword !== '' && newPassword !== confirmPassword}
              helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Las contraseñas no coinciden' : ''}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              sx={{ 
                mb: 2,
                background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #43A047 30%, #5CB85C 90%)',
                },
              }}
            >
              Cambiar Contraseña
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Sección de Eliminación de Cuenta */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'error.main' }}>
            ⚠️ Zona Peligrosa
          </Typography>
          <Box sx={{ p: 3, border: '2px solid', borderColor: 'error.main', borderRadius: 2, backgroundColor: 'error.light', opacity: 0.1 }}>
            <Typography variant="body1" sx={{ mb: 2, color: 'error.dark', fontWeight: 'medium' }}>
              Eliminar cuenta permanentemente
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="large"
              onClick={handleDeleteAccount}
              disabled={loading}
              sx={{ 
                mt: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'error.main',
                  color: 'white',
                },
              }}
            >
              Eliminar Cuenta Permanentemente
            </Button>
          </Box>
        </Box>

        {/* Mensajes de éxito y error */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mt: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Settings; 