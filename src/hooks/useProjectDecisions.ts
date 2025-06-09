import { useState, useEffect, useCallback } from 'react';
import {
  ProjectDecision,
  CreateProjectDecisionData,
  UseProjectDecisionsResult,
  UseDecisionTimelineResult,
  UseParentChildDecisionsResult,
  UseProjectValidationResult,
  DecisionTimelineItem,
  SuccessMetric
} from '../types/projects';
import * as decisionsService from '../services/projectDecisions';

/**
 * Hook para manejo de decisiones de un proyecto específico
 */
export const useProjectDecisions = (projectId: string): UseProjectDecisionsResult => {
  // Estados
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ===================================================================

  /**
   * Cargar decisiones del proyecto
   */
  const loadDecisions = useCallback(async () => {
    if (!projectId) {
      setDecisions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('⚖️ Cargando decisiones del proyecto:', projectId);
      const fetchedDecisions = await decisionsService.getProjectDecisions(projectId);
      setDecisions(fetchedDecisions);

      console.log('✅ Decisiones cargadas:', fetchedDecisions.length);
    } catch (err) {
      console.error('❌ Error cargando decisiones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Refrescar lista de decisiones
   */
  const refreshDecisions = useCallback(async () => {
    await loadDecisions();
  }, [loadDecisions]);

  /**
   * Obtener el siguiente número de secuencia
   */
  const getNextSequenceNumber = useCallback((): number => {
    if (decisions.length === 0) return 1;
    const maxSequence = Math.max(...decisions.map(d => d.sequence_number));
    return maxSequence + 1;
  }, [decisions]);

  // ===================================================================
  // OPERACIONES CRUD
  // ===================================================================

  /**
   * Crear una nueva decisión
   */
  const createDecision = useCallback(async (
    decisionData: CreateProjectDecisionData
  ): Promise<ProjectDecision> => {
    try {
      setError(null);

      // Validar datos antes de enviar
      const validationErrors = decisionsService.validateDecisionData(decisionData);
      if (validationErrors.length > 0) {
        throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      console.log('✨ Creando nueva decisión para proyecto:', projectId);
      const newDecision = await decisionsService.createProjectDecision(projectId, decisionData);

      // Agregar la decisión a la lista local
      setDecisions(prevDecisions => [...prevDecisions, newDecision]);

      console.log('✅ Decisión creada exitosamente:', newDecision.title);
      return newDecision;
    } catch (err) {
      console.error('❌ Error creando decisión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creando decisión';
      setError(errorMessage);
      throw err;
    }
  }, [projectId]);

  /**
   * Actualizar una decisión existente
   */
  const updateDecision = useCallback(async (
    decisionId: string,
    updates: Partial<ProjectDecision>
  ): Promise<ProjectDecision> => {
    try {
      setError(null);

      console.log('📝 Actualizando decisión:', decisionId);
      const updatedDecision = await decisionsService.updateProjectDecision(decisionId, updates);

      // Actualizar en la lista local
      setDecisions(prevDecisions =>
        prevDecisions.map(decision =>
          decision.id === decisionId ? updatedDecision : decision
        )
      );

      console.log('✅ Decisión actualizada:', updatedDecision.title);
      return updatedDecision;
    } catch (err) {
      console.error('❌ Error actualizando decisión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando decisión';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Eliminar una decisión
   */
  const deleteDecision = useCallback(async (decisionId: string): Promise<void> => {
    try {
      setError(null);

      console.log('🗑️ Eliminando decisión:', decisionId);
      await decisionsService.deleteProjectDecision(decisionId);

      // Remover de la lista local
      setDecisions(prevDecisions =>
        prevDecisions.filter(decision => decision.id !== decisionId)
      );

      console.log('✅ Decisión eliminada exitosamente');
    } catch (err) {
      console.error('❌ Error eliminando decisión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando decisión';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // ===================================================================
  // EFECTOS
  // ===================================================================

  /**
   * Cargar decisiones cuando cambie el projectId
   */
  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  // ===================================================================
  // RETORNO DEL HOOK
  // ===================================================================

  return {
    decisions,
    loading,
    error,
    createDecision,
    updateDecision,
    deleteDecision,
    getNextSequenceNumber,
    refreshDecisions
  };
};

/**
 * Hook para manejo del árbol de decisiones (jerarquía)
 */
export const useDecisionTree = (projectId: string) => {
  const [decisionTree, setDecisionTree] = useState<ProjectDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecisionTree = useCallback(async () => {
    if (!projectId) {
      setDecisionTree([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🌳 Cargando árbol de decisiones:', projectId);
      const tree = await decisionsService.getDecisionTree(projectId);
      setDecisionTree(tree);

      console.log('✅ Árbol de decisiones cargado');
    } catch (err) {
      console.error('❌ Error cargando árbol:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDecisionTree();
  }, [loadDecisionTree]);

  return {
    decisionTree,
    loading,
    error,
    refresh: loadDecisionTree
  };
};

/**
 * Hook para estadísticas de decisiones
 */
export const useDecisionStats = (projectId: string) => {
  const [stats, setStats] = useState({
    total: 0,
    by_type: {
      strategic: 0,
      tactical: 0,
      operational: 0,
      research: 0,
      analytical: 0,
    },
    by_urgency: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Cargando estadísticas de decisiones:', projectId);
      const calculatedStats = await decisionsService.getProjectDecisionStats(projectId);
      setStats(calculatedStats);

      console.log('✅ Estadísticas cargadas:', calculatedStats);
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};

/**
 * Hook para filtrado y búsqueda de decisiones
 */
export const useDecisionFilters = (projectId: string) => {
  const [filteredDecisions, setFilteredDecisions] = useState<ProjectDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Filtrar decisiones por criterios
   */
  const filterDecisions = useCallback(async (filters: {
    decision_type?: ProjectDecision['decision_type'][];
    urgency?: ProjectDecision['urgency'][];
    tags?: string[];
    date_range?: {
      start?: string;
      end?: string;
    };
  }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Filtrando decisiones:', filters);
      const results = await decisionsService.filterProjectDecisions(projectId, filters);
      setFilteredDecisions(results);

      console.log('✅ Filtros aplicados:', results.length, 'resultados');
    } catch (err) {
      console.error('❌ Error filtrando decisiones:', err);
      setError(err instanceof Error ? err.message : 'Error en filtros');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Buscar decisiones por texto
   */
  const searchDecisions = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando decisiones:', searchTerm);
      const results = await decisionsService.searchProjectDecisions(projectId, searchTerm);
      setFilteredDecisions(results);

      console.log('✅ Búsqueda completada:', results.length, 'resultados');
    } catch (err) {
      console.error('❌ Error buscando decisiones:', err);
      setError(err instanceof Error ? err.message : 'Error en búsqueda');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Limpiar filtros y búsqueda
   */
  const clearFilters = useCallback(() => {
    setFilteredDecisions([]);
    setError(null);
  }, []);

  return {
    filteredDecisions,
    loading,
    error,
    filterDecisions,
    searchDecisions,
    clearFilters
  };
};

/**
 * Hook para actualizar métricas de decisiones
 */
export const useDecisionMetrics = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Actualizar métricas de éxito
   */
  const updateMetrics = useCallback(async (
    decisionId: string,
    metrics: Record<string, SuccessMetric>
  ) => {
    try {
      setUpdating(true);
      setError(null);

      console.log('📊 Actualizando métricas de decisión:', decisionId);
      const updatedDecision = await decisionsService.updateDecisionMetrics(decisionId, metrics);

      console.log('✅ Métricas actualizadas exitosamente');
      return updatedDecision;
    } catch (err) {
      console.error('❌ Error actualizando métricas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando métricas';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updating,
    error,
    updateMetrics
  };
};

/**
 * Hook para reordenamiento de decisiones
 */
export const useDecisionReordering = (projectId: string) => {
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reordenar decisiones
   */
  const reorderDecisions = useCallback(async (decisionIdsInOrder: string[]) => {
    try {
      setReordering(true);
      setError(null);

      console.log('🔄 Reordenando decisiones:', decisionIdsInOrder);
      await decisionsService.reorderProjectDecisions(projectId, decisionIdsInOrder);

      console.log('✅ Decisiones reordenadas exitosamente');
    } catch (err) {
      console.error('❌ Error reordenando decisiones:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error reordenando decisiones';
      setError(errorMessage);
      throw err;
    } finally {
      setReordering(false);
    }
  }, [projectId]);

  return {
    reordering,
    error,
    reorderDecisions
  };
};

/**
 * Hook específico para Timeline de Decisiones con Capas
 */
export const useDecisionTimeline = (projectId: string): UseDecisionTimelineResult => {
  const [timelineData, setTimelineData] = useState<DecisionTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    if (!projectId) {
      setTimelineData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📅 Cargando timeline de decisiones');
      const timeline = await decisionsService.getDecisionTimeline(projectId);
      setTimelineData(timeline);

      console.log('✅ Timeline cargado:', timeline.length, 'decisiones');
    } catch (err) {
      console.error('❌ Error cargando timeline:', err);
      setError(err instanceof Error ? err.message : 'Error cargando timeline');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshTimeline = useCallback(async () => {
    await loadTimeline();
  }, [loadTimeline]);

  // Cargar timeline cuando cambie el projectId
  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  return {
    timelineData,
    loading,
    error,
    refreshTimeline
  };
};

/**
 * Hook para manejo de decisiones padre-hijo
 */
export const useParentChildDecisions = (projectId: string): UseParentChildDecisionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear decisión hija
   */
  const createChildDecision = useCallback(async (
    parentDecisionId: string,
    decisionData: CreateProjectDecisionData
  ): Promise<ProjectDecision> => {
    try {
      setLoading(true);
      setError(null);

      console.log('👶 Creando decisión hija');
      const childDecision = await decisionsService.createChildDecision(
        projectId, 
        parentDecisionId, 
        decisionData
      );

      console.log('✅ Decisión hija creada exitosamente');
      return childDecision;
    } catch (err) {
      console.error('❌ Error creando decisión hija:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creando decisión hija';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Obtener decisiones hijas
   */
  const getChildDecisions = useCallback(async (parentDecisionId: string): Promise<ProjectDecision[]> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Obteniendo decisiones hijas');
      const children = await decisionsService.getChildDecisions(parentDecisionId);

      console.log('✅ Decisiones hijas obtenidas:', children.length);
      return children;
    } catch (err) {
      console.error('❌ Error obteniendo decisiones hijas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo decisiones hijas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Promover decisión a nivel superior
   */
  const promoteDecision = useCallback(async (decisionId: string): Promise<ProjectDecision> => {
    try {
      setLoading(true);
      setError(null);

      console.log('⬆️ Promoviendo decisión');
      const promotedDecision = await decisionsService.promoteDecision(decisionId);

      console.log('✅ Decisión promovida exitosamente');
      return promotedDecision;
    } catch (err) {
      console.error('❌ Error promoviendo decisión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error promoviendo decisión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mover decisión como hija de otra
   */
  const moveDecisionAsChild = useCallback(async (
    decisionId: string, 
    newParentId: string
  ): Promise<ProjectDecision> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 Moviendo decisión como hija');
      const movedDecision = await decisionsService.moveDecisionAsChild(decisionId, newParentId);

      console.log('✅ Decisión movida exitosamente');
      return movedDecision;
    } catch (err) {
      console.error('❌ Error moviendo decisión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error moviendo decisión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createChildDecision,
    getChildDecisions,
    promoteDecision,
    moveDecisionAsChild
  };
};

/**
 * Hook para validación de proyecto antes de crear decisiones
 */
export const useProjectValidation = (): UseProjectValidationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validar que un proyecto existe
   */
  const validateProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const exists = await decisionsService.validateProjectExists(projectId);
      
      if (!exists) {
        setError('Proyecto no encontrado');
      }

      return exists;
    } catch (err) {
      console.error('❌ Error validando proyecto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error validando proyecto';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear decisión con validación de proyecto
   */
  const createDecisionWithValidation = useCallback(async (
    projectId: string,
    decisionData: CreateProjectDecisionData
  ): Promise<ProjectDecision> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Creando decisión con validación de proyecto');
      const decision = await decisionsService.createDecisionWithValidation(projectId, decisionData);

      console.log('✅ Decisión creada con validación exitosa');
      return decision;
    } catch (err) {
      console.error('❌ Error creando decisión con validación:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creando decisión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    validateProject,
    createDecisionWithValidation
  };
}; 