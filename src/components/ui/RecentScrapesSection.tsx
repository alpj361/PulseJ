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
  Search, 
  TrendingUp, 
  ViewModule, 
  ViewList, 
  ViewComfy, 
  Refresh,
  Sort,
  DataUsage,
  SmartToy
} from '@mui/icons-material';
import RecentScrapeCard from './RecentScrapeCard';
import { getRecentScrapes, getRecentScrapeStats, deleteRecentScrape, RecentScrape, RecentScrapeStats } from '../../services/recentScrapes';
import { LanguageContext } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const translations = {
  es: {
    title: 'Monitoreo de Tweets',
    subtitle: 'Resultados de las extracciones de tweets realizadas con Vizta Chat',
    loading: 'Cargando resultados...',
    noScrapes: 'No hay resultados disponibles',
    noScrapesDesc: 'No se encontraron extracciones para la categoría seleccionada.',
    allCategories: 'Todas',
    allTools: 'Todas',
    categories: {
      'Política': 'Política',
      'Económica': 'Económica', 
      'Sociales': 'Sociales',
      'General': 'General',
      'Tecnología': 'Tecnología',
      'Deportes': 'Deportes'
    },
    tools: {
      'nitter_context': 'Nitter Context',
      'twitter_search': 'Twitter Search',
      'news_search': 'News Search',
      'web_search': 'Web Search'
    },
    layoutCompact: 'Vista compacta',
    layoutExpanded: 'Vista expandida',
    layoutFull: 'Vista completa',
    sortByDate: 'Por fecha',
    sortByTweets: 'Por tweets',
    sortByEngagement: 'Por engagement',
    refreshData: 'Actualizar datos',
    totalTweets: 'Total de Tweets Extraídos',
    totalExtractions: 'Total de Extracciones',
    avgEngagement: 'Engagement Promedio',
    topTool: 'Herramienta Principal',
    topCategory: 'Categoría Principal',
    deleteSuccess: 'Extracción eliminada exitosamente',
    deleteError: 'Error eliminando la extracción'
  },
  en: {
    title: 'Tweet Monitoring',
    subtitle: 'Results from tweet extractions performed with Vizta Chat',
    loading: 'Loading results...',
    noScrapes: 'No results available',
    noScrapesDesc: 'No extractions found for the selected category.',
    allCategories: 'All',
    allTools: 'All',
    categories: {
      'Política': 'Politics',
      'Económica': 'Economic',
      'Sociales': 'Social',
      'General': 'General',
      'Tecnología': 'Technology',
      'Deportes': 'Sports'
    },
    tools: {
      'nitter_context': 'Nitter Context',
      'twitter_search': 'Twitter Search',
      'news_search': 'News Search',
      'web_search': 'Web Search'
    },
    layoutCompact: 'Compact view',
    layoutExpanded: 'Expanded view',
    layoutFull: 'Full view',
    sortByDate: 'By date',
    sortByTweets: 'By tweets',
    sortByEngagement: 'By engagement',
    refreshData: 'Refresh data',
    totalTweets: 'Total Tweets Extracted',
    totalExtractions: 'Total Extractions',
    avgEngagement: 'Average Engagement',
    topTool: 'Top Tool',
    topCategory: 'Top Category',
    deleteSuccess: 'Extraction deleted successfully',
    deleteError: 'Error deleting extraction'
  }
};

type SortType = 'date' | 'tweets' | 'engagement';

