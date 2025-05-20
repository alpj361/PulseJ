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
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Phone as PhoneIcon 
} from '@mui/icons-material';

const translations = {
  es: {
    title: 'Configuración de Usuario',
    phoneLabel: 'Número de teléfono asociado a tu cuenta',
    phonePlaceholder: 'Ej: +502 1234 5678',
    saveButton: 'Guardar',
    saving: 'Guardando...',
    success: 'Número actualizado correctamente',
    loadError: 'No se pudo cargar el perfil',
    saveError: 'No se pudo guardar el número',
  },
  en: {
    title: 'User Settings',
    phoneLabel: 'Phone number associated with your account',
    phonePlaceholder: 'Ex: +502 1234 5678',
    saveButton: 'Save',
    saving: 'Saving...',
    success: 'Phone number updated successfully',
    loadError: 'Could not load profile',
    saveError: 'Could not save phone number',
  },
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      setSuccess('');
      const { data, error } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (error) {
        setError(t.loadError);
      } else if (data && data.phone) {
        setPhone(data.phone);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, t.loadError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const { error } = await supabase.from('profiles').upsert({ id: user.id, phone });
    if (error) {
      setError(t.saveError);
    } else {
      setSuccess(t.success);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative top border */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
        
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 3,
            mt: 0.5
          }}
        >
          <SettingsIcon 
            sx={{ 
              color: theme.palette.primary.main,
              fontSize: 28
            }} 
          />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{
              fontWeight: 'medium',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {t.title}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box 
          component="form" 
          onSubmit={handleSave}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            maxWidth: 500,
            mx: 'auto'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
            p: 3,
            borderRadius: 2
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="primary" />
              {t.phoneLabel}
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              type="tel"
              required
              InputProps={{
                sx: {
                  backgroundColor: 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }
                }
              }}
            />
          </Box>
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: 2,
                fontSize: '0.875rem',
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                }
              }}
            >
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                fontSize: '0.875rem',
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{
              borderRadius: 6,
              py: 1.2,
              px: 4,
              fontWeight: 'medium',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              }
            }}
            startIcon={loading ? null : undefined}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>{t.saving}</span>
              </Box>
            ) : (
              t.saveButton
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings; 