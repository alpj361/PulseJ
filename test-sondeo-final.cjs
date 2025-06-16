// Script de prueba final para el endpoint de sondeos con datos de visualización
const https = require('https');

async function testSondeoWithVisualization() {
  try {
    console.log('🧪 Iniciando prueba del endpoint de sondeos con visualización...');
    
    const payload = JSON.stringify({
      pregunta: "¿Cuál es la situación económica actual de Guatemala?",
      selectedContexts: ["tendencias"],
      configuracion: {
        detalle_nivel: "alto",
        incluir_recomendaciones: true,
        incluir_visualizaciones: true,
        tipo_analisis: "tendencias"
      }
    });
    
    const options = {
      hostname: 'server.standatpd.com',
      port: 443,
      path: '/api/sondeo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        // Token de prueba - deberías usar un token real
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NWM5M2I0Yi00NTVlLTQ1MGItOWQwMS1lMThmOWU4ZGZhYWEiLCJlbWFpbCI6InBhYmxvam9zZWEzNjFAZ21haWwuY29tIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.example'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`📡 Status Code: ${res.statusCode}`);
      console.log(`📡 Headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n✅ Respuesta recibida:');
          console.log('📊 Success:', response.success);
          
          if (response.resultado) {
            console.log('📝 Respuesta:', response.resultado.respuesta ? 'Presente' : 'Ausente');
            console.log('📊 Datos de análisis:', response.resultado.datos_analisis ? 'Presente' : 'Ausente');
            console.log('💡 Conclusiones:', response.resultado.conclusiones ? 'Presente' : 'Ausente');
            console.log('🔍 Metodología:', response.resultado.metodologia ? 'Presente' : 'Ausente');
            
            if (response.resultado.datos_analisis) {
              console.log('📈 Tipos de datos disponibles:', Object.keys(response.resultado.datos_analisis));
            }
          }
          
          if (response.contexto) {
            console.log('🔗 Fuentes utilizadas:', response.contexto.fuentes_utilizadas);
            console.log('📊 Estadísticas contexto:', response.contexto.estadisticas);
          }
          
          if (response.creditos) {
            console.log('💳 Costo total:', response.creditos.costo_total);
            console.log('💰 Créditos restantes:', response.creditos.creditos_restantes);
          }
          
        } catch (parseError) {
          console.error('❌ Error parsing JSON:', parseError);
          console.log('📄 Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    req.write(payload);
    req.end();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Ejecutar la prueba
testSondeoWithVisualization(); 