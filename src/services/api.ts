import { KeywordCount, CategoryCount } from '../types';
import { insertTrendData, getLatestTrendData } from './supabase';

// Define the WordCloudItem interface here instead of importing it
export interface WordCloudItem {
  text: string;
  value: number;
  color: string;
}

// Types for the API response from VPS scraper
export interface TrendResponse {
  wordCloudData: WordCloudItem[];
  topKeywords: KeywordCount[];
  categoryData: CategoryCount[];
  about?: any[];
  statistics?: any;
  timestamp: string;
  processing_status?: string;
}

// Types for backend response with about and statistics
export interface AboutInfo {
  nombre: string;
  resumen: string;
  categoria: string;
  tipo: string;
  relevancia: 'alta' | 'media' | 'baja';
  contexto_local: boolean;
  razon_tendencia?: string;
  fecha_evento?: string;
  palabras_clave?: string[];
  source: string;
  model: string;
}

export interface Statistics {
  relevancia: Record<string, number>;
  contexto: {
    local: number;
    global: number;
  };
  timestamp: string;
}

// Get VPS API URL from environment variables
// This will come from Netlify environment variables in production
const VPS_API_URL = import.meta.env.VITE_VPS_API_URL || '';

// ExtractorW Backend URL - FORZAR URL DE RENDER EN PRODUCCIÓN
const EXTRACTORW_API_URL = 'https://extractorw.onrender.com/api';

console.log('🔧 Configuración de APIs:');
console.log(`   ExtractorW: ${EXTRACTORW_API_URL}`);
console.log(`   VPS: ${VPS_API_URL || 'No configurado'}`);
console.log(`   Entorno: ${import.meta.env.DEV ? 'Desarrollo' : 'Producción'}`);

// Verificar que la URL no sea el valor genérico del archivo netlify.toml
const isGenericUrl = VPS_API_URL.includes('your-vps-scraper-url') || 
                     VPS_API_URL.includes('dev-your-vps-scraper-url');

// URL real a usar
const API_URL_TO_USE = !isGenericUrl && VPS_API_URL ? VPS_API_URL : '';

// Check if the API URL is configured
if (!API_URL_TO_USE) {
  console.warn('VPS API URL is not configured or contains generic values. Set VITE_VPS_API_URL environment variable. Using mock data.');
}

// Función de ayuda para obtener colores aleatorios
function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#0EA5E9', // light blue
    '#14B8A6', // teal
    '#10B981', // green
    '#F97316', // orange
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#EF4444', // red
    '#F59E0B', // amber
    '#84CC16', // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Fetches raw trending data from the VPS scraper
 */
