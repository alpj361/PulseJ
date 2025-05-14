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
  timestamp: string;
}

// Get VPS API URL from environment variables
// This will come from Netlify environment variables in production
const VPS_API_URL = import.meta.env.VITE_VPS_API_URL || '';

// Check if the API URL is configured
if (!VPS_API_URL) {
  console.warn('VPS API URL is not configured. Set VITE_VPS_API_URL environment variable.');
}

/**
 * Fetches raw trending data from the VPS scraper
 */
export async function fetchRawTrendsFromVPS(): Promise<any> {
  try {
    // Ensure we have an API URL
    if (!VPS_API_URL) {
      throw new Error('VPS API URL is not configured');
    }
    
    const response = await fetch(`${VPS_API_URL}/trending`);
    
    if (!response.ok) {
      throw new Error(`Error fetching trends: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchRawTrendsFromVPS:', error);
    throw error;
  }
}

/**
 * Process trends data with AI via Netlify Function
 */
export async function processTrendsWithAI(rawTrendsData: any): Promise<TrendResponse> {
  try {
    const response = await fetch('/.netlify/functions/processTrends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendingUrl: `${VPS_API_URL}/trends`,
        rawData: rawTrendsData
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error processing trends with AI: ${response.statusText}`);
    }
    
    const processedData = await response.json();
    
    // Ensure the response has the required format
    if (!processedData.wordCloudData || !processedData.topKeywords || !processedData.categoryData) {
      throw new Error('Invalid response format from AI processing');
    }
    
    return processedData;
  } catch (error) {
    console.error('Error in processTrendsWithAI:', error);
    throw error;
  }
}

/**
 * Fetches trending data from the VPS scraper and processes it with AI
 */
export async function fetchTrendsFromVPS(): Promise<TrendResponse> {
  // 1. Fetch raw trends
  const rawTrendsData = await fetchRawTrendsFromVPS();
  
  // 2. Process with AI
  const processedData = await processTrendsWithAI(rawTrendsData);
  
  // 3. Ensure timestamp
  if (!processedData.timestamp) {
    processedData.timestamp = new Date().toISOString();
  }
  
  return processedData;
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
    throw error;
  }
}

/**
 * Fetch trends data from VPS, process with AI, store in Supabase, and return the data
 */
export async function fetchAndStoreTrends(): Promise<TrendResponse> {
  // 1. Fetch and process the trends data
  const trendsData = await fetchTrendsFromVPS();
  
  // 2. Store the processed data in Supabase
  await storeTrendsInSupabase(trendsData);
  
  // 3. Return the data for UI display
  return trendsData;
}

/**
 * Retrieve the latest trend data from Supabase
 * Useful for initial loading of the page
 */
export async function getLatestTrends(): Promise<TrendResponse | null> {
  try {
    const data = await getLatestTrendData();
    if (!data) return null;
    
    return {
      wordCloudData: data.word_cloud_data,
      topKeywords: data.top_keywords,
      categoryData: data.category_data,
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error getting latest trends from Supabase:', error);
    return null;
  }
} 