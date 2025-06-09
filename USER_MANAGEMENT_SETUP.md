# Configuración de Gestión de Usuarios

Este documento explica cómo configurar las funciones de gestión de usuarios (cambiar contraseña, actualizar email, eliminar cuenta) en tu aplicación PulseJ con Supabase.

## Funciones Implementadas

### ✅ Cambiar Contraseña
- **Estado**: Completamente funcional
- **Implementación**: Usa `supabase.auth.updateUser({ password })`
- **Requisitos**: Usuario autenticado

### ✅ Actualizar Email
- **Estado**: Completamente funcional
- **Implementación**: Usa `supabase.auth.updateUser({ email })`
- **Requisitos**: Usuario autenticado
- **Nota**: Se envía un email de confirmación al nuevo correo

### ⚠️ Eliminar Cuenta
- **Estado**: Parcialmente implementado
- **Implementación**: Requiere configuración adicional en backend
- **Requisitos**: Service role key de Supabase

## Configuración Requerida

### 1. Frontend (Ya implementado)
El archivo `PulseJ/src/pages/Settings.tsx` ya contiene todas las funciones implementadas.

### 2. Base de Datos - Funciones SQL
Ejecuta el archivo `PulseJ/delete_user_function.sql` en tu Supabase SQL Editor:

```sql
-- Ejecutar el contenido completo del archivo delete_user_function.sql
```

### 3. Backend para Eliminación de Cuenta

Para implementar completamente la eliminación de cuenta, necesitas crear un endpoint en tu backend:

#### Opción A: Usando ExtractorW (Node.js)
Agrega este endpoint a `ExtractorW/server.js`:

```javascript
// Endpoint para eliminar usuario
app.delete('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar autenticación del usuario
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Eliminar datos relacionados usando la función admin
    await supabaseAdmin.rpc('admin_delete_user', { 
      user_id_to_delete: userId 
    });
    
    // Eliminar usuario de Auth (requiere service_role key)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### Opción B: Usando Netlify Functions
Crea `PulseJ/netlify/functions/delete-user.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body);
    
    // Eliminar datos relacionados
    await supabaseAdmin.rpc('admin_delete_user', { 
      user_id_to_delete: userId 
    });
    
    // Eliminar usuario de Auth
    await supabaseAdmin.auth.admin.deleteUser(userId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 4. Variables de Entorno

Agrega a tu archivo `.env`:

```env
# Para backend/Netlify functions
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**¿Dónde encontrar el Service Role Key?**
1. Ve a tu dashboard de Supabase
2. Navega a Settings > API
3. Copia la "service_role" key (¡Nunca la expongas en el frontend!)

### 5. Actualizar Frontend para Usar Backend

Si implementas el backend, actualiza la función `handleDeleteAccount` en `Settings.tsx`:

```javascript
// Reemplazar la línea:
const { error } = await supabase.rpc('delete_user');

// Por:
const response = await fetch('/api/user/' + user.id, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session?.access_token
  }
});

if (!response.ok) {
  throw new Error('Error eliminando cuenta');
}
```

## Configuración de Políticas RLS

Asegúrate de que tienes las políticas correctas en Supabase:

```sql
-- Permitir a usuarios eliminar sus propios datos
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can delete own codex items" ON codex_items
  FOR DELETE USING (auth.uid() = user_id);
```

## Testing

### Cambiar Contraseña
1. Ve a Settings
2. Ingresa contraseña actual, nueva contraseña y confirmación
3. Haz clic en "Cambiar Contraseña"
4. Verifica que puedes iniciar sesión con la nueva contraseña

### Actualizar Email
1. Ve a Settings
2. Ingresa nuevo email
3. Haz clic en "Actualizar Correo Electrónico"
4. Revisa el nuevo email para el enlace de confirmación
5. Haz clic en el enlace para confirmar

### Eliminar Cuenta
1. Implementa primero el backend
2. Ve a Settings > Zona Peligrosa
3. Haz clic en "Eliminar Cuenta Permanentemente"
4. Confirma en los dos diálogos
5. Verifica que la cuenta y datos fueron eliminados

## Consideraciones de Seguridad

1. **Service Role Key**: Nunca expongas esta clave en el frontend
2. **Confirmaciones**: Siempre pide confirmación múltiple para eliminación
3. **Logs**: Registra todas las eliminaciones de cuenta para auditoría
4. **Backup**: Considera hacer backup antes de eliminar datos
5. **Rate Limiting**: Implementa límites de intentos para cambios de contraseña

## Troubleshooting

### Error: "No se pudo cambiar la contraseña"
- Verifica que la contraseña actual sea correcta
- Asegúrate de que la nueva contraseña tenga al menos 6 caracteres

### Error: "No se pudo actualizar el correo electrónico"
- Verifica que el nuevo email sea válido
- Asegúrate de que el email no esté ya en uso

### Error: "No se pudo eliminar la cuenta"
- Verifica que el backend esté configurado correctamente
- Confirma que el service_role key sea válido
- Revisa los logs del servidor para más detalles 