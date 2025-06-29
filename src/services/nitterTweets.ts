import { supabase } from './supabase';

// ===================================================================
// NITTER TWEETS SERVICE
// Servicio para obtener tweets individuales de nitter_context con análisis de IA
// ===================================================================

export interface NitterTweet {
  id: string;
  query_original: string;
  query_clean: string;
  herramienta: string;
  categoria: string;
  tweet_count: number;
  total_engagement: number;
  avg_engagement: number;
  user_id: string;
  session_id: string;
  mcp_request_id?: string;
  mcp_execution_time?: number;
  location: string;
  tweets: any[]; // JSONB array con todos los tweets y análisis de IA
  created_at: string;
  updated_at: string;
}

export interface NitterTweetStats {
  totalTweets: number;
  totalEngagement: number;
  avgEngagement: number;
  sentimentCounts: Record<string, number>;
  intentionCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  tweetsPerDay: Record<string, number>;
}

/**
 * Obtiene tweets individuales de nitter_context del usuario actual
 */
export async function getNitterTweets(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    categoria?: string;
    sentimiento?: string;
    location?: string;
    sessionId?: string;
    query?: string;
    forceRefresh?: boolean;
  } = {}
): Promise<NitterTweet[]> {
  try {
    const {
      limit = 50,
      offset = 0,
      categoria,
      sentimiento,
      location,
      sessionId,
      query,
      forceRefresh = false
    } = options;

    let supabaseQuery = supabase
      .from('recent_scrapes')
      .select('*')
      .eq('user_id', userId)
      .eq('herramienta', 'nitter_context')
      .is('tweet_id', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros opcionales
    if (categoria) {
      supabaseQuery = supabaseQuery.eq('categoria', categoria);
    }
    if (sentimiento) {
      supabaseQuery = supabaseQuery.eq('sentimiento', sentimiento);
    }
    if (location) {
      supabaseQuery = supabaseQuery.eq('location', location);
    }
    if (sessionId) {
      supabaseQuery = supabaseQuery.eq('session_id', sessionId);
    }
    if (query) {
      supabaseQuery = supabaseQuery.ilike('query_original', `%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Error obteniendo nitter tweets: ${error.message}`);
    }

    // Debug log
    console.log('getNitterTweets result:', {
      count: data?.length || 0,
      data: data?.map(item => ({
        id: item.id,
        query_original: item.query_original,
        tweet_count: item.tweet_count,
        total_engagement: item.total_engagement
      }))
    });

    return data || [];

  } catch (error) {
    console.error('Error obteniendo nitter tweets:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de tweets de nitter_context del usuario
 */
export async function getNitterTweetStats(userId: string): Promise<NitterTweetStats> {
  try {
    const { data: scrapes, error } = await supabase
      .from('recent_scrapes')
      .select('categoria, location, tweet_count, total_engagement, tweets, created_at')
      .eq('user_id', userId)
      .eq('herramienta', 'nitter_context')
      .is('tweet_id', null);

    if (error) {
      throw new Error(`Error obteniendo estadísticas de nitter tweets: ${error.message}`);
    }

    // Calcular métricas agregadas
    const totalTweets = scrapes?.reduce((sum, s) => sum + (s.tweet_count || 0), 0) || 0;
    const totalEngagement = scrapes?.reduce((sum, s) => sum + (s.total_engagement || 0), 0) || 0;

    // Extraer datos de tweets individuales de los arrays
    const allTweets: any[] = [];
    scrapes?.forEach(scrape => {
      if (scrape.tweets && Array.isArray(scrape.tweets)) {
        allTweets.push(...scrape.tweets);
      }
    });

    // Conteos por sentimiento
    const sentimentCounts: Record<string, number> = {};
    allTweets.forEach(tweet => {
      if (tweet.sentimiento) {
        sentimentCounts[tweet.sentimiento] = (sentimentCounts[tweet.sentimiento] || 0) + 1;
      }
    });

    // Conteos por intención comunicativa
    const intentionCounts: Record<string, number> = {};
    allTweets.forEach(tweet => {
      if (tweet.intencion_comunicativa) {
        intentionCounts[tweet.intencion_comunicativa] = (intentionCounts[tweet.intencion_comunicativa] || 0) + 1;
      }
    });

    // Conteos por categoría
    const categoryCounts: Record<string, number> = {};
    scrapes?.forEach(scrape => {
      if (scrape.categoria) {
        categoryCounts[scrape.categoria] = (categoryCounts[scrape.categoria] || 0) + 1;
      }
    });

    // Conteos por ubicación
    const locationCounts: Record<string, number> = {};
    scrapes?.forEach(scrape => {
      if (scrape.location) {
        locationCounts[scrape.location] = (locationCounts[scrape.location] || 0) + 1;
      }
    });

    // Scrapes por día (últimos 7 días)
    const tweetsPerDay: Record<string, number> = {};
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      tweetsPerDay[fechaStr] = 0;
    }

    scrapes?.forEach(scrape => {
      if (scrape.created_at) {
        const fecha = scrape.created_at.split('T')[0];
        if (tweetsPerDay.hasOwnProperty(fecha)) {
          tweetsPerDay[fecha] += scrape.tweet_count || 0;
        }
      }
    });

    return {
      totalTweets,
      totalEngagement,
      avgEngagement: totalTweets > 0 ? Math.round(totalEngagement / totalTweets) : 0,
      sentimentCounts,
      intentionCounts,
      categoryCounts,
      locationCounts,
      tweetsPerDay
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de nitter tweets:', error);
    throw error;
  }
}

/**
 * Obtiene conteos de tweets por categoría
 */
export async function getNitterTweetsByCategory(userId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('recent_scrapes')
      .select('categoria, tweet_count')
      .eq('user_id', userId)
      .eq('herramienta', 'nitter_context')
      .is('tweet_id', null);

    if (error) {
      throw new Error(`Error obteniendo categorías de nitter tweets: ${error.message}`);
    }

    const categoryCounts: Record<string, number> = {};
    data?.forEach(item => {
      if (item.categoria) {
        categoryCounts[item.categoria] = (categoryCounts[item.categoria] || 0) + (item.tweet_count || 1);
      }
    });

    return categoryCounts;

  } catch (error) {
    console.error('Error obteniendo categorías de nitter tweets:', error);
    throw error;
  }
}

 