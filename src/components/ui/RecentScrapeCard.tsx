import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Collapse,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material';
import {
  Search,
  SmartToy,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  AccessTime,
  DataUsage,
  Speed,
  LocationOn,
  Delete,
  Warning
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { RecentScrape } from '../../services/recentScrapes';
import { MagicTweetCard } from './MagicTweetCard';

interface RecentScrapeCardProps {
  scrape: RecentScrape;
  layout?: 'compact' | 'expanded' | 'full';
  showActions?: boolean;
  onDelete?: (scrapeId: string) => void;
  isDeleting?: boolean;
}

const RecentScrapeCard: React.FC<RecentScrapeCardProps> = ({ 
  scrape, 
  layout = 'expanded',
  showActions = true,
  onDelete,
  isDeleting = false
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Colores por herramienta
  const getToolColor = (herramienta: string) => {
    const colors = {
      'nitter_context': theme.palette.primary.main,
      'twitter_search': '#1DA1F2',
      'news_search': '#FF6B35',
      'web_search': '#4CAF50'
    };
    return colors[herramienta as keyof typeof colors] || theme.palette.grey[500];
  };

  // Colores por categoría
  const getCategoryColor = (categoria: string) => {
    const colors = {
      'Política': '#f44336',
      'Económica': '#2196f3',
      'Sociales': '#4caf50',
      'General': '#9e9e9e',
      'Tecnología': '#9c27b0',
      'Deportes': '#ff9800'
    };
    return colors[categoria as keyof typeof colors] || theme.palette.grey[500];
  };

  // Colores por grupo detectado
  const getGroupColor = (grupo: string) => {
    const colors = {
      'politica-guatemala': '#f44336',
      'economia-guatemala': '#2196f3', 
      'deportes-guatemala': '#ff9800',
      'cultura-guatemala': '#9c27b0',
      'social-guatemala': '#4caf50',
      'tecnologia': '#3f51b5',
      'internacional': '#795548',
      'entretenimiento': '#e91e63',
      'general': '#9e9e9e'
    };
    return colors[grupo as keyof typeof colors] || theme.palette.grey[500];
  };

  // Nombres de display para grupos
  const getGroupDisplayName = (grupo: string) => {
    const names = {
      'politica-guatemala': '🏛️ Política',
      'economia-guatemala': '💰 Economía',
      'deportes-guatemala': '⚽ Deportes', 
      'cultura-guatemala': '🎭 Cultura',
      'social-guatemala': '✊ Social',
      'tecnologia': '💻 Tecnología',
      'internacional': '🌍 Internacional',
      'entretenimiento': '🎬 Entretenimiento',
      'general': '📱 General'
    };
    return names[grupo as keyof typeof names] || grupo;
  };

  // Icono por herramienta
  const getToolIcon = (herramienta: string) => {
    const icons = {
      'nitter_context': <SmartToy />,
      'twitter_search': <Search />,
      'news_search': <DataUsage />,
      'web_search': <TrendingUp />
    };
    return icons[herramienta as keyof typeof icons] || <Search />;
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(scrape.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: `1px solid ${alpha(getToolColor(scrape.herramienta), 0.2)}`,
          borderLeft: `4px solid ${getToolColor(scrape.herramienta)}`,
          transition: 'all 0.2s ease-in-out',
          opacity: isDeleting ? 0.6 : 1,
          pointerEvents: isDeleting ? 'none' : 'auto',
          '&:hover': {
            transform: layout === 'compact' ? 'translateY(-2px)' : 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(getToolColor(scrape.herramienta), 0.15)}`,
            borderColor: alpha(getToolColor(scrape.herramienta), 0.4)
          },
        }}
      >
        <CardContent>
          {/* Overlay de carga para eliminación */}
          {isDeleting && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                zIndex: 1,
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={32} thickness={4} />
                <Typography variant="caption" color="text.secondary">
                  Eliminando...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Header con Título Generado y botones de acción */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {scrape.generated_title || scrape.query_original}
              </Typography>
              {/* Query original como subtítulo si hay título generado */}
              {scrape.generated_title && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  Query: {scrape.query_original}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip
                  label={scrape.categoria}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getCategoryColor(scrape.categoria), 0.1),
                    color: getCategoryColor(scrape.categoria),
                    fontWeight: 'medium',
                  }}
                />
                {/* Mostrar grupo detectado si está disponible */}
                {scrape.detected_group && (
                  <Chip
                    label={getGroupDisplayName(scrape.detected_group)}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getGroupColor(scrape.detected_group), 0.1),
                      color: getGroupColor(scrape.detected_group),
                      fontWeight: 'medium',
                    }}
                  />
                )}
                {scrape.location && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 14 }} />}
                    label={scrape.location}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
              {/* Botón de eliminar */}
              {showActions && onDelete && (
                <Tooltip title="Eliminar extracción">
                  <IconButton 
                    onClick={handleDeleteClick} 
                    size="small"
                    disabled={isDeleting}
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {/* Botón de expandir */}
              <Tooltip title={expanded ? 'Mostrar menos' : 'Mostrar tweets'}>
                <IconButton onClick={toggleExpanded} size="small" disabled={isDeleting}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Métricas del scrape */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center', 
            mb: 2,
            p: 1,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.grey[500], 0.05)
          }}>
              <Tooltip title="Tweets extraídos">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{scrape.tweet_count}</Typography>
                  <Typography variant="caption" color="text.secondary">Tweets</Typography>
                </Box>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Engagement total">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{scrape.total_engagement.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Engagement</Typography>
                </Box>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Engagement promedio">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">{scrape.avg_engagement}</Typography>
                  <Typography variant="caption" color="text.secondary">Promedio</Typography>
                </Box>
              </Tooltip>
          </Box>

          {/* Tweets extraídos */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {scrape.tweets && scrape.tweets.length > 0 ? (
                scrape.tweets.map((tweet: any) => (
                  <MagicTweetCard key={tweet.tweet_id || tweet.id} tweet={tweet} layout="expanded" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                  No se encontraron tweets para este scrape.
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Estás seguro de que quieres eliminar esta extracción de tweets?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.grey[500], 0.1), borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {scrape.generated_title || scrape.query_original}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {scrape.tweet_count} tweets extraídos • {formatDate(scrape.created_at)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecentScrapeCard; 