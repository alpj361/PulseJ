const EXTRACTORW_URL = process.env.VITE_EXTRACTORW_API_URL || 'http://localhost:3009';

console.log('🔍 DIAGNÓSTICO DE CONECTIVIDAD - SISTEMA DE TRANSCRIPCIÓN');
console.log('=' .repeat(60));

async function testConnection() {
  try {
    console.log(`\n📡 Probando conectividad con: ${EXTRACTORW_URL}`);
    
    // Test 1: Status básico
    console.log('\n1️⃣ Verificando endpoint de status...');
    try {
      const statusResponse = await fetch(`${EXTRACTORW_URL}/api/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Servidor ExtractorW está online');
        console.log(`   Status: ${statusData.status}`);
        console.log(`   Timestamp: ${statusData.timestamp}`);
      } else {
        console.log(`❌ Error en status: ${statusResponse.status} ${statusResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ No se puede conectar al servidor: ${error.message}`);
      console.log('💡 Asegúrate de que ExtractorW esté corriendo en el puerto 3009');
      return;
    }

    // Test 2: Formatos soportados
    console.log('\n2️⃣ Verificando formatos soportados...');
    try {
      const formatsResponse = await fetch(`${EXTRACTORW_URL}/api/transcription/supported-formats`);
      if (formatsResponse.ok) {
        const formatsData = await formatsResponse.json();
        console.log('✅ Endpoint de formatos funciona');
        console.log(`   Audio: ${formatsData.data.audio.join(', ')}`);
        console.log(`   Video: ${formatsData.data.video.join(', ')}`);
      } else {
        console.log(`❌ Error en formatos: ${formatsResponse.status} ${formatsResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error obteniendo formatos: ${error.message}`);
    }

    // Test 3: Endpoint protegido (sin token)
    console.log('\n3️⃣ Verificando endpoint protegido (sin token)...');
    try {
      const protectedResponse = await fetch(`${EXTRACTORW_URL}/api/transcription/cost`);
      if (protectedResponse.status === 401) {
        console.log('✅ Endpoint protegido funciona correctamente (401 esperado sin token)');
      } else {
        console.log(`⚠️ Respuesta inesperada: ${protectedResponse.status} ${protectedResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error en endpoint protegido: ${error.message}`);
    }

    // Test 4: CORS
    console.log('\n4️⃣ Verificando configuración CORS...');
    try {
      const corsResponse = await fetch(`${EXTRACTORW_URL}/api/transcription/supported-formats`, {
        method: 'OPTIONS'
      });
      console.log(`✅ CORS response: ${corsResponse.status}`);
      const corsHeaders = corsResponse.headers.get('Access-Control-Allow-Origin');
      if (corsHeaders) {
        console.log(`   CORS headers: ${corsHeaders}`);
      } else {
        console.log('⚠️ No se encontraron headers CORS');
      }
    } catch (error) {
      console.log(`❌ Error verificando CORS: ${error.message}`);
    }

    console.log('\n🎯 RECOMENDACIONES:');
    console.log('─'.repeat(50));
    console.log('• Si el servidor no responde: cd ExtractorW && npm run dev');
    console.log('• Verificar archivo .env en PulseJ: VITE_EXTRACTORW_API_URL=http://localhost:3009');
    console.log('• Verificar que el puerto 3009 no esté bloqueado');
    console.log('• Asegurar que FFmpeg esté instalado para transcripciones de video');

  } catch (error) {
    console.error('\n❌ Error general en diagnóstico:', error);
  }
}

// Simulación de Token para pruebas
const simulateTokenTest = () => {
  console.log('\n5️⃣ Información sobre autenticación...');
  console.log('Token actual en localStorage:', 
    typeof window !== 'undefined' && localStorage.getItem('token') ? 
    '✅ Token presente' : '❌ Token faltante'
  );
  console.log('💡 El token se debe obtener del proceso de login en PulseJ');
};

// Ejecutar diagnóstico
testConnection().then(() => {
  if (typeof window !== 'undefined') {
    simulateTokenTest();
  }
  console.log('\n✨ Diagnóstico completado\n');
}); 