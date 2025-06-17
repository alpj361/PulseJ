import { supabase } from './supabase.ts';
import { 
  Project, 
  CreateProjectData, 
  ProjectWithContext,
  ProjectStats,
  ProjectFilters,
  ProjectSortOptions
} from '../types/projects';

/**
 * Service para manejo de proyectos
 * Incluye CRUD completo y funciones auxiliares
 */

// ===================================================================
// CRUD BÁSICO DE PROYECTOS
// ===================================================================

/**
 * Crear un nuevo proyecto
 */
export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  try {
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Usuario no autenticado');

    // Preparar datos con valores por defecto
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
      collaborators: [] // Por ahora vacío, se implementará en fases futuras
    };

    console.log('🚀 Creando proyecto:', projectToCreate);

    const { data, error } = await supabase
      .from('projects')
      .insert(projectToCreate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando proyecto:', error);
      throw error;
    }

    console.log('✅ Proyecto creado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error en createProject:', error);
    throw error;
  }
};

/**
 * Obtener todos los proyectos de un usuario
 */
export const getProjectsByUser = async (
  userId: string, 
  filters?: ProjectFilters,
  sort?: ProjectSortOptions
): Promise<Project[]> => {
  try {
    console.log('📂 Obteniendo proyectos para usuario:', userId);

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    // Aplicar filtros si existen
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.date_range) {
        if (filters.date_range.start) {
          query = query.gte('created_at', filters.date_range.start);
        }
        if (filters.date_range.end) {
          query = query.lte('created_at', filters.date_range.end);
        }
      }
    }

    // Aplicar ordenamiento
    const sortField = sort?.field || 'updated_at';
    const sortDirection = sort?.direction || 'desc';
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo proyectos:', error);
      throw error;
    }

    console.log(`✅ Obtenidos ${data?.length || 0} proyectos`);
    return data || [];
  } catch (error) {
    console.error('Error en getProjectsByUser:', error);
    throw error;
  }
};

/**
 * Obtener un proyecto por ID con información adicional
 */
export const getProjectById = async (projectId: string): Promise<ProjectWithContext | null> => {
  try {
    console.log('🔍 Obteniendo proyecto:', projectId);

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        context:project_contexts(*),
        decisions_count:project_decisions(count),
        latest_decision:project_decisions(*)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        return null;
      }
      console.error('❌ Error obteniendo proyecto:', error);
      throw error;
    }

    console.log('✅ Proyecto obtenido:', data);
    return data;
  } catch (error) {
    console.error('Error en getProjectById:', error);
    throw error;
  }
};

/**
 * Actualizar un proyecto existente
 */
export const updateProject = async (
  projectId: string, 
  updates: Partial<Project>
): Promise<Project> => {
  try {
    console.log('📝 Actualizando proyecto:', projectId, updates);

    // Filtrar campos que no deberían actualizarse directamente
    const { id, user_id, created_at, updated_at, ...allowedUpdates } = updates;

    const { data, error } = await supabase
      .from('projects')
      .update(allowedUpdates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando proyecto:', error);
      throw error;
    }

    console.log('✅ Proyecto actualizado:', data);
    return data;
  } catch (error) {
    console.error('Error en updateProject:', error);
    throw error;
  }
};

/**
 * Eliminar un proyecto (solo el owner puede hacerlo)
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    console.log('🗑️ Eliminando proyecto:', projectId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('❌ Error eliminando proyecto:', error);
      throw error;
    }

    console.log('✅ Proyecto eliminado exitosamente');
  } catch (error) {
    console.error('Error en deleteProject:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES AUXILIARES Y ESTADÍSTICAS
// ===================================================================

/**
 * Obtener estadísticas de un proyecto usando la función de base de datos
 */
export const getProjectStats = async (projectId: string): Promise<ProjectStats> => {
  try {
    console.log('📊 Obteniendo estadísticas del proyecto:', projectId);

    const { data, error } = await supabase
      .rpc('get_project_stats', { project_uuid: projectId });

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }

    console.log('✅ Estadísticas obtenidas:', data);
    return data;
  } catch (error) {
    console.error('Error en getProjectStats:', error);
    throw error;
  }
};

/**
 * Marcar proyecto como completado usando la función de base de datos
 */
export const completeProject = async (
  projectId: string, 
  completionNotes?: string
): Promise<boolean> => {
  try {
    console.log('🎯 Completando proyecto:', projectId);

    const { data, error } = await supabase
      .rpc('complete_project', { 
        project_uuid: projectId,
        completion_notes: completionNotes || ''
      });

    if (error) {
      console.error('❌ Error completando proyecto:', error);
      throw error;
    }

    console.log('✅ Proyecto completado:', data);
    return data;
  } catch (error) {
    console.error('Error en completeProject:', error);
    throw error;
  }
};

/**
 * Obtener proyectos recientes del usuario (últimos 5)
 */
export const getRecentProjects = async (userId: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error en getRecentProjects:', error);
    throw error;
  }
};

/**
 * Buscar proyectos por texto (título, descripción, tags)
 */
export const searchProjects = async (
  userId: string, 
  searchTerm: string
): Promise<Project[]> => {
  try {
    console.log('🔍 Buscando proyectos:', searchTerm);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error buscando proyectos:', error);
      throw error;
    }

    console.log(`✅ Encontrados ${data?.length || 0} proyectos`);
    return data || [];
  } catch (error) {
    console.error('Error en searchProjects:', error);
    throw error;
  }
};

/**
 * Obtener todas las categorías únicas de proyectos del usuario
 */
export const getProjectCategories = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null);

    if (error) throw error;

    // Extraer categorías únicas
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return categories;
  } catch (error) {
    console.error('Error en getProjectCategories:', error);
    throw error;
  }
};

/**
 * Obtener todos los tags únicos de proyectos del usuario
 */
export const getProjectTags = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('tags')
      .eq('user_id', userId);

    if (error) throw error;

    // Extraer y aplanar todos los tags únicos
    const allTags = data.reduce((acc: string[], project) => {
      if (project.tags && Array.isArray(project.tags)) {
        acc.push(...project.tags);
      }
      return acc;
    }, []);

    const uniqueTags = [...new Set(allTags)];
    return uniqueTags;
  } catch (error) {
    console.error('Error en getProjectTags:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES DE VALIDACIÓN
// ===================================================================

/**
 * Verificar si el usuario tiene permisos para acceder a un proyecto
 */
export const verifyProjectAccess = async (
  projectId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('user_id, collaborators, visibility')
      .eq('id', projectId)
      .single();

    if (error) return false;

    // Es el owner
    if (data.user_id === userId) return true;

    // Es colaborador
    if (data.collaborators && data.collaborators.includes(userId)) return true;

    // Es público
    if (data.visibility === 'public') return true;

    return false;
  } catch (error) {
    console.error('Error en verifyProjectAccess:', error);
    return false;
  }
};

/**
 * Validar datos de proyecto antes de crear/actualizar
 */
export const validateProjectData = (data: CreateProjectData): string[] => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('El título es requerido');
  }

  if (data.title && data.title.length > 255) {
    errors.push('El título no puede exceder 255 caracteres');
  }

  if (data.description && data.description.length > 2000) {
    errors.push('La descripción no puede exceder 2000 caracteres');
  }

  if (data.tags && data.tags.length > 20) {
    errors.push('No se pueden agregar más de 20 etiquetas');
  }

  if (data.start_date && data.target_date) {
    const startDate = new Date(data.start_date);
    const targetDate = new Date(data.target_date);
    if (startDate > targetDate) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha objetivo');
    }
  }

  return errors;
}; 