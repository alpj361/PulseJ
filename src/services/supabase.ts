/**
 * Supabase client configuration
 * 
 * This file integrates with Supabase using Bolt.new and Netlify.
 * 
 * For production:
 * - Set up environment variables in Netlify dashboard
 * - The Bolt.new Supabase integration will handle authentication
 * 
 * For local development:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Create a .env.local file with your Supabase credentials
 */

import { createClient } from '@supabase/supabase-js';
import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';

// Use environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create mock Supabase data for development
const mockTrendData = {
  id: 'mock-id',
  created_at: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  word_cloud_data: mockWordCloudData,
  top_keywords: mockTopKeywords,
  category_data: mockCategoryData
};

// Create and export the Supabase client
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    })
  : createClient('https://example.com', 'mock-key'); // This will likely error, but we'll handle it

/**
 * Database schema for reference:
 * 
 * Table: trends
 * - id: uuid (primary key, generated)
 * - created_at: timestamp with time zone (default now())
 * - timestamp: timestamp with time zone (when the trend data was collected)
 * - word_cloud_data: jsonb (array of WordCloudItem)
 * - top_keywords: jsonb (array of KeywordCount)
 * - category_data: jsonb (array of CategoryCount)
 */

/**
 * Insert trend data into Supabase
 */
export async function insertTrendData(data: any): Promise<void> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, skipping database operation');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('trends')
      .upsert([
        {
          timestamp: data.timestamp,
          word_cloud_data: data.wordCloudData,
          top_keywords: data.topKeywords,
          category_data: data.categoryData
        }
      ], { ignoreDuplicates: true }); // Evita error 409 si el timestamp ya existe
    
    if (error) throw error;
  } catch (error) {
    console.error('Error inserting trend data:', error);
    throw error;
  }
}

/**
 * Get the latest trend data from Supabase
 */
export async function getLatestTrendData(): Promise<any | null> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, returning mock data');
    return mockTrendData;
  }
  
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('📭 No se encontraron datos de tendencias en Supabase');
        return null;
      }
      throw error;
    }
    
    console.log('📋 Datos encontrados en Supabase:', {
      timestamp: data.timestamp,
      hasWordCloud: !!data.word_cloud_data,
      hasKeywords: !!data.top_keywords,
      hasCategories: !!data.category_data,
      keywordCount: data.top_keywords?.length || 0
    });
    
    // Verificar si los datos tienen la estructura completa
    if (!data.top_keywords || data.top_keywords.length < 10) {
      console.warn(`Los datos recuperados tienen ${data.top_keywords?.length || 0} keywords, se esperaban 10`);
      
      // Si tenemos datos crudos, procesar localmente
      if (data.raw_data) {
        console.log('Usando raw_data para generar topKeywords completos');
        
        // Ordenar por alguna métrica relevante (p.ej. volume)
        const rawItems = data.raw_data.trends || [];
        const sortedItems = [...rawItems].sort((a, b) => (b.volume || 0) - (a.volume || 0));
        
        // Tomar top 10 o repetir si hay menos
        const top10 = sortedItems.slice(0, 10);
        while (top10.length < 10) {
          // Si hay menos de 10, repetir los más importantes
          top10.push(top10[top10.length % Math.max(1, top10.length)]);
        }
        
        // Crear estructura para topKeywords
        data.top_keywords = top10.map(item => ({
          keyword: item.name || item.keyword || 'Unknown',
          count: item.volume || item.count || 1
        }));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching latest trend data from Supabase:', error);
    // Solo retornar mock data si Supabase no está configurado, no por errores de query
    return null;
  }
}

/**
 * Tabla: codex_items
 * - id: uuid (primary key)
 * - user_id: uuid (referencia a auth.users)
 * - tipo: text (documento, audio, video, enlace)
 * - titulo: text
 * - descripcion: text
 * - etiquetas: text[]
 * - proyecto: text
 * - storage_path: text
 * - url: text
 * - nombre_archivo: text
 * - tamano: bigint
 * - fecha: date
 * - created_at: timestamp with time zone (default now())
 */

export async function saveCodexItem(item: any) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  const { error } = await supabase.from('codex_items').insert([
    {
      user_id: item.user_id,
      tipo: item.tipo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      etiquetas: item.etiquetas,
      proyecto: item.proyecto,
      project_id: item.project_id || null,
      storage_path: item.storagePath,
      url: item.url,
      nombre_archivo: item.nombreArchivo,
      tamano: item.tamano,
      fecha: item.fecha,
      is_drive: item.isDrive || false,
      drive_file_id: item.driveFileId || null
    }
  ]);
  if (error) throw error;
}

