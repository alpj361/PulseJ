import { supabase } from './supabase';
import { EXTRACTORW_API_URL } from './api';

// ===================================================================
// RECENT SCRAPES SERVICE
// Servicio para obtener scrapes recientes de la tabla recent_scrapes
// ===================================================================

export interface RecentScrape {
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
  tweets: any[]; // JSONB array
  created_at: string;
  updated_at: string;
  // Nuevos campos del sistema de títulos inteligentes
  generated_title?: string;
  detected_group?: string;
}

export interface RecentScrapeStats {
  totalScrapes: number;
  totalTweets: number;
  totalEngagement: number;
  avgTweetsPerScrape: number;
  avgEngagementPerScrape: number;
  herramientasCount: Record<string, number>;
  categoriasCount: Record<string, number>;
  scrapesPorDia: Record<string, number>;
}

/**
 * Obtiene scrapes recientes del usuario actual
 */
export async function getRecentScrapes(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    herramienta?: string;
    categoria?: string;
    sessionId?: string;
  } = {}
): Promise<RecentScrape[]> {
  try {
    const {
      limit = 20,
      offset = 0,
      herramienta,
      categoria,
      sessionId
    } = options;

    let query = supabase
      .from('recent_scrapes')
      .select('*')
      .eq('user_id', userId)
      .is('tweet_id', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros opcionales
    if (herramienta) {
      query = query.eq('herramienta', herramienta);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error obteniendo scrapes: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error obteniendo recent scrapes:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de scrapes del usuario
 */
export async function getRecentScrapeStats(userId: string): Promise<RecentScrapeStats> {
  try {
    const { data: stats, error } = await supabase
      .from('recent_scrapes')
      .select('herramienta, categoria, tweet_count, total_engagement, created_at')
      .eq('user_id', userId)
      .is('tweet_id', null);

    if (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }

    // Calcular métricas
    const totalScrapes = stats?.length || 0;
    const totalTweets = stats?.reduce((sum, s) => sum + (s.tweet_count || 0), 0) || 0;
    const totalEngagement = stats?.reduce((sum, s) => sum + (s.total_engagement || 0), 0) || 0;

    // Herramientas más usadas
    const herramientasCount: Record<string, number> = {};
    stats?.forEach(s => {
      herramientasCount[s.herramienta] = (herramientasCount[s.herramienta] || 0) + 1;
    });

    // Categorías más usadas
    const categoriasCount: Record<string, number> = {};
    stats?.forEach(s => {
      categoriasCount[s.categoria] = (categoriasCount[s.categoria] || 0) + 1;
    });

    // Scrapes por día (últimos 7 días)
    const scrapesPorDia: Record<string, number> = {};
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      scrapesPorDia[fechaStr] = 0;
    }

    stats?.forEach(s => {
      const fecha = s.created_at.split('T')[0];
      if (scrapesPorDia.hasOwnProperty(fecha)) {
        scrapesPorDia[fecha]++;
      }
    });

    return {
      totalScrapes,
      totalTweets,
      totalEngagement,
      avgTweetsPerScrape: totalScrapes > 0 ? Math.round(totalTweets / totalScrapes) : 0,
      avgEngagementPerScrape: totalScrapes > 0 ? Math.round(totalEngagement / totalScrapes) : 0,
      herramientasCount,
      categoriasCount,
      scrapesPorDia
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de scrapes:', error);
    throw error;
  }
}

/**
 * Obtiene scrapes por categoría con conteos
 */
export async function getRecentScrapesByCategory(userId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('recent_scrapes')
      .select('categoria')
      .eq('user_id', userId)
      .is('tweet_id', null);

    if (error) {
      throw new Error(`Error obteniendo categorías: ${error.message}`);
    }

    const categoryCounts: Record<string, number> = {};
    data?.forEach(item => {
      categoryCounts[item.categoria] = (categoryCounts[item.categoria] || 0) + 1;
    });

    return categoryCounts;

  } catch (error) {
    console.error('Error obteniendo categorías de scrapes:', error);
    throw error;
  }
}

/**
 * Elimina un scrape específico del usuario
 */
export async function deleteRecentScrape(scrapeId: string, authToken?: string): Promise<void> {
  try {
    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Agregar token de autenticación si está disponible
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Usar el endpoint de ExtractorW que maneja autenticación
    const response = await fetch(`${EXTRACTORW_API_URL}/vizta-chat/scrapes/${scrapeId}`, {
      method: 'DELETE',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error HTTP: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Error eliminando scrape');
    }

    console.log('✅ Scrape eliminado exitosamente:', data.deletedScrape);

  } catch (error) {
    console.error('Error eliminando scrape:', error);
    throw error;
  }
} 