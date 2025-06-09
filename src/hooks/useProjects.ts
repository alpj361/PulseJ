import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Project,
  CreateProjectData,
  ProjectFilters,
  ProjectSortOptions,
  UseProjectsResult
} from '../types/projects';
import * as projectsService from '../services/projects';

/**
 * Hook principal para manejo de proyectos
 * Incluye estado completo y operaciones CRUD
 */
export const useProjects = (
  initialFilters?: ProjectFilters,
  initialSort?: ProjectSortOptions
): UseProjectsResult => {
  // Estados
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contexto de autenticación
  const { user } = useAuth();

  // ===================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ===================================================================

  /**
   * Cargar proyectos del usuario
   */
  const loadProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Cargando proyectos...');
      const fetchedProjects = await projectsService.getProjectsByUser(
        user.id,
        initialFilters,
        initialSort
      );

      setProjects(fetchedProjects);
      console.log('✅ Proyectos cargados:', fetchedProjects.length);
    } catch (err) {
      console.error('❌ Error cargando proyectos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user?.id, initialFilters, initialSort]);

  /**
   * Refrescar lista de proyectos
   */
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  // ===================================================================
  // OPERACIONES CRUD
  // ===================================================================

  /**
   * Crear un nuevo proyecto
   */
  const createProject = useCallback(async (projectData: CreateProjectData): Promise<Project> => {
    try {
      setError(null);

      // Validar datos antes de enviar
      const validationErrors = projectsService.validateProjectData(projectData);
      if (validationErrors.length > 0) {
        throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      console.log('✨ Creando nuevo proyecto...');
      const newProject = await projectsService.createProject(projectData);

      // Agregar el proyecto a la lista local
      setProjects(prevProjects => [newProject, ...prevProjects]);

      console.log('✅ Proyecto creado exitosamente:', newProject.title);
      return newProject;
    } catch (err) {
      console.error('❌ Error creando proyecto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creando proyecto';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Actualizar un proyecto existente
   */
  const updateProject = useCallback(async (
    projectId: string, 
    updates: Partial<Project>
  ): Promise<Project> => {
    try {
      setError(null);

      console.log('📝 Actualizando proyecto:', projectId);
      const updatedProject = await projectsService.updateProject(projectId, updates);

      // Actualizar en la lista local
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? updatedProject : project
        )
      );

      console.log('✅ Proyecto actualizado:', updatedProject.title);
      return updatedProject;
    } catch (err) {
      console.error('❌ Error actualizando proyecto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando proyecto';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Eliminar un proyecto
   */
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      setError(null);

      console.log('🗑️ Eliminando proyecto:', projectId);
      await projectsService.deleteProject(projectId);

      // Remover de la lista local
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== projectId)
      );

      console.log('✅ Proyecto eliminado exitosamente');
    } catch (err) {
      console.error('❌ Error eliminando proyecto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando proyecto';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // ===================================================================
  // EFECTOS
  // ===================================================================

  /**
   * Cargar proyectos cuando cambie el usuario o los filtros
   */
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ===================================================================
  // RETORNO DEL HOOK
  // ===================================================================

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects
  };
};

/**
 * Hook simplificado para obtener solo la lista de proyectos
 */
export const useProjectsList = (filters?: ProjectFilters) => {
  const { projects, loading, error, refreshProjects } = useProjects(filters);
  
  return {
    projects,
    loading,
    error,
    refresh: refreshProjects
  };
};

/**
 * Hook para obtener proyectos recientes del usuario
 */
export const useRecentProjects = (limit: number = 5) => {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadRecentProjects = useCallback(async () => {
    if (!user?.id) {
      setRecentProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📅 Cargando proyectos recientes...');
      const recent = await projectsService.getRecentProjects(user.id);
      
      // Limitar al número solicitado
      const limitedRecent = recent.slice(0, limit);
      setRecentProjects(limitedRecent);

      console.log('✅ Proyectos recientes cargados:', limitedRecent.length);
    } catch (err) {
      console.error('❌ Error cargando proyectos recientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);
   
  return {
    recentProjects,
    loading,
    error,
    refresh: loadRecentProjects
  };
};

/**
 * Hook para buscar proyectos
 */
export const useProjectSearch = () => {
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const searchProjects = useCallback(async (searchTerm: string) => {
    if (!user?.id || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando proyectos:', searchTerm);
      const results = await projectsService.searchProjects(user.id, searchTerm);
      setSearchResults(results);

      console.log('✅ Búsqueda completada:', results.length, 'resultados');
    } catch (err) {
      console.error('❌ Error buscando proyectos:', err);
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchProjects,
    clearSearch
  };
};

/**
 * Hook para obtener estadísticas generales de proyectos del usuario
 */
export const useProjectsStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
    archived: 0,
    by_priority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { projects, loading: projectsLoading, error: projectsError } = useProjects();

  useEffect(() => {
    if (projectsLoading) {
      setLoading(true);
      return;
    }

    if (projectsError) {
      setError(projectsError);
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Calculando estadísticas de proyectos...');

      const calculatedStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        paused: projects.filter(p => p.status === 'paused').length,
        archived: projects.filter(p => p.status === 'archived').length,
        by_priority: {
          low: projects.filter(p => p.priority === 'low').length,
          medium: projects.filter(p => p.priority === 'medium').length,
          high: projects.filter(p => p.priority === 'high').length,
          urgent: projects.filter(p => p.priority === 'urgent').length
        }
      };

      setStats(calculatedStats);
      setError(null);
      console.log('✅ Estadísticas calculadas:', calculatedStats);
    } catch (err) {
      console.error('❌ Error calculando estadísticas:', err);
      setError(err instanceof Error ? err.message : 'Error calculando estadísticas');
    } finally {
      setLoading(false);
    }
  }, [projects, projectsLoading, projectsError]);
   
  return {
    stats,
    loading,
    error
  };
}; 