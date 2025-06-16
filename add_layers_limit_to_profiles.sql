-- Migración: Agregar límite de capas por usuario
-- Fecha: 2025-01-16
-- Descripción: Agregar columna layerslimit a la tabla profiles para controlar cuántas capas del mismo tipo puede crear un usuario

-- Agregar la columna layerslimit con valor por defecto de 3
ALTER TABLE profiles 
ADD COLUMN layerslimit INTEGER DEFAULT 3 NOT NULL;

-- Agregar comentario para documentar la columna
COMMENT ON COLUMN profiles.layerslimit IS 'Límite máximo de capas del mismo tipo de decisión que puede crear el usuario';

-- Opcional: Crear un índice si necesitamos consultar frecuentemente por este campo
CREATE INDEX idx_profiles_layerslimit ON profiles(layerslimit);

-- Verificar que la migración se aplicó correctamente
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'layerslimit'; 