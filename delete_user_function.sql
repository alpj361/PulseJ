-- Función para eliminar usuario (requiere service_role key)
-- Esta función debe ejecutarse en Supabase con permisos de administrador

-- Primero crear la función RPC para eliminar usuario
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Esta función requiere que sea ejecutada por un usuario con permisos de service_role
  -- En producción, esto debería manejarse desde el backend con service_role key
  SELECT 1; -- Placeholder function
$$;

-- Grant execute permission to authenticated users (temporal)
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Función más completa para eliminación de usuario (para backend)
-- Esta debería ejecutarse desde el backend con service_role key
CREATE OR REPLACE FUNCTION admin_delete_user(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar datos relacionados del usuario
  
  -- Eliminar items del codex
  DELETE FROM codex_items WHERE user_id = user_id_to_delete;
  
  -- Eliminar perfil
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Eliminar otros datos relacionados si existen
  -- DELETE FROM other_user_tables WHERE user_id = user_id_to_delete;
  
  -- Nota: La eliminación del usuario de auth.users debe hacerse 
  -- desde el backend con la función supabase.auth.admin.deleteUser()
  -- usando service_role key
  
END;
$$;

-- Esta función solo puede ser ejecutada por service_role
REVOKE EXECUTE ON FUNCTION admin_delete_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_delete_user(UUID) FROM authenticated;

-- Comentarios para implementación en backend:
/*
Para implementar la eliminación completa de usuario en el backend:

1. En Node.js/Express endpoint:
```javascript
const { createClient } = require('@supabase/supabase-js');

// Cliente con service_role key (solo en backend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para eliminar usuario
app.delete('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Eliminar datos relacionados
    await supabaseAdmin.rpc('admin_delete_user', { user_id_to_delete: userId });
    
    // Eliminar usuario de Auth
    await supabaseAdmin.auth.admin.deleteUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. Variables de entorno necesarias:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
*/ 