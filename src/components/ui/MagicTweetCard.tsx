import React, { useCallback, useEffect, useState } from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Repeat,
  ChatBubbleOutline,
  Share,
  Verified
} from '@mui/icons-material';

// Definimos una interfaz más flexible para MagicTweetCard
interface MagicTweetData {
  id: number;
  tweet_id: string;
  usuario: string;
  fecha_tweet: string | null;
  texto: string;
  likes: number;
  retweets: number;
  replies: number;
  verified?: boolean;
  categoria: 'Política' | 'Económica' | 'Sociales' | 'General';
  sentimiento?: 'positivo' | 'negativo' | 'neutral';
  intencion_comunicativa?: string;
  score_sentimiento?: number;
  propagacion_viral?: string;
  location?: string;
  fecha_captura?: string;
  enlace?: string | null;
}

// Componente MagicCard que crea el efecto de gradiente mágico
export function MagicCard(props: any) {
  const {
    children,
    gradientSize = 200,
    gradientColor = "#262626",
    gradientOpacity = 0.3,
    ...otherProps
  } = props;

  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const handleMouseMove = useCallback(
    (e: any) => {
      const { left, top } = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    },
    [mouseX, mouseY],
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  useEffect(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  return (
    <Box
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        cursor: 'pointer',
        '&:hover .magic-overlay': {
          opacity: gradientOpacity,
        }
      }}
      {...otherProps}
    >
      <Box sx={{ position: 'relative', zIndex: 10, width: '100%' }}>
        {children}
      </Box>
      <motion.div
        className="magic-overlay"
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          borderRadius: 12,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
          `,
        }}
      />
    </Box>
  )
}

// Funciones utilitarias
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getCategoryColor = (categoria: string) => {
  switch (categoria) {
    case 'Política':
      return "#9c27b0";
    case 'Económica':
      return "#4caf50";
    case 'Sociales':
      return "#2196f3";
    default:
      return "#9e9e9e";
  }
};

const getEmotionEmoji = (sentimiento?: string) => {
  switch (sentimiento) {
    case 'positivo':
      return '😊';
    case 'negativo':
      return '😔';
    default:
      return '😐';
  }
};

const getIntentionIcon = (intencion: string) => {
  switch (intencion) {
    case 'informativo':
      return '📊';
    case 'opinativo':
      return '💭';
    case 'humoristico':
      return '😄';
    case 'alarmista':
      return '⚠️';
    case 'critico':
      return '🔍';
    case 'promocional':
      return '📢';
    case 'conversacional':
      return '💬';
    case 'protesta':
      return '✊';
    default:
      return '📝';
  }
};

// Componente principal MagicTweetCard
interface MagicTweetCardProps {
  tweet: MagicTweetData;
  layout?: 'compact' | 'expanded' | 'full';
  onLike?: (tweetId: string) => void;
  onRetweet?: (tweetId: string) => void;
  onShare?: (tweetId: string) => void;
}

export function MagicTweetCard(props: MagicTweetCardProps) {
  const { 
    tweet, 
    layout = 'expanded',
    onLike,
    onRetweet,
    onShare
  } = props;

  const theme = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [localLikes, setLocalLikes] = useState(tweet.likes);
  const [localRetweets, setLocalRetweets] = useState(tweet.retweets);

  // Solo usar los datos si existen, no valores por defecto
  const sentimiento = tweet.sentimiento;
  const intencionComunicativa = tweet.intencion_comunicativa;
  
  // Usar la categoría real de la base de datos o 'General' como fallback
  const categoria = tweet.categoria || 'General';
  const categoryColor = getCategoryColor(categoria);

  const handleLike = (e: any) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLocalLikes((prev: number) => isLiked ? prev - 1 : prev + 1);
    onLike?.(tweet.tweet_id);
  };

  const handleRetweet = (e: any) => {
    e.stopPropagation();
    setIsRetweeted(!isRetweeted);
    setLocalRetweets((prev: number) => isRetweeted ? prev - 1 : prev + 1);
    onRetweet?.(tweet.tweet_id);
  };

  const handleShare = (e: any) => {
    e.stopPropagation();
    onShare?.(tweet.tweet_id);
  };

  // Extract username from the usuario field - handle various formats
  const extractUsername = (usuario: string) => {
    if (!usuario) return '@usuario';
    
    // Si ya tiene @, buscar el patrón completo
    const atMatch = usuario.match(/@([^\s]+)/);
    if (atMatch) {
      return `@${atMatch[1]}`;
    }
    
    // Si no tiene @, asumir que el campo usuario es solo el nombre de usuario
    // Limpiar espacios y caracteres especiales
    const cleanUsername = usuario.trim().replace(/[^\w.-]/g, '');
    return cleanUsername ? `@${cleanUsername}` : '@usuario';
  };



  return (
    <MagicCard gradientColor={categoryColor}>
      <Card 
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          bgcolor: 'background.paper',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <CardContent sx={{ p: 3, flexGrow: 1 }}>
          <Box sx={{ width: '100%' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {extractUsername(tweet.usuario)}
                </Typography>
                {tweet.verified && (
                  <Verified sx={{ fontSize: 16, color: '#1976d2' }} />
                )}
              </Box>
              
              {/* Category and Emotion Badges */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={categoria}
                  size="small"
                  sx={{ 
                    bgcolor: categoryColor + '20',
                    color: categoryColor,
                    border: `1px solid ${categoryColor}40`,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                />
                
                {sentimiento && (
                  <Chip 
                    label={`${getEmotionEmoji(sentimiento)} ${sentimiento}`}
                    size="small"
                    sx={{ 
                      bgcolor: sentimiento === 'positivo' 
                        ? '#4caf5020' 
                        : sentimiento === 'negativo' 
                        ? '#f4433620' 
                        : '#9e9e9e20',
                      color: sentimiento === 'positivo' 
                        ? '#4caf50' 
                        : sentimiento === 'negativo' 
                        ? '#f44336' 
                        : '#9e9e9e',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                )}
                
                {intencionComunicativa && (
                  <Chip 
                    label={`${getIntentionIcon(intencionComunicativa)} ${intencionComunicativa}`}
                    size="small"
                    sx={{ 
                      bgcolor: '#2196f320',
                      color: '#2196f3',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                )}
              </Box>
              
              {/* Tweet Content */}
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2, 
                  lineHeight: 1.5,
                  color: 'text.primary',
                  fontWeight: 400
                }}
              >
                {layout === 'compact' 
                  ? tweet.texto.substring(0, 140) + (tweet.texto.length > 140 ? '...' : '')
                  : tweet.texto}
              </Typography>
              
              {/* Engagement Stats */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip title="Respuestas">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', cursor: 'pointer' }}>
                      <ChatBubbleOutline sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{formatNumber(tweet.replies)}</Typography>
                    </Box>
                  </Tooltip>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip title="Retweets">
                    <Box 
                      onClick={handleRetweet}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        color: isRetweeted ? '#4caf50' : 'text.secondary',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <Repeat sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{formatNumber(localRetweets)}</Typography>
                    </Box>
                  </Tooltip>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip title="Me gusta">
                    <Box 
                      onClick={handleLike}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        color: isLiked ? '#f44336' : 'text.secondary',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {isLiked ? <Favorite sx={{ fontSize: 16 }} /> : <FavoriteBorder sx={{ fontSize: 16 }} />}
                      <Typography variant="caption">{formatNumber(localLikes)}</Typography>
                    </Box>
                  </Tooltip>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip title="Compartir">
                    <Box 
                      onClick={handleShare}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        color: 'text.secondary',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <Share sx={{ fontSize: 16 }} />
                    </Box>
                  </Tooltip>
                </motion.div>
              </Box>

              {/* Additional metadata for full layout */}
              {layout === 'full' && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tweet.score_sentimiento && (
                      <Typography variant="caption" color="text.secondary">
                        Sentimiento: {(tweet.score_sentimiento * 100).toFixed(1)}%
                      </Typography>
                    )}
                    {tweet.propagacion_viral && (
                      <Typography variant="caption" color="text.secondary">
                        Propagación: {tweet.propagacion_viral}
                      </Typography>
                    )}
                    {tweet.location && (
                      <Typography variant="caption" color="text.secondary">
                        Ubicación: {tweet.location}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
          </Box>
        </CardContent>
      </Card>
    </MagicCard>
  );
}

export default MagicTweetCard; 