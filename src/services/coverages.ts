// ===================================================================
// SERVICIO DE COBERTURAS GEOGRÁFICAS
// Gestiona zonas, ciudades, departamentos y países cubiertos por proyectos
// ===================================================================

import { supabase } from './supabase';

// ===================================================================
// TIPOS Y INTERFACES
// ===================================================================

export type CoverageType = 'pais' | 'departamento' | 'ciudad' | 'zona' | 'region';
export type DetectionSource = 'manual' | 'ai_detection' | 'transcription' | 'document_analysis';
export type CoverageStatus = 'active' | 'planned' | 'completed' | 'excluded';
export type RelevanceLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Coverage {
  id: string;
  project_id: string;
  coverage_type: CoverageType;
  name: string;
  parent_name?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  detection_source: DetectionSource;
  confidence_score: number;
  source_item_id?: string;
  source_card_id?: string;
  description?: string;
  relevance: RelevanceLevel;
  coverage_status: CoverageStatus;
  discovery_context?: string;
  tags: string[];
  extra_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CoverageStats {
  total: number;
  by_type: Record<CoverageType, number>;
  by_source: Record<DetectionSource, number>;
  by_status: Record<CoverageStatus, number>;
  by_relevance?: Record<RelevanceLevel, number>;
  timeline?: Record<string, number>;
}

export interface CreateCoverageData {
  project_id: string;
  coverage_type: CoverageType;
  name: string;
  parent_name?: string;
  description?: string;
  relevance?: RelevanceLevel;
  coordinates?: { lat: number; lng: number };
  tags?: string[];
  source_card_id?: string;
  source_item_id?: string;
}

export interface CoverageFilters {
  type?: CoverageType;
  status?: CoverageStatus;
  source?: DetectionSource;
}

export interface CoveragesResponse {
  success: boolean;
  coverages: Coverage[];
  stats: CoverageStats;
  filters: CoverageFilters;
}

export interface CoverageFromCardResponse {
  success: boolean;
  created_coverages: Coverage[];
  created_count: number;
  errors?: string[];
  message: string;
}

// ===================================================================
// HALLAZGOS ASOCIADOS A COBERTURAS
// ===================================================================

export interface CapturadoCard {
  id: string;
  entity: string | null;
  city: string | null;
  department: string | null;
  pais: string | null;
  topic: string | null;
  description: string | null;
  discovery: string | null;
  created_at: string;
}

export interface CoverageGroup {
  topic: string;
  countries: string[];
  departments: string[];
  cities: string[];
  total_cards: number;
  coverages_created: Coverage[];
}

export interface AutoDetectResponse {
  success: boolean;
  coverage_groups: CoverageGroup[];
  created_count: number;
  updated_count?: number;
  total_processed?: number;
  themes_count: number;
  cards_processed: number;
  errors?: string[];
  message: string;
}

// ===================================================================
// FUNCIONES PRINCIPALES
// ===================================================================

/**
 * Obtiene las coberturas de un proyecto con filtros opcionales
 */
export async function getCoverages(
  projectId: string, 
  filters: CoverageFilters = {}
): Promise<CoveragesResponse> {
  try {
    const params = new URLSearchParams({
      project_id: projectId,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    const response = await fetch(`https://server.standatpd.com/api/coverages?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener coberturas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching coverages:', error);
    throw error;
  }
}

/**
 * Crea una nueva cobertura manualmente
 */
export async function createCoverage(data: CreateCoverageData): Promise<Coverage> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear cobertura');
    }

    const result = await response.json();
    return result.coverage;
  } catch (error) {
    console.error('Error creating coverage:', error);
    throw error;
  }
}

/**
 * Crea coberturas desde información de una card capturada
 */
export async function createCoverageFromCard(
  cardId: string, 
  projectId: string
): Promise<CoverageFromCardResponse> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages/from-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        card_id: cardId,
        project_id: projectId
      })
    });

    if (!response.ok) {
      let errorMessage = 'Error al crear coberturas desde card';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // Si no se puede parsear el JSON del error, usar el status text
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('La respuesta del servidor no es JSON válido');
    }

    const text = await response.text();
    if (!text.trim()) {
      throw new Error('La respuesta del servidor está vacía');
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON response:', text);
      throw new Error('Respuesta del servidor no es JSON válido');
    }
  } catch (error) {
    console.error('Error creating coverage from card:', error);
    throw error;
  }
}

/**
 * Actualiza una cobertura existente
 */
export async function updateCoverage(
  coverageId: string, 
  updates: Partial<Pick<Coverage, 'name' | 'parent_name' | 'description' | 'relevance' | 'coverage_status' | 'coordinates' | 'tags'>>
): Promise<Coverage> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages/${coverageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar cobertura');
    }

    const result = await response.json();
    return result.coverage;
  } catch (error) {
    console.error('Error updating coverage:', error);
    throw error;
  }
}

/**
 * Elimina una cobertura
 */
export async function deleteCoverage(coverageId: string): Promise<void> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages/${coverageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar cobertura');
    }
  } catch (error) {
    console.error('Error deleting coverage:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas detalladas de coberturas de un proyecto
 */
export async function getCoverageStats(projectId: string): Promise<CoverageStats> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages/stats/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener estadísticas');
    }

    const result = await response.json();
    return result.stats;
  } catch (error) {
    console.error('Error fetching coverage stats:', error);
    throw error;
  }
}

// ===================================================================
// UTILIDADES Y HELPERS
// ===================================================================

/**
 * Obtiene el ícono apropiado para cada tipo de cobertura
 */
export function getCoverageIcon(type: CoverageType): string {
  const icons: Record<CoverageType, string> = {
    pais: '🌍',
    departamento: '🏛️',
    ciudad: '🏙️',
    zona: '📍',
    region: '🗺️'
  };
  return icons[type] || '📍';
}

/**
 * Obtiene el color apropiado para cada tipo de cobertura
 */
export function getCoverageColor(type: CoverageType): string {
  const colors: Record<CoverageType, string> = {
    pais: 'bg-blue-100 text-blue-800',
    departamento: 'bg-green-100 text-green-800',
    ciudad: 'bg-purple-100 text-purple-800',
    zona: 'bg-orange-100 text-orange-800',
    region: 'bg-teal-100 text-teal-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el color apropiado para cada fuente de detección
 */
export function getSourceColor(source: DetectionSource): string {
  const colors: Record<DetectionSource, string> = {
    manual: 'bg-blue-100 text-blue-800',
    ai_detection: 'bg-purple-100 text-purple-800',
    transcription: 'bg-green-100 text-green-800',
    document_analysis: 'bg-orange-100 text-orange-800'
  };
  return colors[source] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el color apropiado para cada nivel de relevancia
 */
export function getRelevanceColor(relevance: RelevanceLevel): string {
  const colors: Record<RelevanceLevel, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return colors[relevance] || 'bg-gray-100 text-gray-800';
}

/**
 * Formatea el nombre de la cobertura para mostrar
 */
export function formatCoverageName(coverage: Coverage): string {
  if (coverage.parent_name && coverage.parent_name !== coverage.name) {
    return `${coverage.name}, ${coverage.parent_name}`;
  }
  return coverage.name;
}

/**
 * Valida si una card tiene información geográfica válida
 */
export function hasValidGeographicInfo(card: any): boolean {
  return !!(card.city || card.department);
}

/**
 * Extrae información geográfica de una card
 */
export function extractGeographicInfo(card: any): { city?: string; department?: string } {
  return {
    city: card.city?.trim() || undefined,
    department: card.department?.trim() || undefined
  };
}

/**
 * Agrupa coberturas por tipo para visualización
 */
export function groupCoveragesByType(coverages: Coverage[]): Record<CoverageType, Coverage[]> {
  return coverages.reduce((groups, coverage) => {
    const type = coverage.coverage_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(coverage);
    return groups;
  }, {} as Record<CoverageType, Coverage[]>);
}

/**
 * Filtra coberturas por texto de búsqueda
 */
export function filterCoveragesBySearch(coverages: Coverage[], searchText: string): Coverage[] {
  if (!searchText.trim()) return coverages;
  
  const search = searchText.toLowerCase();
  return coverages.filter(coverage => 
    coverage.name.toLowerCase().includes(search) ||
    coverage.parent_name?.toLowerCase().includes(search) ||
    coverage.description?.toLowerCase().includes(search) ||
    coverage.discovery_context?.toLowerCase().includes(search)
  );
}

/**
 * Detecta coberturas automáticamente desde hallazgos agrupadas por tema
 */
export async function autoDetectCoverages(projectId: string): Promise<AutoDetectResponse> {
  try {
    const response = await fetch(`https://server.standatpd.com/api/coverages/auto-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al detectar coberturas automáticamente');
    }

    return await response.json();
  } catch (error) {
    console.error('Error auto-detecting coverages:', error);
    throw error;
  }
}

/**
 * Obtiene hallazgos agrupados por tema con información geográfica
 */
export async function getFindingsByTheme(projectId: string): Promise<Record<string, CapturadoCard[]>> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('capturado_cards')
      .select('id, entity, city, department, pais, topic, description, discovery, created_at')
      .eq('project_id', projectId)
      .or('pais.not.is.null,city.not.is.null,department.not.is.null')
      .order('topic', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Agrupar por tema
    const grouped: Record<string, CapturadoCard[]> = {};
    data.forEach(card => {
      const theme = card.topic || 'General';
      if (!grouped[theme]) {
        grouped[theme] = [];
      }
      grouped[theme].push(card as CapturadoCard);
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching findings by theme:', error);
    return {};
  }
}

/**
 * Devuelve las cards capturadas que coincidan con la cobertura (ciudad, departamento o país)
 */
export async function getFindingsForCoverage(projectId: string, coverage: Coverage): Promise<CapturadoCard[]> {
  try {
    // Si el proyecto es público o el usuario tiene sesión, supabase ya tiene la sesión
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('No autenticado');

    let matchField: string;
    switch (coverage.coverage_type) {
      case 'pais':
        matchField = 'pais';
        break;
      case 'ciudad':
        matchField = 'city';
        break;
      case 'departamento':
        matchField = 'department';
        break;
      default:
        return [];
    }

    const { data, error } = await supabase
      .from('capturado_cards')
      .select('id, entity, city, department, pais, topic, description, discovery, created_at')
      .eq('project_id', projectId)
      .eq(matchField, coverage.name)
      .limit(50);

    if (error) throw error;
    return data as CapturadoCard[];
  } catch (error) {
    console.error('Error fetching findings for coverage:', error);
    return [];
  }
} 