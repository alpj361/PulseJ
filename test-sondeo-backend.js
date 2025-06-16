// Script de prueba para el endpoint de sondeos
const fetch = require('node-fetch');

async function testSondeoEndpoint() {
  try {
    console.log('🧪 Iniciando prueba del endpoint de sondeos...');
    
    // Token de prueba (deberías usar un token real)
    const authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NWM5M2I0Yi00NTVlLTQ1MGItOWQwMS1lMThmOWU4ZGZhYWEiLCJlbWFpbCI6InBhYmxvam9zZWEzNjFAZ21haWwuY29tIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.example';
    
    const payload = {
      pregunta: "¿Qué está pasando en Guatemala actualmente?",
      selectedContexts: ["tendencias"],
      configuracion: {
        detalle_nivel: "alto",
        incluir_recomendaciones: true,
        incluir_visualizaciones: true,
        tipo_analisis: "tendencias"
      }
    };
    
    console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://server.standatpd.com/api/sondeo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response (raw):', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Respuesta parseada exitosamente:');
        console.log('- Success:', data.success);
        console.log('- Tiene resultado:', !!data.resultado);
        console.log('- Tiene contexto:', !!data.contexto);
        console.log('- Keys:', Object.keys(data));
        
        if (data.resultado) {
          console.log('📊 Resultado:', data.resultado.respuesta?.substring(0, 200) + '...');
        }
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError.message);
      }
    } else {
      console.error('❌ Error en la respuesta:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testSondeoEndpoint(); 