import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Stack,
  useTheme,
  Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ViewModule, ViewComfy, ViewList } from '@mui/icons-material';
import TweetCard from './TweetCard';
import { TrendingTweet } from '../../types';

// Sample tweet data for demonstration
const sampleTweets: TrendingTweet[] = [
  {
    id: 1,
    trend_original: "#Guatemala",
    trend_clean: "Guatemala",
    categoria: "Política",
    tweet_id: "1234567890",
    usuario: "periodista_gt",
    fecha_tweet: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    texto: "🇬🇹 URGENTE: El Congreso de Guatemala aprueba importantes reformas al sistema educativo que beneficiarán a miles de estudiantes en todo el país. Una decisión histórica que marca un antes y después en la educación nacional. #EducaciónGuatemala #Congreso",
    enlace: "https://twitter.com/periodista_gt/status/1234567890",
    likes: 2847,
    retweets: 1203,
    replies: 456,
    verified: true,
    location: "guatemala",
    fecha_captura: new Date().toISOString(),
    raw_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    trend_original: "#EconomíaGT",
    trend_clean: "Economía Guatemala",
    categoria: "Económica",
    tweet_id: "2345678901",
    usuario: "economista_central",
    fecha_tweet: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    texto: "📊 Los indicadores económicos de Guatemala muestran una tendencia positiva en el tercer trimestre. El PIB creció un 3.2% comparado con el mismo período del año anterior.",
    enlace: "https://twitter.com/economista_central/status/2345678901",
    likes: 892,
    retweets: 334,
    replies: 127,
    verified: false,
    location: "guatemala",
    fecha_captura: new Date().toISOString(),
    raw_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    trend_original: "#SociedadGT",
    trend_clean: "Sociedad Guatemala",
    categoria: "Sociales",
    tweet_id: "3456789012",
    usuario: "activista_social",
    fecha_tweet: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    texto: "¡Increíble participación ciudadana en la jornada de limpieza del Lago de Atitlán! 🌊 Más de 500 voluntarios se unieron para preservar este patrimonio natural. La unidad hace la fuerza 💪 #LimpiezaAtitlán #VoluntariadoGT #MedioAmbiente",
    enlace: "https://twitter.com/activista_social/status/3456789012",
    likes: 4521,
    retweets: 2890,
    replies: 789,
    verified: true,
    location: "guatemala",
    fecha_captura: new Date().toISOString(),
    raw_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    trend_original: "#TecnologíaGT",
    trend_clean: "Tecnología Guatemala",
    categoria: "General",
    tweet_id: "4567890123",
    usuario: "tech_guatemala",
    fecha_tweet: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    texto: "🚀 StartUp guatemalteca desarrolla app que conecta agricultores con compradores directos, eliminando intermediarios y aumentando ganancias del campo. La tecnología al servicio del desarrollo rural.",
    enlace: null,
    likes: 167,
    retweets: 89,
    replies: 23,
    verified: false,
    location: "guatemala",
    fecha_captura: new Date().toISOString(),
    raw_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

type LayoutType = 'compact' | 'expanded' | 'full';

const TweetDemo: React.FC = () => {
  const theme = useTheme();
  const [layout, setLayout] = useState<LayoutType>('expanded');
  const [showActions, setShowActions] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  const handleLayoutChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLayout: LayoutType
  ) => {
    if (newLayout !== null) {
      setLayout(newLayout);
    }
  };

  const handleTweetLike = (tweetId: string) => {
    console.log('Demo: Liked tweet', tweetId);
  };

  const handleTweetRetweet = (tweetId: string) => {
    console.log('Demo: Retweeted tweet', tweetId);
  };

  const handleTweetShare = (tweetId: string) => {
    console.log('Demo: Shared tweet', tweetId);
  };

  const getGridProps = () => {
    switch (layout) {
      case 'compact':
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };
      case 'expanded':
        return { xs: 12, sm: 6, lg: 4 };
      case 'full':
        return { xs: 12, md: 6 };
      default:
        return { xs: 12, sm: 6, lg: 4 };
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.95)})`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
          🐦 Demo: TweetCard Modernizado
        </Typography>
                 <Typography variant="body2" color="text.secondary">
           Demostración de las diferentes funcionalidades del componente TweetCard actualizado (sin imágenes de perfil)
         </Typography>
      </Box>

      {/* Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Layout de las tarjetas
          </Typography>
          <ToggleButtonGroup
            value={layout}
            exclusive
            onChange={handleLayoutChange}
            aria-label="layout"
            size="small"
          >
            <ToggleButton value="compact">
              <ViewModule sx={{ mr: 1 }} />
              Compacta
            </ToggleButton>
            <ToggleButton value="expanded">
              <ViewComfy sx={{ mr: 1 }} />
              Expandida
            </ToggleButton>
            <ToggleButton value="full">
              <ViewList sx={{ mr: 1 }} />
              Completa
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Stack direction="row" spacing={1}>
          <ToggleButton
            value="actions"
            selected={showActions}
            onChange={() => setShowActions(!showActions)}
            size="small"
          >
            {showActions ? 'Ocultar' : 'Mostrar'} Acciones
          </ToggleButton>
          
          <ToggleButton
            value="loading"
            selected={showLoading}
            onChange={() => setShowLoading(!showLoading)}
            size="small"
          >
            {showLoading ? 'Ocultar' : 'Mostrar'} Loading
          </ToggleButton>
        </Stack>
      </Stack>

      {/* Features Info */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
        <Typography variant="subtitle2" color="info.main" gutterBottom>
          ✨ Nuevas Características Implementadas:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label="3 Layouts diferentes" size="small" color="primary" variant="outlined" />
          <Chip label="Estados de carga (Skeleton)" size="small" color="primary" variant="outlined" />
          <Chip label="Métricas interactivas" size="small" color="primary" variant="outlined" />
          <Chip label="Animaciones suaves" size="small" color="primary" variant="outlined" />
          <Chip label="Acciones hover" size="small" color="primary" variant="outlined" />
          <Chip label="Fechas relativas" size="small" color="primary" variant="outlined" />
          <Chip label="Responsive design" size="small" color="primary" variant="outlined" />
          <Chip label="Accesibilidad mejorada" size="small" color="primary" variant="outlined" />
        </Stack>
      </Box>

      {/* Tweet Cards */}
      <Grid container spacing={layout === 'compact' ? 2 : 3}>
        {sampleTweets.map((tweet) => (
          <Grid item {...getGridProps()} key={tweet.id}>
            <TweetCard
              tweet={tweet}
              layout={layout}
              isLoading={showLoading}
              showActions={showActions}
              onLike={handleTweetLike}
              onRetweet={handleTweetRetweet}
              onShare={handleTweetShare}
            />
          </Grid>
        ))}
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Haz hover sobre las tarjetas para ver las acciones interactivas y efectos de animación
        </Typography>
      </Box>
    </Paper>
  );
};

export default TweetDemo; 