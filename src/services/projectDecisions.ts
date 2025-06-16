import { supabase } from './supabase';
import { 
  ProjectDecision, 
  CreateProjectDecisionData,
  SuccessMetric
} from '../types/projects';
import { 
  createProjectDecision as createProjectDecisionDB,
  getProjectDecisions as getProjectDecisionsDB,
  updateProjectDecision as updateProjectDecisionDB,
  deleteProjectDecision as deleteProjectDecisionDB,
  getChildDecisions as getChildDecisionsDB,
  getRootDecisions,
  moveDecisionAsChild as moveDecisionAsChildDB,
  promoteDecisionToRoot,
  getProjectStats
} from './supabase';

/**
 * Service para manejo de decisiones de proyectos con sistema de capas
 * Incluye CRUD, secuencias y métricas de decisiones con campos específicos por tipo
 */

// ===================================================================
// CRUD BÁSICO DE DECISIONES CON CAMPOS ESPECÍFICOS
// ===================================================================

/**
 * Encontrar la última decisión del mismo tipo para usarla como padre automáticamente
 */
export const findLastDecisionOfType = async (
  projectId: string, 
  decisionType: 'enfoque' | 'alcance' | 'configuracion'
): Promise<string | null> => {
  try {
    console.log(`🔍 Buscando última decisión de tipo "${decisionType}" en proyecto:`, projectId);

    const { data, error } = await supabase
      .from('project_decisions')
      .select('id, sequence_number, created_at')
      .eq('project_id', projectId)
      .eq('decision_type', decisionType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`✅ Encontrada decisión padre de tipo "${decisionType}":`, data[0].id);
      return data[0].id;
    }

    console.log(`ℹ️ No se encontró decisión anterior de tipo "${decisionType}"`);
    return null;
  } catch (error) {
    console.error('Error en findLastDecisionOfType:', error);
    return null;
  }
};

/**
 * Obtener el número de capa para una decisión del mismo tipo
 */
export const getNextLayerNumber = async (
  projectId: string, 
  decisionType: 'enfoque' | 'alcance' | 'configuracion'
): Promise<number> => {
  try {
    console.log(`🔢 Calculando número de capa para tipo "${decisionType}" en proyecto:`, projectId);

    const { data, error } = await supabase
      .from('project_decisions')
      .select('id')
      .eq('project_id', projectId)
      .eq('decision_type', decisionType)
      .is('parent_decision_id', null); // Solo contar decisiones raíz del mismo tipo

    if (error) throw error;

    const layerNumber = (data?.length || 0) + 1;
    console.log(`✅ Número de capa calculado: ${layerNumber}`);
    return layerNumber;
  } catch (error) {
    console.error('Error en getNextLayerNumber:', error);
    return 1;
  }
};

/**
 * Crear una nueva decisión de proyecto con sistema de capas numeradas
 * Las decisiones del mismo tipo se apilan como capas (Capa 1, Capa 2, etc.)
 * Solo las decisiones derivadas usan parent_decision_id
 */
export const createProjectDecision = async (
  projectId: string,
  decisionData: CreateProjectDecisionData & {
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
    // Nuevo campo para identificar si es decisión derivada
    is_derived?: boolean;
  }
): Promise<ProjectDecision> => {
  try {
    console.log('⚖️ Creando decisión para proyecto:', projectId);

    // Si no es una decisión derivada (no tiene parent_decision_id explícito), 
    // NO asignar padre automáticamente - solo apilar como capas
    let parentDecisionId = decisionData.parent_decision_id;
    let layerNumber = null;

    if (!parentDecisionId && !decisionData.is_derived) {
      // Es una capa nueva del mismo tipo - calcular número de capa
      layerNumber = await getNextLayerNumber(projectId, decisionData.decision_type || 'enfoque');
      console.log(`📋 Creando capa ${layerNumber} de tipo "${decisionData.decision_type}"`);
    }

    // Preparar datos específicos según el tipo de decisión
    const specificData = {
      title: decisionData.title,
      description: decisionData.description,
      decision_type: decisionData.decision_type || 'enfoque',
      parent_decision_id: parentDecisionId, // Solo si es decisión derivada
      // Campos generales
      change_description: decisionData.change_description,
      objective: decisionData.objective,
      next_steps: decisionData.next_steps,
      deadline: decisionData.deadline,
      urgency: decisionData.urgency,
      tags: decisionData.tags,
      // Campos específicos para enfoque
      focus_area: decisionData.focus_area,
      focus_context: decisionData.focus_context,
      // Campos específicos para alcance
      geographic_scope: decisionData.geographic_scope,
      monetary_scope: decisionData.monetary_scope,
      time_period_start: decisionData.time_period_start,
      time_period_end: decisionData.time_period_end,
      target_entities: decisionData.target_entities,
      scope_limitations: decisionData.scope_limitations,
      // Campos específicos para configuración
      output_format: decisionData.output_format,
      methodology: decisionData.methodology,
      data_sources: decisionData.data_sources,
      search_locations: decisionData.search_locations,
      tools_required: decisionData.tools_required,
      references: decisionData.references
    };

    const result = await createProjectDecisionDB(projectId, specificData);
    console.log('✅ Decisión creada exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error en createProjectDecision:', error);
    throw error;
  }
};

