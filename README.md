# PulseJ - Dashboard de Tendencias y Codex

## Descripción
Dashboard moderno para análisis de tendencias y gestión de contenido con autenticación Supabase y integración con Google Drive.

## Características principales

### 🔐 Sistema de autenticación robusto
- Autenticación con Supabase (email/password y Google OAuth)
- Solo usuarios registrados con código de invitación pueden acceder
- Limpieza automática de usuarios no registrados de `auth.users`
- Verificación de email entre Supabase y Google OAuth

### 📊 Dashboard de tendencias
- Visualización de tendencias en tiempo real desde backend ExtractorW
- Gráficos interactivos con Chart.js
- Filtros por fecha y categoría

### 📁 Codex con Google Drive
- **Nuevo sistema modular y robusto** para Google Drive Picker
- Hook `useGoogleDrive` centralizado que maneja OAuth + Picker
- Carga única de scripts Google APIs (evita duplicados)
- Manejo estandarizado de errores con mensajes amigables
- Verificación automática de emails entre Supabase y Google
- Importación de documentos, audio y video desde Google Drive

## Arquitectura del Google Drive Picker

### Módulos principales

#### 1. `utils/googleApiLoader.ts`
- **Propósito**: Carga única y controlada de Google APIs
- **Funciones**:
  - `loadGsi()`: Carga Google Sign-In con reintentos
  - `loadGapiPicker()`: Carga Google Picker API
  - `waitForGsi()`: Utilidad para esperar disponibilidad
- **Beneficios**: Evita scripts duplicados, manejo robusto de errores

#### 2. `config/google.ts`
- **Propósito**: Configuración centralizada de Google APIs
- **Incluye**:
  - Client ID y Developer Key
  - Scopes para Google Drive
  - Mapeo de errores OAuth con mensajes amigables
  - Funciones de utilidad para manejo de errores

#### 3. `hooks/useGoogleDrive.ts`
- **Propósito**: Hook global para manejo de Google Drive
- **Estado gestionado**:
  - `token`: Access token actual
  - `loading`: Estado de carga
  - `error`: Errores con mensajes amigables
  - `email`: Email del usuario Google
  - `isGoogleUser`: Detección automática de usuarios Google
  - `canUseDrive`: Verificación de permisos
- **Funciones**:
  - `requestToken()`: Solicita access token con OAuth
  - `openPicker()`: Abre Google Picker con token válido
  - `clearToken()`: Limpia estado y tokens

#### 4. `components/GoogleDrivePickerButton.tsx`
- **Propósito**: Componente UI simplificado
- **Props**:
  - `onFilePicked`: Callback cuando se selecciona archivo
  - `onError`: Callback para manejo de errores
  - `buttonText`: Texto personalizable del botón
  - `disabled`: Estado deshabilitado
- **Características**:
  - Estados visuales (loading, error, success)
  - Mensajes informativos automáticos
  - Integración completa con `useGoogleDrive`

### Flujo de funcionamiento

1. **Inicialización**: El hook `useGoogleDrive` detecta si el usuario es de Google
2. **Carga de APIs**: Se cargan GSI y GAPI Picker de forma asíncrona y única
3. **Solicitud de token**: Al hacer clic, se solicita access token con scopes de Drive
4. **Verificación**: Se verifica que el email de Google coincida con Supabase
5. **Picker**: Se abre Google Picker con token válido
6. **Selección**: El archivo seleccionado se pasa al callback `onFilePicked`

### Manejo de errores

- **Errores de OAuth**: Mensajes amigables mapeados desde códigos técnicos
- **Errores de carga**: Reintentos automáticos para APIs de Google
- **Errores de verificación**: Validación de emails entre servicios
- **Errores recuperables**: Identificación automática para reintentos

## Instalación y configuración

### Prerrequisitos
- Node.js 18+
- Cuenta de Supabase configurada
- Proyecto de Google Cloud con APIs habilitadas

### Variables de entorno
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Configuración de Google Cloud
1. Habilitar Google Drive API y Google Picker API
2. Configurar OAuth 2.0 con dominios autorizados
3. Obtener Client ID y Developer Key
4. Actualizar `config/google.ts` con tus credenciales

### Instalación
```bash
npm install
npm run dev
```

## Estructura del proyecto

```
src/
├── components/
│   ├── GoogleDrivePickerButton.tsx  # Componente UI del picker
│   └── ...
├── hooks/
│   ├── useGoogleDrive.ts           # Hook principal de Google Drive
│   └── ...
├── utils/
│   ├── googleApiLoader.ts          # Cargador de APIs de Google
│   └── ...
├── config/
│   ├── google.ts                   # Configuración de Google APIs
│   ├── auth.ts                     # Configuración de autenticación
│   └── ...
├── pages/
│   ├── Codex.tsx                   # Página principal del codex
│   ├── Trends.tsx                  # Dashboard de tendencias
│   └── ...
└── context/
    ├── AuthContext.tsx             # Contexto de autenticación
    └── ...
```

## Uso del Google Drive Picker

### Implementación básica
```tsx
import { GoogleDrivePickerButton } from '../components/GoogleDrivePickerButton';

function MiComponente() {
  const handleFilePicked = (file) => {
    console.log('Archivo seleccionado:', file);
    // Procesar archivo...
  };

  const handleError = (error) => {
    console.error('Error:', error);
    // Mostrar error al usuario...
  };

  return (
    <GoogleDrivePickerButton
      onFilePicked={handleFilePicked}
      onError={handleError}
      buttonText="Seleccionar archivo"
    />
  );
}
```

### Uso avanzado con hook
```tsx
import { useGoogleDrive } from '../hooks/useGoogleDrive';

function ComponenteAvanzado() {
  const { 
    isGoogleUser, 
    token, 
    loading, 
    error, 
    openPicker, 
    requestToken 
  } = useGoogleDrive();

  // Lógica personalizada...
}
```

## Mejoras implementadas

### ✅ Problemas resueltos
- **Scripts duplicados**: Carga única controlada
- **Errores de inicialización**: Reintentos automáticos
- **Bucles infinitos**: Flujo de estado robusto
- **Manejo de errores**: Mensajes amigables y recuperación
- **Verificación de usuarios**: Validación automática de emails

### 🚀 Beneficios
- **Rendimiento**: Menos scripts, menos memoria
- **Estabilidad**: Manejo robusto de errores de red
- **UX**: Mensajes claros y estados visuales
- **Mantenibilidad**: Código modular y reutilizable
- **Debugging**: Logs exhaustivos con emojis

## Desarrollo

### Scripts disponibles
- `npm run dev`: Servidor de desarrollo
- `npm run build`: Build de producción
- `npm run preview`: Preview del build

### Debugging
Los logs incluyen emojis para facilitar el debugging:
- 🟦 Información general
- 🟩 Éxito/completado
- 🟧 Advertencias
- 🟥 Errores
- 🟨 Callbacks/eventos

## Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

MIT License - ver archivo LICENSE para detalles.