import { supabase } from './supabase';
import { 
  ProjectDecision, 
  CreateProjectDecisionData,
  SuccessMetric
} from '../types/projects';

/**
 * Service para manejo de decisiones de proyectos
 * Incluye CRUD, secuencias y métricas de decisiones
 */

// ===================================================================
// CRUD BÁSICO DE DECISIONES
// ===================================================================

/**
 * Crear una nueva decisión en un proyecto
 */
export const createProjectDecision = async (
  projectId: string,
  decisionData: CreateProjectDecisionData
): Promise<ProjectDecision> => {
  try {
    console.log('⚖️ Creando decisión para proyecto:', projectId);

    // Obtener el siguiente número de secuencia
    const nextSequenceNumber = await getNextSequenceNumber(projectId);

    // Preparar datos con valores por defecto (compatibles con estructura Supabase)
    const decisionToCreate = {
      project_id: projectId,
      title: decisionData.title,
      description: decisionData.description,
      decision_type: decisionData.decision_type || 'operational',
      sequence_number: nextSequenceNumber,
      parent_decision_id: decisionData.parent_decision_id || null,
      rationale: decisionData.rationale || null,
      expected_impact: decisionData.expected_impact || null,
      resources_required: decisionData.resources_required || null,
      risks_identified: decisionData.risks_identified || null,
      status: 'pending', // Siempre empieza como pending (campo requerido en DB)
      urgency: decisionData.urgency || 'medium',
      stakeholders: null, // Inicializar como null
      tags: decisionData.tags || null,
      attachments: null, // Inicializar como null (jsonb)
      decision_references: null, // Inicializar como null (jsonb)
      success_metrics: decisionData.success_metrics || null,
      implementation_date: null,
      actual_impact: null,
      lessons_learned: null
    };

    const { data, error } = await supabase
      .from('project_decisions')
      .insert(decisionToCreate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando decisión:', error);
      throw error;
    }

    console.log('✅ Decisión creada exitosamente:', data);
    return data;
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

    // Simplificar consulta para evitar recursión infinita en policies
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo decisiones:', error);
      throw error;
    }

    console.log(`✅ Obtenidas ${data?.length || 0} decisiones`);
    return data || [];
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
 * Actualizar una decisión existente
 */
export const updateProjectDecision = async (
  decisionId: string,
  updates: Partial<ProjectDecision>
): Promise<ProjectDecision> => {
  try {
    console.log('📝 Actualizando decisión:', decisionId, updates);

    // Filtrar campos que no deberían actualizarse directamente
    const { 
      id, 
      project_id, 
      sequence_number, 
      created_at, 
      updated_at, 
      ...allowedUpdates 
    } = updates;

    const { data, error } = await supabase
      .from('project_decisions')
      .update(allowedUpdates)
      .eq('id', decisionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando decisión:', error);
      throw error;
    }

    console.log('✅ Decisión actualizada:', data);
    return data;
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
    const { data: childDecisions, error: childError } = await supabase
      .from('project_decisions')
      .select('id')
      .eq('parent_decision_id', decisionId);

    if (childError) throw childError;

    if (childDecisions && childDecisions.length > 0) {
      throw new Error('No se puede eliminar una decisión que tiene decisiones dependientes');
    }

    const { error } = await supabase
      .from('project_decisions')
      .delete()
      .eq('id', decisionId);

    if (error) {
      console.error('❌ Error eliminando decisión:', error);
      throw error;
    }

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
        strategic: decisions.filter(d => d.decision_type === 'strategic').length,
        tactical: decisions.filter(d => d.decision_type === 'tactical').length,
        operational: decisions.filter(d => d.decision_type === 'operational').length,
        research: decisions.filter(d => d.decision_type === 'research').length,
        analytical: decisions.filter(d => d.decision_type === 'analytical').length,
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
  
  // +2 si es decisión estratégica
  if (decision.decision_type === 'strategic') score += 2;
  
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