/**
 * Obtener todas las decisiones de un proyecto
 */
export const getProjectDecisions = async (
  projectId: string,
  includeParentChild: boolean = false
): Promise<ProjectDecision[]> => {
  try {
    console.log('📋 Obteniendo decisiones del proyecto:', projectId);
    const decisions = await getProjectDecisionsDB(projectId);
    console.log(`✅ Obtenidas ${decisions.length} decisiones`);
    return decisions;
  } catch (error) {
    console.error('Error en getProjectDecisions:', error);
    throw error;
  }
};

/**
 * Obtener una decisión específica por ID
 */
export const getProjectDecisionById = async (decisionId: string): Promise<ProjectDecision | null> => {
  try {
    console.log('🔍 Obteniendo decisión:', decisionId);

    // Simplificar consulta para evitar recursión infinita en policies
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('id', decisionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ Error obteniendo decisión:', error);
      throw error;
    }

    console.log('✅ Decisión obtenida:', data);
    return data;
  } catch (error) {
    console.error('Error en getProjectDecisionById:', error);
    throw error;
  }
};

/**
 * Actualizar una decisión existente con campos específicos
 */
export const updateProjectDecision = async (
  decisionId: string,
  updates: Partial<ProjectDecision>
): Promise<ProjectDecision> => {
  try {
    console.log('📝 Actualizando decisión:', decisionId, updates);
    const result = await updateProjectDecisionDB(decisionId, updates);
    console.log('✅ Decisión actualizada:', result);
    return result;
  } catch (error) {
    console.error('Error en updateProjectDecision:', error);
    throw error;
  }
};

/**
 * Eliminar una decisión
 */
