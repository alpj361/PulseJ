-- Función para eliminar usuarios no registrados de Supabase Auth
-- Esta función debe ejecutarse con permisos de administrador en Supabase

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

-- Ejemplo de uso:
-- SELECT delete_unregistered_user('user-id-here'); 