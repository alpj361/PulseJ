import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  useTheme,
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Language,
  LocationOn,
  HelpOutline,
  Whatshot,
  SportsSoccer,
  Chat
} from '@mui/icons-material';
import { Statistics } from '../../services/api';

interface StatisticsCardProps {
  statistics: Statistics;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ statistics }) => {
  const theme = useTheme();

  // Validaciones para asegurar que tenemos datos válidos
  if (!statistics) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Estadísticas no disponibles
      </Typography>
    );
  }

  // Calcular totales para porcentajes
  const totalRelevancia = Object.values(statistics.relevancia || {}).reduce((sum, count) => sum + count, 0);
  const totalContexto = (statistics.contexto?.local || 0) + (statistics.contexto?.global || 0);

  // Función para calcular grado de controversia basado en categorías
  const calculateControversyLevels = (categoryData: any[]) => {
    const controversy = {
      alto: 0,
      medio: 0,
      bajo: 0
    };

    // Mapeo de categorías a niveles de controversia
    const controversyMapping: Record<string, 'alto' | 'medio' | 'bajo'> = {
      // ALTO - Temas que generan mucha división y debate
      'política': 'alto',
      'politica': 'alto',
      'politics': 'alto',
      'justicia': 'alto',
      'corrupción': 'alto',
      'corrupcion': 'alto',
      'protesta': 'alto',
      'manifestación': 'alto',
      'manifestacion': 'alto',
      'conflicto': 'alto',
      'escándalo': 'alto',
      'escandalo': 'alto',
      'controversia': 'alto',
      'seguridad': 'alto',
      'crimen': 'alto',
      'violencia': 'alto',
      'internacional': 'alto',
      'guerra': 'alto',
      'crisis': 'alto',
      'religión': 'alto',
      'religion': 'alto',

      // MEDIO - Temas que generan debate moderado
      'deportes': 'medio',
      'deporte': 'medio',
      'sports': 'medio',
      'fútbol': 'medio',
      'futbol': 'medio',
      'football': 'medio',
      'economía': 'medio',
      'economia': 'medio',
      'económica': 'medio',
      'economica': 'medio',
      'finanzas': 'medio',
      'tecnología': 'medio',
      'tecnologia': 'medio',
      'technology': 'medio',
      'educación': 'medio',
      'educacion': 'medio',
      'salud': 'medio',
      'health': 'medio',
      'ciencia': 'medio',
      'science': 'medio',
      'medio ambiente': 'medio',
      'medioambiente': 'medio',
      'environment': 'medio',

      // BAJO - Temas de conversación casual y entretenimiento
      'entretenimiento': 'bajo',
      'entertainment': 'bajo',
      'música': 'bajo',
      'musica': 'bajo',
      'music': 'bajo',
      'cine': 'bajo',
      'cinema': 'bajo',
      'película': 'bajo',
      'pelicula': 'bajo',
      'movie': 'bajo',
      'televisión': 'bajo',
      'television': 'bajo',
      'tv': 'bajo',
      'cultura': 'bajo',
      'culture': 'bajo',
      'arte': 'bajo',
      'art': 'bajo',
      'celebración': 'bajo',
      'celebracion': 'bajo',
      'celebration': 'bajo',
      'fiesta': 'bajo',
      'party': 'bajo',
      'festival': 'bajo',
      'concierto': 'bajo',
      'concert': 'bajo',
      'turismo': 'bajo',
      'tourism': 'bajo',
      'viajes': 'bajo',
      'travel': 'bajo',
      'gastronomía': 'bajo',
      'gastronomia': 'bajo',
      'food': 'bajo',
      'comida': 'bajo',
      'moda': 'bajo',
      'fashion': 'bajo',
      'farándula': 'bajo',
      'farandula': 'bajo',
      'celebrity': 'bajo',
      'conversación': 'bajo',
      'conversacion': 'bajo',
      'chat': 'bajo',
      'social': 'bajo',
      'sociedad': 'bajo',
      'community': 'bajo',
      'general': 'bajo',
      'otros': 'bajo',
      'other': 'bajo'
    };

    if (categoryData && Array.isArray(categoryData)) {
      categoryData.forEach(item => {
        const category = item.category || item.nombre || '';
        const count = item.count || item.valor || 0;
        
        // Normalizar la categoría para búsqueda
        const normalizedCategory = category.toLowerCase().trim();
        
        // Buscar coincidencia exacta primero
        let level = controversyMapping[normalizedCategory];
        
        // Si no hay coincidencia exacta, buscar coincidencia parcial
        if (!level) {
          for (const [key, value] of Object.entries(controversyMapping)) {
            if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
              level = value;
              break;
            }
          }
        }
        
        // Si aún no hay coincidencia, usar 'bajo' como default
        if (!level) {
          level = 'bajo';
        }
        
        controversy[level] += count;
      });
    }

    return controversy;
  };

  // Obtener datos de controversia
  const controversyData = React.useMemo(() => {
    // Intentar obtener datos de categorías de diferentes fuentes
    const categoryData = (statistics as any).category_data || (statistics as any).categoryData || [];
    return calculateControversyLevels(categoryData);
  }, [statistics]);

  const totalControversy = controversyData.alto + controversyData.medio + controversyData.bajo;

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const getControversyColor = (level: string) => {
    switch (level) {
      case 'alto':
        return theme.palette.error.main;
      case 'medio':
        return theme.palette.warning.main;
      case 'bajo':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getControversyIcon = (level: string) => {
    switch (level) {
      case 'alto':
        return <Whatshot />;
      case 'medio':
        return <SportsSoccer />;
      case 'bajo':
        return <Chat />;
      default:
        return <Remove />;
    }
  };

  const getControversyTooltip = (level: string) => {
    switch (level) {
      case 'alto':
        return {
          title: 'Controversia Alta',
          description: 'Temas que generan mucha división, debate intenso y polarización. Incluye política, conflictos, escándalos, protestas, justicia y crisis.'
        };
      case 'medio':
        return {
          title: 'Controversia Media',
          description: 'Temas que generan debate moderado y opiniones divididas. Incluye deportes, economía, tecnología, educación y ciencia.'
        };
      case 'bajo':
        return {
          title: 'Controversia Baja',
          description: 'Temas de conversación casual y entretenimiento. Incluye música, cine, cultura, celebraciones, gastronomía y farándula.'
        };
      default:
        return { title: 'Nivel Desconocido', description: 'Categoría no clasificada.' };
    }
  };

  return (
    <Box sx={{ mt: -1 }}>
      <Grid container spacing={4}>
        {/* Grado de Controversia */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.15),
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(12px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&:hover': {
                boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.12)}`,
                borderColor: alpha(theme.palette.primary.main, 0.25),
                transform: 'translateY(-4px)',
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.error.main} 0%, 
                  ${theme.palette.warning.main} 50%, 
                  ${theme.palette.success.main} 100%)`,
                borderRadius: '4px 4px 0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 50%)`,
                pointerEvents: 'none',
                zIndex: -1
              }
            }}
          >
            <Box
              sx={{
                p: 3,
                background: alpha(theme.palette.primary.main, 0.04),
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid',
                borderBottomColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Whatshot 
                  sx={{ 
                    color: 'primary.main',
                    fontSize: 20,
                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                  }} 
                />
              </Box>
              <Typography 
                variant="h6" 
                fontWeight="600" 
                letterSpacing="-0.025em"
                sx={{
                  fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  flexGrow: 1
                }}
              >
                Grado de Controversia
              </Typography>
              <Tooltip 
                title="El grado de controversia mide qué tanto debate y división generan los temas de tendencia"
                placement="top"
                arrow
              >
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {Object.entries(controversyData).map(([level, count]) => {
                const tooltip = getControversyTooltip(level);
                return (
                  <Box key={level} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Tooltip title={tooltip.description} placement="left" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'help' }}>
                          <Box sx={{ color: getControversyColor(level) }}>
                            {getControversyIcon(level)}
                          </Box>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: '500' }}>
                            {tooltip.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: getControversyColor(level) }}>
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getPercentage(count, totalControversy)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha(getControversyColor(level), 0.15),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getControversyColor(level),
                          borderRadius: 5,
                          background: `linear-gradient(90deg, ${getControversyColor(level)}, ${alpha(getControversyColor(level), 0.8)})`
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: '500' }}>
                      {Math.round(getPercentage(count, totalControversy))}% del total de tendencias
                    </Typography>
                  </Box>
                );
              })}
              
              {totalControversy === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No hay datos de controversia disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contexto Local vs Global */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.15),
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: 'blur(12px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.info.main, 0.08)}`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&:hover': {
                boxShadow: `0 12px 48px ${alpha(theme.palette.info.main, 0.12)}`,
                borderColor: alpha(theme.palette.info.main, 0.25),
                transform: 'translateY(-4px)',
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.info.main} 0%, 
                  ${alpha(theme.palette.info.main, 0.8)} 50%, 
                  ${theme.palette.info.light} 100%)`,
                borderRadius: '4px 4px 0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse at bottom right, ${alpha(theme.palette.info.main, 0.02)} 0%, transparent 50%)`,
                pointerEvents: 'none',
                zIndex: -1
              }
            }}
          >
            <Box
              sx={{
                p: 3,
                background: alpha(theme.palette.info.main, 0.04),
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid',
                borderBottomColor: alpha(theme.palette.info.main, 0.1)
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight="600" 
                letterSpacing="-0.025em"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif'
                }}
              >
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.info.main, 0.15),
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <Language 
                    sx={{ 
                      color: 'info.main',
                      fontSize: 20,
                      filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))'
                    }} 
                  />
                </Box>
                <span style={{
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Contexto de las Tendencias
                </span>
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Contexto Local */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ color: 'info.main' }} />
                    <Typography variant="body1" fontWeight="medium">
                      Local (Guatemala)
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'info.main' }}>
                    {statistics.contexto?.local || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(statistics.contexto?.local || 0, totalContexto)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.info.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'info.main',
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(getPercentage(statistics.contexto?.local || 0, totalContexto))}% del total
                </Typography>
              </Box>

              {/* Contexto Global */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language sx={{ color: 'secondary.main' }} />
                    <Typography variant="body1" fontWeight="medium">
                      Global/Internacional
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'secondary.main' }}>
                    {statistics.contexto?.global || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(statistics.contexto?.global || 0, totalContexto)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'secondary.main',
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(getPercentage(statistics.contexto?.global || 0, totalContexto))}% del total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Timestamp */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', pt: 1 }}>
            <Typography variant="caption" color="text.disabled">
              Última actualización: {new Date(statistics.timestamp).toLocaleString('es-ES')}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatisticsCard; 