export const deleteProjectDecision = async (decisionId: string): Promise<void> => {
  try {
    console.log('🗑️ Eliminando decisión:', decisionId);

    // Verificar si tiene decisiones hijas antes de eliminar
    const childDecisions = await getChildDecisionsDB(decisionId);
    if (childDecisions.length > 0) {
      throw new Error('No se puede eliminar una decisión que tiene decisiones dependientes');
    }

    await deleteProjectDecisionDB(decisionId);
    console.log('✅ Decisión eliminada exitosamente');
  } catch (error) {
    console.error('Error en deleteProjectDecision:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES ESPECIALES PARA SECUENCIAS Y JERARQUÍAS
// ===================================================================

/**
 * Obtener el siguiente número de secuencia para un proyecto
 */
export const getNextSequenceNumber = async (projectId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('sequence_number')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    const lastSequence = data && data.length > 0 ? data[0].sequence_number : 0;
    return lastSequence + 1;
  } catch (error) {
    console.error('Error en getNextSequenceNumber:', error);
    return 1; // Fallback al primer número
  }
};

/**
 * Reordenar las decisiones de un proyecto
 */
export const reorderProjectDecisions = async (
  projectId: string,
  decisionIdsInOrder: string[]
): Promise<void> => {
  try {
    console.log('🔄 Reordenando decisiones:', projectId, decisionIdsInOrder);

    // Actualizar cada decisión con su nuevo número de secuencia
    const updates = decisionIdsInOrder.map((decisionId, index) => 
      supabase
        .from('project_decisions')
        .update({ sequence_number: index + 1 })
        .eq('id', decisionId)
        .eq('project_id', projectId)
    );

    // Ejecutar todas las actualizaciones
    const results = await Promise.all(updates);
    
    // Verificar errores
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Errores reordenando decisiones:', errors);
      throw new Error('Error reordenando algunas decisiones');
    }

    console.log('✅ Decisiones reordenadas exitosamente');
  } catch (error) {
    console.error('Error en reorderProjectDecisions:', error);
    throw error;
  }
};

/**
 * Obtener el árbol de decisiones (jerarquía padre-hijo)
 */
export const getDecisionTree = async (projectId: string): Promise<ProjectDecision[]> => {
  try {
    console.log('🌳 Obteniendo árbol de decisiones:', projectId);

    // Obtener todas las decisiones con información de jerarquía
    const decisions = await getProjectDecisions(projectId, true);

    // Organizar en estructura de árbol (decisiones raíz primero)
    const rootDecisions = decisions.filter(d => !d.parent_decision_id);
    const childDecisions = decisions.filter(d => d.parent_decision_id);

    // Función recursiva para construir el árbol
    const buildTree = (parentId: string | null): ProjectDecision[] => {
      return decisions
        .filter(d => d.parent_decision_id === parentId)
        .map(decision => ({
          ...decision,
          child_decisions: buildTree(decision.id)
        }));
    };

    return buildTree(null);
  } catch (error) {
    console.error('Error en getDecisionTree:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES PARA ESTADO Y MÉTRICAS
// ===================================================================

/**
 * Actualizar métricas de éxito de una decisión
 */
export const updateDecisionMetrics = async (
  decisionId: string,
  metrics: Record<string, SuccessMetric>
): Promise<ProjectDecision> => {
  try {
    console.log('📊 Actualizando métricas de decisión:', decisionId);

    return await updateProjectDecision(decisionId, {
      success_metrics: metrics
    });
  } catch (error) {
    console.error('Error en updateDecisionMetrics:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de decisiones de un proyecto
 */
export const getProjectDecisionStats = async (projectId: string) => {
  try {
    const decisions = await getProjectDecisions(projectId);

    const stats = {
      total: decisions.length,
      by_type: {
        enfoque: decisions.filter(d => d.decision_type === 'enfoque').length,
        alcance: decisions.filter(d => d.decision_type === 'alcance').length,
        configuracion: decisions.filter(d => d.decision_type === 'configuracion').length,
      },
      by_urgency: {
        low: decisions.filter(d => d.urgency === 'low').length,
        medium: decisions.filter(d => d.urgency === 'medium').length,
        high: decisions.filter(d => d.urgency === 'high').length,
        critical: decisions.filter(d => d.urgency === 'critical').length,
      }
    };

    return stats;
  } catch (error) {
    console.error('Error en getProjectDecisionStats:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES DE FILTRADO Y BÚSQUEDA
// ===================================================================

/**
 * Filtrar decisiones por criterios específicos
 */
export const filterProjectDecisions = async (
  projectId: string,
  filters: {
    decision_type?: ProjectDecision['decision_type'][];
    urgency?: ProjectDecision['urgency'][];
    tags?: string[];
    date_range?: {
      start?: string;
      end?: string;
    };
  }
): Promise<ProjectDecision[]> => {
  try {
    console.log('🔍 Filtrando decisiones:', projectId, filters);

    let query = supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId);

    // Aplicar filtros
    if (filters.decision_type && filters.decision_type.length > 0) {
      query = query.in('decision_type', filters.decision_type);
    }

    if (filters.urgency && filters.urgency.length > 0) {
      query = query.in('urgency', filters.urgency);
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

    query = query.order('sequence_number', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error filtrando decisiones:', error);
      throw error;
    }

    console.log(`✅ Filtradas ${data?.length || 0} decisiones`);
    return data || [];
  } catch (error) {
    console.error('Error en filterProjectDecisions:', error);
    throw error;
  }
};

/**
 * Buscar decisiones por texto en título y descripción
 */
export const searchProjectDecisions = async (
  projectId: string,
  searchTerm: string
): Promise<ProjectDecision[]> => {
  try {
    console.log('🔍 Buscando decisiones:', projectId, searchTerm);

    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,rationale.ilike.%${searchTerm}%`)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.error('❌ Error buscando decisiones:', error);
      throw error;
    }

    console.log(`✅ Encontradas ${data?.length || 0} decisiones`);
    return data || [];
  } catch (error) {
    console.error('Error en searchProjectDecisions:', error);
    throw error;
  }
};

// ===================================================================
// FUNCIONES DE VALIDACIÓN
// ===================================================================

/**
 * Validar datos de decisión antes de crear/actualizar
 */
export const validateDecisionData = (data: CreateProjectDecisionData): string[] => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('El título es requerido');
  }

  if (data.title && data.title.length > 255) {
    errors.push('El título no puede exceder 255 caracteres');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('La descripción es requerida');
  }

  if (data.description && data.description.length > 5000) {
    errors.push('La descripción no puede exceder 5000 caracteres');
  }

  if (data.tags && data.tags.length > 20) {
    errors.push('No se pueden agregar más de 20 etiquetas');
  }

  if (data.risks_identified && data.risks_identified.length > 50) {
    errors.push('No se pueden identificar más de 50 riesgos');
  }

  return errors;
};

// ===================================================================
// SISTEMA DE TIMELINE Y CAPAS
// ===================================================================

/**
 * Obtener decisiones organizadas por timeline con información de capas
 */
export const getDecisionTimeline = async (projectId: string) => {
  try {
    console.log('📅 Obteniendo timeline de decisiones para proyecto:', projectId);

    // Obtener decisiones sin joins para evitar recursión infinita en policies
    const decisions = await getProjectDecisions(projectId, false);
    
    // Organizar decisiones por capas (niveles de profundidad)
    const timelineData = decisions.map(decision => {
      const depth = calculateDecisionDepth(decision.id, decisions);
      const childrenCount = decisions.filter(d => d.parent_decision_id === decision.id).length;
      const isRootDecision = !decision.parent_decision_id;
      
      return {
        ...decision,
        timeline_layer: depth,
        children_count: childrenCount,
        is_root: isRootDecision,
        complexity_score: calculateComplexityScore(decision, decisions)
      };
    });

    // Ordenar por secuencia y luego por profundidad
    const sortedTimeline = timelineData.sort((a, b) => {
      if (a.sequence_number !== b.sequence_number) {
        return a.sequence_number - b.sequence_number;
      }
      return a.timeline_layer - b.timeline_layer;
    });

    console.log('✅ Timeline de decisiones organizado:', sortedTimeline.length);
    return sortedTimeline;
  } catch (error) {
    console.error('Error en getDecisionTimeline:', error);
    throw error;
  }
};

/**
 * Calcular la profundidad de una decisión en el árbol
 */
function calculateDecisionDepth(decisionId: string, allDecisions: ProjectDecision[]): number {
  const decision = allDecisions.find(d => d.id === decisionId);
  if (!decision || !decision.parent_decision_id) return 0;
  
  return 1 + calculateDecisionDepth(decision.parent_decision_id, allDecisions);
}

/**
 * Calcular score de complejidad basado en relaciones y métricas
 */
function calculateComplexityScore(decision: ProjectDecision, allDecisions: ProjectDecision[]): number {
  let score = 0;
  
  // +1 por cada decisión hija
  const childrenCount = allDecisions.filter(d => d.parent_decision_id === decision.id).length;
  score += childrenCount;
  
  // +1 por cada riesgo identificado
  score += decision.risks_identified?.length || 0;
  
  // +1 por cada métrica de éxito
  score += Object.keys(decision.success_metrics || {}).length;
  
  // +2 si es decisión de enfoque (equivalente a estratégica)
  if (decision.decision_type === 'enfoque') score += 2;
  
  // +1 por urgencia alta/crítica
  if (decision.urgency === 'high' || decision.urgency === 'critical') score += 1;
  
  return score;
}

/**
 * Crear decisión hija vinculada a una decisión padre
 */
export const createChildDecision = async (
  projectId: string,
  parentDecisionId: string,
  decisionData: CreateProjectDecisionData
): Promise<ProjectDecision> => {
  try {
    console.log('👶 Creando decisión hija para:', parentDecisionId);

    // Verificar que la decisión padre existe
    const parentDecision = await getProjectDecisionById(parentDecisionId);
    if (!parentDecision) {
      throw new Error('Decisión padre no encontrada');
    }

    // Crear la decisión con el parent_decision_id
    const childDecisionData = {
      ...decisionData,
      parent_decision_id: parentDecisionId
    };

    const newChildDecision = await createProjectDecision(projectId, childDecisionData);
    console.log('✅ Decisión hija creada:', newChildDecision.title);
    
    return newChildDecision;
  } catch (error) {
    console.error('Error en createChildDecision:', error);
    throw error;
  }
};

/**
 * Obtener todas las decisiones hijas de una decisión padre
 */
export const getChildDecisions = async (parentDecisionId: string): Promise<ProjectDecision[]> => {
  try {
    console.log('👶 Obteniendo decisiones hijas de:', parentDecisionId);

    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('parent_decision_id', parentDecisionId)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo decisiones hijas:', error);
      throw error;
    }

    console.log(`✅ Obtenidas ${data?.length || 0} decisiones hijas`);
    return data || [];
  } catch (error) {
    console.error('Error en getChildDecisions:', error);
    throw error;
  }
};

/**
 * Validar que existe un proyecto antes de crear decisiones
 */
export const validateProjectExists = async (projectId: string): Promise<boolean> => {
  try {
    console.log('🔍 Validando existencia del proyecto:', projectId);

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Proyecto no encontrado');
        return false;
      }
      throw error;
    }

    console.log('✅ Proyecto existe');
    return true;
  } catch (error) {
    console.error('Error en validateProjectExists:', error);
    throw error;
  }
};

/**
 * Crear decisión con validación de proyecto
 */
export const createDecisionWithValidation = async (
  projectId: string,
  decisionData: CreateProjectDecisionData
): Promise<ProjectDecision> => {
  try {
    // RESTRICCIÓN: Solo crear decisiones si el proyecto existe
    const projectExists = await validateProjectExists(projectId);
    if (!projectExists) {
      throw new Error('No se puede crear la decisión: el proyecto no existe. Crea primero un proyecto.');
    }

    return await createProjectDecision(projectId, decisionData);
  } catch (error) {
    console.error('Error en createDecisionWithValidation:', error);
    throw error;
  }
};

/**
 * Promover una decisión a un nivel superior en la jerarquía
 */
export const promoteDecision = async (decisionId: string): Promise<ProjectDecision> => {
  try {
    console.log('⬆️ Promoviendo decisión:', decisionId);

    const decision = await getProjectDecisionById(decisionId);
    if (!decision) {
      throw new Error('Decisión no encontrada');
    }

    // Si ya es raíz, no se puede promover más
    if (!decision.parent_decision_id) {
      throw new Error('La decisión ya está en el nivel raíz');
    }

    // Remover el parent_decision_id para hacerla raíz
    const promotedDecision = await updateProjectDecision(decisionId, {
      parent_decision_id: undefined
    });

    console.log('✅ Decisión promovida exitosamente');
    return promotedDecision;
  } catch (error) {
    console.error('Error en promoteDecision:', error);
    throw error;
  }
};

/**
 * Mover una decisión como hija de otra decisión
 */
export const moveDecisionAsChild = async (
  decisionId: string,
  newParentId: string
): Promise<ProjectDecision> => {
  try {
    console.log('📦 Moviendo decisión como hija:', { decisionId, newParentId });

    // Verificar que ambas decisiones existen
    const [decision, newParent] = await Promise.all([
      getProjectDecisionById(decisionId),
      getProjectDecisionById(newParentId)
    ]);

    if (!decision || !newParent) {
      throw new Error('Una o ambas decisiones no fueron encontradas');
    }

    // Verificar que no se está creando un ciclo
    if (await wouldCreateCycle(decisionId, newParentId)) {
      throw new Error('No se puede mover: crearía un ciclo en la jerarquía');
    }

    const movedDecision = await updateProjectDecision(decisionId, {
      parent_decision_id: newParentId
    });

    console.log('✅ Decisión movida exitosamente');
    return movedDecision;
  } catch (error) {
    console.error('Error en moveDecisionAsChild:', error);
    throw error;
  }
};

/**
 * Verificar si mover una decisión crearía un ciclo
 */
async function wouldCreateCycle(decisionId: string, potentialParentId: string): Promise<boolean> {
  try {
    const potentialParent = await getProjectDecisionById(potentialParentId);
    if (!potentialParent) return false;

    // Si el potencial padre ya es hijo de la decisión que queremos mover, habría ciclo
    if (potentialParent.parent_decision_id === decisionId) return true;

    // Recursivamente verificar hacia arriba
    if (potentialParent.parent_decision_id) {
      return await wouldCreateCycle(decisionId, potentialParent.parent_decision_id);
    }

    return false;
  } catch (error) {
    console.error('Error verificando ciclos:', error);
    return true; // En caso de error, asumir que habría ciclo por seguridad
  }
} 