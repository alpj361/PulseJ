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
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  SmartToy,
  ViewModule, 
  ViewList, 
  ViewComfy, 
  Refresh,
  ExpandMore
} from '@mui/icons-material';
import RecentScrapeCard from './RecentScrapeCard';
import { getNitterTweets, getNitterTweetStats, getNitterTweetsByCategory, NitterTweet, NitterTweetStats } from '../../services/nitterTweets';
import { LanguageContext } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const translations = {
  es: {
    title: 'Tweets con Análisis de IA',
    subtitle: 'Tweets extraídos con nitter_context y analizados con inteligencia artificial',
    loading: 'Cargando tweets...',
    noTweets: 'No hay tweets disponibles',
    noTweetsDesc: 'No se encontraron tweets analizados para la categoría seleccionada.',
    allCategories: 'Todas',
    allSentiments: 'Todos',
    categories: {
      'Política': 'Política',
      'Económica': 'Económica', 
      'Sociales': 'Sociales',
      'General': 'General',
      'Tecnología': 'Tecnología',
      'Deportes': 'Deportes'
    },
    sentiments: {
      'positivo': 'Positivo',
      'negativo': 'Negativo',
      'neutral': 'Neutral'
    },
    intentions: {
      'informativo': 'Informativo',
      'opinativo': 'Opinativo',
      'promocional': 'Promocional',
      'conversacional': 'Conversacional',
      'humorous': 'Humorístico',
      'alarmista': 'Alarmista',
      'crítico': 'Crítico',
      'protesta': 'Protesta'
    },
    layoutCompact: 'Vista compacta',
    layoutExpanded: 'Vista expandida',
    layoutFull: 'Vista completa',
    sortByDate: 'Por fecha',
    sortByLikes: 'Por likes',
    sortByRetweets: 'Por retweets',
    refreshData: 'Actualizar datos',
    totalTweets: 'Total de Tweets Analizados',
    avgEngagement: 'Engagement Promedio',
    dominantSentiment: 'Sentimiento Dominante',
    topIntention: 'Intención Principal',
    aiAnalysisStats: 'Estadísticas de Análisis IA',
    refreshed: 'Datos actualizados exitosamente',
    refreshError: 'Error al actualizar los datos'
  },
  en: {
    title: 'AI-Analyzed Tweets',
    subtitle: 'Tweets extracted with nitter_context and analyzed with artificial intelligence',
    loading: 'Loading tweets...',
    noTweets: 'No tweets available',
    noTweetsDesc: 'No analyzed tweets found for the selected category.',
    allCategories: 'All',
    allSentiments: 'All',
    categories: {
      'Política': 'Politics',
      'Económica': 'Economic',
      'Sociales': 'Social',
      'General': 'General',
      'Tecnología': 'Technology',
      'Deportes': 'Sports'
    },
    sentiments: {
      'positivo': 'Positive',
      'negativo': 'Negative',
      'neutral': 'Neutral'
    },
    intentions: {
      'informativo': 'Informative',
      'opinativo': 'Opinion',
      'promocional': 'Promotional',
      'conversacional': 'Conversational',
      'humorous': 'Humorous',
      'alarmista': 'Alarmist',
      'crítico': 'Critical',
      'protesta': 'Protest'
    },
    layoutCompact: 'Compact view',
    layoutExpanded: 'Expanded view',
    layoutFull: 'Full view',
    sortByDate: 'By date',
    sortByLikes: 'By likes',
    sortByRetweets: 'By retweets',
    refreshData: 'Refresh data',
    totalTweets: 'Total Analyzed Tweets',
    avgEngagement: 'Average Engagement',
    dominantSentiment: 'Dominant Sentiment',
    topIntention: 'Top Intention',
    aiAnalysisStats: 'AI Analysis Statistics',
    refreshed: 'Data refreshed successfully',
    refreshError: 'Error refreshing data'
  }
};

type LayoutType = 'compact' | 'expanded' | 'full';
type SortType = 'date' | 'likes' | 'retweets';