export async function fetchRawTrendsFromVPS(): Promise<any> {
  try {
    console.log('Iniciando fetchRawTrendsFromVPS');
    // Ensure we have an API URL
    if (!API_URL_TO_USE) {
      console.warn('VPS API URL is not configured, generating test data');
      // Return realistic test data structure similar to ExtractorT
      console.log('Retornando datos de prueba para VPS raw trends');
      return {
        status: "success",
        location: "guatemala",
        twitter_trends: [
          "1. Napoli251K",
          "2. Lilo68K", 
          "3. Alejandro Giammattei",
          "4. Lukita",
          "5. santa maría de jesús",
          "6. Aguirre",
          "7. #SerieA14K",
          "8. McTominay118K",
          "9. margaret satterthwaite",
          "10. Sinibaldi"
        ]
      };
    }
    
    console.log(`Realizando fetch a ${API_URL_TO_USE}/trending`);
    const response = await fetch(`${API_URL_TO_USE}/trending`);
    
    if (!response.ok) {
      throw new Error(`Error fetching trends: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Datos crudos recibidos del API:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in fetchRawTrendsFromVPS:', error);
    // Return test data in case of error
    console.log('Error en fetchRawTrendsFromVPS, retornando datos de prueba');
    return {
      status: "success",
      location: "guatemala", 
      twitter_trends: [
        "1. Napoli251K",
        "2. Lilo68K",
        "3. Alejandro Giammattei",
        "4. Lukita",
        "5. santa maría de jesús",
        "6. Aguirre",
        "7. #SerieA14K", 
        "8. McTominay118K",
        "9. margaret satterthwaite",
        "10. Sinibaldi"
      ]
    };
  }
}

/**
 * Stores trending data in Supabase
 */
export async function storeTrendsInSupabase(trendsData: TrendResponse): Promise<void> {
  try {
    await insertTrendData(trendsData);
    console.log('Trends data successfully stored in Supabase');
  } catch (error) {
    console.error('Error storing trends in Supabase:', error);
    // Just log the error, but don't throw to prevent UI breaking
  }
}

// Function to test if fetch is working correctly
async function testFetch() {
  try {
    console.log('Testing fetch to an external API...');
    // Intenta hacer fetch a jsonplaceholder, un servicio de prueba común
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    if (!response.ok) {
      console.error('Error en respuesta de test fetch:', response.status, response.statusText);
      return false;
    }
    const data = await response.json();
    console.log('Test fetch successful, response:', data);
    return true;
  } catch (error) {
    console.error('Error in test fetch:', error);
    return false;
  }
}

/**
 * Fetches trending data from ExtractorW backend with fast response + background processing
 */
export async function fetchTrendsFromExtractorW(rawTrendsData?: any): Promise<TrendResponse> {
  try {
    console.log('🚀 Iniciando fetchTrendsFromExtractorW');
    
    const requestBody = rawTrendsData ? { rawData: rawTrendsData } : undefined;
    
    console.log('📡 Llamando a ExtractorW backend para procesamiento rápido...');
    const response = await fetch(`${EXTRACTORW_API_URL}/processTrends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody ? JSON.stringify(requestBody) : JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`Error calling ExtractorW: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Respuesta rápida recibida de ExtractorW:', data);
    
    // La respuesta inicial viene sin about y statistics
    // Estos se procesan en background
    
    return {
      wordCloudData: data.wordCloudData || [],
      topKeywords: data.topKeywords || [],
      categoryData: data.categoryData || [],
      about: data.about || [],
      statistics: data.statistics || {},
      timestamp: data.timestamp,
      processing_status: data.processing_status || 'basic_completed'
    };
  } catch (error) {
    console.error('❌ Error in fetchTrendsFromExtractorW:', error);
    // No fallback a mock data, lanzar el error
    throw error;
  }
}

/**
 * Polls for completed processing status (about and statistics)
 * Updated with longer timeouts to handle Perplexity processing time (2-3 minutes)
 */
export async function pollForCompletedData(timestamp: string, maxAttempts: number = 15): Promise<TrendResponse | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for timestamp: ${timestamp}`);
      
      const response = await fetch(`${EXTRACTORW_API_URL}/processingStatus/${encodeURIComponent(timestamp)}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️  Record not found yet, attempt ${attempt}`);
        } else if (response.status === 503) {
          console.log(`⚠️  Service unavailable, attempt ${attempt}`);
        } else {
          console.log(`⚠️  Polling attempt ${attempt} failed: ${response.status} ${response.statusText}`);
        }
        
        // Wait longer on early attempts, shorter on later ones
        const waitTime = attempt <= 5 ? 15000 : (attempt <= 10 ? 12000 : 8000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      const data = await response.json();
      console.log(`📊 Polling result ${attempt}:`, {
        status: data.status,
        has_about: data.has_about,
        has_statistics: data.has_statistics
      });
      
      if (data.status === 'complete' && data.has_about && data.has_statistics) {
        console.log('✅ Procesamiento completo detectado!');
        return data.data;
      }
      
      if (data.status === 'error') {
        console.error('❌ Error en procesamiento detectado');
        return null;
      }
      
      // Progressive wait times: start with longer waits, then shorter
      // First 3 attempts: 20 seconds (Perplexity is still processing)
      // Next 7 attempts: 15 seconds 
      // Final 5 attempts: 10 seconds
      let waitTime;
      if (attempt <= 3) {
        waitTime = 20000; // 20 seconds for first attempts
      } else if (attempt <= 10) {
        waitTime = 15000; // 15 seconds for middle attempts
      } else {
        waitTime = 10000; // 10 seconds for final attempts
      }
      
      console.log(`⏳ Esperando ${waitTime/1000} segundos antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.error(`❌ Error en polling attempt ${attempt}:`, error);
      // Wait 10 seconds on fetch errors
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log(`⏰ Polling timeout reached after ${maxAttempts} attempts (approx ${Math.round(maxAttempts * 15 / 60)} minutes), returning null`);
  return null;
}

/**
 * Gets latest trends from ExtractorW backend
 */
export async function getLatestTrendsFromExtractorW(): Promise<TrendResponse | null> {
  try {
    console.log('📡 Obteniendo últimas tendencias de ExtractorW...');
    
    const response = await fetch(`${EXTRACTORW_API_URL}/latestTrends`);
    
    if (!response.ok) {
      throw new Error(`Error getting latest trends: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Últimas tendencias obtenidas:', {
      timestamp: data.timestamp,
      status: data.processing_status,
      has_about: data.about?.length > 0,
      has_statistics: Object.keys(data.statistics || {}).length > 0
    });
    
    return {
      wordCloudData: data.wordCloudData || [],
      topKeywords: data.topKeywords || [],
      categoryData: data.categoryData || [],
      about: data.about || [],
      statistics: data.statistics || {},
      timestamp: data.timestamp,
      processing_status: data.processing_status || 'unknown'
    };
  } catch (error) {
    console.error('❌ Error getting latest trends:', error);
    return null;
  }
}

