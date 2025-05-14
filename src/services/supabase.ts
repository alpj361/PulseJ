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

// Use environment variables for Supabase configuration
// These will be set in Netlify dashboard for production
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  // Check if Supabase URL and key are configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Supabase not configured, skipping database operation');
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
  // Check if Supabase URL and key are configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Supabase not configured, returning null');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching latest trend data:', error);
    return null;
  }
} 