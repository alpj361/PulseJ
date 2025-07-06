import { supabase } from './supabase';

/**
 * Obtener el límite de capas del usuario autenticado
 */
export async function getUserLayersLimit(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 3; // Valor por defecto si no hay usuario

    // Verificar si estamos en modo demo
    const isDemoMode = user.id === 'demo-user-id' || new URLSearchParams(window.location.search).get('demo') === 'true';
    
    if (isDemoMode) {
      console.log('🎭 getUserLayersLimit - Modo demo: límite generoso');
      return 50; // Límite generoso para modo demo
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('layerslimit')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user layers limit:', error);
      return 3; // Valor por defecto en caso de error
    }

    return data?.layerslimit || 3;
  } catch (error) {
    console.error('Error in getUserLayersLimit:', error);
    return 3;
  }
}

/**
 * Contar capas existentes de un tipo específico en un proyecto
 */
export async function countUserLayersByType(
  projectId: string, 
  decisionType: 'enfoque' | 'alcance' | 'configuracion'
): Promise<number> {
  try {
    // Verificar si estamos en modo demo
    const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
    
    if (isDemoMode) {
      console.log('🎭 countUserLayersByType - Modo demo: simulando capas existentes');
      // Simular datos realistas para demo
      const demoCounts = {
        'enfoque': 2,
        'alcance': 1,
        'configuracion': 3
      };
      return demoCounts[decisionType] || 0;
    }

    const { data, error } = await supabase
      .from('project_decisions')
      .select('id')
      .eq('project_id', projectId)
      .eq('decision_type', decisionType)
      .is('parent_decision_id', null); // Solo capas raíz, no derivadas

    if (error) {
      console.error('Error counting layers:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in countUserLayersByType:', error);
    return 0;
  }
}

/**
 * Verificar si el usuario puede crear una nueva capa del tipo especificado
 */
export async function canCreateNewLayer(
  projectId: string,
  decisionType: 'enfoque' | 'alcance' | 'configuracion'
): Promise<{ canCreate: boolean; currentCount: number; limit: number; remaining: number }> {
  try {
    const [limit, currentCount] = await Promise.all([
      getUserLayersLimit(),
      countUserLayersByType(projectId, decisionType)
    ]);

    const canCreate = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);

    return {
      canCreate,
      currentCount,
      limit,
      remaining
    };
  } catch (error) {
    console.error('Error in canCreateNewLayer:', error);
    return {
      canCreate: false,
      currentCount: 0,
      limit: 3,
      remaining: 0
    };
  }
}

/**
 * Actualizar el límite de capas de un usuario (solo para admin)
 */
export async function updateUserLayersLimit(userId: string, newLimit: number): Promise<boolean> {
  try {
    // Verificar si estamos en modo demo
    const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
    
    if (isDemoMode) {
      console.log('🎭 updateUserLayersLimit - Modo demo: simulando actualización exitosa');
      return true; // Simular operación exitosa en modo demo
    }

    const { error } = await supabase
      .from('profiles')
      .update({ layerslimit: newLimit })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user layers limit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserLayersLimit:', error);
    return false;
  }
} 