const NitterTweetsSection: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const t = translations[language];
  const theme = useTheme();

  const [tweets, setTweets] = useState<NitterTweet[]>([]);
  const [stats, setStats] = useState<NitterTweetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [layout, setLayout] = useState<LayoutType>('expanded');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (user) {
      loadTweets();
      loadStats();
      loadCategoryStats();
    }
  }, [user, selectedCategory, selectedSentiment, sortBy]);

  const loadTweets = async (forceRefresh = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const categoria = selectedCategory === 'all' ? undefined : selectedCategory;
      const sentimiento = selectedSentiment === 'all' ? undefined : selectedSentiment;
      
      const tweetsData = await getNitterTweets(user.id, {
        limit: 100,
        categoria,
        sentimiento,
        forceRefresh,
      });
      
      // Ordenar tweets según el criterio seleccionado
      const sortedTweets = [...tweetsData].sort((a, b) => {
        switch (sortBy) {
          case 'likes':
            return b.total_engagement - a.total_engagement;
          case 'retweets':
            return b.total_engagement - a.total_engagement;
          case 'date':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
      
      console.log('NitterTweetsSection - Final tweets data:', {
        count: sortedTweets.length,
        tweets: sortedTweets.map(t => ({
          id: t.id,
          query_original: t.query_original,
          tweet_count: t.tweet_count,
          total_engagement: t.total_engagement
        }))
      });
      
      setTweets(sortedTweets);
    } catch (error) {
      console.error('Error loading nitter tweets:', error);
      setTweets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const statsData = await getNitterTweetStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading nitter tweet stats:', error);
      setStats(null);
    }
  };

  const loadCategoryStats = async () => {
    if (!user) return;
    
    try {
      const categoryData = await getNitterTweetsByCategory(user.id);
      setCategoryStats(categoryData);
    } catch (error) {
      console.error('Error loading category stats:', error);
      setCategoryStats({});
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTweets(true), loadStats(), loadCategoryStats()]);
      setSnackbar({
        open: true,
        message: t.refreshed,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t.refreshError,
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLayoutChange = (event: React.MouseEvent<HTMLElement>, newLayout: LayoutType | null) => {
    if (newLayout !== null) {
      setLayout(newLayout);
    }
  };

  const handleSortChange = (event: React.MouseEvent<HTMLElement>, newSort: SortType | null) => {
    if (newSort !== null) {
      setSortBy(newSort);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getGridProps = () => {
    switch (layout) {
      case 'compact':
        return { xs: 12, sm: 6, md: 4, lg: 3 };
      case 'full':
        return { xs: 12 };
      case 'expanded':
      default:
        return { xs: 12, sm: 6, md: 6, lg: 4 };
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo':
        return theme.palette.success.main;
      case 'negativo':
        return theme.palette.error.main;
      case 'neutral':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto', p: 0 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.subtitle}
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{ minWidth: 140 }}
        >
          {t.refreshData}
        </Button>
      </Stack>

      {/* Filters and Controls */}
      <Stack spacing={3} sx={{ mb: 3 }}>
        {/* Category Filter */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            Categorías
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${t.allCategories} (${tweets.length})`}
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              color={selectedCategory === 'all' ? 'primary' : 'default'}
              size="small"
            />
            {Object.entries(categoryStats).map(([category, count]) => (
              <Chip
                key={category}
                label={`${t.categories[category as keyof typeof t.categories] || category} (${count})`}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                color={selectedCategory === category ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Stack>
        </Box>

        {/* Sentiment Filter */}
        {stats && Object.keys(stats.sentimentCounts).length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Sentimiento
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={t.allSentiments}
                onClick={() => setSelectedSentiment('all')}
                variant={selectedSentiment === 'all' ? 'filled' : 'outlined'}
                color={selectedSentiment === 'all' ? 'secondary' : 'default'}
                size="small"
              />
              {Object.entries(stats.sentimentCounts).map(([sentiment, count]) => (
                <Chip
                  key={sentiment}
                  label={`${t.sentiments[sentiment as keyof typeof t.sentiments] || sentiment} (${count})`}
                  onClick={() => setSelectedSentiment(sentiment)}
                  variant={selectedSentiment === sentiment ? 'filled' : 'outlined'}
                  sx={{ 
                    color: selectedSentiment === sentiment ? 'white' : getSentimentColor(sentiment),
                    backgroundColor: selectedSentiment === sentiment ? getSentimentColor(sentiment) : 'transparent',
                    borderColor: getSentimentColor(sentiment),
                    '&:hover': {
                      backgroundColor: alpha(getSentimentColor(sentiment), 0.1)
                    }
                  }}
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Layout and Sort Controls */}
        <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="flex-end">
          {/* Layout Controls */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Diseño
            </Typography>
            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={handleLayoutChange}
              aria-label="layout"
              size="small"
            >
              <ToggleButton value="compact">
                <Tooltip title={t.layoutCompact}>
                  <ViewModule />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="expanded">
                <Tooltip title={t.layoutExpanded}>
                  <ViewComfy />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="full">
                <Tooltip title={t.layoutFull}>
                  <ViewList />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Sort Controls */}
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
                  <Typography variant="caption">RTs</Typography>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Stack>

      {/* AI Analysis Statistics */}
      {!loading && stats && (
        <Accordion 
          expanded={statsExpanded} 
          onChange={() => setStatsExpanded(!statsExpanded)}
          sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {t.aiAnalysisStats}
              </Typography>
              <Chip 
                label={`${stats.totalTweets} tweets`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Total Tweets */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats.totalTweets}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.totalTweets}
                  </Typography>
                </Paper>
              </Grid>

              {/* Average Engagement */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {stats.avgEngagement}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.avgEngagement}
                  </Typography>
                </Paper>
              </Grid>

              {/* Dominant Sentiment */}
              {Object.keys(stats.sentimentCounts).length > 0 && (
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${alpha(getSentimentColor(Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][0]), 0.1)}, ${alpha(getSentimentColor(Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][0]), 0.05)})`,
                      border: `1px solid ${alpha(getSentimentColor(Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][0]), 0.2)}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ color: getSentimentColor(Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][0]) }}>
                      {Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][1]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.dominantSentiment}: {t.sentiments[Object.entries(stats.sentimentCounts).sort(([,a], [,b]) => b - a)[0][0] as keyof typeof t.sentiments]}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Top Intention */}
              {Object.keys(stats.intentionCounts).length > 0 && (
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.05)})`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {Object.entries(stats.intentionCounts).sort(([,a], [,b]) => b - a)[0][1]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.topIntention}: {t.intentions[Object.entries(stats.intentionCounts).sort(([,a], [,b]) => b - a)[0][0] as keyof typeof t.intentions]}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

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
          <SmartToy sx={{ fontSize: 48, color: 'text.disabled' }} />
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
          {tweets.map((tweet) => (
            <Grid item {...getGridProps()} key={tweet.id}>
              <RecentScrapeCard 
                scrape={tweet} 
                layout={layout}
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
    </Box>
  );
};

export default NitterTweetsSection; 