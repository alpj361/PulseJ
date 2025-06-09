import { useState, useEffect, useCallback } from 'react';
import {
  ProjectContext,
  CreateProjectContextData,
  UseProjectContextResult
} from '../types/projects';
import { TrendingTweet } from '../types';
import * as contextService from '../services/projectContexts';

/**
 * Hook para manejo del contexto de un proyecto específico
 */
export const useProjectContext = (projectId: string): UseProjectContextResult => {
  // Estados
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ===================================================================

  /**
   * Cargar el contexto actual del proyecto
   */
  const loadContext = useCallback(async () => {
    if (!projectId) {
      setContext(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🌍 Cargando contexto del proyecto:', projectId);
      const fetchedContext = await contextService.getProjectContext(projectId);
      setContext(fetchedContext);

      console.log('✅ Contexto cargado:', fetchedContext ? 'Encontrado' : 'No existe');
    } catch (err) {
      console.error('❌ Error cargando contexto:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Refrescar contexto
   */
  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]);

  // ===================================================================
  // OPERACIONES CRUD
  // ===================================================================

  /**
   * Crear contexto inicial para el proyecto
   */
  const createContext = useCallback(async (
    contextData: CreateProjectContextData
  ): Promise<ProjectContext> => {
    try {
      setError(null);

      // Validar datos antes de enviar
      const validationErrors = contextService.validateContextData(contextData);
      if (validationErrors.length > 0) {
        throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      console.log('✨ Creando contexto para proyecto:', projectId);
      const newContext = await contextService.createProjectContext(projectId, contextData);

      setContext(newContext);
      console.log('✅ Contexto creado exitosamente');
      return newContext;
    } catch (err) {
      console.error('❌ Error creando contexto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creando contexto';
      setError(errorMessage);
      throw err;
    }
  }, [projectId]);

  /**
   * Actualizar contexto existente (crea nueva versión)
   */
  const updateContext = useCallback(async (
    contextData: Partial<CreateProjectContextData>
  ): Promise<ProjectContext> => {
    try {
      setError(null);

      console.log('📝 Actualizando contexto del proyecto:', projectId);
      const updatedContext = await contextService.updateProjectContext(projectId, contextData);

      setContext(updatedContext);
      console.log('✅ Contexto actualizado con nueva versión');
      return updatedContext;
    } catch (err) {
      console.error('❌ Error actualizando contexto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando contexto';
      setError(errorMessage);
      throw err;
    }
  }, [projectId]);

  // ===================================================================
  // EFECTOS
  // ===================================================================

  /**
   * Cargar contexto cuando cambie el projectId
   */
  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // ===================================================================
  // RETORNO DEL HOOK
  // ===================================================================

  return {
    context,
    loading,
    error,
    createContext,
    updateContext,
    refreshContext
  };
};

/**
 * Hook para el historial de versiones del contexto
 */
export const useProjectContextHistory = (projectId: string) => {
  const [contextHistory, setContextHistory] = useState<ProjectContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContextHistory = useCallback(async () => {
    if (!projectId) {
      setContextHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📚 Cargando historial de contexto:', projectId);
      const history = await contextService.getProjectContextHistory(projectId);
      setContextHistory(history);

      console.log('✅ Historial cargado:', history.length, 'versiones');
    } catch (err) {
      console.error('❌ Error cargando historial:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadContextHistory();
  }, [loadContextHistory]);

  return {
    contextHistory,
    loading,
    error,
    refresh: loadContextHistory
  };
};

/**
 * Hook especializado para integración con trending tweets
 */
export const useProjectTrendingIntegration = (projectId: string) => {
  const [integrating, setIntegrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Agregar tweets seleccionados al contexto
   */
  const addTrendingToContext = useCallback(async (trendingTweetIds: number[]) => {
    try {
      setIntegrating(true);
      setError(null);

      console.log('🐦 Integrando trending tweets al contexto:', trendingTweetIds);
      const updatedContext = await contextService.addTrendingToContext(projectId, trendingTweetIds);

      console.log('✅ Trending integrado exitosamente');
      return updatedContext;
    } catch (err) {
      console.error('❌ Error integrando trending:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error integrando trending';
      setError(errorMessage);
      throw err;
    } finally {
      setIntegrating(false);
    }
  }, [projectId]);

  /**
   * Extraer información automáticamente de tweets
   */
  const extractDataFromTrending = useCallback((trendingTweets: TrendingTweet[]) => {
    try {
      console.log('🔧 Extrayendo datos de tweets seleccionados...');

      const extractedData = {
        dataSources: contextService.extractDataSourcesFromTrending(trendingTweets),
        actors: contextService.extractActorsFromTrending(trendingTweets),
        references: contextService.generateReferencesFromTrending(trendingTweets)
      };

      console.log('✅ Datos extraídos exitosamente:', {
        sources: extractedData.dataSources.length,
        actors: extractedData.actors.length,
        references: extractedData.references.length
      });

      return extractedData;
    } catch (err) {
      console.error('❌ Error extrayendo datos:', err);
      throw err;
    }
  }, []);

  return {
    integrating,
    error,
    addTrendingToContext,
    extractDataFromTrending
  };
};

/**
 * Hook para validación y utilidades del contexto
 */
export const useContextValidation = () => {
  /**
   * Validar datos de contexto
   */
  const validateContext = useCallback((data: CreateProjectContextData) => {
    const errors = contextService.validateContextData(data);
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Validar actores
   */
  const validateActors = useCallback((actors: any[]) => {
    const errors = contextService.validateActors(actors);
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Validar referencias
   */
  const validateReferences = useCallback((references: any[]) => {
    const errors = contextService.validateReferences(references);
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    validateContext,
    validateActors,
    validateReferences
  };
}; 