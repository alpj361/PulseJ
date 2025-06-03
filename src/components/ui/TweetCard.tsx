import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Link,
  useTheme
} from '@mui/material';
import {
  Favorite,
  Repeat,
  ChatBubbleOutline,
  Verified,
  Launch
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { TrendingTweet } from '../../types';

interface TweetCardProps {
  tweet: TrendingTweet;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const theme = useTheme();

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Obtener color por categoría
  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'Política':
        return { bg: 'rgba(156, 39, 176, 0.1)', text: '#9c27b0', border: '#9c27b0' };
      case 'Económica':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: '#4caf50', border: '#4caf50' };
      case 'Sociales':
        return { bg: 'rgba(33, 150, 243, 0.1)', text: '#2196f3', border: '#2196f3' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.1)', text: '#9e9e9e', border: '#9e9e9e' };
    }
  };

  const categoryColor = getCategoryColor(tweet.categoria);

  // Formatear números grandes
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        {/* Header con usuario y categoría */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {tweet.usuario.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                  @{tweet.usuario}
                </Typography>
                {tweet.verified && (
                  <Tooltip title="Cuenta verificada">
                    <Verified sx={{ fontSize: 16, color: '#1da1f2' }} />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDate(tweet.fecha_tweet)}
              </Typography>
            </Box>
          </Box>
          
          <Chip
            label={tweet.categoria}
            size="small"
            sx={{
              backgroundColor: categoryColor.bg,
              color: categoryColor.text,
              border: `1px solid ${alpha(categoryColor.border, 0.3)}`,
              fontWeight: 'medium',
              fontSize: '0.75rem'
            }}
          />
        </Box>

        {/* Contenido del tweet */}
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            mb: 2,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {tweet.texto}
        </Typography>

        {/* Trend relacionado */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            Trending: {tweet.trend_clean}
          </Typography>
        </Box>

        {/* Métricas del tweet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Favorite sx={{ fontSize: 16, color: '#e91e63' }} />
            <Typography variant="caption" color="text.secondary">
              {formatNumber(tweet.likes)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Repeat sx={{ fontSize: 16, color: '#4caf50' }} />
            <Typography variant="caption" color="text.secondary">
              {formatNumber(tweet.retweets)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatBubbleOutline sx={{ fontSize: 16, color: '#2196f3' }} />
            <Typography variant="caption" color="text.secondary">
              {formatNumber(tweet.replies)}
            </Typography>
          </Box>
        </Box>

        {/* Footer con enlace */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.disabled">
            Capturado: {formatDate(tweet.fecha_captura)}
          </Typography>
          
          {tweet.enlace && (
            <Tooltip title="Ver tweet original">
              <IconButton
                component={Link}
                href={tweet.enlace}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <Launch fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TweetCard; 