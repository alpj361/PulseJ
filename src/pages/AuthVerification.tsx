import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import Logo from '../components/common/Logo';

export default function AuthVerification() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'checking' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando autenticación...');

  // Función para verificar si un usuario está registrado en la base de datos
  const checkUserExists = async (userEmail: string): Promise<boolean> => {
    try {
      console.log('🔍 AuthVerification - Verificando email:', userEmail);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userEmail)
        .single();
      
      console.log('🔍 AuthVerification - Data:', data);
      console.log('🔍 AuthVerification - Error:', error);
      
      const exists = !error && !!data;
      console.log('🔍 AuthVerification - Usuario existe en profiles:', exists);
      return exists;
    } catch (error) {
      console.error('❌ AuthVerification - Error verificando usuario:', error);
      return false;
    }
  };

  // Función para eliminar usuario de Supabase Auth cuando no está registrado
  const deleteUnregisteredUser = async (userId: string): Promise<void> => {
    try {
      console.log('🗑️ AuthVerification - Eliminando usuario no registrado:', userId);
      
      // Nota: Esta operación requiere permisos especiales
      // Como alternativa, podemos usar una función RPC si está disponible
      const { error } = await supabase.rpc('delete_unregistered_user', {
        user_id: userId
      });
      
      if (error) {
        console.error('❌ Error eliminando usuario:', error);
        // Si no funciona la función RPC, al menos cerramos la sesión
        await supabase.auth.signOut();
      } else {
        console.log('✅ Usuario eliminado exitosamente');
      }
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      // Fallback: cerrar sesión
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    const verifyUser = async () => {
      try {
        setStatus('checking');
        setMessage('Verificando tu cuenta...');
        
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔍 AuthVerification - Session data:', data);
        console.log('🔍 AuthVerification - Session error:', error);
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          setStatus('error');
          setMessage('Error de autenticación');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!data.session || !data.session.user) {
          // No hay sesión, redirigir a login y detener el efecto
          console.log('❌ No hay sesión, redirigiendo a login');
          navigate('/login');
          return;
        }

        const userId = data.session.user.id;
        const userEmail = data.session.user.email;
        
        console.log('✅ Usuario autenticado:', userEmail);
        console.log('🔍 User ID:', userId);
        
        if (!userEmail) {
          console.error('❌ No se pudo obtener el email del usuario');
          setStatus('error');
          setMessage('Error obteniendo información del usuario');
          navigate('/login');
          return;
        }
        
        // Verificar si el usuario está registrado en profiles
        const userExists = await checkUserExists(userEmail);
        
        if (userExists) {
          // Usuario registrado, redirigir al dashboard
          console.log('✅ Usuario verificado, redirigiendo al dashboard');
          setMessage('¡Bienvenido! Redirigiendo...');
          sessionStorage.setItem('user_verified', 'true');
          setTimeout(() => navigate('/'), 1000);
          return;
        } else {
          // Usuario no registrado, cerrar sesión y redirigir al registro
          console.log('❌ Usuario no registrado, cerrando sesión y redirigiendo al registro');
          setMessage('Cuenta no registrada. Redirigiendo al registro...');
          sessionStorage.removeItem('user_verified');
          await deleteUnregisteredUser(userId);
          await supabase.auth.signOut();
          navigate('/register?error=not_registered&message=Debes registrarte con un código de acceso antes de poder iniciar sesión');
          return;
        }
        
      } catch (error) {
        console.error('❌ Error en verificación:', error);
        setStatus('error');
        setMessage('Error verificando tu cuenta');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    verifyUser();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
        gap: 3,
        px: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Logo />
      </Box>
      
      <CircularProgress size={60} sx={{ color: 'white' }} />
      
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'white', 
          textAlign: 'center',
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
        }}
      >
        {message}
      </Typography>
      
      {status === 'error' && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 400 }}>
          Hubo un problema verificando tu cuenta. Serás redirigido al login.
        </Alert>
      )}
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          textAlign: 'center',
          mt: 2
        }}
      >
        Por favor espera mientras verificamos tu acceso...
      </Typography>
    </Box>
  );
} 