/**
 * Fetches and stores trending data with AI processing
 * Now uses ExtractorW backend with fast response + background processing
 */
export async function fetchAndStoreTrends(): Promise<TrendResponse> {
  try {
    console.log('🚀 Iniciando fetchAndStoreTrends con ExtractorW');
    
    // 1. Fetch raw trends from VPS (if available)
    console.log('📡 Obteniendo datos raw de VPS...');
    const rawTrendsData = await fetchRawTrendsFromVPS();
    
    // 2. Process with ExtractorW (fast response)
    console.log('⚡ Procesando con ExtractorW (respuesta rápida)...');
    const initialData = await fetchTrendsFromExtractorW(rawTrendsData);
    
    // 3. Start polling for complete data in background
    if (initialData.timestamp && initialData.processing_status === 'basic_completed') {
      console.log('🔄 Iniciando polling para datos completos...');
      // Don't await this - let it run in background
      pollForCompletedData(initialData.timestamp).then(completeData => {
        if (completeData) {
          console.log('✅ Datos completos recibidos del polling');
          // You could emit an event here or use a state management solution
          // to update the UI when complete data is available
        }
      }).catch(error => {
        console.error('❌ Error en polling background:', error);
      });
    }
    
    // 4. Store initial data in Supabase
    try {
      console.log('💾 Guardando datos iniciales en Supabase...');
      await storeTrendsInSupabase(initialData);
      console.log('✅ Datos guardados en Supabase');
    } catch (storageError) {
      console.error('⚠️  Error storing in Supabase:', storageError);
      // Continue even if storage fails
    }
    
    return initialData;
  } catch (error) {
    console.error('❌ Error in fetchAndStoreTrends:', error);
    // No usar mock data como fallback final, lanzar el error
    throw error;
  }
}

/**
 * Gets the latest trend data from local storage or API
 * Now tries ExtractorW first, then falls back to Supabase
 */
export async function getLatestTrends(): Promise<TrendResponse | null> {
  try {
    console.log('📊 Iniciando getLatestTrends');
    
    // 1. Try to get latest from ExtractorW first
    console.log('🔍 Intentando obtener datos de ExtractorW...');
    const extractorData = await getLatestTrendsFromExtractorW();
    
    if (extractorData) {
      console.log('✅ Datos obtenidos de ExtractorW');
      return extractorData;
    }
    
    // 2. Fallback to Supabase
    console.log('🔄 Fallback a Supabase...');
    const supabaseData = await getLatestTrendData();
    
    if (supabaseData) {
      console.log('✅ Datos obtenidos de Supabase');
      
      // Asegurar que los datos de Supabase tienen la estructura correcta
    return {
        wordCloudData: supabaseData.word_cloud_data || [],
        topKeywords: supabaseData.top_keywords || [],
        categoryData: supabaseData.category_data || [],
        about: supabaseData.about || [],
        statistics: supabaseData.statistics || null,
        timestamp: supabaseData.timestamp || new Date().toISOString(),
        processing_status: supabaseData.processing_status || 'unknown'
      };
    }
    
    console.log('⚠️  No se encontraron datos, retornando null');
    return null;
  } catch (error) {
    console.error('❌ Error in getLatestTrends:', error);
    return null;
  }
}

/**
 * Envía un sondeo personalizado (contexto y pregunta) a ExtractorW y espera la respuesta del LLM
 * @param contextoArmado Objeto con contexto (noticias, codex, tendencias, input, etc)
 * @param pregunta Pregunta del usuario (puede ser igual a input)
 * @returns Respuesta completa del LLM y contexto usado
 */
export async function sendSondeoToExtractorW(contextoArmado: any, pregunta: string): Promise<any> {
  try {
    // 1. Enviar el contexto y pregunta a ExtractorW (nuevo endpoint /api/sondeo)
    const response = await fetch('https://extractorw.onrender.com/api/sondeo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contexto: contextoArmado,
        pregunta: pregunta
      })
    });
    if (!response.ok) {
      throw new Error(`Error enviando sondeo: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error en sendSondeoToExtractorW:', error);
    throw error;
  }
} 