export async function getCodexItemsByUser(user_id: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const { data, error } = await supabase
    .from('codex_items')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Obtener activos (codex items) asociados a un proyecto específico
 */
export async function getProjectAssets(projectId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return [];
  }
}

/**
 * Obtener codex items disponibles para agregar a un proyecto (sin project_id asignado)
 */
export async function getAvailableCodexItems(userId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('user_id', userId)
      .is('project_id', null) // Solo items no asignados a proyectos
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available codex items:', error);
    return [];
  }
}

/**
 * Asignar un codex item a un proyecto
 */
export async function assignCodexItemToProject(itemId: string, projectId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update({ project_id: projectId })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning codex item to project:', error);
    throw error;
  }
}

/**
 * Desasignar un codex item de un proyecto
 */
export async function unassignCodexItemFromProject(itemId: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update({ project_id: null })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unassigning codex item from project:', error);
    throw error;
  }
}

/**
 * Create digitalstorage bucket if it doesn't exist (or verify it exists)
 */
export async function createCodexBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'digitalstorage')
    
    if (bucketExists) {
      console.log('digitalstorage bucket already exists')
    } else {
      console.warn('digitalstorage bucket not found. Please create it manually in Supabase dashboard.')
    }
  } catch (error) {
    console.error('Error checking digitalstorage bucket:', error)
  }
}

/**
 * Obtener las últimas 10 noticias de la tabla news
 */
export async function getLatestNews() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(10);
  if (error) throw error;
  
  // Función para limpiar HTML y fragmentos de código
  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Eliminar etiquetas HTML
      .replace(/\[&#8230;\]/g, '...') // Reemplazar entidades HTML
      .replace(/The post .* appeared first on .*/g, '') // Eliminar texto de "appeared first"
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };
  
  // Mapear a NewsItem
  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.titulo,
    source: item.fuente,
    date: item.fecha,
    excerpt: cleanText(item.resumen),
    category: item.categoria,
    keywords: item.keywords || [],
    url: item.url
  }));
}

/**
 * Obtiene los sondeos de un usuario desde la tabla 'sondeos'
 * @param userEmail Email del usuario
 * @returns Array de sondeos
 */
