import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
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
  Divider
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import SaveIcon from '@mui/icons-material/Save';

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
    guatemala: 'Guatemala'
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
    guatemala: 'Guatemala'
  }
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

        <Box component="form" onSubmit={handleSave} sx={{ mt: 3 }}>
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
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings; 