import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  Satellite,
  FolderOpen,
  MenuBook,
  Chat,
  ArrowForward,
  AudioFile,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BackgroundPaths } from '@/components/ui/BackgroundPaths';
import { GlowCard } from '@/components/ui/spotlight-card';
import Logo from '../components/common/Logo';
import { BoltNewBadge } from '@/components/ui/BoltNewBadge';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleStart = () => {
    navigate('/login');
  };

  // Usando el logo original de login

  const features = [
    {
      icon: TrendingUp,
      title: "Monitoreo de Tendencias Locales",
      description: "Detecta temas en auge y coyunturas relevantes en Guatemala, incluyendo menciones de leyes, actores políticos y crisis emergentes en tiempo real.",
    },
    {
      icon: Satellite,
      title: "Monitoreo de Redes y Medios",
      description: "Conecta con X, medios digitales y blogs locales para rastrear publicaciones clave, hashtags y cambios en el discurso público.",
    },
    {
      icon: FolderOpen,
      title: "Proyectos y Coberturas",
      description: "Crea proyectos temáticos para organizar investigaciones, guardar tendencias relevantes y documentar avances de coberturas periodísticas.",
    },
    {
      icon: MenuBook,
      title: "Códex y Librería",
      description: "Una librería viva con recursos, referencias, leyes y conceptos clave. Base de conocimiento confiable y actualizada para comunicadores.",
    },
    {
      icon: AudioFile,
      title: "Transcripción de Audio/Video",
      description: "Convierte automáticamente archivos de audio y video en texto con IA avanzada. Perfecto para entrevistas y conferencias de prensa.",
    },
    {
      icon: Chat,
      title: "Chat de Apoyo",
      description: "Asistente inteligente que responde preguntas, ayuda a redactar contenido y brinda soporte contextual basado en tus proyectos activos.",
    },
  ];

  return (
    <BackgroundPaths>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Header */}
        <Box component="header" sx={{ py: 3, px: 4 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Logo size={32} variant="icon" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    pulse
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                    JOURNAL
                  </Typography>
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  Iniciar Sesión
                </Button>
              </motion.div>
            </Box>
          </Container>
        </Box>

        {/* Hero Section */}
        <Box component="main" sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography 
                  variant={isMobile ? "h2" : "h1"} 
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="text.secondary" 
                  sx={{ mb: 2, maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}
                >
                  La plataforma integral para periodistas y analistas que transforma datos en historias poderosas. 
                  Conecta tu Google Drive, analiza tendencias y gestiona tu contenido en un solo lugar.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Typography 
                  variant="body2" 
                  color="primary.main" 
                  fontWeight="medium" 
                  sx={{ mb: 8, fontStyle: 'italic' }}
                >
                  Know the pulse, shape the story.
                </Typography>
              </motion.div>

              {/* Features Cards */}
              <Grid container spacing={3} sx={{ mb: 8 }}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={6} lg={4} key={feature.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                      style={{ height: '100%' }}
                    >
                      <GlowCard 
                        customSize={true}
                        glowColor="blue"
                        className="h-full w-full flex flex-col"
                      >
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%',
                          gap: 2
                        }}>
                          <Box sx={{ 
                            width: 56, 
                            height: 56, 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            borderRadius: 4, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mb: 1
                          }}>
                            <feature.icon sx={{ fontSize: 28, color: 'primary.main' }} />
                          </Box>
                          <Typography variant="h6" fontWeight="semibold" gutterBottom color="text.primary">
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flexGrow: 1 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </GlowCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              >
                <Paper 
                  sx={{ 
                    p: 4, 
                    maxWidth: 400, 
                    mx: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: theme.shadows[8]
                  }}
                >
                  <Button
                    onClick={handleStart}
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'semibold',
                      borderRadius: 3,
                      textTransform: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[12]
                      }
                    }}
                  >
                    Empezar ahora
                  </Button>

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                    
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/terms')}
                      sx={{ 
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        textTransform: 'none',
                        color: 'text.secondary'
                      }}
                    >
                      Ver Términos y Condiciones
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 6, 
            px: 4, 
            borderTop: 1, 
            borderColor: 'rgba(0, 0, 0, 0.05)',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Logo size={24} variant="icon" />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    pulse
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                    JOURNAL
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/privacy')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Política de Privacidad
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/terms')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Términos de Servicio
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    component="a"
                    href="mailto:contacto@standatpd.com"
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    contacto@standatpd.com
                  </Button>
                </Box>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.7 }}
            >
              <Box sx={{ 
                mt: 4, 
                pt: 4, 
                borderTop: 1, 
                borderColor: 'rgba(0, 0, 0, 0.05)',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: { xs: 1, md: 2 }
                }}>
                  <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} Pulse Journal. Todos los derechos reservados.
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ display: { xs: 'none', md: 'block' } }}>
                    •
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    standatpd
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* Bolt badge */}
        <BoltNewBadge position="bottom-right" variant="auto" size="medium" />
      </Box>
    </BackgroundPaths>
  );
};

export default Home; 