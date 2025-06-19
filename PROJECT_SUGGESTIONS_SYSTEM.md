# Sistema de Sugerencias Inteligentes para Proyectos

## 📋 Descripción General

El Sistema de Sugerencias Inteligentes utiliza **Gemini 1.5 Flash** de Google para analizar proyectos de auditoría municipal y proporcionar recomendaciones personalizadas sobre los próximos pasos a seguir.

## 🎯 Características Principales

### ✨ Análisis Inteligente
- **Contexto Municipal Guatemalteco**: Especializado en auditoría municipal y transparencia
- **Análisis Multicriterio**: Considera estado, prioridad, decisiones previas y contexto del proyecto
- **Sugerencias Categorizadas**: Organiza recomendaciones por tipo y prioridad

### 🔧 Funcionalidades
- **Cache Inteligente**: Las sugerencias se guardan localmente por 1 hora
- **Regeneración Bajo Demanda**: Actualización manual cuando sea necesario
- **Interfaz Intuitiva**: Acordeones desplegables con información detallada
- **Integración Completa**: Conectado con decisiones y assets del proyecto

## 🏗️ Arquitectura del Sistema

### Backend (ExtractorW)
```
/server/routes/project-suggestions.js    # Endpoint principal
/server/routes/index.js                  # Registro de rutas
```

### Frontend (PulseJ)
```
/src/services/geminiSuggestions.ts       # Servicio de comunicación
/src/components/ui/ProjectSuggestions.tsx # Componente UI principal
/src/components/ui/ProjectDashboard.tsx   # Integración en dashboard
```

## 📡 API Endpoint

### POST `/api/project-suggestions`

**Request:**
```json
{
  "project": {
    "title": "string",
    "description": "string",
    "status": "active|paused|completed|archived",
    "priority": "low|medium|high|urgent",
    "category": "string",
    "tags": ["string"],
    "start_date": "ISO date",
    "target_date": "ISO date",
    "decisions": [
      {
        "title": "string",
        "description": "string",
        "decision_type": "enfoque|alcance|configuracion",
        "sequence_number": "number"
      }
    ]
  }
}
```

**Response:**
```json
{
  "analysis": "Análisis del estado actual del proyecto",
  "suggestions": [
    {
      "id": "suggestion_1",
      "title": "Título de la sugerencia",
      "description": "Descripción detallada",
      "category": "analysis|research|platform|external|documentation",
      "priority": "high|medium|low",
      "action": "Acción específica a tomar",
      "estimatedTime": "Tiempo estimado",
      "tools": ["herramienta1", "herramienta2"]
    }
  ],
  "generatedAt": "ISO timestamp"
}
```

## 🎨 Componente UI

### ProjectSuggestions.tsx

**Props:**
- `project: Project` - Datos del proyecto
- `decisions: ProjectDecision[]` - Decisiones del proyecto

**Estados:**
- `suggestions` - Sugerencias cargadas
- `loading` - Estado de carga
- `error` - Mensajes de error

**Funcionalidades:**
- **Cache manual de sugerencias (7 días)**
- **Generación solo manual** - NO se generan automáticamente
- Botón de generación/regeneración manual
- Interfaz con acordeones
- Chips de categoría y prioridad
- Información de herramientas y tiempo

**Comportamiento de Cache:**
- Las sugerencias se guardan por 7 días
- Solo se actualizan cuando el usuario presiona "Generar/Regenerar"
- Carga automática solo de sugerencias existentes válidas

## 🧠 Prompt de Gemini

### Contexto Especializado
- **Auditoría Municipal**: Enfoque en transparencia y gobierno local
- **Guatemala**: Instituciones como SAT, CGC, MP, INFODIGTO
- **Herramientas de Plataforma**: Sondeos, Tendencias, Noticias, Codex, Decisiones por Capas

### Categorías de Sugerencias
- **analysis**: Análisis de datos y métricas
- **research**: Investigación y recopilación de información
- **platform**: Uso de herramientas de la plataforma
- **external**: Acciones fuera de la plataforma
- **documentation**: Documentación y registro

### Niveles de Prioridad
- **high**: Acciones críticas e inmediatas
- **medium**: Acciones importantes pero no urgentes
- **low**: Acciones de mejora y optimización

## 🔧 Configuración

### Variables de Entorno (ExtractorW)
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Dependencias
```bash
npm install @google/generative-ai
```

## 🚀 Uso en la Aplicación

### 1. Navegación
- Ir a **Proyectos** → Seleccionar proyecto → **Ver detalles**
- La sección "Sugerencias Inteligentes" aparece debajo de "Acciones Rápidas"

### 2. Generación de Sugerencias
- Click en **"Recibir Sugerencias"** para primera generación
- Use el botón de recarga ↻ para actualizar
- Las sugerencias se guardan automáticamente en cache

### 3. Visualización
- **Análisis**: Resumen del estado del proyecto
- **Sugerencias**: Lista expandible con detalles
- **Información**: Categoría, prioridad, tiempo estimado, herramientas

## 📊 Tipos de Sugerencias Generadas

### 🔍 Investigación (research)
- Búsquedas en fuentes oficiales
- Revisión de antecedentes
- Análisis de tendencias relacionadas

### 💻 Plataforma (platform)
- Crear sondeos temáticos
- Revisar tendencias actuales
- Gestionar documentos en Codex
- Estructurar decisiones por capas

### 📊 Análisis (analysis)
- Evaluación de métricas
- Comparación de datos
- Identificación de patrones

### 🌐 Externo (external)
- Consultas a instituciones
- Revisión de portales oficiales
- Verificación en registros públicos

### 📝 Documentación (documentation)
- Sistematización de hallazgos
- Creación de reportes
- Registro de evidencias

## 🧪 Testing

### Script de Pruebas
```bash
cd ExtractorW
node test-project-suggestions.js
```

**Escenarios de Prueba:**
- Proyecto básico sin decisiones
- Proyecto avanzado con múltiples decisiones
- Diferentes estados y prioridades
- Validación de respuestas JSON

## 🔄 Cache y Performance

### Cache Local
- **Duración**: 1 hora
- **Clave**: `project_suggestions_{projectId}`
- **Storage**: localStorage del navegador

### Optimizaciones
- **Gemini 1.5 Flash**: Modelo optimizado para velocidad
- **Fallback**: Sugerencias estáticas si falla la API
- **Error Handling**: Manejo graceful de errores de red

## 📈 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Sugerencias basadas en assets del proyecto
- [ ] Integración con historial de decisiones
- [ ] Sugerencias colaborativas para equipos
- [ ] Analytics de efectividad de sugerencias
- [ ] Personalización por tipo de auditoría

### Mejoras Técnicas
- [ ] Streaming de respuestas para sugerencias largas
- [ ] Cache en servidor para equipos
- [ ] Versioning de prompts
- [ ] A/B testing de diferentes enfoques

## 🎯 Beneficios del Sistema

### Para Auditores
- **Orientación Clara**: Próximos pasos específicos y accionables
- **Ahorro de Tiempo**: Evita planificación manual repetitiva
- **Mejores Prácticas**: Incorpora experiencia en auditoría municipal
- **Contexto Local**: Considera especificidades de Guatemala

### Para Equipos
- **Consistencia**: Metodología uniforme entre proyectos
- **Aprendizaje**: Transferencia de conocimiento automática
- **Eficiencia**: Reduce tiempo de planificación
- **Calidad**: Sugerencias basadas en mejores prácticas

---

> **Nota**: Este sistema está diseñado específicamente para auditoría municipal en Guatemala y utiliza IA para mejorar la eficiencia y efectividad de los procesos de auditoría y transparencia. 