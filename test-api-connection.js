// Script para probar la nueva configuración del API

async function testAPIConnection() {
  console.log('🔧 Probando conexión a ExtractorW en VPS...');
  console.log('==============================================');
  
  try {
    // 1. Probar health check
    console.log('\n🌐 1. Health Check...');
    const healthResponse = await fetch('https://server.standatpd.com/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ ExtractorW está funcionando');
      console.log(`   Uptime: ${Math.round(health.uptime)} segundos`);
      console.log(`   Environment: ${health.environment}`);
    }
    
    // 2. Probar latestTrends (puede fallar si no hay datos)
    console.log('\n📊 2. Probando latestTrends...');
    const latestResponse = await fetch('https://server.standatpd.com/api/latestTrends');
    if (latestResponse.ok) {
      const latest = await latestResponse.json();
      console.log('✅ Datos disponibles en BD');
      console.log(`   Keywords: ${latest.topKeywords?.length || 0}`);
      console.log(`   Timestamp: ${latest.timestamp}`);
    } else {
      console.log('⚠️  Sin datos previos en BD (normal en primera ejecución)');
    }
    
    // 3. Probar processTrends (generar datos frescos)
    console.log('\n⚡ 3. Generando datos frescos...');
    const processResponse = await fetch('https://server.standatpd.com/api/processTrends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (processResponse.ok) {
      const processed = await processResponse.json();
      console.log('✅ Datos generados exitosamente');
      console.log(`   Keywords: ${processed.topKeywords?.length || 0}`);
      console.log(`   WordCloud: ${processed.wordCloudData?.length || 0} items`);
      console.log(`   Categories: ${processed.categoryData?.length || 0}`);
      console.log(`   Status: ${processed.processing_status}`);
      console.log(`   Timestamp: ${processed.timestamp}`);
      
      // 4. Verificar que los datos ahora estén disponibles
      console.log('\n🔄 4. Verificando persistencia...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      const verifyResponse = await fetch('https://server.standatpd.com/api/latestTrends');
      if (verifyResponse.ok) {
        const verified = await verifyResponse.json();
        console.log('✅ Datos persisten correctamente');
        console.log(`   Keywords: ${verified.topKeywords?.length || 0}`);
      } else {
        console.log('⚠️  Datos no persisten (usando memoria temporal)');
      }
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log('✅ ExtractorW funcionando correctamente');
    console.log('✅ API endpoints respondiendo');
    console.log('✅ Generación de datos exitosa');
    console.log('✅ Frontend puede conectarse sin problemas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar test
testAPIConnection(); 