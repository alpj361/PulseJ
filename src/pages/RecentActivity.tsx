import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import ActivityCard from '../components/ui/ActivityCard';
import { 
  Grid, 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Chip,
  Paper, 
  Container,
  Link,
  useTheme,
  alpha
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const translations = {
  es: {
    title: 'Actividad Reciente',
    loading: 'Cargando actividad...',
    noActivity: 'No tienes actividad reciente.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chatear con el Bot',
    yourNumber: 'Tu número:',
    error: 'No se pudo cargar tu actividad reciente.',
    presentations: 'Presentaciones',
    comparisons: 'Comparativas',
    comingSoon: 'Próximamente',
  },
  en: {
    title: 'Recent Activity',
    loading: 'Loading activity...',
    noActivity: 'You have no recent activity.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chat with the Bot',
    yourNumber: 'Your number:',
    error: 'Could not load your recent activity.',
    presentations: 'Presentations',
    comparisons: 'Comparisons',
    comingSoon: 'Coming Soon',
  },
};

const WHATSAPP_BOT_NUMBER = '50252725024';

interface Activity {
  id: string;
  created_at: string;
  type: 'Hashtag' | 'Usuario' | 'News';
  value: string;
  sentimiento: 'positivo' | 'negativo' | 'neutral';
}

export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  useEffect(() => {
    const fetchPhoneAndActivity = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      // Obtener el número de teléfono del perfil
      const { data: profile, error: profileError } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (profileError || !profile?.phone) {
        setError('No se pudo obtener tu número de teléfono. Ve a Settings para configurarlo.');
        setLoading(false);
        return;
      }
      setUserPhone(profile.phone);
      // Obtener la actividad asociada a ese número
      const { data, error: activityError } = await supabase
        .from('scrapes')
        .select('*')
        .eq('wa_number', profile.phone)
        .order('created_at', { ascending: false });
      if (activityError) {
        setError(t.error);
      } else {
        setActivities(data || []);
      }
      setLoading(false);
    };
    fetchPhoneAndActivity();
  }, [user]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* WhatsApp Bot Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          backgroundColor: alpha(theme.palette.success.main, 0.05),
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(theme.palette.success.main, 0.2),
          transition: 'all 0.3s ease',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%2325D366" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")',
          backgroundSize: '300px',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
            borderColor: alpha(theme.palette.success.main, 0.4),
            '& .whatsapp-btn': {
              transform: 'translateY(-3px) scale(1.02)',
              boxShadow: '0 10px 20px rgba(37, 211, 102, 0.25)',
            },
            '& .whatsapp-icon': {
              transform: 'rotate(-10deg) scale(1.1)',
            }
          }
        }}
      >
        {/* Subtle animated dots in background */}
        <Box sx={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: { xs: 100, md: 120 },
          height: { xs: 100, md: 120 },
          background: 'radial-gradient(circle, rgba(37, 211, 102, 0.1) 10%, transparent 10.5%) 0 0, radial-gradient(circle, rgba(37, 211, 102, 0.1) 10%, transparent 10.5%) 8px 8px',
          backgroundSize: '16px 16px',
          zIndex: 0,
          opacity: 0.5,
          animation: 'pulseBackground 4s ease-in-out infinite alternate',
          '@keyframes pulseBackground': {
            '0%': { opacity: 0.3 },
            '100%': { opacity: 0.7 }
          }
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, md: 0 }, position: 'relative', zIndex: 1 }}>
          {/* WhatsApp Logo with wrapper and effect */}
          <Box 
            sx={{ 
              mr: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              boxShadow: '0 6px 16px rgba(37, 211, 102, 0.25)',
              transition: 'all 0.3s ease',
            }}
          >
            <WhatsAppIcon 
              className="whatsapp-icon"
              sx={{ 
                color: 'white', 
                fontSize: 30,
                transition: 'transform 0.3s ease',
              }} 
            />
          </Box>

          <Box>
            {/* Title with enhanced styling */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#075E54',
                mb: 0.5,
                textShadow: '0 1px 2px rgba(7, 94, 84, 0.1)'
              }}
            >
              WhatsApp
            </Typography>
            
            {/* Button with improved design */}
            <Button 
              className="whatsapp-btn"
              variant="contained" 
              size="large"
              href={`https://wa.me/${WHATSAPP_BOT_NUMBER}?text=Hola%20Bot%2C%20quiero%20consultar%20actividad%20reciente...`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mt: 1,
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                borderRadius: '50px',
                px: 3,
                py: 1,
                transition: 'all 0.3s ease',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1ED75F 0%, #0E7F73 100%)',
                }
              }}
            >
              {t.chatWithBot}
            </Button>
          </Box>
        </Box>

        {/* Phone Number Info */}
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#128C7E',
            bgcolor: alpha(theme.palette.success.main, 0.12),
            py: 1,
            px: 2.5,
            borderRadius: 6,
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: '1px dashed',
            borderColor: alpha(theme.palette.success.main, 0.3),
            position: 'relative',
            zIndex: 1
          }}
        >
          {userPhone && (
            <>
              {t.yourNumber} <strong>{userPhone}</strong>
            </>
          )}
        </Typography>
      </Paper>

      {/* Main Card */}
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
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
          <TimelineIcon 
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
        
        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              my: 4,
              p: 3,
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2
            }}
          >
            <CircularProgress size={24} color="primary" />
            <Typography>{t.loading}</Typography>
          </Box>
        ) : error ? (
          <Typography 
            variant="body2" 
            color="error.main" 
            sx={{ 
              my: 4, 
              p: 3, 
              textAlign: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.1)
            }}
          >
            {error}
          </Typography>
        ) : activities.length === 0 ? (
          <Box 
            sx={{ 
              my: 4, 
              p: 3, 
              textAlign: 'center',
              bgcolor: alpha(theme.palette.grey[500], 0.05),
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.6 }} />
            <Typography variant="body1" color="text.secondary">
              {t.noActivity}
            </Typography>
          </Box>
        ) : (
          <Grid 
            container 
            spacing={3} 
            sx={{ 
              mt: 1,
              '& .MuiGrid-item': {
                display: 'flex',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.01)'
                }
              }
            }}
          >
            {activities.map((activity, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                key={activity.id}
                sx={{
                  animation: 'fadeInUp 0.5s ease forwards',
                  opacity: 0,
                  animationDelay: `${index * 0.1}s`,
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                <ActivityCard
                  value={activity.value}
                  type={activity.type}
                  created_at={activity.created_at}
                  sentimiento={activity.sentimiento}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Opciones futuras */}
      <Typography 
        variant="h6" 
        component="h3" 
        sx={{ 
          mb: 2, 
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'text.primary',
          fontWeight: 'medium'
        }}
      >
        Funcionalidades próximas
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: theme.palette.primary.main,
                fontWeight: 'medium'
              }}
            >
              {t.presentations}
            </Typography>
            <Chip 
              label={t.comingSoon} 
              color="primary" 
              variant="outlined" 
              sx={{ 
                fontWeight: 'medium',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
              }} 
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.secondary.main, 0.02),
              border: '1px solid',
              borderColor: alpha(theme.palette.secondary.main, 0.1),
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: theme.palette.secondary.main,
                fontWeight: 'medium'
              }}
            >
              {t.comparisons}
            </Typography>
            <Chip 
              label={t.comingSoon} 
              color="secondary" 
              variant="outlined" 
              sx={{ 
                fontWeight: 'medium',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}