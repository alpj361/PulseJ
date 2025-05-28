import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Description as FileTextIcon,
  FlashOn as ZapIcon,
  ArrowForward as ArrowRightIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Home: React.FC = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleStart = () => {
    navigate('/login');
  };

  // Logo SVG Component
  const PulseLogo = ({ size = 80 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <path d="M10 50 Q15 25, 20 50 T30 50" stroke="url(#waveGradient)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M20 50 Q25 20, 30 50 T40 50" stroke="url(#waveGradient)" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M30 50 Q35 15, 40 50 T50 50" stroke="url(#waveGradient)" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M40 50 Q45 10, 50 50 T60 50" stroke="url(#waveGradient)" strokeWidth="9" fill="none" strokeLinecap="round"/>
    </svg>
  );

  const TermsModal = () => (
    <Dialog 
      open={showTermsModal} 
      onClose={() => setShowTermsModal(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Términos y Condiciones
        </Typography>
        <IconButton onClick={() => setShowTermsModal(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ space: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight="semibold">
            1. Aceptación de los Términos
          </Typography>
          <Typography paragraph color="text.secondary">
            Al acceder y utilizar Pulse Journal, usted acepta estar sujeto a estos términos y condiciones de uso.
          </Typography>
          
          <Typography variant="h6" gutterBottom fontWeight="semibold">
            2. Descripción del Servicio
          </Typography>
          <Typography paragraph color="text.secondary">
            Pulse Journal es una plataforma de análisis de tendencias y gestión de contenido periodístico que permite a los usuarios organizar, analizar y extraer insights de sus materiales de investigación.
          </Typography>
          
          <Typography variant="h6" gutterBottom fontWeight="semibold">
            3. Privacidad y Datos
          </Typography>
          <Typography paragraph color="text.secondary">
            Nos comprometemos a proteger su privacidad. Los datos que proporcione serán utilizados únicamente para mejorar su experiencia en la plataforma y no serán compartidos con terceros sin su consentimiento.
          </Typography>
          
          <Typography variant="h6" gutterBottom fontWeight="semibold">
            4. Uso Responsable
          </Typography>
          <Typography paragraph color="text.secondary">
            Se compromete a utilizar la plataforma de manera responsable y ética, respetando los derechos de autor y las fuentes de información.
          </Typography>
          
          <Typography variant="h6" gutterBottom fontWeight="semibold">
            5. Modificaciones
          </Typography>
          <Typography paragraph color="text.secondary">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={() => setShowTermsModal(false)}
          variant="contained"
          fullWidth
          size="large"
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 50%, #E8EAF6 100%)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          p: 3
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Header vacío - solo para mantener estructura si se necesita en el futuro */}
            <Box />
            <Box />
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        component="main"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          px: 3
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            {/* Logo Principal */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PulseLogo size={isMobile ? 60 : 80} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography 
                    variant={isMobile ? "h3" : "h2"} 
                    fontWeight="bold" 
                    color="text.primary"
                  >
                    pulse
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    color="text.secondary" 
                    fontWeight="medium"
                    sx={{ letterSpacing: 2 }}
                  >
                    JOURNAL
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Título y Descripción */}
            <Box sx={{ mb: 6 }}>
              <Typography 
                variant={isMobile ? "h3" : "h2"} 
                fontWeight="bold" 
                color="text.primary" 
                sx={{ mb: 3, lineHeight: 1.2 }}
              >
                Analiza tendencias.
                <br />
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Organiza contenido.
                </Box>
                <br />
                Descubre insights.
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}
              >
                La plataforma integral para periodistas y analistas que transforma datos en historias poderosas. 
                Conecta tu Google Drive, analiza tendencias y gestiona tu contenido en un solo lugar.
              </Typography>
            </Box>

            {/* Características destacadas */}
            <Grid container spacing={3} sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3
                  }}
                >
                  <CardContent>
                    <BarChartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="semibold" gutterBottom>
                      Análisis de Tendencias
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visualiza patrones y tendencias en tiempo real
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3
                  }}
                >
                  <CardContent>
                    <FileTextIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="semibold" gutterBottom>
                      Gestión de Contenido
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Organiza documentos, audios y videos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3
                  }}
                >
                  <CardContent>
                    <ZapIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="semibold" gutterBottom>
                      Integración Google Drive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Conecta directamente con tus archivos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Botón de Acceso */}
            <Paper 
              sx={{ 
                p: 4, 
                maxWidth: 400, 
                mx: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 3
              }}
            >
              <Button
                onClick={handleStart}
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowRightIcon />}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'semibold',
                  borderRadius: 2,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                Empezar ahora
              </Button>
            </Paper>

            {/* Footer info */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes una cuenta?{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    p: 0, 
                    minWidth: 'auto', 
                    fontWeight: 'medium',
                    textTransform: 'none'
                  }}
                >
                  Inicia sesión aquí
                </Button>
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/terms')}
                  sx={{ 
                    p: 0, 
                    minWidth: 'auto', 
                    textDecoration: 'underline',
                    fontSize: 'inherit',
                    textTransform: 'none'
                  }}
                >
                  Ver Términos y Condiciones
                </Button>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Modal de Términos */}
      <TermsModal />
    </Box>
  );
};

export default Home; 