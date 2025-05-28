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
  
  // Inicializar estado con valores de localStorage
  const [token, setToken] = useState<string | null>(() => {
    try {
      const storedToken = localStorage.getItem(GOOGLE_DRIVE_TOKEN_KEY);
      console.log('🔍 [useGoogleDrive] Inicializando token desde localStorage:', storedToken ? 'EXISTE' : 'NO EXISTE');
      return storedToken;
    } catch (e) {
      console.error('🟥 [useGoogleDrive] Error leyendo token de localStorage:', e);
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState<string | null>(() => {
    try {
      const storedEmail = localStorage.getItem(GOOGLE_DRIVE_EMAIL_KEY);
      console.log('🔍 [useGoogleDrive] Inicializando email desde localStorage:', storedEmail || 'NO EXISTE');
      return storedEmail;
    } catch (e) {
      console.error('🟥 [useGoogleDrive] Error leyendo email de localStorage:', e);
      return null;
    }
  });
  
  const tokenClientRef = useRef<any>(null);
  const pendingPickerCallbackRef = useRef<((file: GoogleDriveFile) => void) | null>(null);

  // Verificar si el usuario está autenticado con Google (usar useMemo para estabilizar)
  const isGoogleUser = useMemo(() => {
    return user?.app_metadata?.provider === 'google' || 
           user?.identities?.some((id: any) => id.provider === 'google');
  }, [user?.app_metadata?.provider, user?.identities]);

  console.log('🟦 [useGoogleDrive] Usuario de Google:', isGoogleUser);
  console.log('🟦 [useGoogleDrive] Token actual:', !!token, token ? `(${token.substring(0, 20)}...)` : '(null)');

  // Debug localStorage en cada render
  useEffect(() => {
    const storedToken = localStorage.getItem(GOOGLE_DRIVE_TOKEN_KEY);
    const storedEmail = localStorage.getItem(GOOGLE_DRIVE_EMAIL_KEY);
    console.log('🔍 [useGoogleDrive] Estado localStorage - Token:', storedToken ? 'EXISTE' : 'NO EXISTE', 'Email:', storedEmail || 'NO EXISTE');
    console.log('🔍 [useGoogleDrive] Estado React - Token:', !!token, 'Email:', email || 'NO EXISTE');
    
    // Si hay token en localStorage pero no en estado, sincronizar
    if (storedToken && !token) {
      console.log('🟧 [useGoogleDrive] Sincronizando token desde localStorage...');
      setToken(storedToken);
    }
    if (storedEmail && !email) {
      console.log('🟧 [useGoogleDrive] Sincronizando email desde localStorage...');
      setEmail(storedEmail);
    }
  }, [token, email]);

  // Función para guardar token en localStorage
  const saveToken = useCallback((newToken: string) => {
    try {
      localStorage.setItem(GOOGLE_DRIVE_TOKEN_KEY, newToken);
      setToken(newToken);
      console.log('🟩 [useGoogleDrive] Token guardado en localStorage:', newToken.substring(0, 20) + '...');
    } catch (e) {
      console.warn('🟧 [useGoogleDrive] No se pudo guardar token en localStorage:', e);
      setToken(newToken);
    }
  }, []);

  // Función para guardar email en localStorage
  const saveEmail = useCallback((newEmail: string) => {
    try {
      localStorage.setItem(GOOGLE_DRIVE_EMAIL_KEY, newEmail);
      setEmail(newEmail);
      console.log('🟩 [useGoogleDrive] Email guardado en localStorage:', newEmail);
    } catch (e) {
      console.warn('🟧 [useGoogleDrive] No se pudo guardar email en localStorage:', e);
      setEmail(newEmail);
    }
  }, []);

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
          
          // Abrir picker si hay callback pendiente
          if (pendingPickerCallbackRef.current) {
            console.log('🟩 [useGoogleDrive] Abriendo picker con token recién obtenido...');
            const callback = pendingPickerCallbackRef.current;
            pendingPickerCallbackRef.current = null;
            // Usar setTimeout para evitar problemas de timing
            setTimeout(() => {
              openPickerWithToken(callback, response.access_token);
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
      console.log('🟦 [useGoogleDrive] Solicitando access token...');
      client.requestAccessToken();
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

    // Si ya tenemos token, abrir picker inmediatamente
    console.log('🟩 [useGoogleDrive] Token existe, abriendo picker inmediatamente...');
    await openPickerWithToken(onFilePicked, token);
  }, [token, requestToken, openPickerWithToken]);

  // Limpiar token y estado
  const clearToken = useCallback(() => {
    console.log('🟦 [useGoogleDrive] Limpiando token y estado');
    try {
      localStorage.removeItem(GOOGLE_DRIVE_TOKEN_KEY);
      localStorage.removeItem(GOOGLE_DRIVE_EMAIL_KEY);
    } catch (e) {
      console.warn('🟧 [useGoogleDrive] Error limpiando localStorage:', e);
    }
    setToken(null);
    setEmail(null);
    setError(null);
    setLoading(false);
    pendingPickerCallbackRef.current = null;
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
    
    // Utilidades
    hasValidToken: !!token,
    canUseDrive: isGoogleUser && !!user?.email
  };
} 