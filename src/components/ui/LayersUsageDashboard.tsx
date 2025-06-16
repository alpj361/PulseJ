import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Alert,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getUserLayersLimit, countUserLayersByType } from '../../services/userLimits';
import { getUserProjects } from '../../services/supabase';

interface LayersUsage {
  enfoque: number;
  alcance: number;
  configuracion: number;
}

interface ProjectUsage {
  id: string;
  title: string;
  usage: LayersUsage;
}

interface UsageStats {
  userLimit: number;
  totalUsage: LayersUsage;
  projectsUsage: ProjectUsage[];
  loading: boolean;
  error: string | null;
}

const LayersUsageDashboard: React.FC = () => {
  const [stats, setStats] = useState<UsageStats>({
    userLimit: 3,
    totalUsage: { enfoque: 0, alcance: 0, configuracion: 0 },
    projectsUsage: [],
    loading: true,
    error: null
  });

  const layerTypes = [
    {
      key: 'enfoque' as keyof LayersUsage,
      label: 'Enfoque',
      icon: TrendingUpIcon,
      color: '#2563eb', // blue-600
      description: 'Capas de dirección estratégica y marco conceptual'
    },
    {
      key: 'alcance' as keyof LayersUsage,
      label: 'Alcance', 
      icon: AssignmentIcon,
      color: '#dc2626', // red-600
      description: 'Capas de límites temporales, geográficos y temáticos'
    },
    {
      key: 'configuracion' as keyof LayersUsage,
      label: 'Configuración',
      icon: SettingsIcon,
      color: '#7c3aed', // violet-600
      description: 'Capas de herramientas, formatos y metodologías'
    }
  ];

  const loadUsageStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Cargar límite del usuario
      const userLimit = await getUserLayersLimit();
      
      // Cargar proyectos del usuario
      const projects = await getUserProjects();
      
      // Para cada proyecto, contar las capas por tipo
      const projectsUsage: ProjectUsage[] = await Promise.all(
        projects.map(async (project) => {
          const usage = {
            enfoque: await countUserLayersByType(project.id, 'enfoque'),
            alcance: await countUserLayersByType(project.id, 'alcance'),
            configuracion: await countUserLayersByType(project.id, 'configuracion')
          };
          
          return {
            id: project.id,
            title: project.title,
            usage
          };
        })
      );

      // Calcular uso total
      const totalUsage = projectsUsage.reduce(
        (acc, project) => ({
          enfoque: acc.enfoque + project.usage.enfoque,
          alcance: acc.alcance + project.usage.alcance,
          configuracion: acc.configuracion + project.usage.configuracion
        }),
        { enfoque: 0, alcance: 0, configuracion: 0 }
      );

      setStats({
        userLimit,
        totalUsage,
        projectsUsage,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error cargando estadísticas de uso:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error cargando las estadísticas de uso'
      }));
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, []);

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = getUsagePercentage(used, limit);
    if (percentage >= 100) return '#dc2626'; // red-600
    if (percentage >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const isAtLimit = (used: number, limit: number) => used >= limit;

  if (stats.loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Cargando estadísticas de uso...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (stats.error) {
    return (
      <Alert severity="error" action={
        <IconButton size="small" onClick={loadUsageStats}>
          <RefreshIcon />
        </IconButton>
      }>
        {stats.error}
      </Alert>
    );
  }

  return (
    <Box sx={{ space: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📊 Dashboard de Uso de Capas
            </Typography>
            <Tooltip title="Actualizar estadísticas">
              <IconButton onClick={loadUsageStats} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Límite actual: <strong>{stats.userLimit} capas por tipo de decisión</strong>
          </Typography>
        </CardContent>
      </Card>

      {/* Uso por tipo de capa */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {layerTypes.map((type) => {
          const used = stats.totalUsage[type.key];
          const percentage = getUsagePercentage(used, stats.userLimit);
          const color = getUsageColor(used, stats.userLimit);
          const atLimit = isAtLimit(used, stats.userLimit);
          const IconComponent = type.icon;

          return (
            <Grid item xs={12} md={4} key={type.key}>
              <Card sx={{ 
                height: '100%',
                border: atLimit ? `2px solid ${color}` : undefined,
                borderRadius: 2
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${type.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComponent sx={{ color: type.color, fontSize: 20 }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {type.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {used}/{stats.userLimit} capas
                      </Typography>
                    </Box>
                    {atLimit && (
                      <Tooltip title="Has alcanzado el límite para este tipo">
                        <WarningIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                      </Tooltip>
                    )}
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${type.color}15`,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: color,
                        borderRadius: 4
                      }
                    }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {percentage.toFixed(0)}% usado
                    </Typography>
                    {atLimit ? (
                      <Chip
                        size="small"
                        label="Límite alcanzado"
                        color="error"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label={`${stats.userLimit - used} disponibles`}
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Box>

                  <Tooltip title={type.description}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 1, 
                        fontSize: '0.7rem',
                        cursor: 'help',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      <InfoIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                      {type.description}
                    </Typography>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Uso por proyecto */}
      {stats.projectsUsage.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              📁 Uso por Proyecto
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats.projectsUsage.map((project, index) => {
              const totalUsed = project.usage.enfoque + project.usage.alcance + project.usage.configuracion;
              const maxPossible = stats.userLimit * 3;
              const projectPercentage = (totalUsed / maxPossible) * 100;

              return (
                <Box key={project.id} sx={{ mb: index < stats.projectsUsage.length - 1 ? 2 : 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {totalUsed}/{maxPossible} capas ({projectPercentage.toFixed(0)}%)
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={1}>
                    {layerTypes.map((type) => {
                      const used = project.usage[type.key];
                      const typePercentage = getUsagePercentage(used, stats.userLimit);
                      const typeColor = getUsageColor(used, stats.userLimit);

                      return (
                        <Grid item xs={4} key={type.key}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: type.color
                              }}
                            />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', flex: 1 }}>
                              {type.label}: {used}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  {index < stats.projectsUsage.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>💡 Información importante:</strong> Los límites se aplican solo a capas raíz (no a decisiones derivadas). 
          Puedes crear decisiones derivadas ilimitadas dentro de cada capa principal.
        </Typography>
      </Alert>
    </Box>
  );
};

export default LayersUsageDashboard; 