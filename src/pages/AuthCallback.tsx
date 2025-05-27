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
        
        if (!isFromRegister) {
          // Si no viene desde registro, dejar que AuthVerification maneje la verificación
          console.log('🔍 AuthCallback - No viene desde registro, redirigiendo a verificación');
          navigate('/auth/verify');
          return;
        }
        
        // Obtener la sesión actual después del callback de OAuth
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔍 AuthCallback - Session data:', data);
        console.log('🔍 AuthCallback - Session error:', error);
        
        if (error) {
          console.error('❌ Error en callback:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (data.session && data.session.user) {
          const userEmail = data.session.user.email;
          const userId = data.session.user.id;
          console.log('✅ Usuario autenticado:', userEmail);
          console.log('🔍 User ID:', userId);
          
          // Usuario viene desde registro con código, validar código y crear perfil
          console.log('🔍 Usuario viene desde registro, validando código:', codeParam);
          
          const isValidCode = await validateInvitationCode(codeParam);
          console.log('🔍 Código válido:', isValidCode);
          
          if (isValidCode) {
            // Crear perfil del usuario
            try {
              console.log('🔍 Creando perfil del usuario...');
              await supabase.from('profiles').upsert({
                id: data.session.user.id,
                email: data.session.user.email,
                phone: '' // Inicializar con string vacío, el usuario lo puede llenar después
              });
              
              // Marcar código como usado
              try {
                await supabase.rpc('mark_invitation_code_used', {
                  invitation_code: codeParam,
                  user_id: data.session.user.id
                });
              } catch (codeError) {
                console.log('⚠️ Error marcando código como usado:', codeError);
              }
              
              console.log('✅ Perfil creado exitosamente, redirigiendo al dashboard');
              navigate('/auth/verify');
            } catch (profileError) {
              console.error('❌ Error creando perfil:', profileError);
              await supabase.auth.signOut();
              navigate('/register?error=profile_creation_failed&message=Error creando tu perfil. Intenta de nuevo.');
            }
          } else {
            // Código inválido
            console.log('❌ Código de invitación inválido');
            await supabase.auth.signOut();
            navigate('/register?error=invalid_code&message=Código de invitación inválido o ya utilizado');
          }
        } else {
          // No hay sesión, redirigir a login
          console.log('❌ No hay sesión, redirigiendo a login');
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ Error procesando callback:', error);
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