export async function getSondeosByUser(userEmail: string) {
  const { data, error } = await supabase
    .from('sondeos')
    .select('*')
    .eq('email_usuario', userEmail)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Obtener tweets de trending topics de las últimas 24 horas
 * @param limit Número máximo de tweets a obtener (default: 20)
 * @param categoria Filtrar por categoría específica (opcional)
 * @returns Array de tweets con datos limpios
 */
export async function getTrendingTweets(limit: number = 20, categoria?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  
  try {
    let query = supabase
      .from('trending_tweets')
      .select('*')
      .gte('fecha_captura', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('fecha_captura', { ascending: false })
      .limit(limit);
    
    // Filtrar por categoría si se especifica
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Función para limpiar texto de tweets (similar a cleanText de noticias)
    const cleanTweetText = (text: string) => {
      if (!text) return '';
      return text
        .replace(/https?:\/\/[^\s]+/g, '') // Eliminar URLs
        .replace(/@\w+/g, (match) => match) // Mantener mentions pero limpiar
        .replace(/#\w+/g, (match) => match) // Mantener hashtags pero limpiar
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    };
    
    // Mapear y limpiar datos
    return (data || []).map((tweet: any) => ({
      id: tweet.id,
      trend_original: tweet.trend_original,
      trend_clean: tweet.trend_clean,
      categoria: tweet.categoria,
      tweet_id: tweet.tweet_id,
      usuario: tweet.usuario,
      fecha_tweet: tweet.fecha_tweet,
      texto: cleanTweetText(tweet.texto),
      enlace: tweet.enlace,
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
      verified: tweet.verified || false,
      location: tweet.location,
      fecha_captura: tweet.fecha_captura,
      raw_data: tweet.raw_data,
      created_at: tweet.created_at,
      updated_at: tweet.updated_at,
      // Incluir campos de análisis de sentimiento e intención si existen
      sentimiento: tweet.sentimiento || null,
      intencion_comunicativa: tweet.intencion_comunicativa || null,
      score_sentimiento: tweet.score_sentimiento || null,
      propagacion_viral: tweet.propagacion_viral || null
    }));
  } catch (error) {
    console.error('Error fetching trending tweets:', error);
    return [];
  }
}

/**
 * Obtener estadísticas de tweets por categoría
 * @returns Objeto con conteos por categoría
 */
export async function getTweetStatsByCategory() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {};
  
  try {
    const { data, error } = await supabase
      .from('trending_tweets')
      .select('categoria')
      .gte('fecha_captura', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    // Contar por categoría
    const stats = (data || []).reduce((acc: any, tweet: any) => {
      const cat = tweet.categoria || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    return stats;
  } catch (error) {
    console.error('Error fetching tweet stats:', error);
    return {};
  }
}

// ===================================================================
// GESTIÓN DE PROYECTOS Y DECISIONES EN CAPAS
// ===================================================================

/**
 * Tipos para el sistema de proyectos
 */
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags: string[];
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  visibility: 'private' | 'team' | 'public';
  collaborators?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDecision {
  id: string;
  project_id: string;
  title: string;
  description: string;
  decision_type: 'enfoque' | 'alcance' | 'configuracion';
  sequence_number: number;
  parent_decision_id?: string | null;
  // Campos específicos para el sistema de capas
  change_description?: string | null;
  objective?: string | null;
  next_steps?: string | null;
  deadline?: string | null;
  // Campos específicos por tipo de decisión
  focus_area?: string | null;           // Para enfoque
  focus_context?: string | null;        // Para enfoque
  geographic_scope?: string | null;     // Para alcance
  monetary_scope?: string | null;       // Para alcance
  time_period_start?: string | null;    // Para alcance
  time_period_end?: string | null;      // Para alcance
  target_entities?: string | null;      // Para alcance
  scope_limitations?: string | null;    // Para alcance
  output_format?: string[] | null;      // Para configuración (array para selección múltiple)
  methodology?: string | null;          // Para configuración
  data_sources?: string | null;         // Para configuración
  search_locations?: string | null;     // Para configuración
  tools_required?: string | null;       // Para configuración
  references?: string[] | null;         // Para configuración (array de links)
  // Campos existentes mantenidos por compatibilidad
  rationale?: string | null;
  expected_impact?: string | null;
  resources_required?: string | null;
  risks_identified: string[] | null;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stakeholders?: string[] | null;
  tags: string[] | null;
  attachments: any[] | null;
  decision_references: any[] | null;
  success_metrics: Record<string, any> | null;
  implementation_date?: string | null;
  actual_impact?: string | null;
  lessons_learned?: string | null;
  created_at: string;
  updated_at: string;
}

// ===================================================================
// CRUD DE PROYECTOS
// ===================================================================

/**
 * Crear un nuevo proyecto
 */
export async function createProject(projectData: {
  title: string;
  description?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  category?: string;
  tags?: string[];
  start_date?: string;
  target_date?: string;
  visibility?: Project['visibility'];
}): Promise<Project> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const projectToCreate = {
      user_id: user.id,
      title: projectData.title,
      description: projectData.description || null,
      status: projectData.status || 'active',
      priority: projectData.priority || 'medium',
      category: projectData.category || null,
      tags: projectData.tags || [],
      start_date: projectData.start_date || null,
      target_date: projectData.target_date || null,
      visibility: projectData.visibility || 'private',
      collaborators: []
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Obtener proyectos del usuario autenticado
 */
export async function getUserProjects(): Promise<Project[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

/**
 * Obtener un proyecto específico por ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

/**
 * Actualizar un proyecto
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Eliminar un proyecto
 */
export async function deleteProject(projectId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ===================================================================
// CRUD DE DECISIONES EN CAPAS
// ===================================================================

/**
 * Crear una nueva decisión con soporte para campos específicos por tipo
 */
export async function createProjectDecision(
  projectId: string,
  decisionData: {
    title: string;
    description: string;
    decision_type: 'enfoque' | 'alcance' | 'configuracion';
    parent_decision_id?: string;
    // Campos generales
    change_description?: string;
    objective?: string;
    next_steps?: string;
    deadline?: string;
    urgency?: ProjectDecision['urgency'];
    tags?: string[];
    // Campos específicos para enfoque
    focus_area?: string;
    focus_context?: string;
    // Campos específicos para alcance
    geographic_scope?: string;
    monetary_scope?: string;
    time_period_start?: string;
    time_period_end?: string;
    target_entities?: string;
    scope_limitations?: string;
    // Campos específicos para configuración
    output_format?: string[];
    methodology?: string;
    data_sources?: string;
    search_locations?: string;
    tools_required?: string;
    references?: string[];
  }
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    // Obtener el siguiente número de secuencia
    const { data: sequenceData, error: sequenceError } = await supabase
      .rpc('get_next_decision_sequence', { project_uuid: projectId });

    if (sequenceError) throw sequenceError;

    const decisionToCreate = {
      project_id: projectId,
      title: decisionData.title,
      description: decisionData.description,
      decision_type: decisionData.decision_type,
      sequence_number: sequenceData || 1,
      parent_decision_id: decisionData.parent_decision_id || null,
      // Campos generales
      change_description: decisionData.change_description || null,
      objective: decisionData.objective || null,
      next_steps: decisionData.next_steps || null,
      deadline: decisionData.deadline || null,
      urgency: decisionData.urgency || 'medium',
      tags: decisionData.tags || [],
      // Campos específicos para enfoque
      focus_area: decisionData.focus_area || null,
      focus_context: decisionData.focus_context || null,
      // Campos específicos para alcance
      geographic_scope: decisionData.geographic_scope || null,
      monetary_scope: decisionData.monetary_scope || null,
      time_period_start: decisionData.time_period_start || null,
      time_period_end: decisionData.time_period_end || null,
      target_entities: decisionData.target_entities || null,
      scope_limitations: decisionData.scope_limitations || null,
      // Campos específicos para configuración
      output_format: decisionData.output_format || null,
      methodology: decisionData.methodology || null,
      data_sources: decisionData.data_sources || null,
      search_locations: decisionData.search_locations || null,
      tools_required: decisionData.tools_required || null,
      references: decisionData.references || null,
      // Campos de compatibilidad
      rationale: null,
      expected_impact: null,
      resources_required: null,
      risks_identified: [],
      stakeholders: [],
      attachments: [],
      decision_references: [],
      success_metrics: {},
      implementation_date: null,
      actual_impact: null,
      lessons_learned: null
    };

    const { data, error } = await supabase
      .from('project_decisions')
      .insert(decisionToCreate)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project decision:', error);
    throw error;
  }
}

/**
 * Obtener decisiones de un proyecto con soporte para jerarquía
 */
export async function getProjectDecisions(projectId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project decisions:', error);
    return [];
  }
}

/**
 * Actualizar una decisión
 */
export async function updateProjectDecision(
  decisionId: string,
  updates: Partial<ProjectDecision>
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update(updates)
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project decision:', error);
    throw error;
  }
}

/**
 * Eliminar una decisión
 */
export async function deleteProjectDecision(decisionId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('project_decisions')
      .delete()
      .eq('id', decisionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project decision:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de un proyecto
 */
export async function getProjectStats(projectId: string): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { total: 0, by_type: {}, by_urgency: {} };

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('decision_type, urgency')
      .eq('project_id', projectId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      by_type: {} as Record<string, number>,
      by_urgency: {} as Record<string, number>
    };

    data?.forEach((decision: any) => {
      // Count by type
      const type = decision.decision_type || 'enfoque';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;

      // Count by urgency
      const urgency = decision.urgency || 'medium';
      stats.by_urgency[urgency] = (stats.by_urgency[urgency] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return { total: 0, by_type: {}, by_urgency: {} };
  }
}

/**
 * Obtener decisiones hijas de una decisión padre
 */
export async function getChildDecisions(parentDecisionId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('parent_decision_id', parentDecisionId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching child decisions:', error);
    return [];
  }
}

/**
 * Obtener decisiones raíz (sin padre) de un proyecto
 */
export async function getRootDecisions(projectId: string): Promise<ProjectDecision[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_decision_id', null)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching root decisions:', error);
    return [];
  }
}

/**
 * Mover una decisión como hija de otra
 */
export async function moveDecisionAsChild(
  decisionId: string,
  newParentId: string
): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: newParentId })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error moving decision as child:', error);
    throw error;
  }
}

/**
 * Promover una decisión a raíz (eliminar padre)
 */
export async function promoteDecisionToRoot(decisionId: string): Promise<ProjectDecision> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: null })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error promoting decision to root:', error);
    throw error;
  }
}