import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  useTheme,
  Button,
  Stack,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  Twitter, 
  TrendingUp, 
  ViewModule, 
  ViewList, 
  ViewComfy, 
  Refresh,
  Sort
} from '@mui/icons-material';
import TweetCard from './TweetCard';
import { MagicTweetCard } from './MagicTweetCard';
import { getTrendingTweets, getTweetStatsByCategory } from '../../services/supabase';
import { TrendingTweet } from '../../types';
import { LanguageContext } from '../../context/LanguageContext';

const translations = {
  es: {
    title: 'Lo que pasa en las redes',
    subtitle: 'Tweets relacionados con los temas más populares de las últimas 24 horas',
    loading: 'Cargando tweets...',
    noTweets: 'No hay tweets disponibles',
    noTweetsDesc: 'No se encontraron tweets para la categoría seleccionada en las últimas 24 horas.',
    allCategories: 'Todas',
    categories: {
      'Política': 'Política',
      'Económica': 'Económica', 
      'Sociales': 'Sociales',
      'General': 'General'
    },
    layoutCompact: 'Vista compacta',
    layoutExpanded: 'Vista expandida',
    layoutFull: 'Vista completa',
    sortByDate: 'Por fecha',
    sortByLikes: 'Por likes',
    sortByRetweets: 'Por retweets',
    refreshData: 'Actualizar datos',
    tweetLiked: 'Tweet marcado como favorito',
    tweetRetweeted: 'Tweet compartido',
    tweetShared: 'Tweet copiado al portapapeles'
  },
  en: {
    title: 'What\'s happening on social media',
    subtitle: 'Tweets related to the most popular topics in the last 24 hours',
    loading: 'Loading tweets...',
    noTweets: 'No tweets available',
    noTweetsDesc: 'No tweets found for the selected category in the last 24 hours.',
    allCategories: 'All',
    categories: {
      'Política': 'Politics',
      'Económica': 'Economic',
      'Sociales': 'Social',
      'General': 'General'
    },
    layoutCompact: 'Compact view',
    layoutExpanded: 'Expanded view',
    layoutFull: 'Full view',
    sortByDate: 'By date',
    sortByLikes: 'By likes',
    sortByRetweets: 'By retweets',
    refreshData: 'Refresh data',
    tweetLiked: 'Tweet liked',
    tweetRetweeted: 'Tweet retweeted',
    tweetShared: 'Tweet copied to clipboard'
  }
};

type LayoutType = 'compact' | 'expanded' | 'full';
type SortType = 'date' | 'likes' | 'retweets';

