// Configuración de autenticación
export const getAuthConfig = () => {
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const currentPort = window.location.port || (isLocalDev ? '5173' : '80');
  
  return {
    isLocalDev,
    baseUrl: isLocalDev ? `http://localhost:${currentPort}` : window.location.origin,
    callbackUrl: isLocalDev ? `http://localhost:${currentPort}/auth/callback` : `${window.location.origin}/auth/callback`,
    loginUrl: isLocalDev ? `http://localhost:${currentPort}/login` : `${window.location.origin}/login`,
  };
};

// Scopes básicos para Google OAuth
export const GOOGLE_SCOPES = 'openid email profile';

// Scopes con Drive (para usar más tarde)
export const GOOGLE_SCOPES_WITH_DRIVE = 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'; 