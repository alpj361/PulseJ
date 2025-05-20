import { Box, Typography, Chip, Stack, Paper, IconButton, Collapse, List, ListItem, ListItemText, Divider, Avatar } from '@mui/material';
import { FaHashtag, FaUser, FaRegNewspaper } from "react-icons/fa";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import type { IconType } from "react-icons";
import React, { useState } from 'react';

// Definir tipos para las props
interface ActivityCardProps {
  value: string;
  type: "Hashtag" | "Usuario" | "News";
  created_at: string;
  sentimiento: "positivo" | "negativo" | "neutral";
}

// Estructura esperada para los tweets en JSON
interface Tweet {
  id: string;
  text?: string;
  contenido?: string;
  created_at?: string;
  fecha?: string;
  sentiment?: "positivo" | "negativo" | "neutral";
  sentimiento?: "positivo" | "negativo" | "neutral";
  tipo?: string;
  user?: {
    name: string;
    username: string;
    profile_image_url?: string | null;
  };
  usuario?: string;
  fuente?: string;
  metrics?: {
    likes?: number;
    replies?: number;
    reposts?: number;
    views?: number;
  };
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
  };
}

// Estructura completa del JSON
interface HashtagData {
  meta: {
    hashtag: string;
    count: number;
    total_tweets?: number;
    trending_score?: number;
    related_topics?: string[];
    sentiment_summary?: {
      positive?: number;
      negative?: number;
      neutral?: number;
      positivo?: number;
      negativo?: number;
    };
    created_at?: string;
    date_captured?: string;
  };
  tweets: Tweet[];
}

const typeIcons: Record<string, IconType> = {
  Hashtag: FaHashtag,
  Usuario: FaUser,
  News: FaRegNewspaper,
};

const typeColors: Record<string, string> = {
  Hashtag: "#3b82f6", // azul
  Usuario: "#8b5cf6", // morado
  News: "#ef4444", // rojo
};

const sentimentMap: Record<string, { color: string; emoji: string }> = {
  positivo: { color: "#dcfce7", emoji: "😃" },
  negativo: { color: "#fee2e2", emoji: "😡" },
  neutral: { color: "#f3f4f6", emoji: "😐" },
};

