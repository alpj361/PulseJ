-- Script para agregar el campo email a la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- Agregar columna email si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Opcional: Hacer el email único si quieres evitar duplicados
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_email UNIQUE (email);

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'; 