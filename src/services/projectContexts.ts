import { supabase } from './supabase';
import { 
  ProjectContext, 
  CreateProjectContextData,
  Actor,
  Reference
} from '../types/projects';

/**
 * Service para manejo del contexto de proyectos
 * Incluye CRUD y funciones especiales para integración con trending
 */

// ===================================================================
// CRUD BÁSICO DE CONTEXTO
// ===================================================================

/**
 * Crear contexto para un proyecto
 */
export const createProjectContext = async (
  projectId: string,
  contextData: CreateProjectContextData
): Promise<ProjectContext> => {
  try {
    console.log('🌍 Creando contexto para proyecto:', projectId);

    // Preparar datos con valores por defecto
    const contextToCreate = {
      project_id: projectId,
      situation_description: contextData.situation_description,
      data_sources: contextData.data_sources || [],
      objectives: contextData.objectives || [],
      key_actors: contextData.key_actors || [],
      main_problem: contextData.main_problem || null,
      geographic_scope: contextData.geographic_scope || null,
      time_frame: contextData.time_frame || null,
      source_references: contextData.source_references || [],
      external_links: contextData.external_links || [],
      context_type: contextData.context_type || 'initial',
      version: 1
    };

    const { data, error } = await supabase
      .from('project_contexts')
      .insert(contextToCreate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando contexto:', error);
      throw error;
    }

    console.log('✅ Contexto creado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error en createProjectContext:', error);
    throw error;
  }
};

/**
 * Obtener el contexto actual de un proyecto
 */
export const getProjectContext = async (projectId: string): Promise<ProjectContext | null> => {
  try {
    console.log('📖 Obteniendo contexto del proyecto:', projectId);

    const { data, error } = await supabase
      .from('project_contexts')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        console.log('ℹ️ No hay contexto para este proyecto');
        return null;
      }
      console.error('❌ Error obteniendo contexto:', error);
      throw error;
    }

    console.log('✅ Contexto obtenido:', data);
    return data;
  } catch (error) {
    console.error('Error en getProjectContext:', error);
    throw error;
  }
};

/**
 * Obtener todas las versiones del contexto de un proyecto
 */
export const getProjectContextHistory = async (projectId: string): Promise<ProjectContext[]> => {
  try {
    console.log('📚 Obteniendo historial de contexto:', projectId);

    const { data, error } = await supabase
      .from('project_contexts')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }

    console.log(`✅ Obtenidas ${data?.length || 0} versiones del contexto`);
    return data || [];
  } catch (error) {
    console.error('Error en getProjectContextHistory:', error);
    throw error;
  }
};

/**
 * Actualizar el contexto de un proyecto (crea nueva versión)
 */
export const updateProjectContext = async (
  projectId: string,
  contextData: Partial<CreateProjectContextData>
): Promise<ProjectContext> => {
  try {
    console.log('📝 Actualizando contexto del proyecto:', projectId);

    // Obtener la versión actual para incrementarla
    const currentContext = await getProjectContext(projectId);
    const nextVersion = currentContext ? currentContext.version + 1 : 1;

    // Preparar datos de actualización
    const contextToCreate = {
      project_id: projectId,
      situation_description: contextData.situation_description || '',
      data_sources: contextData.data_sources || [],
      objectives: contextData.objectives || [],
      key_actors: contextData.key_actors || [],
      main_problem: contextData.main_problem || null,
      geographic_scope: contextData.geographic_scope || null,
      time_frame: contextData.time_frame || null,
      source_references: contextData.source_references || [],
      external_links: contextData.external_links || [],
      context_type: contextData.context_type || 'updated',
      version: nextVersion
    };

    const { data, error } = await supabase
      .from('project_contexts')
      .insert(contextToCreate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando contexto:', error);
      throw error;
    }

    console.log('✅ Contexto actualizado con nueva versión:', data);
    return data;
  } catch (error) {
    console.error('Error en updateProjectContext:', error);
    throw error;
  }
};

/**
 * Eliminar una versión específica del contexto
 */
