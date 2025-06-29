import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import ActivityCard from '../components/ui/ActivityCard';
import DocumentGeneratorCard from '../components/ui/DocumentGeneratorCard';
import RecentScrapesSection from '../components/ui/RecentScrapesSection';
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
  TrendingUp as TrendingUpIcon,
  DataUsage as DataUsageIcon
} from '@mui/icons-material';

const translations = {
  es: {
    title: 'Actividad Reciente',
    scrapesTitle: 'Scrapes Recientes con Vizta Chat',
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
    noThemes: 'No hay temas comunes aún',
    legacyActivity: 'Actividad Anterior (WhatsApp)',
    viztaChatActivity: 'Actividad de Vizta Chat',
    pageDescription: 'Aquí puedes ver tu actividad reciente con Vizta Chat.'
  },
  en: {
    title: 'Recent Activity',
    scrapesTitle: 'Recent Scrapes with Vizta Chat',
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
    noThemes: 'No common themes yet',
    legacyActivity: 'Legacy Activity (WhatsApp)',
    viztaChatActivity: 'Vizta Chat Activity',
    pageDescription: 'Here you can see your recent activity with Vizta Chat.'
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
      {/* Recent Tweets Extraction Section */}
      <RecentScrapesSection />

      <Box mt={6}>
        <DocumentGeneratorCard 
          onDocumentGenerated={(document) => {
            // Opcional: hacer algo cuando se genera un documento
            console.log('Documento generado:', document);
          }}
        />
      </Box>

      {/* WhatsApp Bot Section - ELIMINADO */}
      {/*
      <Paper ...>
        ...
      </Paper>
      */}

      {/* Opciones futuras - ELIMINADO */}
      {/* ... */}
    </Container>
  );
}