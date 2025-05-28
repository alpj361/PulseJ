// Configuración de autenticación
export const getAuthConfig = () => {
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const currentPort = window.location.port || (isLocalDev ? '5173' : '80');
  
  // En producción, asegurar que usamos HTTPS
  const protocol = isLocalDev ? 'http:' : 'https:';
  const baseUrl = isLocalDev 
    ? `http://localhost:${currentPort}` 
    : `${protocol}//${window.location.hostname}`;
  
  return {
    isLocalDev,
    baseUrl,
    callbackUrl: `${baseUrl}/auth/callback`,
    loginUrl: `${baseUrl}/login`,
    verifyUrl: `${baseUrl}/auth/verify`,
  };
};

// Función para obtener la URL de callback correcta
export const getCallbackUrl = () => {
  const config = getAuthConfig();
  console.log('🔧 Auth Config:', config);
  return config.callbackUrl;
};

// Scopes básicos para Google OAuth
export const GOOGLE_SCOPES = 'openid email profile';

// Scopes con Drive (para usar en login/register)
export const GOOGLE_SCOPES_WITH_DRIVE = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'; 