import React, { useEffect, useState } from 'react';
import { getLatestNews } from '../services/supabase';
import { NewsItem } from '../types';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Box,
  CircularProgress,
  Link
} from '@mui/material';
import { OpenInNew, CalendarToday, Business } from '@mui/icons-material';

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const latest = await getLatestNews();
        setNews(latest);
      } catch (e) {
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Política':
        return 'primary';
      case 'Económica':
        return 'success';
      case 'Sociales':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary">
        Noticias Recientes
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {news.map(noticia => (
            <Grid item xs={12} md={6} lg={4} key={noticia.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={noticia.category}
                      color={getCategoryColor(noticia.category) as any}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  
                  <Typography variant="h6" component="h2" gutterBottom fontWeight="semibold" lineHeight={1.3}>
                    {noticia.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      {noticia.source}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      •
                    </Typography>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(noticia.date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 3 }}>
                    {noticia.excerpt}
                  </Typography>
                  
                  {noticia.url && (
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<OpenInNew />}
                      component={Link}
                      href={noticia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      Ver noticia completa
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {news.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  No hay noticias recientes disponibles
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default News; 