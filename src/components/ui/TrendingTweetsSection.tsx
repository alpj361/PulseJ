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
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Twitter, TrendingUp } from '@mui/icons-material';
import TweetCard from './TweetCard';
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
    }
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
    }
  }
};

const TrendingTweetsSection: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  const [tweets, setTweets] = useState<TrendingTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTweets();
    loadCategoryStats();
  }, [selectedCategory]);

  const loadTweets = async () => {
    setLoading(true);
    try {
      const categoria = selectedCategory === 'all' ? undefined : selectedCategory;
      const tweetsData = await getTrendingTweets(24, categoria); // Obtener hasta 24 tweets
      setTweets(tweetsData);
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

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: string
  ) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
    }
  };

  const categories = ['all', 'Política', 'Económica', 'Sociales', 'General'];

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, position: 'relative' }}>
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

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, position: 'relative' }}
      >
        {t.subtitle}
      </Typography>

      {/* Category Filter */}
      <Box sx={{ mb: 3, position: 'relative' }}>
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={handleCategoryChange}
          aria-label="category filter"
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              color: theme.palette.text.secondary,
              textTransform: 'none',
              fontWeight: 'medium',
              px: 2,
              py: 1,
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
                    ml: 1, 
                    height: 20, 
                    fontSize: '0.7rem',
                    backgroundColor: alpha('#fff', 0.2),
                    color: 'inherit'
                  }} 
                />
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

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
        <Grid container spacing={3}>
          {tweets.map((tweet) => (
            <Grid item xs={12} sm={6} lg={4} key={tweet.id}>
              <TweetCard tweet={tweet} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default TrendingTweetsSection; 