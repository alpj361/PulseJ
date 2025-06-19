import { TrendingTweet } from './index';

// Tipos para sugerencias de IA
export interface ProjectSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'analysis' | 'research' | 'platform' | 'external' | 'documentation';
  priority: 'high' | 'medium' | 'low';
  action: string;
  estimatedTime: string;
  tools: string[];
}

export interface SuggestionsResponse {
  suggestions: ProjectSuggestion[];
  analysis: string;
  generatedAt: string;
}

// Interfaz para las tareas del proyecto
export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  project_id: string;
}

export interface TasksResponse {
  tasks: ProjectTask[];
  updatedAt: string;
}

// Tipos básicos para el sistema de proyectos
export interface Actor {
  name: string;
  role: string;
  influence: 'high' | 'medium' | 'low';
  position?: string;
  description?: string;
}

export interface Reference {
  type: 'url' | 'document' | 'article' | 'research' | 'news';
  title: string;
  url?: string;
  date?: string;
  author?: string;
  description?: string;
}

export interface SuccessMetric {
  target: number;
  actual?: number;
  unit: string;
  description?: string;
}

// Interfaz principal de Proyecto
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
  collaborators?: string[]; // Array de UUIDs de usuarios
  suggestions?: SuggestionsResponse | null; // Sugerencias de IA persistentes
  tasks?: TasksResponse | null; // Tareas del proyecto persistentes
  created_at: string;
  updated_at: string;
}

// Interfaz para el contexto del proyecto
export interface ProjectContext {
  id: string;
  project_id: string;
  situation_description: string;
  data_sources: string[];
  objectives: string[];
  key_actors: Actor[];
  main_problem?: string;
  geographic_scope?: string;
  time_frame?: string;
  source_references: Reference[];
  external_links: string[];
  context_type: 'initial' | 'updated' | 'revision';
  version: number;
  // Integración con trending tweets
  selected_trends?: TrendingTweet[];
  created_at: string;
  updated_at: string;
}

// Interfaz para las decisiones del proyecto (coincide con estructura Supabase)
export interface ProjectDecision {
  id: string;
  project_id: string;
  title: string;
  description: string;
  decision_type: 'enfoque' | 'alcance' | 'configuracion';
  sequence_number: number;
  parent_decision_id?: string | null;
  // Nuevos campos para el sistema de capas
  change_description?: string | null; // Descripción del cambio
  objective?: string | null; // Objetivo de la decisión
  next_steps?: string | null; // Siguientes pasos
  deadline?: string | null; // Fecha límite (opcional)
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
  rationale?: string | null; // Justificación
  expected_impact?: string | null; // Impacto esperado
  resources_required?: string | null; // Recursos necesarios
  risks_identified: string[] | null; // Riesgos identificados
  // Campo status eliminado - las decisiones se toman cuando se crean
  implementation_date?: string | null;
  actual_impact?: string | null; // Impacto real después de implementar
  lessons_learned?: string | null; // Lecciones aprendidas
  success_metrics: Record<string, SuccessMetric> | null; // Métricas de éxito (jsonb)
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stakeholders?: string[] | null; // UUIDs de stakeholders
  tags: string[] | null;
  attachments: any[] | null; // Para archivos adjuntos (jsonb)
  decision_references: any[] | null; // Referencias específicas (jsonb)
  created_at: string;
  updated_at: string;
}

// Interfaces para los formularios (sin campos auto-generados)
export interface CreateProjectData {
  title: string;
  description?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  category?: string;
  tags?: string[];
  start_date?: string;
  target_date?: string;
  visibility?: Project['visibility'];
}

export interface CreateProjectContextData {
  situation_description: string;
  data_sources?: string[];
  objectives?: string[];
  key_actors?: Actor[];
  main_problem?: string;
  geographic_scope?: string;
  time_frame?: string;
  source_references?: Reference[];
  external_links?: string[];
  context_type?: ProjectContext['context_type'];
  selected_trends?: TrendingTweet[];
}

export interface CreateProjectDecisionData {
  title: string;
  description: string;
  decision_type?: ProjectDecision['decision_type'];
  parent_decision_id?: string;
  // Nuevos campos para el sistema de capas
  change_description?: string;
  objective?: string;
  next_steps?: string;
  deadline?: string;
  // Campos existentes mantenidos por compatibilidad
  rationale?: string;
  expected_impact?: string;
  resources_required?: string;
  risks_identified?: string[];
  urgency?: ProjectDecision['urgency'];
  tags?: string[];
  success_metrics?: Record<string, SuccessMetric>;
}

