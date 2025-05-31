import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import ActivityCard from '../components/ui/ActivityCard';
import DocumentGeneratorCard from '../components/ui/DocumentGeneratorCard';
import { 
  Grid, 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Chip,
  Paper, 
  Container,
  Link,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  Newspaper as NewspaperIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const translations = {
  es: {
    title: 'Actividad Reciente',
    loading: 'Cargando actividad...',
    noActivity: 'No tienes actividad reciente.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chatea',
    yourNumber: 'Tu número:',
    error: 'No se pudo cargar tu actividad reciente.',
    presentations: 'Presentaciones',
    comparisons: 'Comparativas',
    comingSoon: 'Próximamente',
    statistics: 'Estadísticas de Extracción',
    hashtags: 'Hashtags',
    users: 'Usuarios',
    news: 'Noticias',
    commonThemes: 'Temas Comunes',
    noThemes: 'No hay temas comunes aún'
  },
  en: {
    title: 'Recent Activity',
    loading: 'Loading activity...',
    noActivity: 'You have no recent activity.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chat',
    yourNumber: 'Your number:',
    error: 'Could not load your recent activity.',
    presentations: 'Presentations',
    comparisons: 'Comparisons',
    comingSoon: 'Coming Soon',
    statistics: 'Extraction Statistics',
    hashtags: 'Hashtags',
    users: 'Users',
    news: 'News',
    commonThemes: 'Common Themes',
    noThemes: 'No common themes yet'
  },
};

const WHATSAPP_BOT_NUMBER = '50252725024';

interface Activity {
  id: string;
  created_at: string;
  type: 'Hashtag' | 'Usuario' | 'News';
  value: string;
  sentimiento: 'positivo' | 'negativo' | 'neutral';
}

interface ThemeCount {
  theme: string;
  count: number;
}

export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  // Calculate statistics from activities
  const getStatistics = () => {
    const hashtagCount = activities.filter(a => a.type === 'Hashtag').length;
    const userCount = activities.filter(a => a.type === 'Usuario').length;
    const newsCount = activities.filter(a => a.type === 'News').length;
    
    // Extract common themes (based on value frequency)
    const valueFrequency: Record<string, number> = {};
    activities.forEach(activity => {
      // Check if the value is a JSON string
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(activity.value);
        
        // Extract theme name from JSON structure
        if (jsonData.meta && jsonData.meta.hashtag) {
          // If it's a hashtag JSON format (new format)
          const theme = jsonData.meta.hashtag.toLowerCase();
          if (valueFrequency[theme]) {
            valueFrequency[theme]++;
          } else {
            valueFrequency[theme] = 1;
          }
          
          // Also add related topics if available
          if (jsonData.meta.related_topics && Array.isArray(jsonData.meta.related_topics)) {
            jsonData.meta.related_topics.forEach((topic: string) => {
              const relatedTopic = topic.toLowerCase();
              if (valueFrequency[relatedTopic]) {
                valueFrequency[relatedTopic]++;
              } else {
                valueFrequency[relatedTopic] = 1;
              }
            });
          }
        } else if (Array.isArray(jsonData) && jsonData.length > 0) {
          // Check if it's the older array format with tweets
          if (jsonData[0].tipo === "tweet" && jsonData[0].contenido) {
            // Extract hashtag from tweet content
            const hashtagMatch = jsonData[0].contenido.match(/#(\w+)/);
            if (hashtagMatch) {
              const theme = hashtagMatch[1].toLowerCase();
              if (valueFrequency[theme]) {
                valueFrequency[theme]++;
              } else {
                valueFrequency[theme] = 1;
              }
            }
          }
        } else if (jsonData.hashtag) {
          // Direct hashtag property
          const theme = jsonData.hashtag.toLowerCase();
          if (valueFrequency[theme]) {
            valueFrequency[theme]++;
          } else {
            valueFrequency[theme] = 1;
          }
        } else {
          // Not the expected JSON format, use the raw value
          const value = activity.value.toLowerCase();
          if (valueFrequency[value]) {
            valueFrequency[value]++;
          } else {
            valueFrequency[value] = 1;
          }
        }
      } catch (e) {
        // Not JSON, use the raw value
        const value = activity.value.toLowerCase();
        if (valueFrequency[value]) {
          valueFrequency[value]++;
        } else {
          valueFrequency[value] = 1;
        }
      }
    });
    
    // Sort by frequency and get top 5
    const commonThemes: ThemeCount[] = Object.entries(valueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ 
        theme, 
        count 
      }));
    
    return {
      hashtagCount,
      userCount,
      newsCount,
      commonThemes
    };
  };

  useEffect(() => {
    const fetchPhoneAndActivity = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      // Obtener el número de teléfono del perfil
      const { data: profile, error: profileError } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (profileError || !profile?.phone) {
        setError('No se pudo obtener tu número de teléfono. Ve a Settings para configurarlo.');
        setLoading(false);
        return;
      }
      setUserPhone(profile.phone);
      console.log('🔍 DEBUG: User phone:', profile.phone);
      
      // Obtener la actividad asociada a ese número
      const { data, error: activityError } = await supabase
        .from('scrapes')
        .select('*')
        .eq('wa_number', profile.phone)
        .order('created_at', { ascending: false });
        
      console.log('📊 DEBUG: Raw scrapes data:', data);
      console.log('❌ DEBUG: Activity error:', activityError);
      
      // TEMP DEBUG: Also get all recent scrapes to see what's available
      const { data: allScrapes } = await supabase
        .from('scrapes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      console.log('🌍 DEBUG: All recent scrapes (last 10):', allScrapes?.map(s => ({
        id: s.id,
        wa_number: s.wa_number,
        type: s.type,
        value_preview: s.value?.substring(0, 50),
        created_at: s.created_at
      })));
      
      if (activityError) {
        setError(t.error);
      } else {
        // Process the data to ensure correct type detection
        const processedActivities = (data || []).map((scrape: any) => {
          console.log('🔍 DEBUG: Processing scrape:', scrape.id, scrape.type, scrape.value?.substring(0, 100));
          
          let processedType = scrape.type;
          let processedSentimiento = scrape.sentimiento || 'neutral';
          
          // Try to detect type from JSON structure if not already set correctly
          if (scrape.value) {
            try {
              const jsonData = JSON.parse(scrape.value);
              console.log('📋 DEBUG: Parsed JSON meta:', jsonData.meta);
              
              // New format with meta.hashtag
              if (jsonData.meta && jsonData.meta.hashtag) {
                processedType = 'Hashtag';
                console.log('✅ DEBUG: Detected hashtag format:', jsonData.meta.hashtag);
                // Use sentiment from meta if available
                if (jsonData.meta.sentiment_summary) {
                  const sentiment = jsonData.meta.sentiment_summary;
                  if (sentiment.positivo > sentiment.negativo && sentiment.positivo > sentiment.neutral) {
                    processedSentimiento = 'positivo';
                  } else if (sentiment.negativo > sentiment.positivo && sentiment.negativo > sentiment.neutral) {
                    processedSentimiento = 'negativo';
                  } else {
                    processedSentimiento = 'neutral';
                  }
                }
              }
              // Array format with tweets
              else if (Array.isArray(jsonData) && jsonData.length > 0) {
                if (jsonData[0].tipo === "tweet" || jsonData[0].text || jsonData[0].contenido) {
                  // Check if it looks like hashtag content
                  const content = jsonData[0].contenido || jsonData[0].text || '';
                  if (content.includes('#')) {
                    processedType = 'Hashtag';
                    console.log('✅ DEBUG: Detected hashtag in array format');
                  }
                  // Use sentiment from first tweet if available
                  if (jsonData[0].sentimiento || jsonData[0].sentiment) {
                    processedSentimiento = jsonData[0].sentimiento || jsonData[0].sentiment;
                  }
                }
              }
              // Direct hashtag object
              else if (jsonData.hashtag) {
                processedType = 'Hashtag';
                console.log('✅ DEBUG: Detected direct hashtag format');
              }
              // User data
              else if (jsonData.username || jsonData.user) {
                processedType = 'Usuario';
                console.log('✅ DEBUG: Detected user format');
              }
            } catch (e) {
              console.log('❌ DEBUG: JSON parse error:', e);
              console.log('📄 DEBUG: Raw JSON content that failed:', scrape.value);
              // Si el valor contiene 'meta' y 'hashtag', forzar tipo Hashtag
              if (scrape.value.includes('"meta"') && scrape.value.includes('"hashtag"')) {
                processedType = 'Hashtag';
                console.log('🟡 DEBUG: Forzando tipo Hashtag por contenido de texto');
              } else if (scrape.value.startsWith('#')) {
                processedType = 'Hashtag';
              } else if (scrape.value.startsWith('@')) {
                processedType = 'Usuario';
              }
            }
          }
          
          const processed = {
            ...scrape,
            type: processedType,
            sentimiento: processedSentimiento
          };
          
          console.log('✅ DEBUG: Processed result:', processed.id, processed.type, processed.sentimiento);
          return processed;
        });
        
        console.log('📊 DEBUG: Final processed activities:', processedActivities.length);
        setActivities(processedActivities);
      }
      setLoading(false);
    };
    fetchPhoneAndActivity();
  }, [user, t.error]);

  const statistics = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* WhatsApp Bot Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          mb: 3, 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          backgroundColor: alpha(theme.palette.success.main, 0.05),
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha(theme.palette.success.main, 0.2),
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderColor: alpha(theme.palette.success.main, 0.3),
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              backgroundColor: theme.palette.success.main,
              color: '#fff',
              borderRadius: '50%',
              width: 38,
              height: 38,
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'medium',
              mr: 2,
              color: theme.palette.success.dark
            }}
          >
            {t.whatsappBot}
          </Typography>
          <Button 
            variant="contained" 
            color="success"
            href={`https://wa.me/${WHATSAPP_BOT_NUMBER}?text=Hola%20Bot%2C%20quiero%20consultar%20actividad%20reciente...`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            {t.chatWithBot}
          </Button>
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.success.dark,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            py: 0.75,
            px: 2,
            borderRadius: 2,
            fontWeight: 'medium'
          }}
        >
          {userPhone && (
            <>
              {t.yourNumber} <strong>{userPhone}</strong>
            </>
          )}
        </Typography>
      </Paper>

      {/* Main Card */}
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative top border */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
        
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 3,
            mt: 0.5
          }}
        >
          <TimelineIcon 
            sx={{ 
              color: theme.palette.primary.main,
              fontSize: 28
            }} 
          />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{
              fontWeight: 'medium',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {t.title}
          </Typography>
        </Box>
        
        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              my: 4,
              p: 3,
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2
            }}
          >
            <CircularProgress size={24} color="primary" />
            <Typography>{t.loading}</Typography>
          </Box>
        ) : error ? (
          <Typography 
            variant="body2" 
            color="error.main" 
            sx={{ 
              my: 4, 
              p: 3, 
              textAlign: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.1)
            }}
          >
            {error}
          </Typography>
        ) : activities.length === 0 ? (
          <Box 
            sx={{ 
              my: 4, 
              p: 3, 
              textAlign: 'center',
              bgcolor: alpha(theme.palette.grey[500], 0.05),
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.6 }} />
            <Typography variant="body1" color="text.secondary">
              {t.noActivity}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid 
              container 
              spacing={3} 
              sx={{ 
                mt: 1,
                '& .MuiGrid-item': {
                  display: 'flex',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.01)'
                  }
                }
              }}
            >
              {activities.map((activity, index) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  key={activity.id}
                  sx={{
                    animation: 'fadeInUp 0.5s ease forwards',
                    opacity: 0,
                    animationDelay: `${index * 0.1}s`,
                    '@keyframes fadeInUp': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(20px)'
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  <ActivityCard
                    value={activity.value}
                    type={activity.type}
                    created_at={activity.created_at}
                    sentimiento={activity.sentimiento}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Statistics Section */}
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.primary',
                  fontWeight: 'medium' 
                }}
              >
                <TrendingUpIcon 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontSize: 24
                  }} 
                />
                {t.statistics}
              </Typography>

              <Grid container spacing={3}>
                {/* Activity Type Counts */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <TagIcon color="info" />
                          <Typography variant="h6" color="info.main" fontWeight="bold">
                            {statistics.hashtagCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.hashtags}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <PersonIcon color="success" />
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            {statistics.userCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.users}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <NewspaperIcon color="warning" />
                          <Typography variant="h6" color="warning.main" fontWeight="bold">
                            {statistics.newsCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.news}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Common Themes */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.secondary.main, 0.1),
                      backgroundColor: alpha(theme.palette.secondary.main, 0.02),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="medium" 
                      color="secondary.main" 
                      sx={{ mb: 2 }}
                    >
                      {t.commonThemes}
                    </Typography>
                    
                    {statistics.commonThemes.length > 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1,
                        '& > *': {
                          flexGrow: 0
                        }
                      }}>
                        {statistics.commonThemes.map((item, index) => {
                          // Format the theme name - capitalize first letter of each word
                          const formattedTheme = item.theme
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                            
                          return (
                            <Chip 
                              key={index}
                              label={`${formattedTheme} (${item.count})`}
                              color="secondary"
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontWeight: 'medium',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {t.noThemes}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </Paper>

      {/* Document Generator Section */}
      <DocumentGeneratorCard 
        onDocumentGenerated={(document) => {
          // Opcional: hacer algo cuando se genera un documento
          console.log('Documento generado:', document);
        }}
      />

      {/* Opciones futuras */}
      <Typography 
        variant="h6" 
        component="h3" 
        sx={{ 
          mb: 2, 
          mt: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'text.primary',
          fontWeight: 'medium'
        }}
      >
        Funcionalidades próximas
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: theme.palette.primary.main,
                fontWeight: 'medium'
              }}
            >
              {t.presentations}
            </Typography>
            <Chip 
              label={t.comingSoon} 
              color="primary" 
              variant="outlined" 
              sx={{ 
                fontWeight: 'medium',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
              }} 
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.secondary.main, 0.02),
              border: '1px solid',
              borderColor: alpha(theme.palette.secondary.main, 0.1),
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: theme.palette.secondary.main,
                fontWeight: 'medium'
              }}
            >
              {t.comparisons}
            </Typography>
            <Chip 
              label={t.comingSoon} 
              color="secondary" 
              variant="outlined" 
              sx={{ 
                fontWeight: 'medium',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
              }} 
            />
          </Paper>
        </Grid>
      </Grid>

    </Container>
  );
}