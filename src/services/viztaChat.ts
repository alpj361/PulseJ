import { supabase } from './supabase';

// ===================================================================
// VIZTA CHAT SERVICE
// Servicio para conectar con el backend de Vizta Chat en ExtractorW
// ===================================================================

const EXTRACTOR_W_URL = import.meta.env.VITE_EXTRACTOR_W_URL || 'https://server.standatpd.com';

// Tipos
export interface ViztaChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  toolUsed?: string;
  toolArgs?: any;
  sessionId?: string;
  requestId?: string;
  executionTime?: number;
}

export interface ViztaChatResponse {
  success: boolean;
  response: string;
  toolUsed?: string;
  toolArgs?: any;
  toolResult?: any;
  sessionId: string;
  requestId: string;
  executionTime?: number;
  timestamp: string;
  error?: string;
}

export interface ScrapeData {
  id: number;
  query_original: string;
  query_clean: string;
  herramienta: string;
  categoria: string;
  tweet_id: string;
  usuario: string;
  fecha_tweet: string;
  texto: string;
  enlace: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
  sentimiento: string;
  user_id: string;
  session_id: string;
  fecha_captura: string;
  created_at: string;
}

/**
 * Obtiene el token de autenticación actual
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Envía una consulta al chat de Vizta
 */
export async function sendViztaChatQuery(
  message: string, 
  sessionId?: string
): Promise<ViztaChatResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    console.log('🤖 Enviando consulta a Vizta Chat:', message);

    const response = await fetch(`${EXTRACTOR_W_URL}/api/vizta-chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la consulta');
    }

    const data = await response.json();
    console.log('✅ Respuesta de Vizta Chat recibida');
    
    return data;

  } catch (error) {
    console.error('❌ Error enviando consulta a Vizta Chat:', error);
    throw error;
  }
}

/**
 * Obtiene los scrapes del usuario
 */
export async function getUserScrapes(options: {
  limit?: number;
  offset?: number;
  herramienta?: string;
  categoria?: string;
  sessionId?: string;
} = {}): Promise<ScrapeData[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.herramienta) params.append('herramienta', options.herramienta);
    if (options.categoria) params.append('categoria', options.categoria);
    if (options.sessionId) params.append('sessionId', options.sessionId);

    const response = await fetch(`${EXTRACTOR_W_URL}/api/vizta-chat/scrapes?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo scrapes');
    }

    const data = await response.json();
    return data.scrapes || [];

  } catch (error) {
    console.error('❌ Error obteniendo scrapes:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de scrapes del usuario
 */
export async function getUserScrapeStats(): Promise<any> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/api/vizta-chat/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo estadísticas');
    }

    const data = await response.json();
    return data.stats;

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtiene scrapes de una sesión específica
 */
export async function getSessionScrapes(sessionId: string): Promise<ScrapeData[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/api/vizta-chat/session/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo scrapes de sesión');
    }

    const data = await response.json();
    return data.scrapes || [];

  } catch (error) {
    console.error('❌ Error obteniendo scrapes de sesión:', error);
    throw error;
  }
}

/**
 * Obtiene herramientas MCP disponibles
 */
export async function getAvailableTools(): Promise<any[]> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('No hay sesión de usuario activa');
    }

    const response = await fetch(`${EXTRACTOR_W_URL}/api/vizta-chat/tools`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo herramientas');
    }

    const data = await response.json();
    return data.tools || [];

  } catch (error) {
    console.error('❌ Error obteniendo herramientas:', error);
    throw error;
  }
}

/**
 * Genera un ID de sesión único
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea un mensaje para mostrar en el chat
 */
export function formatChatMessage(
  content: string, 
  sender: 'user' | 'assistant',
  metadata?: any
): ViztaChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    sender,
    timestamp: new Date(),
    ...metadata
  };
} 