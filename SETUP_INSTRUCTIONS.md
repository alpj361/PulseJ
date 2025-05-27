# Instrucciones de Configuración - Sistema de Autenticación

## Pasos Requeridos en Supabase

### 1. Agregar campo email a la tabla profiles

Ejecuta este SQL en el Editor SQL de Supabase:

```sql
-- Agregar columna email si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';
```

### 2. Crear función para eliminar usuarios no registrados

Ejecuta este SQL en el Editor SQL de Supabase:

```sql
CREATE OR REPLACE FUNCTION delete_unregistered_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si el usuario existe en profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Si no existe en profiles, eliminar de auth.users
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Verificar si se eliminó
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  ELSE
    -- El usuario está registrado, no eliminar
    RETURN FALSE;
  END IF;
END;
$$;
```

## Flujo de Autenticación Actualizado

### Para Login con Email/Password:
1. Usuario ingresa credenciales → `Login.tsx`
2. Si autenticación exitosa → redirige a `/auth/verify`
3. `AuthVerification.tsx` verifica si el email existe en `profiles`
4. Si existe → marca como verificado y redirige al dashboard
5. Si no existe → elimina usuario de auth y redirige al registro

### Para Login con Google:
1. Usuario hace clic en "Iniciar sesión con Google" → `Login.tsx`
2. Redirige a Google OAuth → regresa a `/auth/callback`
3. `AuthCallback.tsx` verifica si viene desde registro (con código)
4. Si NO viene desde registro → redirige a `/auth/verify`
5. `AuthVerification.tsx` verifica si el email existe en `profiles`
6. Si existe → marca como verificado y redirige al dashboard
7. Si no existe → elimina usuario de auth y redirige al registro

### Para Registro:
1. Usuario se registra con código de invitación
2. Se crea entrada en `profiles` con `id`, `email` y `phone`
3. Se marca el código como usado
4. Redirige a `/auth/verify` que lo lleva al dashboard

## Verificaciones de Seguridad

- ✅ Usuarios no registrados son eliminados automáticamente de auth
- ✅ Solo usuarios con entrada en `profiles` pueden acceder
- ✅ Verificación por email en lugar de ID para mayor flexibilidad
- ✅ Flag de verificación en sessionStorage previene acceso directo
- ✅ Limpieza automática de flags al cerrar sesión

## Archivos Modificados

- `src/pages/AuthVerification.tsx` - Verificación por email y limpieza de usuarios
- `src/pages/AuthCallback.tsx` - Guarda email en profiles
- `src/pages/Register.tsx` - Guarda email en profiles
- `src/pages/Login.tsx` - Limpieza de código no usado
- `src/context/AuthContext.tsx` - Limpieza de sessionStorage al cerrar sesión
- `src/App.tsx` - VerifiedRoute mejorado con verificación de flags
- `src/config/auth.ts` - Detección correcta de puerto

## Pruebas Recomendadas

1. **Login con usuario registrado**: Debe funcionar normalmente
2. **Login con usuario no registrado**: Debe eliminar usuario y redirigir al registro
3. **Registro con código válido**: Debe crear perfil y permitir acceso
4. **Acceso directo a rutas protegidas**: Debe redirigir a verificación
5. **Cerrar sesión**: Debe limpiar todos los flags y redirigir al login 