import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  LocationOn,
  Schedule,
  InfoOutlined
} from '@mui/icons-material';
import { AboutInfo } from '../../services/api';

interface AboutCardProps {
  keyword: string;
  aboutInfo: AboutInfo;
  index: number;
}

const AboutCard: React.FC<AboutCardProps> = ({ keyword, aboutInfo, index }) => {
  const theme = useTheme();

  // Determinar el icono y color según la relevancia
  const getRelevanceIndicator = (relevancia: string) => {
    switch (relevancia) {
      case 'alta':
        return {
          icon: <TrendingUp />,
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1),
          label: 'Alta'
        };
      case 'media':
        return {
          icon: <TrendingFlat />,
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
          label: 'Media'
        };
      case 'baja':
        return {
          icon: <TrendingDown />,
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.1),
          label: 'Baja'
        };
      default:
        return {
          icon: <TrendingFlat />,
          color: theme.palette.grey[500],
          bgColor: alpha(theme.palette.grey[500], 0.1),
          label: 'N/A'
        };
    }
  };

  // Determinar color de categoría
  const getCategoryColor = (categoria: string) => {
    const categoryColors: Record<string, string> = {
      'Deportes': theme.palette.primary.main,
      'fútbol': theme.palette.primary.main,
      'Política': theme.palette.secondary.main,
      'política': theme.palette.secondary.main,
      'Entretenimiento': theme.palette.info.main,
      'Música': theme.palette.warning.main,
      'Tecnología': theme.palette.success.main,
      'Sociedad': theme.palette.text.secondary,
      'Justicia': theme.palette.error.main,
      'Internacional': theme.palette.info.dark,
      'Religión': theme.palette.warning.dark
    };
    
    return categoryColors[categoria] || theme.palette.grey[600];
  };

  const relevanceIndicator = getRelevanceIndicator(aboutInfo.relevancia);
  const categoryColor = getCategoryColor(aboutInfo.categoria);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header con número y relevancia */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
          background: `linear-gradient(135deg, ${alpha(categoryColor, 0.1)} 0%, ${alpha(categoryColor, 0.05)} 100%)`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              fontSize: '1rem'
            }}
          >
            #{index + 1}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: categoryColor,
              fontSize: '1.1rem'
            }}
          >
            {aboutInfo.nombre || keyword}
          </Typography>
        </Box>
        
        {/* Indicador de relevancia */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 2,
            bgcolor: relevanceIndicator.bgColor,
            color: relevanceIndicator.color
          }}
        >
          {relevanceIndicator.icon}
          <Typography variant="caption" fontWeight="bold">
            {relevanceIndicator.label}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        {/* Chips de información */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={aboutInfo.categoria}
            size="small"
            sx={{
              bgcolor: alpha(categoryColor, 0.1),
              color: categoryColor,
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={aboutInfo.tipo}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'divider' }}
          />
          {aboutInfo.contexto_local && (
            <Chip
              icon={<LocationOn sx={{ fontSize: 16 }} />}
              label="Local"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Resumen */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            fontSize: '0.9rem'
          }}
        >
          {aboutInfo.resumen}
        </Typography>

        {/* Razón de tendencia */}
        {aboutInfo.razon_tendencia && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoOutlined sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" fontWeight="bold" color="primary.main">
                RAZÓN DE TENDENCIA
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontStyle: 'italic',
                color: 'text.primary',
                fontSize: '0.85rem',
                pl: 3
              }}
            >
              {aboutInfo.razon_tendencia}
            </Typography>
          </Box>
        )}

        {/* Fecha del evento */}
        {aboutInfo.fecha_evento && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {aboutInfo.fecha_evento}
            </Typography>
          </Box>
        )}

        {/* Palabras clave */}
        {aboutInfo.palabras_clave && aboutInfo.palabras_clave.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Palabras clave:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {aboutInfo.palabras_clave.slice(0, 4).map((palabra, idx) => (
                <Chip
                  key={idx}
                  label={palabra}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    borderColor: 'divider',
                    color: 'text.secondary'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Fuente */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: '0.7rem' }}
          >
            Fuente: {aboutInfo.source} ({aboutInfo.model})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AboutCard; 