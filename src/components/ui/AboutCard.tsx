import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  useTheme,
  alpha,
  CardHeader,
  Stack
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';

interface AboutCardProps {
  keyword: string;
  aboutInfo: AboutInfo;
  index: number;
}

const AboutCard: React.FC<AboutCardProps> = ({ keyword, aboutInfo, index }) => {
  const theme = useTheme();

  // Determinar el icono y color según la relevancia
  const getRelevanceIndicator = (relevancia: string) => {
    const rel = relevancia.toLowerCase();
    switch (rel) {
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
  const getCategoryColor = (categoria: string | undefined) => {
    const categoryColors: Record<string, string> = {
      'deportes': theme.palette.primary.main,
      'política': theme.palette.secondary.main,
      'música': theme.palette.warning.main,
      'entretenimiento': theme.palette.info.main,
      'justicia': theme.palette.error.main,
      'sociedad': theme.palette.text.secondary,
      'internacional': theme.palette.info.dark,
      'religión': theme.palette.warning.dark,
      'economía': theme.palette.success.dark,
      'tecnología': theme.palette.success.main,
      'salud': theme.palette.success.light,
      'educación': theme.palette.info.light,
      'cultura': theme.palette.warning.light,
      'ciencia': theme.palette.info.main,
      'seguridad': theme.palette.error.dark,
      'medio ambiente': theme.palette.success.light,
      'moda': theme.palette.secondary.light,
      'farándula': theme.palette.warning.main,
      'otros': theme.palette.text.secondary
    };

    if (!categoria) return theme.palette.text.secondary;
    
    // Normalizar la categoría y buscar coincidencia exacta primero
    const normalizedCategoria = categoria.toLowerCase().trim();
    if (categoryColors[normalizedCategoria]) {
      return categoryColors[normalizedCategoria];
    }

    // Si no hay coincidencia exacta, buscar coincidencia parcial
    for (const [cat, color] of Object.entries(categoryColors)) {
      if (normalizedCategoria.includes(cat) || cat.includes(normalizedCategoria)) {
        return color;
      }
    }

    return theme.palette.text.secondary;
  };

  // Determinar si es local o global
  const getContextoChip = () => {
    if (aboutInfo.contexto_local === undefined) return null;
    
    return aboutInfo.contexto_local ? (
      <Chip
        icon={<LocationOnIcon />}
        label="Local"
        size="small"
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          '& .MuiChip-icon': { color: 'white' }
        }}
      />
    ) : (
      <Chip
        icon={<PublicIcon />}
        label="Global"
        size="small"
        sx={{
          backgroundColor: theme.palette.grey[500],
          color: 'white',
          '& .MuiChip-icon': { color: 'white' }
        }}
      />
    );
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
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              #{index + 1}
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
              {aboutInfo.nombre || keyword}
            </Typography>
          </Box>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
            {aboutInfo.categoria && (
              <Chip
                label={aboutInfo.categoria}
                size="small"
                sx={{
                  backgroundColor: categoryColor,
                  color: 'white'
                }}
              />
            )}
            {getContextoChip()}
          </Stack>
        }
      />

      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        {/* Chips de información */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={aboutInfo.tipo}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'divider' }}
          />
        </Box>

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
            Fuente: X (Tendencias)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AboutCard; 