const RecentScrapesSection: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const { user, session } = useAuth();
  const t = translations[language];
  const theme = useTheme();

  const [scrapes, setScrapes] = useState<RecentScrape[]>([]);
  const [stats, setStats] = useState<RecentScrapeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (user) {
      loadScrapes();
      loadStats();
    }
  }, [user, selectedCategory, sortBy]);

  const loadScrapes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const categoria = selectedCategory === 'all' ? undefined : selectedCategory;
      
      const scrapesData = await getRecentScrapes(user.id, {
        limit: 50,
        categoria,
      });
      
      // Ordenar scrapes según el criterio seleccionado
      const sortedScrapes = [...scrapesData].sort((a, b) => {
        switch (sortBy) {
          case 'tweets':
            return b.tweet_count - a.tweet_count;
          case 'engagement':
            return b.total_engagement - a.total_engagement;
          case 'date':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
      
      setScrapes(sortedScrapes);
    } catch (error) {
      console.error('Error loading scrapes:', error);
      setScrapes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const statsData = await getRecentScrapeStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScrapes();
    await loadStats();
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

  const handleSortChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSort: SortType
  ) => {
    if (newSort !== null) {
      setSortBy(newSort);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDelete = async (scrapeId: string) => {
    try {
      setDeleting(scrapeId);
      console.log('🗑️ Eliminando scrape:', scrapeId);

      // Obtener token de la sesión de Supabase
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('No hay token de autenticación disponible');
      }

      // Llamar al servicio de eliminación con el token
      await deleteRecentScrape(scrapeId, authToken);

      // Actualizar la lista local eliminando el item
      setScrapes(prevScrapes => prevScrapes.filter(scrape => scrape.id !== scrapeId));

      // Actualizar estadísticas
      await loadStats();

      showSnackbar(t.deleteSuccess, 'success');
      console.log('✅ Scrape eliminado exitosamente');

    } catch (error) {
      console.error('❌ Error eliminando scrape:', error);
      showSnackbar(
        error instanceof Error ? error.message : t.deleteError, 
        'error'
      );
    } finally {
      setDeleting(null);
    }
  };

  const categories = ['all', 'Política', 'Económica', 'Sociales', 'General', 'Tecnología', 'Deportes'];

  // Configurar grid
  const gridProps = { xs: 12, md: 6 };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, position: 'relative' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t.subtitle}
          </Typography>
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

      {/* Controls */}
      <Stack spacing={3} sx={{ mb: 3 }}>
        {/* Category Filter */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Categoría
          </Typography>
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={handleCategoryChange}
            aria-label="category"
            size="small"
            sx={{
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.75rem',
                padding: '4px 12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${theme.palette.primary.main}`,
                }
              }
            }}
          >
            {categories.map((category) => (
              <ToggleButton key={category} value={category}>
                {category === 'all' ? t.allCategories : t.categories[category as keyof typeof t.categories] || category}
                {stats?.categoriasCount[category] && category !== 'all' && (
                  <Chip 
                    label={stats.categoriasCount[category]} 
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
        <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="flex-end">
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
              <ToggleButton value="tweets">
                <Tooltip title={t.sortByTweets}>
                  <Typography variant="caption">Tweets</Typography>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="engagement">
                <Tooltip title={t.sortByEngagement}>
                  <Typography variant="caption">Engagement</Typography>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Stack>

      {/* Statistics Cards */}
      {!loading && stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Total Tweets Extracted */}
          <Grid item xs={12} sm={6}>
            <Paper
              sx={{
                p: 2,
                minHeight: 120,
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
                <Search sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                  {t.totalTweets}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {stats.totalTweets.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                en {stats.totalScrapes} extracciones
              </Typography>
            </Paper>
          </Grid>

          {/* Average Engagement */}
          <Grid item xs={12} sm={6}>
            <Paper
              sx={{
                p: 2,
                minHeight: 120,
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
                <TrendingUp sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                  {t.avgEngagement}
                </Typography>
              </Box>
              <Tooltip title="Fórmula: (Likes + Retweets + Replies) / # de tweets extraídos" placement="top" arrow>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {stats.avgEngagementPerScrape}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                por extracción
              </Typography>
            </Paper>
          </Grid>
        </Grid>
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
      {!loading && scrapes.length === 0 && (
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
          <DataUsage sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary">
            {t.noScrapes}
          </Typography>
          <Typography color="text.disabled">
            {t.noScrapesDesc}
          </Typography>
        </Box>
      )}

      {/* Scrapes Grid */}
      {!loading && scrapes.length > 0 && (
        <Grid container spacing={3}>
          {scrapes.map((scrape) => (
            <Grid item {...gridProps} key={scrape.id}>
              <RecentScrapeCard 
                scrape={scrape} 
                onDelete={handleDelete}
                isDeleting={deleting === scrape.id}
                showActions={!deleting}
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

export default RecentScrapesSection; 