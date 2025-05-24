import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Language,
  LocationOn
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

  // Función para calcular porcentajes
  const getPercentage = (value: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.max(0, (value / total) * 100));
  };

  // Colores para relevancia
  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'alta': return theme.palette.success.main;
      case 'media': return theme.palette.warning.main;
      case 'baja': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Iconos para relevancia
  const getRelevanceIcon = (relevance: string) => {
    switch (relevance) {
      case 'alta': return <TrendingUp />;
      case 'media': return <Remove />;
      case 'baja': return <TrendingDown />;
      default: return <Remove />;
    }
  };

  return (
    <Box sx={{ mt: -3 }}>
      <Grid container spacing={4}>
        {/* Distribución por Relevancia */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.shadows[2]
            }}
          >
            <Box
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: 'primary.main' }} />
                Distribución por Relevancia
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {statistics.relevancia && Object.entries(statistics.relevancia).map(([relevance, count]) => (
                <Box key={relevance} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: getRelevanceColor(relevance) }}>
                        {getRelevanceIcon(relevance)}
                      </Box>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}>
                        {relevance}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: getRelevanceColor(relevance) }}>
                      {count}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getPercentage(count, totalRelevancia)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(getRelevanceColor(relevance), 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getRelevanceColor(relevance),
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {Math.round(getPercentage(count, totalRelevancia))}% del total
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Contexto Local vs Global */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.shadows[2]
            }}
          >
            <Box
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language sx={{ color: 'secondary.main' }} />
                Contexto de las Tendencias
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