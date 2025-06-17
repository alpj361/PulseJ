# Enhanced Codex - Setup Guide

## Funcionalidades Implementadas

### 1. Subida de Archivos
- **Validación de archivos**: Tipos permitidos (imágenes, videos, audios, documentos, texto)
- **Límite de tamaño**: 100MB por archivo
- **Drag & Drop**: Arrastra archivos directamente al área de subida
- **Progreso de subida**: Visualización en tiempo real del progreso
- **Almacenamiento**: Supabase Storage con URLs públicas
- **Metadatos**: Título, descripción, etiquetas y tipo de contenido opcional

### 2. Integración con Google Drive
- **Autenticación OAuth**: Conexión segura con Google Drive
- **Exploración de archivos**: Lista de archivos del Drive del usuario
- **Selección de archivos**: Interfaz visual para seleccionar archivos
- **Vincular archivos**: Guarda enlaces y metadatos en lugar de descargar
- **Tipos de contenido**: Especificación de tipo de contenido periodístico

### 3. Notas Rápidas
- **Editor de texto**: Área de texto para contenido de notas
- **Metadatos opcionales**: Título, descripción, etiquetas en secciones desplegables
- **Tipos de contenido**: 15 sugerencias predefinidas para periodismo

## Configuración Requerida

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Supabase Configuration
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

# Google Drive API Configuration
VITE_GOOGLE_CLIENT_ID=tu_client_id_de_google
VITE_GOOGLE_API_KEY=tu_api_key_de_google

# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3000
```

### Configuración de Google Drive API

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/
2. **Crear o seleccionar un proyecto**
3. **Habilitar APIs**:
   - Google Drive API
   - Google Picker API
4. **Crear credenciales**:
   - Tipo: ID de cliente OAuth 2.0
   - Tipo de aplicación: Aplicación web
   - Orígenes autorizados: `http://localhost:3000`, `https://tu-dominio.com`
5. **Crear API Key**:
   - Restricciones: Google Drive API, Google Picker API
6. **Copiar credenciales** a las variables de entorno

### Configuración de Supabase Storage

1. **Bucket existente**: Tu proyecto ya tiene el bucket `digitalstorage` configurado
2. **Políticas RLS**: Ya están configuradas correctamente:

```sql
-- Política existente (ya configurada en tu proyecto)
CREATE POLICY "Users can access their own files" ON storage.objects
FOR ALL USING (
  auth.role() = 'authenticated' 
  AND bucket_id = 'digitalstorage' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Actualizar tabla codex_items

Si no existe la tabla, ejecutar:

```sql
CREATE TABLE codex_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  proyecto TEXT DEFAULT 'Sin proyecto',
  project_id UUID,
  storage_path TEXT,
  url TEXT,
  nombre_archivo TEXT,
  tamano BIGINT,
  is_drive BOOLEAN DEFAULT FALSE,
  drive_file_id TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX codex_items_user_id_idx ON codex_items(user_id);
CREATE INDEX codex_items_tipo_idx ON codex_items(tipo);
CREATE INDEX codex_items_proyecto_idx ON codex_items(proyecto);
CREATE INDEX codex_items_fecha_idx ON codex_items(fecha DESC);

-- RLS policies
ALTER TABLE codex_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own codex items" ON codex_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own codex items" ON codex_items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own codex items" ON codex_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own codex items" ON codex_items
FOR DELETE USING (auth.uid() = user_id);
```

## Tipos de Contenido Periodístico

El sistema incluye 15 tipos predefinidos:
- Conferencia de prensa
- Entrevista exclusiva
- Documento legal
- Informe gubernamental
- Declaración oficial
- Testimonio personal
- Documento técnico
- Comunicado de prensa
- Acta de reunión
- Expediente judicial
- Análisis de experto
- Denuncia ciudadana
- Documento histórico
- Investigación periodística
- Material de archivo

## Estructura de Archivos

Los archivos se organizan en Supabase Storage:
```
digitalstorage/
├── {user_id}/
│   ├── 1234567890_abc123.pdf
│   ├── 1234567891_def456.jpg
│   └── ...
```

## Uso del Sistema

1. **Abrir modal**: Click en "Agregar Item" 
2. **Seleccionar fuente**: Subir archivo, Google Drive o Nota
3. **Completar información**: Solo título es obligatorio, resto opcional
4. **Expandir metadatos**: Click en "Información adicional" para campos extra
5. **Guardar**: El sistema procesará y guardará automáticamente

## Limitaciones Actuales

- **Tamaño máximo**: 100MB por archivo
- **Tipos de archivo**: Solo multimedia y documentos de oficina
- **Google Drive**: Solo lectura, sin edición de archivos
- **Offline**: Requiere conexión a internet para todas las funciones

## Próximas Mejoras

- [ ] Integración con más servicios cloud (Dropbox, OneDrive)
- [ ] OCR automático para documentos escaneados
- [ ] Transcripción automática de audios
- [ ] Búsqueda de texto completo en documentos
- [ ] Etiquetado automático con IA
- [ ] Compartir archivos entre usuarios
- [ ] Versionado de documentos
- [ ] Integración con sistemas de gestión documental externos 