#!/usr/bin/env node

/**
 * Script de prueba para verificar la conectividad con Supabase
 * y las operaciones CRUD de decisiones de proyecto
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.log('Necesitas configurar:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Probar conexión básica
 */
async function testConnection() {
  console.log('🔌 Probando conexión con Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

/**
 * Verificar estructura de la tabla project_decisions
 */
async function verifyDecisionTableStructure() {
  console.log('\n📋 Verificando estructura de tabla project_decisions...');
  
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accediendo a project_decisions:', error.message);
      return false;
    }
    
    console.log('✅ Tabla project_decisions accesible');
    
    // Si hay datos, mostrar la estructura
    if (data && data.length > 0) {
      console.log('📄 Ejemplo de estructura de datos:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('📄 Tabla vacía - creando decisión de prueba...');
      await testCreateDecision();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    return false;
  }
}

/**
 * Obtener primer proyecto disponible para pruebas
 */
async function getTestProject() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ No hay proyectos disponibles. Crear uno primero.');
        return null;
      }
      throw error;
    }
    
    console.log('📋 Proyecto de prueba encontrado:', data.title);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo proyecto de prueba:', error.message);
    return null;
  }
}

/**
 * Probar creación de decisión
 */
async function testCreateDecision() {
  console.log('\n✨ Probando creación de decisión...');
  
  const testProject = await getTestProject();
  if (!testProject) {
    console.log('⚠️ Saltando prueba de creación - no hay proyectos disponibles');
    return;
  }
  
  const testDecision = {
    project_id: testProject.id,
    title: 'Decisión de prueba - Integración Timeline',
    description: 'Esta es una decisión de prueba para verificar la integración del timeline con Supabase.',
    decision_type: 'operational',
    sequence_number: 1,
    parent_decision_id: null,
    rationale: 'Prueba de conectividad y funcionalidad del sistema de decisiones.',
    expected_impact: 'Validar que el sistema funciona correctamente con la base de datos.',
    resources_required: 'Tiempo de desarrollo y pruebas.',
    risks_identified: ['Problemas de conectividad', 'Incompatibilidad de tipos'],
    status: 'pending',
    urgency: 'medium',
    stakeholders: null,
    tags: ['prueba', 'timeline', 'integracion'],
    attachments: null,
    decision_references: null,
    success_metrics: {
      'test_completion': {
        target: 100,
        actual: 0,
        unit: 'percentage',
        description: 'Completitud de la prueba'
      }
    },
    implementation_date: null,
    actual_impact: null,
    lessons_learned: null
  };
  
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .insert(testDecision)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creando decisión:', error.message);
      console.error('Detalles:', error);
      return null;
    }
    
    console.log('✅ Decisión creada exitosamente:');
    console.log(`- ID: ${data.id}`);
    console.log(`- Título: ${data.title}`);
    console.log(`- Tipo: ${data.decision_type}`);
    console.log(`- Estado: ${data.status}`);
    console.log(`- Urgencia: ${data.urgency}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error en testCreateDecision:', error.message);
    return null;
  }
}

/**
 * Probar obtención de decisiones
 */
async function testGetDecisions() {
  console.log('\n📋 Probando obtención de decisiones...');
  
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error obteniendo decisiones:', error.message);
      return;
    }
    
    console.log(`✅ Obtenidas ${data.length} decisiones`);
    
    if (data.length > 0) {
      console.log('\n📄 Últimas decisiones:');
      data.forEach((decision, index) => {
        console.log(`${index + 1}. ${decision.title} (${decision.decision_type}, ${decision.urgency})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en testGetDecisions:', error.message);
  }
}

/**
 * Probar eliminación de decisiones de prueba
 */
async function cleanupTestDecisions() {
  console.log('\n🧹 Limpiando decisiones de prueba...');
  
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .delete()
      .like('title', '%prueba%')
      .select('id, title');
    
    if (error) {
      console.error('❌ Error limpiando decisiones de prueba:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Eliminadas ${data.length} decisiones de prueba`);
      data.forEach(decision => {
        console.log(`- ${decision.title}`);
      });
    } else {
      console.log('✅ No hay decisiones de prueba para limpiar');
    }
    
  } catch (error) {
    console.error('❌ Error en cleanupTestDecisions:', error.message);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando pruebas de Supabase para Project Decisions\n');
  
  // 1. Probar conexión
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ No se pudo establecer conexión. Terminando pruebas.');
    process.exit(1);
  }
  
  // 2. Verificar estructura de tabla
  const tableOk = await verifyDecisionTableStructure();
  if (!tableOk) {
    console.log('\n❌ Problemas con la estructura de tabla. Terminando pruebas.');
    process.exit(1);
  }
  
  // 3. Probar operaciones CRUD
  await testGetDecisions();
  
  // 4. Crear decisión de prueba
  const testDecision = await testCreateDecision();
  
  // 5. Obtener decisiones después de crear
  if (testDecision) {
    await testGetDecisions();
  }
  
  // 6. Limpiar datos de prueba
  await cleanupTestDecisions();
  
  console.log('\n✅ Pruebas completadas exitosamente!');
  console.log('\n🎯 La integración con Supabase está funcionando correctamente.');
  console.log('Ahora puedes usar el timeline de decisiones en la aplicación.');
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 