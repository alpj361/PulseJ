# 🎭 Modo Demo - PulseJ

**DemoPulse** es la versión demo de PulseJ que permite explorar todas las funcionalidades sin necesidad de registro o configuración. Ideal para evaluaciones, demostraciones y pruebas de concepto.

## ✨ Características del Modo Demo

### ✅ Acceso Completo Sin Restricciones
- **Sin registro**: Acceso directo sin crear cuenta
- **Sin configuración**: No requiere variables de entorno de Supabase
- **Usuario simulado**: Perfil demo con créditos ilimitados (500 créditos)
- **Permisos de administrador**: Acceso total al panel de administración
- **Datos de prueba realistas**: Contenido simulado para explorar todas las interfaces

### 🚀 Funcionalidades Disponibles

#### ✅ Dashboard Principal
- Vista de tendencias con datos simulados
- Análisis de actividad reciente
- Métricas y estadísticas en tiempo real
- Gráficos interactivos y visualizaciones

#### ✅ Sistema de Proyectos
- **Proyectos de muestra incluidos:**
  - "Investigación Elecciones 2024" (Activo, Prioridad Alta)
  - "Cobertura Crisis Migratoria" (Completado, Prioridad Media)
  - "Tendencias Económicas 2024" (Activo, Prioridad Media)
- Crear, editar y eliminar proyectos
- Sistema de tags y categorías
- Filtrado y búsqueda avanzada
- Estados: activo, pausado, completado, archivado

#### ✅ Sistema de Decisiones por Capas
- **Límites generosos**: 50 capas por tipo de decisión
- **Tres tipos de decisiones:**
  - **Enfoque**: Dirección estratégica y marco conceptual
  - **Alcance**: Límites temporales, geográficos y temáticos  
  - **Configuración**: Herramientas, formatos y metodologías
- Formularios específicos por tipo
- Validación flexible (solo título + un campo adicional)
- Selección múltiple en formatos de salida

#### ✅ Panel de Administración
- **Acceso completo habilitado** para evaluación
- Gestión de usuarios simulados
- Estadísticas de uso del sistema
- Configuración de límites y permisos
- Logs de actividad

#### ✅ Analytics y Reportes
- Gráficos de tendencias
- Métricas de rendimiento
- Análisis de datos
- Exportación de reportes

#### ✅ Gestión de Noticias
- Feed de noticias simulado
- Categorización automática
- Filtros por relevancia
- Sistema de marcadores

#### ✅ Configuraciones de Diseño
- Personalización de interfaz
- Temas y colores
- Configuraciones de usuario
- Preferencias de visualización

## 🚀 Cómo Usar el Modo Demo

### Opción 1: Desde la Página Principal
1. Ve a `http://localhost:5173`
2. Haz clic en **"Explorar Demo"** (botón verde)
3. Serás redirigido automáticamente al dashboard en modo demo

### Opción 2: URL Directa
- `http://localhost:5173/dashboard?demo=true`
- `http://localhost:5173/demo` (redirige automáticamente)

### Opción 3: Cualquier Ruta con Parámetro Demo
- Agrega `?demo=true` a cualquier URL para activar el modo demo
- Ejemplo: `http://localhost:5173/projects?demo=true`

## 🎯 Para Evaluadores

### ✅ Funcionalidades Clave a Probar
1. **Navegación**: Todas las rutas están accesibles
2. **Proyectos**: Crear, editar, filtrar proyectos
3. **Decisiones**: Sistema de capas con formularios específicos
4. **Admin Panel**: Acceso completo a funciones administrativas
5. **Analytics**: Visualización de datos y métricas
6. **Responsive**: Interfaz adaptada para móvil y desktop

### 📊 Datos de Prueba Incluidos
- **3 proyectos de ejemplo** con diferentes estados y prioridades
- **Usuario demo** con 500 créditos y límite de 50 capas
- **Permisos de administrador** activados
- **Métricas simuladas** para gráficos y reportes

### 🔒 Limitaciones del Modo Demo
- Los datos no se persisten (se reinician al refrescar)
- No hay conexión real con servicios externos
- Algunas integraciones están simuladas
- Los cambios no afectan la base de datos real

## 🛠️ Configuración Técnica

### Detección Automática del Modo Demo
El sistema detecta automáticamente el modo demo cuando:
- Se encuentra el parámetro `?demo=true` en la URL
- Las variables de entorno de Supabase no están configuradas
- El usuario tiene ID `demo-user-id`

### Usuario Demo Simulado
```javascript
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@pulsej.com',
  name: 'Usuario Demo',
  credits: 500,
  layerslimit: 50,
  role: 'admin'
}
```

### Indicador Visual
- Barra superior verde con mensaje: "🎭 MODO DEMO - Todas las funcionalidades habilitadas para evaluación"
- Badge "EVALUACIÓN" para identificar el modo activo
- Logs en consola para debugging

## 🏗️ Arquitectura del Modo Demo

### Componentes Modificados
- `AuthContext.tsx`: Gestión de usuario simulado
- `useAdmin.ts`: Permisos de admin automáticos  
- `useUserProfile.ts`: Perfil demo con créditos ilimitados
- `userLimits.ts`: Límites generosos para capas
- `projects.ts`: Proyectos de muestra incluidos
- `Layout.tsx`: Indicador visual del modo demo

### Flujo de Activación
1. Usuario accede con parámetro `?demo=true`
2. `AuthContext` detecta el parámetro y activa modo demo
3. Se configura usuario simulado con sesión demo
4. Todos los servicios usan datos simulados
5. Se otorgan permisos de administrador automáticamente
6. Se muestra indicador visual en la interfaz

## 🔄 Actualización y Mantenimiento

Para mantener el modo demo actualizado:
1. Sincronizar nuevas funcionalidades con datos simulados
2. Actualizar proyectos de ejemplo según necesidades
3. Verificar que todas las rutas sean accesibles
4. Probar regularmente el flujo completo de demo

## 📞 Soporte

Si encuentras algún problema con el modo demo:
1. Verifica que el parámetro `?demo=true` esté en la URL
2. Revisa la consola del navegador para logs de debug
3. Asegúrate de que el indicador verde aparezca en la parte superior
4. Refresca la página y vuelve a intentar

---

**¡El modo demo está listo para evaluación completa! 🎉**

Todas las funcionalidades de PulseJ están disponibles sin restricciones para que puedas explorar y evaluar la plataforma completamente. 