const TrendingTweetsSection: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  const [tweets, setTweets] = useState<TrendingTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [layout, setLayout] = useState<LayoutType>('expanded');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadTweets();
    loadCategoryStats();
  }, [selectedCategory, sortBy]);

  const loadTweets = async () => {
    setLoading(true);
    try {
      const categoria = selectedCategory === 'all' ? undefined : selectedCategory;
      // Obtener 150 tweets para las métricas mejoradas
      const tweetsData = await getTrendingTweets(150, categoria);
      
      // Ordenar tweets según el criterio seleccionado
      const sortedTweets = [...tweetsData].sort((a, b) => {
        switch (sortBy) {
          case 'likes':
            return b.likes - a.likes;
          case 'retweets':
            return b.retweets - a.retweets;
          case 'date':
          default:
            return new Date(b.fecha_tweet || b.fecha_captura).getTime() - 
                   new Date(a.fecha_tweet || a.fecha_captura).getTime();
        }
      });
      
      setTweets(sortedTweets as any);
    } catch (error) {
      console.error('Error loading tweets:', error);
      setTweets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const stats = await getTweetStatsByCategory();
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading category stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTweets();
    await loadCategoryStats();
    setRefreshing(false);
    showSnackbar('Datos actualizados', 'success');
  };

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: string
  ) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
    }
  };

  const handleLayoutChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLayout: LayoutType
  ) => {
    if (newLayout !== null) {
      setLayout(newLayout);
    }
  };

  const handleSortChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSort: SortType
  ) => {
    if (newSort !== null) {
      setSortBy(newSort);
    }
  };

  // Funciones para acciones de tweet
  const handleTweetLike = (tweetId: string) => {
    console.log('Liked tweet:', tweetId);
    showSnackbar(t.tweetLiked, 'success');
  };

  const handleTweetRetweet = (tweetId: string) => {
    console.log('Retweeted tweet:', tweetId);
    showSnackbar(t.tweetRetweeted, 'success');
  };

  const handleTweetShare = async (tweetId: string) => {
    const tweet = tweets.find(t => t.tweet_id === tweetId);
    if (tweet?.enlace) {
      try {
        await navigator.clipboard.writeText(tweet.enlace);
        showSnackbar(t.tweetShared, 'success');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        showSnackbar('Error al copiar enlace', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const categories = ['all', 'Política', 'Económica', 'Sociales', 'General'];

  // Configurar grid según layout
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
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          pointerEvents: 'none'
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
          pointerEvents: 'none'
        }}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, position: 'relative', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <Twitter sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.7)})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {t.title}
              <TrendingUp sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            </Typography>
          </Box>
        </Box>
        
        {/* Refresh Button */}
        <Tooltip title={t.refreshData}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                border: `1px solid ${theme.palette.primary.main}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            {refreshing ? 'Actualizando...' : t.refreshData}
          </Button>
        </Tooltip>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, position: 'relative' }}
      >
        {t.subtitle}
      </Typography>

      {/* Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {/* Category Filter */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Categorías
          </Typography>
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={handleCategoryChange}
            aria-label="category filter"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                color: theme.palette.text.secondary,
                textTransform: 'none',
                fontWeight: 'medium',
                px: 1.5,
                py: 0.5,
                fontSize: '0.8rem',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.8)
                  }
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }
            }}
          >
            {categories.map((category) => (
              <ToggleButton key={category} value={category}>
                {category === 'all' ? t.allCategories : t.categories[category as keyof typeof t.categories] || category}
                {categoryStats[category] && category !== 'all' && (
                  <Chip 
                    label={categoryStats[category]} 
                    size="small" 
                    sx={{ 
                      ml: 0.5, 
                      height: 16, 
                      fontSize: '0.65rem',
                      backgroundColor: alpha('#fff', 0.2),
                      color: 'inherit',
                      '& .MuiChip-label': { px: 0.5 }
                    }} 
                  />
                )}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Layout and Sort Controls */}
        <Stack direction="row" spacing={1}>
          {/* Layout Toggle */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Vista
            </Typography>
            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={handleLayoutChange}
              aria-label="layout"
              size="small"
            >
              <ToggleButton value="compact" aria-label={t.layoutCompact}>
                <Tooltip title={t.layoutCompact}>
                  <ViewModule />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="expanded" aria-label={t.layoutExpanded}>
                <Tooltip title={t.layoutExpanded}>
                  <ViewComfy />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="full" aria-label={t.layoutFull}>
                <Tooltip title={t.layoutFull}>
                  <ViewList />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Sort Toggle */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Ordenar
            </Typography>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={handleSortChange}
              aria-label="sort"
              size="small"
            >
              <ToggleButton value="date">
                <Tooltip title={t.sortByDate}>
                  <Typography variant="caption">Fecha</Typography>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="likes">
                <Tooltip title={t.sortByLikes}>
                  <Typography variant="caption">Likes</Typography>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="retweets">
                <Tooltip title={t.sortByRetweets}>
                  <Typography variant="caption">RT</Typography>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Stack>

      {/* Mini Metrics Cards */}
      {!loading && tweets.length > 0 && (() => {
        // Calcular métricas basadas en los tweets
        const totalTweets = tweets.length;
        const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.likes, 0);
        const totalRetweets = tweets.reduce((sum, tweet) => sum + tweet.retweets, 0);
        const totalReplies = tweets.reduce((sum, tweet) => sum + tweet.replies, 0);
        const avgEngagement = totalTweets > 0 ? (totalLikes + totalRetweets + totalReplies) / totalTweets : 0;

        // Análisis de sentimiento - solo incluir tweets que realmente tienen sentimiento
        const tweetsWithSentiment = tweets.filter(tweet => tweet.sentimiento && tweet.sentimiento !== null);
        const sentimentCounts = tweetsWithSentiment.reduce((acc, tweet) => {
          const sentiment = tweet.sentimiento!;
          acc[sentiment] = (acc[sentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const positiveCount = sentimentCounts.positivo || 0;
        const negativeCount = sentimentCounts.negativo || 0;
        const neutralCount = sentimentCounts.neutral || 0;
        const hasSentimentData = tweetsWithSentiment.length > 0;
        const dominantSentiment = hasSentimentData ? (
          positiveCount > negativeCount 
            ? (positiveCount > neutralCount ? 'positivo' : 'neutral')
            : (negativeCount > neutralCount ? 'negativo' : 'neutral')
        ) : null;

        // Análisis de intenciones - solo incluir tweets que realmente tienen intención
        const tweetsWithIntention = tweets.filter(tweet => tweet.intencion_comunicativa && tweet.intencion_comunicativa !== null);
        const intentionCounts = tweetsWithIntention.reduce((acc, tweet) => {
          const intention = tweet.intencion_comunicativa!;
          acc[intention] = (acc[intention] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const hasIntentionData = tweetsWithIntention.length > 0;
        const topIntention = hasIntentionData ? Object.entries(intentionCounts)
          .sort(([,a], [,b]) => b - a)[0] : null;

        return (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Engagement Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 2,
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                    Engagement Promedio
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {Math.round(avgEngagement)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(totalLikes + totalRetweets + totalReplies).toLocaleString()} interacciones totales
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {tweets.length} tweets analizados
                </Typography>
              </Paper>
            </Grid>

            {/* Sentiment Card - Solo mostrar si hay datos de sentimiento */}
            {hasSentimentData && dominantSentiment && (
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: dominantSentiment === 'positivo' 
                      ? `linear-gradient(135deg, ${alpha('#4caf50', 0.1)}, ${alpha('#4caf50', 0.05)})`
                      : dominantSentiment === 'negativo'
                      ? `linear-gradient(135deg, ${alpha('#f44336', 0.1)}, ${alpha('#f44336', 0.05)})`
                      : `linear-gradient(135deg, ${alpha('#9e9e9e', 0.1)}, ${alpha('#9e9e9e', 0.05)})`,
                    border: `1px solid ${dominantSentiment === 'positivo' 
                      ? alpha('#4caf50', 0.2)
                      : dominantSentiment === 'negativo'
                      ? alpha('#f44336', 0.2)
                      : alpha('#9e9e9e', 0.2)}`,
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ fontSize: '1.2rem' }}>
                      {dominantSentiment === 'positivo' ? '😊' : dominantSentiment === 'negativo' ? '😔' : '😐'}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" 
                      color={dominantSentiment === 'positivo' ? '#4caf50' : dominantSentiment === 'negativo' ? '#f44336' : '#9e9e9e'}
                    >
                      Sentimiento Dominante
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ textTransform: 'capitalize' }}>
                    {dominantSentiment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    +{positiveCount} | ={neutralCount} | -{negativeCount} ({tweetsWithSentiment.length} tweets)
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Intention Card - Solo mostrar si hay datos de intención */}
            {hasIntentionData && topIntention && (
              <Grid item xs={12} sm={hasIntentionData && hasSentimentData ? 12 : 6} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ fontSize: '1.2rem' }}>
                      {topIntention[0] === 'informativo' ? '📰' : 
                       topIntention[0] === 'opinativo' ? '💭' : 
                       topIntention[0] === 'humoristico' ? '😄' : 
                       topIntention[0] === 'critico' ? '❗' : 
                       topIntention[0] === 'alarmista' ? '⚠️' : 
                       topIntention[0] === 'promocional' ? '📢' : 
                       topIntention[0] === 'conversacional' ? '💬' : 
                       topIntention[0] === 'protesta' ? '✊' : '💭'}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                      Intención Principal
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ textTransform: 'capitalize' }}>
                    {topIntention[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {topIntention[1]} tweets ({Math.round((topIntention[1] / tweetsWithIntention.length) * 100)}%)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {tweetsWithIntention.length} tweets con intención
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );
      })()}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} thickness={4} />
            <Typography color="text.secondary">{t.loading}</Typography>
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!loading && tweets.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Twitter sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary">
            {t.noTweets}
          </Typography>
          <Typography color="text.disabled">
            {t.noTweetsDesc}
          </Typography>
        </Box>
      )}

      {/* Tweets Grid */}
      {!loading && tweets.length > 0 && (
        <Grid container spacing={layout === 'compact' ? 2 : 3}>
          {tweets.map((tweet, index) => (
            <Grid item {...getGridProps()} key={tweet.id}>
              <MagicTweetCard 
                tweet={tweet} 
                layout={layout}
                onLike={handleTweetLike}
                onRetweet={handleTweetRetweet}
                onShare={handleTweetShare}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TrendingTweetsSection; 