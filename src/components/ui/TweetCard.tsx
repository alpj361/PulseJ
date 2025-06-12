import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Link,
  useTheme,
  Skeleton,
  Collapse,
  Button,
  Fade,
  Grow
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Repeat,
  ChatBubbleOutline,
  Verified,
  Launch,
  ExpandMore,
  ExpandLess,
  Share,
  BookmarkBorder,
  MoreHoriz
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { TrendingTweet } from '../../types';

interface TweetCardProps {
  tweet: TrendingTweet;
  layout?: 'compact' | 'expanded' | 'full';
  isLoading?: boolean;
  showActions?: boolean;
  onLike?: (tweetId: string) => void;
  onRetweet?: (tweetId: string) => void;
  onShare?: (tweetId: string) => void;
}

// Loading skeleton component
const TweetCardSkeleton: React.FC<{ layout?: 'compact' | 'expanded' | 'full' }> = ({ layout = 'expanded' }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: layout === 'compact' ? 120 : layout === 'expanded' ? 280 : 'auto',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 6 }} />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="80%" height={16} />
          {layout !== 'compact' && (
            <>
              <Skeleton variant="text" width="90%" height={16} />
              <Skeleton variant="text" width="70%" height={16} />
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Skeleton variant="text" width={40} height={16} />
          <Skeleton variant="text" width={40} height={16} />
          <Skeleton variant="text" width={40} height={16} />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width="50%" height={14} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
};

const TweetCard: React.FC<TweetCardProps> = ({ 
  tweet, 
  layout = 'expanded',
  isLoading = false,
  showActions = true,
  onLike,
  onRetweet,
  onShare
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [localLikes, setLocalLikes] = useState(tweet.likes);
  const [localRetweets, setLocalRetweets] = useState(tweet.retweets);

  if (isLoading) {
    return <TweetCardSkeleton layout={layout} />;
  }

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace menos de 1h';
    if (diffInHours < 24) return `hace ${diffInHours}h`;
    if (diffInHours < 48) return 'hace 1 día';
    
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
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Manejar acciones interactivas
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLocalLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(tweet.tweet_id);
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetweeted(!isRetweeted);
    setLocalRetweets(prev => isRetweeted ? prev - 1 : prev + 1);
    onRetweet?.(tweet.tweet_id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(tweet.tweet_id);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determinar altura basada en layout
  const getCardHeight = () => {
    switch (layout) {
      case 'compact': return 140;
      case 'expanded': return isExpanded ? 'auto' : 300;
      case 'full': return 'auto';
      default: return 'auto';
    }
  };

  // Truncar texto basado en layout
  const getTruncatedText = () => {
    const maxLength = layout === 'compact' ? 100 : layout === 'expanded' ? 200 : 500;
    if (tweet.texto.length <= maxLength || isExpanded) return tweet.texto;
    return tweet.texto.substring(0, maxLength) + '...';
  };

  return (
    <Grow in={true} timeout={300}>
      <Card
        sx={{
          height: getCardHeight(),
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          overflow: 'hidden',
          cursor: layout !== 'full' ? 'pointer' : 'default',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            '& .tweet-actions': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${categoryColor.border}, ${alpha(categoryColor.border, 0.6)})`,
            opacity: 0.8
          }
        }}
        onClick={layout !== 'full' ? handleExpand : undefined}
      >
        <CardContent sx={{ flex: 1, p: layout === 'compact' ? 2 : 2.5 }}>
          {/* Header con usuario y categoría */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: layout === 'compact' ? 1 : 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography 
                    variant={layout === 'compact' ? 'caption' : 'subtitle2'} 
                    fontWeight="bold" 
                    color="text.primary"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    @{tweet.usuario}
                  </Typography>
                  {tweet.verified && (
                    <Tooltip title="Cuenta verificada">
                      <Verified sx={{ 
                        fontSize: layout === 'compact' ? 14 : 16, 
                        color: '#1da1f2',
                        flexShrink: 0
                      }} />
                    </Tooltip>
                  )}
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: layout === 'compact' ? '0.65rem' : '0.75rem'
                  }}
                >
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
                fontSize: layout === 'compact' ? '0.65rem' : '0.75rem',
                height: layout === 'compact' ? 20 : 24,
                flexShrink: 0,
                ml: 1
              }}
            />
          </Box>

          {/* Contenido del tweet */}
          <Typography
            variant={layout === 'compact' ? 'caption' : 'body2'}
            color="text.primary"
            sx={{
              mb: layout === 'compact' ? 1 : 2,
              lineHeight: 1.5,
              ...(layout !== 'full' && !isExpanded && {
                display: '-webkit-box',
                WebkitLineClamp: layout === 'compact' ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              })
            }}
          >
            {getTruncatedText()}
          </Typography>

          {/* Mostrar botón "Ver más" si el texto está truncado */}
          {tweet.texto.length > (layout === 'compact' ? 100 : 200) && !isExpanded && layout !== 'full' && (
            <Button
              size="small"
              sx={{ 
                p: 0, 
                minWidth: 'auto',
                color: theme.palette.primary.main,
                fontSize: '0.75rem',
                mb: 1
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
              }}
            >
              Ver más
            </Button>
          )}

          {/* Trend relacionado - solo en expanded y full */}
          {layout !== 'compact' && (
            <Fade in={true} timeout={500}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                  Trending: {tweet.trend_clean}
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Métricas del tweet */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: layout === 'compact' ? 2 : 3, 
            mb: layout === 'compact' ? 1 : 2 
          }}>
            <Tooltip title={`${localLikes} likes`}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  cursor: showActions ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': showActions ? {
                    backgroundColor: alpha('#e91e63', 0.1),
                    transform: 'scale(1.05)'
                  } : {}
                }}
                onClick={showActions ? handleLike : undefined}
              >
                {showActions && isLiked ? (
                  <Favorite sx={{ fontSize: layout === 'compact' ? 14 : 16, color: '#e91e63' }} />
                ) : (
                  <FavoriteBorder sx={{ fontSize: layout === 'compact' ? 14 : 16, color: '#e91e63' }} />
                )}
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: layout === 'compact' ? '0.65rem' : '0.75rem',
                    fontWeight: isLiked ? 'bold' : 'normal'
                  }}
                >
                  {formatNumber(localLikes)}
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title={`${localRetweets} retweets`}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  cursor: showActions ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': showActions ? {
                    backgroundColor: alpha('#4caf50', 0.1),
                    transform: 'scale(1.05)'
                  } : {}
                }}
                onClick={showActions ? handleRetweet : undefined}
              >
                <Repeat sx={{ 
                  fontSize: layout === 'compact' ? 14 : 16, 
                  color: isRetweeted ? '#4caf50' : '#666',
                  fontWeight: isRetweeted ? 'bold' : 'normal'
                }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: layout === 'compact' ? '0.65rem' : '0.75rem',
                    fontWeight: isRetweeted ? 'bold' : 'normal'
                  }}
                >
                  {formatNumber(localRetweets)}
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title={`${tweet.replies} respuestas`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ChatBubbleOutline sx={{ fontSize: layout === 'compact' ? 14 : 16, color: '#2196f3' }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: layout === 'compact' ? '0.65rem' : '0.75rem' }}
                >
                  {formatNumber(tweet.replies)}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* Footer con acciones - solo en expanded y full */}
          {layout !== 'compact' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.disabled">
                Capturado: {formatDate(tweet.fecha_captura)}
              </Typography>
              
              <Box 
                className="tweet-actions"
                sx={{ 
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0,
                  transform: 'translateY(5px)',
                  transition: 'all 0.2s ease'
                }}
              >
                {showActions && (
                  <>
                    <Tooltip title="Compartir">
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }
                        }}
                        onClick={handleShare}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Guardar">
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main
                          }
                        }}
                      >
                        <BookmarkBorder fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                
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
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.1)'
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Launch fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

export default TweetCard; 