// Función para extraer el hashtag del valor (si es JSON)
const extractHashtag = (value: string): string => {
  try {
    // Intentar parsear como JSON
    const parsedData = JSON.parse(value);
    
    // Si es la nueva estructura con meta y tweets
    if (parsedData.meta && parsedData.meta.hashtag) {
      return `#${parsedData.meta.hashtag}`;
    }
    
    // Si el valor es un array, buscar hashtags en el texto (para compatibilidad con formato anterior)
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      // Verificar si es la estructura específica que vemos en el CSV
      if (parsedData[0].tipo === "tweet" && parsedData[0].contenido) {
        const hashtagMatch = parsedData[0].contenido.match(/#(\w+)/);
        if (hashtagMatch) {
          return hashtagMatch[0];
        }
      }
      
      // Buscar otras estructuras posibles
      if (parsedData[0].hashtag) {
        return `#${parsedData[0].hashtag}`;
      } else if (parsedData[0].query) {
        return `#${parsedData[0].query}`;
      } else if (typeof parsedData[0] === 'object' && (parsedData[0].text || parsedData[0].contenido)) {
        const content = parsedData[0].text || parsedData[0].contenido;
        const hashtagMatch = content.match(/#(\w+)/);
        if (hashtagMatch) {
          return hashtagMatch[0];
        }
      }
    }
    
    // Si hay un campo raw_data, también intentar procesarlo
    if (typeof parsedData === 'object' && parsedData.raw_data) {
      try {
        const rawData = JSON.parse(parsedData.raw_data);
        if (rawData.hashtag) {
          return `#${rawData.hashtag}`;
        }
      } catch (e) {
        // Si no se puede parsear raw_data, ignorar
      }
    }
    
    // Si no podemos extraer un hashtag, devolver un valor predeterminado
    return "#Tendencia";
  } catch (e) {
    // Si no es JSON, devolver el valor original
    return value.startsWith('#') ? value : `#${value}`;
  }
};

// Función para normalizar un tweet al formato esperado
const normalizeTweet = (tweet: any): Tweet => {
  // Extraer nombre de usuario y handle de formato "Nombre@handle"
  let userName = "Usuario";
  let userHandle = "usuario";
  
  if (tweet.usuario && tweet.usuario.includes('@')) {
    const userParts = tweet.usuario.split('@');
    userName = userParts[0].trim();
    userHandle = userParts[1].trim();
  }

  // Construir objeto de métricas
  let metrics = {};
  if (tweet.metrics) {
    metrics = tweet.metrics;
  } else if (tweet.engagement) {
    metrics = {
      likes: tweet.engagement.likes,
      replies: tweet.engagement.replies,
      reposts: tweet.engagement.retweets,
      views: tweet.engagement.views
    };
  }
  
  return {
    id: tweet.id || `tweet-${Math.random().toString(36).substr(2, 9)}`,
    text: tweet.contenido || tweet.text || "Sin contenido",
    created_at: tweet.fecha || tweet.created_at || new Date().toISOString(),
    sentiment: tweet.sentimiento || tweet.sentiment || "neutral",
    user: {
      name: userName,
      username: userHandle,
      profile_image_url: null
    },
    metrics: metrics
  };
};

// Función para extraer tweets del valor JSON
const extractTweets = (value: string): Tweet[] => {
  try {
    const parsedData = JSON.parse(value);
    
    // Si es la nueva estructura con meta y tweets
    if (parsedData.meta && Array.isArray(parsedData.tweets)) {
      // Normalizar cada tweet al formato esperado
      return parsedData.tweets.map(normalizeTweet);
    }
    
    // Compatibilidad con formatos anteriores
    if (Array.isArray(parsedData)) {
      // Verificar si los elementos tienen la estructura esperada (datos del CSV)
      if (parsedData.length > 0 && parsedData[0].tipo === "tweet") {
        return parsedData.map(normalizeTweet);
      }
      
      // Estructura alternativa (formato general)
      return parsedData.map(item => {
        // Normalizar los datos para asegurarnos de que tienen la estructura esperada
        return {
          id: item.id || item.tweet_id || `tweet-${Math.random().toString(36).substr(2, 9)}`,
          text: item.text || item.content || item.contenido || item.tweet || "Sin contenido",
          created_at: item.created_at || item.fecha || new Date().toISOString(),
          sentiment: item.sentiment || item.sentimiento || "neutral",
          user: {
            name: item.user?.name || (item.usuario?.includes('@') ? item.usuario.split('@')[0] : "Usuario") || item.author || "Usuario",
            username: item.user?.username || (item.usuario?.includes('@') ? item.usuario.split('@')[1] : "usuario") || item.user_id || "usuario",
            profile_image_url: item.user?.profile_image_url || null
          },
          metrics: item.metrics || item.engagement || {}
        };
      });
    }
    
    return [];
  } catch (e) {
    console.error("Error al extraer tweets:", e);
    return [];
  }
};

// Función para extraer información de sentimiento y recuento
const extractSentimentSummary = (value: string): { 
  positiveCount: number; 
  negativeCount: number; 
  neutralCount: number;
  totalCount: number;
  trendingScore?: number;
  relatedTopics?: string[];
} => {
  try {
    const parsedData = JSON.parse(value);
    
    // Si es la nueva estructura con meta y tweets
    if (parsedData.meta) {
      let positive = 0, negative = 0, neutral = 0;
      if (parsedData.meta.sentiment_summary) {
        // Manejar diferentes formatos de nombres de campo
        positive = parsedData.meta.sentiment_summary.positive || parsedData.meta.sentiment_summary.positivo || 0;
        negative = parsedData.meta.sentiment_summary.negative || parsedData.meta.sentiment_summary.negativo || 0;
        neutral = parsedData.meta.sentiment_summary.neutral || 0;
      }
      
      const totalCount = parsedData.meta.count || parsedData.meta.total_tweets || (positive + negative + neutral);
      
      return {
        positiveCount: positive,
        negativeCount: negative,
        neutralCount: neutral,
        totalCount,
        trendingScore: parsedData.meta.trending_score,
        relatedTopics: parsedData.meta.related_topics
      };
    }
    
    // Si no hay estructura de sentimiento, calcular basado en los tweets
    const tweets = extractTweets(value);
    const positiveCount = tweets.filter(t => t.sentiment === "positivo").length;
    const negativeCount = tweets.filter(t => t.sentiment === "negativo").length;
    const neutralCount = tweets.filter(t => t.sentiment === "neutral" || !t.sentiment).length;
    
    return {
      positiveCount,
      negativeCount,
      neutralCount,
      totalCount: tweets.length
    };
  } catch (e) {
    return {
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalCount: 0
    };
  }
};

// Componente principal
const ActivityCard = ({ value, type, created_at, sentimiento }: ActivityCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const icon = typeIcons[type] || FaRegNewspaper;
  const accentColor = typeColors[type] || "#9ca3af";
  const sentiment = sentimentMap[sentimiento] || sentimentMap["neutral"];
  
  // Extraer información
  const displayHashtag = type === "Hashtag" ? extractHashtag(value) : value;
  const tweets = type === "Hashtag" ? extractTweets(value) : [];
  const { positiveCount, negativeCount, neutralCount, totalCount, trendingScore, relatedTopics } = 
    type === "Hashtag" ? extractSentimentSummary(value) : { positiveCount: 0, negativeCount: 0, neutralCount: 0, totalCount: 0 };
  
  // Verificar si hay tweets con métricas
  const hasMetrics = tweets.some(tweet => 
    (tweet.metrics && (tweet.metrics.likes || tweet.metrics.reposts || tweet.metrics.replies)) ||
    (tweet.engagement && (tweet.engagement.likes || tweet.engagement.retweets || tweet.engagement.replies))
  );
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        p: 0,
        position: 'relative',
        height: '100%',
        borderLeft: `6px solid ${accentColor}`,
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      {/* Header section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 1
        }}>
          {/* Emoji de sentimiento */}
          <Box 
            sx={{ 
              fontSize: '28px', 
              backgroundColor: sentiment.color,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            {sentiment.emoji}
          </Box>
          
          {/* Icono de tipo y botón expandir */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Icono de tipo */}
            <Box 
              sx={{ 
                color: accentColor,
                fontSize: '20px',
                mr: 1,
                position: 'relative'
              }}
            >
              {React.createElement(icon)}
              {/* Indicador de número de tweets */}
              {type === "Hashtag" && tweets.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    bgcolor: accentColor,
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  {totalCount || tweets.length}
                </Box>
              )}
            </Box>
            
            {/* Botón expandir (solo si hay tweets) */}
            {type === "Hashtag" && tweets.length > 0 && (
              <IconButton 
                size="small" 
                onClick={toggleExpand}
                sx={{ 
                  color: accentColor,
                  transition: 'transform 0.3s',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                {expanded ? <IoChevronUp /> : <IoChevronDown />}
              </IconButton>
            )}
          </Box>
        </Box>
        
        {/* Valor principal (hashtag) */}
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          sx={{ 
            mb: 1, 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayHashtag}
        </Typography>
        
        {/* Trending score si está disponible */}
        {trendingScore && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'inline-block', 
              bgcolor: '#f0f9ff', 
              px: 1, 
              py: 0.5, 
              borderRadius: 1,
              mb: 1,
              color: '#0369a1'
            }}
          >
            Trending: {trendingScore}/100
          </Typography>
        )}
        
        {/* Temas relacionados */}
        {relatedTopics && relatedTopics.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {relatedTopics.map((topic, index) => (
              <Chip 
                key={index}
                label={`#${topic}`} 
                size="small"
                sx={{ 
                  bgcolor: '#f1f5f9', 
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
          </Box>
        )}
        
        {/* Resumen de sentimientos */}
        {type === "Hashtag" && (positiveCount > 0 || negativeCount > 0 || neutralCount > 0) && (
          <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {positiveCount > 0 && (
              <Chip 
                size="small" 
                label={`😃 ${positiveCount}`} 
                sx={{ bgcolor: sentimentMap.positivo.color, fontSize: '0.75rem' }}
              />
            )}
            {negativeCount > 0 && (
              <Chip 
                size="small" 
                label={`😡 ${negativeCount}`} 
                sx={{ bgcolor: sentimentMap.negativo.color, fontSize: '0.75rem' }}
              />
            )}
            {neutralCount > 0 && (
              <Chip 
                size="small" 
                label={`😐 ${neutralCount}`} 
                sx={{ bgcolor: sentimentMap.neutral.color, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="caption" color="text.secondary">
            {new Date(created_at).toLocaleString()}
          </Typography>
          <Chip 
            label={type} 
            size="small"
            sx={{ 
              backgroundColor: `${accentColor}20`, // 20% opacidad
              color: accentColor,
              fontWeight: 600,
            }} 
          />
        </Stack>
        
        {/* Hint para expandir (solo visible si hay tweets y no está expandido) */}
        {type === "Hashtag" && tweets.length > 0 && !expanded && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'text.secondary',
              fontSize: '0.7rem',
              opacity: 0.8,
              fontStyle: 'italic'
            }}
          >
            Clic en ↓ para ver {tweets.length} tweets
          </Typography>
        )}
      </Box>
      
      {/* Tweets expandibles */}
      {type === "Hashtag" && tweets.length > 0 && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider />
          <List 
            sx={{ 
              maxHeight: 300, 
              overflow: 'auto',
              p: 0, 
              bgcolor: 'background.paper'
            }}
          >
            {tweets.map((tweet, index) => {
              const tweetSentiment = sentimentMap[tweet.sentiment || "neutral"] || sentimentMap["neutral"];
              
              return (
                <React.Fragment key={tweet.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      py: 1.5, 
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      {/* Avatar o emoji de sentimiento */}
                      <Avatar 
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          mr: 1.5,
                          bgcolor: tweetSentiment.color,
                          fontSize: '1.2rem'
                        }}
                        src={tweet.user?.profile_image_url || undefined}
                      >
                        {!tweet.user?.profile_image_url && tweetSentiment.emoji}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        {/* Nombre de usuario */}
                        <Typography 
                          variant="subtitle2" 
                          component="span"
                          sx={{ fontWeight: 'bold', mr: 0.5 }}
                        >
                          {tweet.user?.name || "Usuario"}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          component="span"
                          color="text.secondary"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          @{tweet.user?.username || "usuario"}
                        </Typography>
                        
                        {/* Texto del tweet */}
                        <Typography 
                          variant="body2" 
                          component="p"
                          sx={{ mt: 0.5, wordBreak: 'break-word' }}
                        >
                          {tweet.text}
                        </Typography>
                        
                        {/* Métricas del tweet si están disponibles */}
                        {tweet.metrics && (
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            {tweet.metrics.likes !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                ❤️ {tweet.metrics.likes}
                              </Typography>
                            )}
                            {tweet.metrics.replies !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                💬 {tweet.metrics.replies}
                              </Typography>
                            )}
                            {tweet.metrics.reposts !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                🔄 {tweet.metrics.reposts}
                              </Typography>
                            )}
                            {tweet.metrics.views !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                👁️ {tweet.metrics.views}
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          {/* Fecha del tweet */}
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {new Date(tweet.created_at || "").toLocaleString()}
                          </Typography>
                          
                          {/* Fuente del tweet si está disponible */}
                          {tweet.fuente && (
                            <Chip
                              label={tweet.fuente}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: 'action.selected',
                                color: 'text.secondary'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < tweets.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        </Collapse>
      )}
    </Paper>
  );
};

// Exportar también como exportación nombrada para mantener compatibilidad
export { ActivityCard };

// Exportación por defecto
export default ActivityCard;