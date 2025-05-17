// Netlify serverless function to process trends with OpenRouter API (GPT-4 Turbo)
// Importación dinámica de node-fetch para compatibilidad ESM/CommonJS
let nodeFetch;

// Auto-detect la disponibilidad de fetch nativo vs. node-fetch
async function getFetch() {
  // Si el entorno ya tiene fetch nativo (Node.js 18+)
  if (typeof fetch === 'function') {
    return fetch;
  }
  
  // Caso contrario, importa node-fetch dinámicamente
  if (!nodeFetch) {
    const module = await import('node-fetch');
    nodeFetch = module.default;
  }
  return nodeFetch;
}

// Environment variables (set these in your Netlify dashboard)
// OPENROUTER_API_KEY: Your OpenRouter API key
// VPS_API_URL: Your VPS trending endpoint

exports.handler = async function(event, context) {
  // Log Node.js version for debugging
  console.log(`Running on Node.js ${process.version}`);
  
  // Inicializa fetch
  const fetch = await getFetch();
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 1. Get parameters from the request
    let params;
    try {
      params = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // 2. Get the raw trends data
    let rawTrendsData;
    
    // If raw data is provided directly, use it
    if (params.rawData) {
      console.log('Using provided raw trends data');
      rawTrendsData = params.rawData;
    }
    // Otherwise, fetch from the trending endpoint
    else {
      // Get the trending endpoint URL
      const trendingUrl = params.trendingUrl || process.env.VPS_API_URL;
      if (!trendingUrl) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No trending endpoint URL provided' }),
        };
      }
      
      console.log(`Fetching trends from: ${trendingUrl}`);
      const trendsResponse = await fetch(trendingUrl);
      
      if (!trendsResponse.ok) {
        throw new Error(`Error fetching trends: ${trendsResponse.statusText}`);
      }
      
      rawTrendsData = await trendsResponse.json();
      console.log('Raw trends data fetched successfully');
    }
    
    if (!rawTrendsData) {
      throw new Error('No trends data available for processing');
    }
    
    // 3. Process the trends with OpenRouter API (GPT-4 Turbo)
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-netlify-site.netlify.app/', // Replace with your Netlify site URL
        'X-Title': 'Trends Dashboard'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo', // You could also use 'openai/gpt-4-turbo'
        messages: [
          {
            role: 'system',
            content: `You are an AI that processes trending data and converts it into structured JSON for a visualization dashboard. 
            You need to return JSON containing:
            1. wordCloudData: Array of objects with { text: string, value: number, color: string }
            2. topKeywords: Array of objects with { keyword: string, count: number }
            3. categoryData: Array of objects with { category: string, count: number }
            4. timestamp: Current ISO timestamp
            
            The value for wordCloudData should be scaled appropriately for visualization (typically 20-100).
            Colors should be attractive hexadecimal values.
            Categories should be extracted or inferred from the trends.
            Return ONLY the JSON object, no explanations or other text.`
          },
          {
            role: 'user',
            content: `Process these trending topics into the required JSON format: 
            ${JSON.stringify(rawTrendsData)}`
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent JSON output
        response_format: { type: "json_object" } // Ensure we get valid JSON back
      })
    });
    
    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      throw new Error(`OpenRouter API error: ${errorText}`);
    }
    
    const aiResponse = await openrouterResponse.json();
    
    // Extract the JSON from the model's response
    let processedData;
    try {
      const content = aiResponse.choices[0].message.content;
      processedData = JSON.parse(content);
      console.log('Successfully processed trends data with AI');
    } catch (err) {
      console.error('Error parsing AI response:', err);
      // Fallback: If AI returns invalid JSON, create a simple processed version
      processedData = createFallbackData(rawTrendsData);
    }
    
    // 4. Return the processed data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData),
    };
    
  } catch (error) {
    console.error('Error processing trends:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error processing trends', 
        message: error.message 
      }),
    };
  }
};

// Fallback function if the AI fails to generate valid JSON
function createFallbackData(rawTrendsData) {
  const timestamp = new Date().toISOString();
  
  // Create a simple processed version based on the raw data structure
  // This is a very basic implementation that would need to be adjusted
  // based on your actual raw data structure
  let wordCloudData = [];
  let topKeywords = [];
  let categoryData = [];
  
  // If raw data has a trends array or similar, process it
  if (Array.isArray(rawTrendsData)) {
    // Simple case: array of trend objects
    topKeywords = rawTrendsData.slice(0, 20).map(item => ({
      keyword: item.name || item.text || item.trend || 'Unknown',
      count: item.count || item.volume || item.value || 1
    }));
    
    // Generate word cloud data from topKeywords
    wordCloudData = topKeywords.map(item => ({
      text: item.keyword,
      value: Math.min(Math.max(item.count * 10, 20), 100),
      color: getRandomColor()
    }));
    
    // Generate simple category data
    const categories = ['Technology', 'Entertainment', 'Politics', 'Sports', 'Business'];
    categoryData = categories.map(category => ({
      category,
      count: Math.floor(Math.random() * 20) + 5
    }));
  } else if (rawTrendsData.trends || rawTrendsData.keywords) {
    // Handle object with trends/keywords property
    const trendsList = rawTrendsData.trends || rawTrendsData.keywords || [];
    return createFallbackData(trendsList);
  }
  
  return {
    wordCloudData,
    topKeywords,
    categoryData,
    timestamp
  };
}

// Helper function to generate random colors
function getRandomColor() {
  const colors = [
    '#3B82F6', // blue
    '#0EA5E9', // light blue
    '#14B8A6', // teal
    '#10B981', // green
    '#F97316', // orange
    '#8B5CF6', // purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 