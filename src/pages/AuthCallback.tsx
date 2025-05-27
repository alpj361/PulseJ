import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { CircularProgress, Box, Typography } from '@mui/material';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Función para validar código de invitación
  const validateInvitationCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .single();
      
      return !error && data;
    } catch (error) {
      // Fallback temporal para desarrollo - códigos de ejemplo
      const validCodes = ['JOURNALIST2024', 'PRESS-INVITE', 'MEDIA-ACCESS'];
      return validCodes.includes(code.toUpperCase());
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 AuthCallback - INICIANDO VERIFICACIÓN');
        console.log('🔍 AuthCallback - Current URL:', window.location.href);
        console.log('🔍 AuthCallback - URL params:', window.location.search);
        
        // Verificar si viene desde el registro con un código
        const codeParam = searchParams.get('code');
        const isFromRegister = !!codeParam;
        
        console.log('🔍 AuthCallback - Code param:', codeParam);
        console.log('🔍 AuthCallback - Is from register:', isFromRegister);
        
        // IMPORTANTE: Esperar a que Supabase procese el callback de OAuth
        console.log('🔍 AuthCallback - Esperando procesamiento de OAuth...');
        
        // Intentar obtener la sesión con reintentos
        let sessionData = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!sessionData && attempts < maxAttempts) {
          attempts++;
          console.log(`🔍 AuthCallback - Intento ${attempts}/${maxAttempts} obteniendo sesión`);
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ AuthCallback - Error obteniendo sesión:', error);
            if (attempts === maxAttempts) {
              navigate('/login?error=auth_failed');
              return;
            }
          } else if (data.session && data.session.user) {
            sessionData = data;
            console.log('✅ AuthCallback - Sesión obtenida exitosamente');
            break;
          } else {
            console.log('⏳ AuthCallback - Sesión aún no disponible, esperando...');
            // Esperar 1 segundo antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!sessionData || !sessionData.session || !sessionData.session.user) {
          console.error('❌ AuthCallback - No se pudo obtener sesión después de múltiples intentos');
          navigate('/login?error=auth_failed');
          return;
        }
        
        const userEmail = sessionData.session.user.email;
        const userId = sessionData.session.user.id;
        console.log('✅ AuthCallback - Usuario autenticado:', userEmail);
        console.log('🔍 AuthCallback - User ID:', userId);
        
        if (!isFromRegister) {
          // Si no viene desde registro, redirigir a verificación
          console.log('🔍 AuthCallback - No viene desde registro, redirigiendo a verificación');
          // Dar un momento para que la sesión se propague
          setTimeout(() => {
            navigate('/auth/verify');
          }, 500);
          return;
        }
        
        // Usuario viene desde registro con código, validar código y crear perfil
        console.log('🔍 AuthCallback - Usuario viene desde registro, validando código:', codeParam);
        
        const isValidCode = await validateInvitationCode(codeParam);
        console.log('🔍 AuthCallback - Código válido:', isValidCode);
        
        if (isValidCode) {
          // Crear perfil del usuario
          try {
            console.log('🔍 AuthCallback - Creando perfil del usuario...');
            await supabase.from('profiles').upsert({
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
              phone: '' // Inicializar con string vacío, el usuario lo puede llenar después
            });
            
            // Marcar código como usado
            try {
              await supabase.rpc('mark_invitation_code_used', {
                invitation_code: codeParam,
                user_id: sessionData.session.user.id
              });
            } catch (codeError) {
              console.log('⚠️ AuthCallback - Error marcando código como usado:', codeError);
            }
            
            console.log('✅ AuthCallback - Perfil creado exitosamente, redirigiendo a verificación');
            setTimeout(() => {
              navigate('/auth/verify');
            }, 500);
          } catch (profileError) {
            console.error('❌ AuthCallback - Error creando perfil:', profileError);
            await supabase.auth.signOut();
            navigate('/register?error=profile_creation_failed&message=Error creando tu perfil. Intenta de nuevo.');
          }
        } else {
          // Código inválido
          console.log('❌ AuthCallback - Código de invitación inválido');
          await supabase.auth.signOut();
          navigate('/register?error=invalid_code&message=Código de invitación inválido o ya utilizado');
        }
      } catch (error) {
        console.error('❌ AuthCallback - Error procesando callback:', error);
        navigate('/login?error=callback_failed');
      }
    };

    console.log('🔍 AuthCallback - useEffect ejecutándose');
    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
      }}
    >
      <CircularProgress size={60} sx={{ color: 'white' }} />
      <Typography variant="h6" sx={{ color: 'white' }}>
        Procesando autenticación...
      </Typography>
    </Box>
  );
} 