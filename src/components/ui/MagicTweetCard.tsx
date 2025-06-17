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
  OpenInNew,
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
const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
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
}

export function MagicTweetCard(props: MagicTweetCardProps) {
  const { 
    tweet, 
    layout = 'expanded'
  } = props;

  const theme = useTheme();

  // Solo usar los datos si existen, no valores por defecto
  const sentimiento = tweet.sentimiento;
  const intencionComunicativa = tweet.intencion_comunicativa;
  
  // Usar la categoría real de la base de datos o 'General' como fallback
  const categoria = tweet.categoria || 'General';
  const categoryColor = getCategoryColor(categoria);

  const handleViewTweet = (e: any) => {
    e.stopPropagation();
    // Abrir el tweet original si tiene enlace
    if (tweet.enlace) {
      // Convertir enlaces de nitter a x.com
      let finalUrl = tweet.enlace;
      if (tweet.enlace.includes('nitter.')) {
        // Extraer la parte después del dominio de nitter
        const urlParts = tweet.enlace.split('/');
        const domainIndex = urlParts.findIndex(part => part.includes('nitter.'));
        if (domainIndex !== -1 && urlParts.length > domainIndex + 1) {
          // Reconstruir URL con x.com
          const pathAfterDomain = urlParts.slice(domainIndex + 1).join('/');
          finalUrl = `https://x.com/${pathAfterDomain}`;
        }
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Construir URL de Twitter con el tweet_id
      const xUrl = `https://x.com/i/status/${tweet.tweet_id}`;
      window.open(xUrl, '_blank', 'noopener,noreferrer');
    }
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
                <Box>
                  <Tooltip title="Respuestas">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <ChatBubbleOutline sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{formatNumber(tweet.replies)}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
                
                <Box>
                  <Tooltip title="Retweets">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <Repeat sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{formatNumber(tweet.retweets)}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
                
                <Box>
                  <Tooltip title="Me gusta">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <FavoriteBorder sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{formatNumber(tweet.likes)}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
                
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip title="Ver Tweet">
                    <Box 
                      onClick={handleViewTweet}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5, 
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: theme.palette.primary.dark
                        }
                      }}
                    >
                      <OpenInNew sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>Ver original</Typography>
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