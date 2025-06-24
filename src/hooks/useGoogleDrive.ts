import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadGsi, loadGapiPicker } from '../utils/googleApiLoader';
import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_DEVELOPER_KEY, 
  GOOGLE_DRIVE_SCOPES,
  getGoogleErrorMessage,
  isRecoverableGoogleError
} from '../config/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleDriveFile {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
}

// Clave para localStorage
const GOOGLE_DRIVE_TOKEN_KEY = 'google_drive_token';
const GOOGLE_DRIVE_EMAIL_KEY = 'google_drive_email';

export function useGoogleDrive() {
  const { user } = useAuth();
  
  // Token de Google Drive vive únicamente en memoria. Siempre se pedirá uno nuevo cuando sea necesario.
  const [token, setToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState<string | null>(null);
  
  const tokenClientRef = useRef<any>(null);
  const pendingPickerCallbackRef = useRef<((file: GoogleDriveFile) => void) | null>(null);
  const autoOpenPickerRef = useRef<boolean>(false); // Para controlar auto-apertura del picker

  // Verificar si el usuario está autenticado con Google (usar useMemo para estabilizar)
  const isGoogleUser = useMemo(() => {
    return user?.app_metadata?.provider === 'google' || 
           user?.identities?.some((id: any) => id.provider === 'google');
  }, [user?.app_metadata?.provider, user?.identities]);

  console.log('🟦 [useGoogleDrive] Usuario de Google:', isGoogleUser);
  console.log('🟦 [useGoogleDrive] Token actual:', !!token, token ? `(${token.substring(0, 20)}...)` : '(null)');

  // Ya no se usa localStorage, así que no hay necesidad de sincronizar nada en cada render.

  // Función para guardar token en memoria
  const saveToken = useCallback((newToken: string) => {
    setToken(newToken);
    console.log('🟩 [useGoogleDrive] Token actualizado (memoria):', newToken.substring(0, 20) + '...');
  }, []);

  // Función para guardar email en memoria
  const saveEmail = useCallback((newEmail: string) => {
    setEmail(newEmail);
    console.log('🟩 [useGoogleDrive] Email en memoria:', newEmail);
  }, []);

  // Verificar si el token actual es válido sin solicitar uno nuevo
  const isTokenValid = useCallback(async (): Promise<boolean> => {
    if (!token) {
      console.log('🟧 [useGoogleDrive] No hay token para validar');
      return false;
    }

    try {
      // Hacer una llamada simple a la API de Google Drive para verificar el token
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;
      console.log(`🟦 [useGoogleDrive] Token válido: ${isValid}`);
      return isValid;
    } catch (e) {
      console.warn('🟧 [useGoogleDrive] Error verificando token:', e);
      return false;
    }
  }, [token]);

  // Función interna para abrir picker con token existente (sin dependencias de token)
  const openPickerWithToken = useCallback(async (onFilePicked: (file: GoogleDriveFile) => void, accessToken: string) => {
    if (!accessToken) {
      console.error('🟥 [useGoogleDrive] openPickerWithToken llamado sin token');
      return;
    }

    try {
      console.log('🟦 [useGoogleDrive] Cargando Google Picker...');
      await loadGapiPicker();
      
      console.log('🟩 [useGoogleDrive] APIs cargadas, creando Picker...');

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setDeveloperKey(GOOGLE_DEVELOPER_KEY)
        .setOAuthToken(accessToken)
        .setCallback((data: any) => {
          console.log('🟨 [useGoogleDrive] Picker callback:', data);
          
          if (data.action === (window as any).google.picker.Action.PICKED && data.docs?.length > 0) {
            const file = data.docs[0];
            console.log('🟩 [useGoogleDrive] Archivo seleccionado:', file);
            onFilePicked({
              id: file.id,
              name: file.name,
              url: file.url,
              mimeType: file.mimeType
            });
          } else if (data.action === (window as any).google.picker.Action.CANCEL) {
            console.log('🟧 [useGoogleDrive] Picker cancelado por usuario');
          }
        })
        .setTitle('Selecciona un archivo de Google Drive')
        .build();

      console.log('🟦 [useGoogleDrive] Mostrando Picker...');
      picker.setVisible(true);
    } catch (e: any) {
      console.error('🟥 [useGoogleDrive] Error abriendo Picker:', e);
      setError(e.message || 'Error abriendo selector de archivos');
    }
  }, []); // Sin dependencias para evitar re-creación

  // Inicializar el token client (solo una vez)
  const initTokenClient = useCallback(async () => {
    if (tokenClientRef.current) {
      console.log('🟦 [useGoogleDrive] TokenClient ya inicializado');
      return tokenClientRef.current;
    }

    try {
      console.log('🟦 [useGoogleDrive] Inicializando TokenClient...');
      await loadGsi();
      
      tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPES,
        prompt: 'consent',
        callback: (response: any) => {
          console.log('🟨 [useGoogleDrive] Callback de OAuth ejecutado:', response);
          
          if (response?.error) {
            const errorMsg = getGoogleErrorMessage(response.error);
            console.error('🟥 [useGoogleDrive] Error en OAuth:', response.error, errorMsg);
            setError(errorMsg);
            setLoading(false);
            return;
          }

          if (!response?.access_token) {
            console.error('🟥 [useGoogleDrive] No se recibió access_token:', response);
            setError('No se recibió token de acceso de Google');
            setLoading(false);
            return;
          }

          // Decodificar id_token si está disponible
          if (response.id_token) {
            try {
              const decoded: any = jwtDecode(response.id_token);
              const googleEmail = decoded.email;
              saveEmail(googleEmail);
              console.log('🟩 [useGoogleDrive] Email decodificado:', googleEmail);
              
              // Verificar que el email coincida con Supabase
              if (user?.email && googleEmail !== user.email) {
                console.error(`🟥 [useGoogleDrive] Email mismatch: Google(${googleEmail}) vs Supabase(${user.email})`);
                setError(`El email de Google (${googleEmail}) no coincide con tu cuenta`);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.warn('🟧 [useGoogleDrive] No se pudo decodificar id_token:', e);
            }
          }

          console.log('🟩 [useGoogleDrive] Token obtenido exitosamente');
          saveToken(response.access_token);
          setError(null);
          setLoading(false);
          
          // Abrir picker si hay callback pendiente o si se marcó para auto-abrir
          if (pendingPickerCallbackRef.current || autoOpenPickerRef.current) {
            console.log('🟩 [useGoogleDrive] Abriendo picker con token recién obtenido...');
            const callback = pendingPickerCallbackRef.current;
            pendingPickerCallbackRef.current = null;
            autoOpenPickerRef.current = false;
            
            // Usar setTimeout para evitar problemas de timing
            setTimeout(() => {
              if (callback) {
                openPickerWithToken(callback, response.access_token);
              }
            }, 100);
          }
        },
      });

      console.log('🟩 [useGoogleDrive] TokenClient inicializado:', tokenClientRef.current);
      return tokenClientRef.current;
    } catch (e) {
      console.error('🟥 [useGoogleDrive] Error inicializando TokenClient:', e);
      setError('Error inicializando cliente de Google');
      setLoading(false);
      throw e;
    }
  }, [saveToken, saveEmail, user?.email, openPickerWithToken]);

  // Solicitar token de acceso
  const requestToken = useCallback(async () => {
    console.log('🟦 [useGoogleDrive] requestToken() llamado');
    console.log('🔍 [useGoogleDrive] User email:', user?.email, 'isGoogleUser:', isGoogleUser);
    
    if (!user?.email) {
      const msg = 'Debes iniciar sesión para acceder a Google Drive';
      console.error('🟥 [useGoogleDrive]', msg);
      setError(msg);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('🟦 [useGoogleDrive] Iniciando flujo OAuth...');

    try {
      const client = await initTokenClient();
      console.log('🟦 [useGoogleDrive] Solicitando access token (consent)...');
      // Forzamos consent para que el usuario revalide permisos cada vez que lo necesitemos.
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e: any) {
      console.error('🟥 [useGoogleDrive] Error solicitando token:', e);
      setError(e.message || 'Error solicitando acceso a Google Drive');
      setLoading(false);
    }
  }, [user?.email, initTokenClient, isGoogleUser]);

  // Abrir Google Picker
  const openPicker = useCallback(async (onFilePicked: (file: GoogleDriveFile) => void) => {
    console.log('🟦 [useGoogleDrive] openPicker() llamado');
    console.log('🔍 [useGoogleDrive] Estado actual - Token:', !!token, 'User email:', user?.email);
    
    if (!token) {
      console.log('🟧 [useGoogleDrive] No hay token, solicitando y guardando callback...');
      pendingPickerCallbackRef.current = onFilePicked;
      await requestToken();
      return; // El picker se abrirá automáticamente cuando se obtenga el token
    }

    // Verificar si el token actual es válido
    const tokenIsValid = await isTokenValid();
    if (!tokenIsValid) {
      console.log('🟧 [useGoogleDrive] Token inválido, solicitando nuevo token...');
      pendingPickerCallbackRef.current = onFilePicked;
      setToken(null); // Limpiar token inválido
      await requestToken();
      return;
    }

    // Si ya tenemos token válido, abrir picker inmediatamente
    console.log('🟩 [useGoogleDrive] Token válido existe, abriendo picker inmediatamente...');
    await openPickerWithToken(onFilePicked, token);
  }, [token, requestToken, openPickerWithToken, isTokenValid]);

  // Auto-abrir picker si existe token válido (para mejorar UX del modal)
  const autoOpenPickerIfTokenExists = useCallback(async (onFilePicked: (file: GoogleDriveFile) => void) => {
    console.log('🟦 [useGoogleDrive] autoOpenPickerIfTokenExists() llamado');
    
    if (!token) {
      console.log('🟧 [useGoogleDrive] No hay token para auto-abrir picker');
      return false;
    }

    // Verificar si el token es válido
    const tokenIsValid = await isTokenValid();
    if (!tokenIsValid) {
      console.log('🟧 [useGoogleDrive] Token inválido, no se puede auto-abrir picker');
      setToken(null); // Limpiar token inválido
      return false;
    }

    // Auto-abrir picker con token válido
    console.log('🟩 [useGoogleDrive] Auto-abriendo picker con token existente...');
    await openPickerWithToken(onFilePicked, token);
    return true;
  }, [token, isTokenValid, openPickerWithToken]);

  // Limpiar token y estado en memoria
  const clearToken = useCallback(() => {
    console.log('🟦 [useGoogleDrive] Limpiando token (memoria)');
    setToken(null);
    setEmail(null);
    setError(null);
    setLoading(false);
    pendingPickerCallbackRef.current = null;
    autoOpenPickerRef.current = false;
  }, []);

  return {
    // Estado
    isGoogleUser,
    token,
    loading,
    error,
    email,
    
    // Acciones
    requestToken,
    openPicker,
    clearToken,
    autoOpenPickerIfTokenExists,
    
    // Utilidades
    hasValidToken: !!token,
    canUseDrive: isGoogleUser && !!user?.email,
    isTokenValid
  };
} 