// Interfaces para respuestas de API
export interface ProjectWithContext extends Project {
  context?: ProjectContext;
  decisions_count?: number;
  latest_decision?: ProjectDecision;
}

export interface ProjectStats {
  total_decisions: number;
  implemented_decisions: number;
  pending_decisions: number;
  memory_entries: number;
  latest_activity: string;
  context_updates: number;
}

// Tipos para filtros y búsquedas
export interface ProjectFilters {
  status?: Project['status'][];
  priority?: Project['priority'][];
  category?: string[];
  tags?: string[];
  date_range?: {
    start?: string;
    end?: string;
  };
}

export interface ProjectSortOptions {
  field: 'created_at' | 'updated_at' | 'title' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

// Interfaces para hooks
export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export interface UseProjectContextResult {
  context: ProjectContext | null;
  loading: boolean;
  error: string | null;
  createContext: (data: CreateProjectContextData) => Promise<ProjectContext>;
  updateContext: (data: Partial<ProjectContext>) => Promise<ProjectContext>;
  refreshContext: () => Promise<void>;
}

export interface UseProjectDecisionsResult {
  decisions: ProjectDecision[];
  loading: boolean;
  error: string | null;
  createDecision: (data: CreateProjectDecisionData) => Promise<ProjectDecision>;
  updateDecision: (id: string, data: Partial<ProjectDecision>) => Promise<ProjectDecision>;
  deleteDecision: (id: string) => Promise<void>;
  getNextSequenceNumber: () => number;
  refreshDecisions: () => Promise<void>;
}

// ===================================================================
// INTERFACES PARA TIMELINE Y SISTEMA DE CAPAS
// ===================================================================

export interface DecisionTimelineItem extends ProjectDecision {
  timeline_layer: number;        // Profundidad en el árbol (0 = raíz)
  children_count: number;        // Número de decisiones hijas
  is_root: boolean;             // Si es una decisión raíz
  complexity_score: number;     // Score de complejidad calculado
  parent_decision?: ProjectDecision;  // Información de la decisión padre
  child_decisions?: ProjectDecision[]; // Lista de decisiones hijas
}

export interface TimelineLayer {
  layer_depth: number;          // Nivel de profundidad
  decisions: DecisionTimelineItem[]; // Decisiones en esta capa
  total_complexity: number;     // Complejidad total de la capa
}

export interface DecisionHierarchy {
  root_decisions: ProjectDecision[];    // Decisiones sin padre
  child_decisions: ProjectDecision[];   // Decisiones con padre
  max_depth: number;                   // Profundidad máxima del árbol
  total_decisions: number;             // Total de decisiones
}

// ===================================================================
// INTERFACES PARA HOOKS NUEVOS
// ===================================================================

export interface UseDecisionTimelineResult {
  timelineData: DecisionTimelineItem[];
  loading: boolean;
  error: string | null;
  refreshTimeline: () => Promise<void>;
}

export interface UseParentChildDecisionsResult {
  loading: boolean;
  error: string | null;
  createChildDecision: (parentDecisionId: string, decisionData: CreateProjectDecisionData) => Promise<ProjectDecision>;
  getChildDecisions: (parentDecisionId: string) => Promise<ProjectDecision[]>;
  promoteDecision: (decisionId: string) => Promise<ProjectDecision>;
  moveDecisionAsChild: (decisionId: string, newParentId: string) => Promise<ProjectDecision>;
}

export interface UseProjectValidationResult {
  loading: boolean;
  error: string | null;
  validateProject: (projectId: string) => Promise<boolean>;
  createDecisionWithValidation: (projectId: string, decisionData: CreateProjectDecisionData) => Promise<ProjectDecision>;
}

// ===================================================================
// TIPOS PARA OPERACIONES DE TIMELINE
// ===================================================================

export type DecisionLayerAction = 
  | 'promote'           // Subir decisión a nivel superior
  | 'demote'           // Bajar decisión a nivel inferior
  | 'move_as_child'    // Mover como hija de otra decisión
  | 'make_root';       // Convertir en decisión raíz

export interface DecisionMoveOperation {
  action: DecisionLayerAction;
  decisionId: string;
  targetParentId?: string;  // Solo para move_as_child
  reason?: string;          // Razón del movimiento
} 