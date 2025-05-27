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
        console.log('🔍 AuthVerification - INICIANDO VERIFICACIÓN');
        console.log('🔍 AuthVerification - Environment:', {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          href: window.location.href,
          userAgent: navigator.userAgent
        });
        
        setStatus('checking');
        setMessage('Verificando tu cuenta...');
        
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔍 AuthVerification - Session data:', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email,
          userId: data.session?.user?.id,
          sessionError: error
        });
        
        if (error) {
          console.error('❌ AuthVerification - Error obteniendo sesión:', error);
          setStatus('error');
          setMessage('Error de autenticación');
          setTimeout(() => {
            console.log('🔄 AuthVerification - Redirigiendo a login por error de sesión');
            navigate('/login');
          }, 2000);
          return;
        }

        if (!data.session || !data.session.user) {
          // No hay sesión, redirigir a login y detener el efecto
          console.log('❌ AuthVerification - No hay sesión válida, redirigiendo a login');
          console.log('🔍 AuthVerification - Session details:', {
            session: data.session,
            user: data.session?.user
          });
          navigate('/login');
          return;
        }

        const userId = data.session.user.id;
        const userEmail = data.session.user.email;
        
        console.log('✅ AuthVerification - Usuario autenticado:', {
          email: userEmail,
          id: userId,
          hasEmail: !!userEmail
        });
        
        if (!userEmail) {
          console.error('❌ AuthVerification - No se pudo obtener el email del usuario');
          setStatus('error');
          setMessage('Error obteniendo información del usuario');
          setTimeout(() => {
            console.log('🔄 AuthVerification - Redirigiendo a login por falta de email');
            navigate('/login');
          }, 2000);
          return;
        }
        
        // Verificar si el usuario está registrado en profiles
        console.log('🔍 AuthVerification - Verificando si usuario existe en profiles...');
        const userExists = await checkUserExists(userEmail);
        
        console.log('🔍 AuthVerification - Resultado verificación:', {
          userExists,
          email: userEmail
        });
        
        if (userExists) {
          // Usuario registrado, redirigir al dashboard
          console.log('✅ AuthVerification - Usuario verificado, redirigiendo al dashboard');
          setMessage('¡Bienvenido! Redirigiendo...');
          sessionStorage.setItem('user_verified', 'true');
          setTimeout(() => {
            console.log('🔄 AuthVerification - Navegando a dashboard');
            navigate('/');
          }, 1000);
          return;
        } else {
          // Usuario no registrado, cerrar sesión y redirigir al registro
          console.log('❌ AuthVerification - Usuario no registrado, iniciando limpieza');
          setMessage('Cuenta no registrada. Redirigiendo al registro...');
          sessionStorage.removeItem('user_verified');
          
          console.log('🗑️ AuthVerification - Eliminando usuario no registrado');
          await deleteUnregisteredUser(userId);
          
          console.log('🚪 AuthVerification - Cerrando sesión');
          await supabase.auth.signOut();
          
          console.log('🔄 AuthVerification - Redirigiendo a registro');
          navigate('/register?error=not_registered&message=Debes registrarte con un código de acceso antes de poder iniciar sesión');
          return;
        }
        
      } catch (error) {
        console.error('❌ AuthVerification - Error en verificación:', error);
        setStatus('error');
        setMessage('Error verificando tu cuenta');
        setTimeout(() => {
          console.log('🔄 AuthVerification - Redirigiendo a login por error general');
          navigate('/login');
        }, 2000);
      }
    };

    console.log('🔍 AuthVerification - useEffect ejecutándose');
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