export const deleteProjectContext = async (contextId: string): Promise<void> => {
  try {
    console.log('🗑️ Eliminando contexto:', contextId);

    const { error } = await supabase
      .from('project_contexts')
      .delete()
      .eq('id', contextId);

    if (error) {
      console.error('❌ Error eliminando contexto:', error);
      throw error;
    }

    console.log('✅ Contexto eliminado exitosamente');
  } catch (error) {
    console.error('Error en deleteProjectContext:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES ESPECIALES PARA TRENDING
// ===================================================================

/**
 * Agregar tweets seleccionados al contexto del proyecto
 * Nota: Esta función se expandirá en la Fase 2
 */
export const addTrendingToContext = async (
  projectId: string,
  trendingTweetIds: number[]
): Promise<ProjectContext> => {
  try {
    console.log('🐦 Agregando trending al contexto:', projectId, trendingTweetIds);

    // Obtener contexto actual
    const currentContext = await getProjectContext(projectId);
    if (!currentContext) {
      throw new Error('No existe contexto para este proyecto');
    }

    // Obtener tweets seleccionados
    const { data: selectedTweets, error: tweetsError } = await supabase
      .from('trending_tweets')
      .select('*')
      .in('id', trendingTweetIds);

    if (tweetsError) {
      console.error('❌ Error obteniendo tweets:', tweetsError);
      throw tweetsError;
    }

    // Actualizar contexto con los tweets seleccionados
    const updatedContextData = {
      ...currentContext,
      selected_trends: selectedTweets,
      context_type: 'updated' as const
    };

    return await updateProjectContext(projectId, updatedContextData);
  } catch (error) {
    console.error('Error en addTrendingToContext:', error);
    throw error;
  }
};

/**
 * Extraer fuentes de datos automáticamente de tweets seleccionados
 */
export const extractDataSourcesFromTrending = (trendingTweets: any[]): string[] => {
  const sources = new Set<string>();
  
  trendingTweets.forEach(tweet => {
    // Agregar la plataforma (Twitter/X)
    sources.add('Twitter/X');
    
    // Agregar categoría como fuente de datos
    if (tweet.categoria) {
      sources.add(`Trending ${tweet.categoria}`);
    }
    
    // Agregar tipo de contenido basado en intención comunicativa
    if (tweet.intencion_comunicativa) {
      sources.add(`Contenido ${tweet.intencion_comunicativa}`);
    }
  });

  return Array.from(sources);
};

/**
 * Extraer actores clave automáticamente de tweets seleccionados
 */
export const extractActorsFromTrending = (trendingTweets: any[]): Actor[] => {
  const actorsMap = new Map<string, Actor>();

  trendingTweets.forEach(tweet => {
    // Agregar usuario del tweet como actor
    const username = tweet.usuario;
    if (username && !actorsMap.has(username)) {
      actorsMap.set(username, {
        name: `@${username}`,
        role: tweet.verified ? 'Cuenta verificada' : 'Usuario de redes sociales',
        influence: tweet.verified || tweet.likes > 1000 ? 'high' : 'medium',
        position: 'redes_sociales',
        description: `Usuario activo en la conversación sobre ${tweet.trend_clean}`
      });
    }

    // Extraer entidades mencionadas
    if (tweet.entidades_mencionadas && Array.isArray(tweet.entidades_mencionadas)) {
      tweet.entidades_mencionadas.forEach((entidad: any) => {
        if (!actorsMap.has(entidad.nombre)) {
          actorsMap.set(entidad.nombre, {
            name: entidad.nombre,
            role: entidad.tipo,
            influence: 'medium',
            description: entidad.contexto || `${entidad.tipo} mencionada en trending topics`
          });
        }
      });
    }
  });

  return Array.from(actorsMap.values());
};

/**
 * Generar referencias automáticamente de tweets seleccionados
 */
export const generateReferencesFromTrending = (trendingTweets: any[]): Reference[] => {
  return trendingTweets.map(tweet => ({
    type: 'url' as const,
    title: `Tweet de @${tweet.usuario}: ${tweet.texto.substring(0, 100)}...`,
    url: tweet.enlace || `https://twitter.com/${tweet.usuario}/status/${tweet.tweet_id}`,
    date: tweet.fecha_tweet || tweet.fecha_captura,
    author: `@${tweet.usuario}`,
    description: `Tweet sobre ${tweet.trend_clean} - ${tweet.sentimiento} (${tweet.likes} likes, ${tweet.retweets} retweets)`
  }));
};

// ===================================================================
// FUNCIONES DE VALIDACIÓN Y UTILIDADES
// ===================================================================

/**
 * Validar datos de contexto antes de crear/actualizar
 */
export const validateContextData = (data: CreateProjectContextData): string[] => {
  const errors: string[] = [];

  if (!data.situation_description || data.situation_description.trim().length === 0) {
    errors.push('La descripción de la situación es requerida');
  }

  if (data.situation_description && data.situation_description.length > 5000) {
    errors.push('La descripción de la situación no puede exceder 5000 caracteres');
  }

  if (data.main_problem && data.main_problem.length > 2000) {
    errors.push('El problema principal no puede exceder 2000 caracteres');
  }

  if (data.objectives && data.objectives.length > 50) {
    errors.push('No se pueden agregar más de 50 objetivos');
  }

  if (data.key_actors && data.key_actors.length > 100) {
    errors.push('No se pueden agregar más de 100 actores clave');
  }

  if (data.external_links && data.external_links.length > 100) {
    errors.push('No se pueden agregar más de 100 enlaces externos');
  }

  return errors;
};

/**
 * Validar formato de actores
 */
export const validateActors = (actors: Actor[]): string[] => {
  const errors: string[] = [];

  actors.forEach((actor, index) => {
    if (!actor.name || actor.name.trim().length === 0) {
      errors.push(`Actor ${index + 1}: El nombre es requerido`);
    }
    if (!actor.role || actor.role.trim().length === 0) {
      errors.push(`Actor ${index + 1}: El rol es requerido`);
    }
    if (!['high', 'medium', 'low'].includes(actor.influence)) {
      errors.push(`Actor ${index + 1}: La influencia debe ser high, medium o low`);
    }
  });

  return errors;
};

/**
 * Validar formato de referencias
 */
export const validateReferences = (references: Reference[]): string[] => {
  const errors: string[] = [];

  references.forEach((ref, index) => {
    if (!ref.title || ref.title.trim().length === 0) {
      errors.push(`Referencia ${index + 1}: El título es requerido`);
    }
    if (!['url', 'document', 'article', 'research', 'news'].includes(ref.type)) {
      errors.push(`Referencia ${index + 1}: Tipo de referencia inválido`);
    }
    if (ref.type === 'url' && ref.url && !isValidUrl(ref.url)) {
      errors.push(`Referencia ${index + 1}: URL inválida`);
    }
  });

  return errors;
};

/**
 * Validar si una URL es válida
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}; 