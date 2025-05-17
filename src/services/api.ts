import { KeywordCount, CategoryCount } from '../types';
import { insertTrendData, getLatestTrendData } from './supabase';
import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';

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
  timestamp: string;
}

// Get VPS API URL from environment variables
// This will come from Netlify environment variables in production
const VPS_API_URL = import.meta.env.VITE_VPS_API_URL || '';

// Verificar que la URL no sea el valor genérico del archivo netlify.toml
const isGenericUrl = VPS_API_URL.includes('your-vps-scraper-url') || 
                     VPS_API_URL.includes('dev-your-vps-scraper-url');

// URL real a usar
const API_URL_TO_USE = !isGenericUrl && VPS_API_URL ? VPS_API_URL : '';

// Check if the API URL is configured
if (!API_URL_TO_USE) {
  console.warn('VPS API URL is not configured or contains generic values. Set VITE_VPS_API_URL environment variable. Using mock data.');
}

/**
 * Creates mock trending data for development when APIs are not available
 * Genera datos ligeramente diferentes cada vez para simular actualización
 */
function createMockTrendData(): TrendResponse {
  console.log('Creando nuevos datos mock para tendencias');
  
  // Base en los datos mock pero con variaciones
  const baseKeywords = [...mockTopKeywords];
  
  // Reorganizar los keywords y modificar algunos counts
  const shuffledKeywords = baseKeywords.map(kw => ({
    keyword: kw.keyword,
    count: Math.max(1, kw.count + Math.floor(Math.random() * 5) - 2) // Variar el conteo ligeramente
  })).sort((a, b) => b.count - a.count);
  
  // Generar word cloud data a partir de los keywords modificados
  const newWordCloudData = shuffledKeywords.map(item => ({
    text: item.keyword,
    value: Math.min(Math.max(item.count * 10, 20), 100),
    color: getRandomColor()
  }));
  
  // Modificar ligeramente los conteos de categorías
  const newCategoryData = mockCategoryData.map(cat => ({
    category: cat.category,
    count: Math.max(1, cat.count + Math.floor(Math.random() * 6) - 3)
  })).sort((a, b) => b.count - a.count);
  
  // Devolver los datos con timestamp actual
  return {
    wordCloudData: newWordCloudData,
    topKeywords: shuffledKeywords,
    categoryData: newCategoryData,
    timestamp: new Date().toISOString()
  };
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
      console.warn('VPS API URL is not configured, using mock data');
      // Return a simple mock structure that represents raw data
      console.log('Retornando datos mock para VPS raw trends');
      return {
        trends: mockTopKeywords.map(k => ({ 
          name: k.keyword, 
          volume: k.count,
          category: mockCategoryData.find(c => Math.random() > 0.5)?.category || 'Miscellaneous'
        }))
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
    // Return mock data in case of error
    console.log('Error en fetchRawTrendsFromVPS, retornando datos mock');
    return {
      trends: mockTopKeywords.map(k => ({ 
        name: k.keyword, 
        volume: k.count,
        category: mockCategoryData.find(c => Math.random() > 0.5)?.category || 'Miscellaneous'
      }))
    };
  }
}

/**
 * Process trends data with AI via Netlify Function
 */
export async function processTrendsWithAI(rawTrendsData: any): Promise<TrendResponse> {
  try {
    console.log('Iniciando processTrendsWithAI');
    
    // Verificar si tenemos las variables de entorno necesarias para usar API real
    if (!import.meta.env.VITE_HAS_NETLIFY_FUNCTIONS && !import.meta.env.PROD) {
      console.warn('No se detectaron las funciones de Netlify. Configura VITE_HAS_NETLIFY_FUNCTIONS=true si deseas usar funciones reales en desarrollo.');
    }
    
    console.log('Llamando a la función Netlify processTrends');
    const response = await fetch('/.netlify/functions/processTrends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendingUrl: `${API_URL_TO_USE}/trends`,
        rawData: rawTrendsData
      }),
    });
    
    if (!response.ok) {
      console.error('Error en la respuesta de la función Netlify:', response.status, response.statusText);
      throw new Error(`Error processing trends with AI: ${response.statusText}`);
    }
    
    const processedData = await response.json();
    console.log('Datos procesados recibidos de la función Netlify:', processedData);
    
    // Ensure the response has the required format
    if (!processedData.wordCloudData || !processedData.topKeywords || !processedData.categoryData) {
      console.error('Formato de respuesta inválido de la función Netlify:', processedData);
      throw new Error('Invalid response format from AI processing');
    }
    
    return processedData;
  } catch (error) {
    console.error('Error in processTrendsWithAI:', error);
    // Use mock data as fallback
    console.log('Error en processTrendsWithAI, retornando datos mock');
    return createMockTrendData();
  }
}

/**
 * Fetches trending data from the VPS scraper and processes it with AI
 */
export async function fetchTrendsFromVPS(): Promise<TrendResponse> {
  try {
    console.log('Iniciando fetchTrendsFromVPS');
    // 1. Fetch raw trends
    console.log('Solicitando datos crudos de tendencias');
    const rawTrendsData = await fetchRawTrendsFromVPS();
    console.log('Datos crudos recibidos, enviando a procesar');
    
    // 2. Process with AI
    const processedData = await processTrendsWithAI(rawTrendsData);
    console.log('Datos procesados recibidos');
    
    // 3. Ensure timestamp
    if (!processedData.timestamp) {
      console.log('No timestamp encontrado, agregando uno nuevo');
      processedData.timestamp = new Date().toISOString();
    }
    
    console.log('Retornando datos procesados');
    return processedData;
  } catch (error) {
    console.error('Error in fetchTrendsFromVPS:', error);
    // Use mock data as fallback
    console.log('Error en fetchTrendsFromVPS, retornando datos mock');
    return createMockTrendData();
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
 * Fetch trends data from VPS, process with AI, store in Supabase, and return the data
 */
export async function fetchAndStoreTrends(): Promise<TrendResponse> {
  try {
    console.log('INICIO: fetchAndStoreTrends');
    
    // Prueba si fetch está funcionando
    const fetchWorks = await testFetch();
    console.log('¿Fetch funciona correctamente?', fetchWorks);
    
    // 1. Fetch and process the trends data
    console.log('Intentando obtener datos de tendencias desde VPS');
    const trendsData = await fetchTrendsFromVPS();
    console.log('Datos de tendencias obtenidos:', trendsData);
    
    // 2. Store the processed data in Supabase (but don't break if it fails)
    try {
      console.log('Intentando almacenar tendencias en Supabase');
      await storeTrendsInSupabase(trendsData);
      console.log('Datos almacenados correctamente en Supabase');
    } catch (err) {
      console.error('Failed to store trends in Supabase, but continuing:', err);
    }
    
    // 3. Return the data for UI display
    console.log('Devolviendo datos para la UI');
    return trendsData;
  } catch (error) {
    console.error('Fatal error in fetchAndStoreTrends:', error);
    // Final fallback - return mock data
    console.log('Usando datos mockup como fallback');
    return createMockTrendData();
  }
}

/**
 * Retrieve the latest trend data from Supabase
 * Useful for initial loading of the page
 */
export async function getLatestTrends(): Promise<TrendResponse | null> {
  try {
    const data = await getLatestTrendData();
    if (!data) {
      console.log('No data found in Supabase, returning mock data');
      return createMockTrendData();
    }
    
    return {
      wordCloudData: data.word_cloud_data,
      topKeywords: data.top_keywords,
      categoryData: data.category_data,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error getting latest trends from Supabase:', error);
    return createMockTrendData();
  }
} 