/**
 * Supabase client configuration
 * 
 * This file integrates with Supabase using Bolt.new and Netlify.
 * 
 * For production:
 * - Set up environment variables in Netlify dashboard
 * - The Bolt.new Supabase integration will handle authentication
 * 
 * For local development:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Create a .env.local file with your Supabase credentials
 */

import { createClient } from '@supabase/supabase-js';
import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';

// Use environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create mock Supabase data for development
const mockTrendData = {
  id: 'mock-id',
  created_at: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  word_cloud_data: mockWordCloudData,
  top_keywords: mockTopKeywords,
  category_data: mockCategoryData
};

// Create and export the Supabase client
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://example.com', 'mock-key'); // This will likely error, but we'll handle it

/**
 * Database schema for reference:
 * 
 * Table: trends
 * - id: uuid (primary key, generated)
 * - created_at: timestamp with time zone (default now())
 * - timestamp: timestamp with time zone (when the trend data was collected)
 * - word_cloud_data: jsonb (array of WordCloudItem)
 * - top_keywords: jsonb (array of KeywordCount)
 * - category_data: jsonb (array of CategoryCount)
 */

/**
 * Insert trend data into Supabase
 */
export async function insertTrendData(data: any): Promise<void> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, skipping database operation');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('trends')
      .insert([
        {
          timestamp: data.timestamp,
          word_cloud_data: data.wordCloudData,
          top_keywords: data.topKeywords,
          category_data: data.categoryData
        }
      ]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error inserting trend data:', error);
    throw error;
  }
}

/**
 * Get the latest trend data from Supabase
 */
export async function getLatestTrendData(): Promise<any | null> {
  // Check if Supabase is properly configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, returning mock data');
    return mockTrendData;
  }
  
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    // Verificar si los datos tienen la estructura completa
    if (!data.top_keywords || data.top_keywords.length < 10) {
      console.warn(`Los datos recuperados tienen ${data.top_keywords?.length || 0} keywords, se esperaban 10`);
      
      // Si tenemos datos crudos, procesar localmente
      if (data.raw_data) {
        console.log('Usando raw_data para generar topKeywords completos');
        
        // Ordenar por alguna métrica relevante (p.ej. volume)
        const rawItems = data.raw_data.trends || [];
        const sortedItems = [...rawItems].sort((a, b) => (b.volume || 0) - (a.volume || 0));
        
        // Tomar top 10 o repetir si hay menos
        const top10 = sortedItems.slice(0, 10);
        while (top10.length < 10) {
          // Si hay menos de 10, repetir los más importantes
          top10.push(top10[top10.length % Math.max(1, top10.length)]);
        }
        
        // Crear estructura para topKeywords
        data.top_keywords = top10.map(item => ({
          keyword: item.name || item.keyword || 'Unknown',
          count: item.volume || item.count || 1
        }));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching latest trend data:', error);
    return mockTrendData;
  }
}