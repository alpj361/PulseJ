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
    console.log('Preparing to call OpenRouter AI...');
    
    // Creamos una promesa que se resuelve después de 8 segundos (para evitar el timeout de Netlify)
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('AI processing timed out, using fallback data');
        resolve({
          ok: false,
          statusText: 'Operation timed out after 8 seconds'
        });
      }, 8000);
    });
    
    // Llamada real a OpenRouter
    const openRouterPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    
    // Usamos Promise.race para tomar el resultado más rápido entre la llamada real y el timeout
    const openrouterResponse = await Promise.race([openRouterPromise, timeoutPromise]);
    console.log(`OpenRouter response received, status: ${openrouterResponse.ok ? 'OK' : 'Error'}`);
    
    let processedData;
    if (!openrouterResponse.ok) {
      console.log('Using fallback data processing...');
      processedData = createFallbackData(rawTrendsData);
    } else {
      try {
        const aiResponse = await openrouterResponse.json();
        const content = aiResponse.choices[0].message.content;
        processedData = JSON.parse(content);
        console.log('Successfully processed trends data with AI');
      } catch (err) {
        console.error('Error parsing AI response:', err);
        processedData = createFallbackData(rawTrendsData);
      }
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
  console.log('Creating fallback data from raw input');
  const timestamp = new Date().toISOString();
  
  // Create a simple processed version based on the raw data structure
  let wordCloudData = [];
  let topKeywords = [];
  let categoryData = [];
  
  try {
    // Fast path: extract some basic data without mucho procesamiento
    let keywords = [];
    
    // If raw data has a trends array or similar, process it
    if (Array.isArray(rawTrendsData)) {
      keywords = rawTrendsData.slice(0, 20).map(item => ({
        keyword: item.name || item.text || item.trend || 'Unknown',
        count: item.count || item.volume || item.value || 1
      }));
    } else if (rawTrendsData.trends) {
      keywords = Array.isArray(rawTrendsData.trends) 
        ? rawTrendsData.trends.slice(0, 20).map(item => ({
            keyword: item.name || item.text || item.trend || 'Unknown',
            count: item.count || item.volume || item.value || 1
          }))
        : [];
    } else if (rawTrendsData.keywords) {
      keywords = Array.isArray(rawTrendsData.keywords)
        ? rawTrendsData.keywords.slice(0, 20)
        : [];
    } else {
      // Fallback to hardcoded data if nothing works
      keywords = [
        { keyword: "Tecnología", count: 12 },
        { keyword: "Política", count: 10 },
        { keyword: "Economía", count: 8 },
        { keyword: "Deportes", count: 8 },
        { keyword: "Entretenimiento", count: 7 },
        { keyword: "Salud", count: 6 },
        { keyword: "Educación", count: 6 },
        { keyword: "Ciencia", count: 5 },
        { keyword: "Medio Ambiente", count: 5 },
        { keyword: "Cultura", count: 4 }
      ];
    }
    
    // Si tenemos menos de 5 keywords, agregar algunas genéricas
    if (keywords.length < 5) {
      const defaultKeywords = [
        { keyword: "Tendencias", count: 10 },
        { keyword: "Actualidad", count: 8 },
        { keyword: "Noticias", count: 7 },
        { keyword: "Eventos", count: 6 },
        { keyword: "Tecnología", count: 5 }
      ];
      keywords = [...keywords, ...defaultKeywords].slice(0, 20);
    }
    
    // Sort by count descending
    topKeywords = keywords.sort((a, b) => b.count - a.count);
    
    // Generate word cloud data directly from topKeywords
    wordCloudData = topKeywords.map(item => ({
      text: item.keyword,
      value: Math.min(Math.max(item.count * 10, 20), 100),
      color: getRandomColor()
    }));
    
    // Generate simple category data
    const categories = ['Tecnología', 'Entretenimiento', 'Política', 'Deportes', 'Negocios', 'Ciencia', 'Salud'];
    categoryData = categories.map(category => ({
      category,
      count: Math.floor(Math.random() * 20) + 5
    }));
    
  } catch (err) {
    console.error('Error creating fallback data:', err);
    // Ultimate fallback - hardcoded data
    topKeywords = [
      { keyword: "Tecnología", count: 12 },
      { keyword: "Política", count: 10 },
      { keyword: "Economía", count: 8 },
      { keyword: "Deportes", count: 8 },
      { keyword: "Entretenimiento", count: 7 }
    ];
    
    wordCloudData = topKeywords.map(item => ({
      text: item.keyword,
      value: item.count * 10,
      color: getRandomColor()
    }));
    
    categoryData = [
      { category: "Tecnología", count: 15 },
      { category: "Política", count: 12 },
      { category: "Economía", count: 10 },
      { category: "Deportes", count: 8 },
      { category: "Entretenimiento", count: 6 }
    ];
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