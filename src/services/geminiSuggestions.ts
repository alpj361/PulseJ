import { Project, ProjectDecision, SuggestionsResponse, ProjectSuggestion } from '../types/projects';
import { updateProject } from './projects';

// URL del backend para obtener sugerencias
// Usar siempre el servidor de producción por ahora hasta que el servidor local esté configurado
const BACKEND_URL = 'https://server.standatpd.com';

/**
 * Obtiene sugerencias inteligentes para un proyecto usando Gemini 1.5 Flash
 */
export async function getProjectSuggestions(
  project: Project,
  decisions: ProjectDecision[] = [],
  userToken: string
): Promise<SuggestionsResponse> {
  try {
    // Preparar contexto del proyecto
    const projectContext = {
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      category: project.category,
      tags: project.tags,
      start_date: project.start_date,
      target_date: project.target_date,
      created_at: project.created_at,
      updated_at: project.updated_at,
      decisions: decisions.map(d => ({
        title: d.title,
        description: d.description,
        decision_type: d.decision_type,
        sequence_number: d.sequence_number,
        created_at: d.created_at
      }))
    };

    const response = await fetch(`${BACKEND_URL}/api/project-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        project: projectContext,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      suggestions: data.suggestions || [],
      analysis: data.analysis || '',
      generatedAt: data.generatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting project suggestions:', error);
    throw new Error('Error obteniendo sugerencias del proyecto');
  }
}

/**
 * Guarda las sugerencias en la base de datos
 */
export async function saveSuggestionsToDatabase(projectId: string, suggestions: SuggestionsResponse): Promise<void> {
  try {
    console.log('💾 Guardando sugerencias en base de datos para proyecto:', projectId);
    
    await updateProject(projectId, {
      suggestions: suggestions
    });
    
    console.log('✅ Sugerencias guardadas exitosamente en la base de datos');
  } catch (error) {
    console.error('❌ Error guardando sugerencias en base de datos:', error);
    throw error;
  }
}

/**
 * Obtiene sugerencias desde la base de datos del proyecto
 */
export function getSuggestionsFromDatabase(project: Project): SuggestionsResponse | null {
  try {
    console.log('🔍 [getSuggestionsFromDatabase] Verificando proyecto:', {
      id: project.id,
      title: project.title,
      hasSuggestions: !!project.suggestions,
      suggestionsType: typeof project.suggestions,
      suggestionsValue: project.suggestions
    });

    if (project.suggestions) {
      // Verificar si las sugerencias no son muy viejas (menos de 24 horas para debugging)
      const cacheAge = Date.now() - new Date(project.suggestions.generatedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas para debugging
      
      console.log('⏰ [getSuggestionsFromDatabase] Verificando edad:', {
        generatedAt: project.suggestions.generatedAt,
        cacheAge: Math.round(cacheAge / (60 * 60 * 1000)) + ' horas',
        maxAge: Math.round(maxAge / (60 * 60 * 1000)) + ' horas',
        isValid: cacheAge < maxAge
      });
      
      if (cacheAge < maxAge) {
        console.log('✅ [getSuggestionsFromDatabase] Usando sugerencias desde base de datos');
        return project.suggestions;
      } else {
        console.log('⏰ [getSuggestionsFromDatabase] Sugerencias en base de datos están viejas');
      }
    } else {
      console.log('❌ [getSuggestionsFromDatabase] No hay sugerencias en el proyecto');
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ [getSuggestionsFromDatabase] Error:', error);
    return null;
  }
}

/**
 * Función de transición para compatibilidad - mantiene funcionamiento con localStorage como fallback
 */
export function getSuggestionsFromCache(projectId: string): SuggestionsResponse | null {
  try {
    const cacheKey = `project_suggestions_${projectId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const suggestions = JSON.parse(cached);
      // Verificar si el cache no es muy viejo (menos de 1 hora)
      const cacheAge = Date.now() - new Date(suggestions.generatedAt).getTime();
      if (cacheAge < 60 * 60 * 1000) { // 1 hora
        console.log('📱 Usando sugerencias desde localStorage (fallback)');
        return suggestions;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error getting suggestions from localStorage cache:', error);
    return null;
  }
}

/**
 * Obtiene el icono para cada categoría de sugerencia
 */
export function getSuggestionIcon(category: ProjectSuggestion['category']): string {
  switch (category) {
    case 'analysis':
      return '📊';
    case 'research':
      return '🔍';
    case 'platform':
      return '💻';
    case 'external':
      return '🌐';
    case 'documentation':
      return '📝';
    default:
      return '💡';
  }
}

/**
 * Obtiene el color para cada prioridad
 */
export function getPriorityColor(priority: ProjectSuggestion['priority']): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
} 