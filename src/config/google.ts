// Configuración centralizada de Google APIs
export const GOOGLE_CLIENT_ID = '80973030831-7v96jltgkg4r31r8n68du9vjpjutuq3o.apps.googleusercontent.com';
export const GOOGLE_DEVELOPER_KEY = 'AIzaSyA0oumyL3f8EaXraPvdYOVE2IYLbcO6lEo';

// Scopes para Google Drive
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
  'profile'
].join(' ');

// Mapeo de errores de Google OAuth
export const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  'popup_closed_by_user': 'Cerraste el diálogo de Google. Intenta de nuevo.',
  'access_denied': 'No concediste permisos a Google Drive. Necesitamos acceso para importar archivos.',
  'invalid_client': 'Error de configuración del cliente. Contacta al administrador.',
  'invalid_request': 'Solicitud inválida. Intenta recargar la página.',
  'unauthorized_client': 'Cliente no autorizado. Verifica la configuración.',
  'unsupported_response_type': 'Tipo de respuesta no soportado.',
  'invalid_scope': 'Permisos inválidos solicitados.',
  'server_error': 'Error del servidor de Google. Intenta más tarde.',
  'temporarily_unavailable': 'Servicio temporalmente no disponible. Intenta más tarde.',
};

// Función para obtener mensaje de error amigable
export const getGoogleErrorMessage = (error: string): string => {
  return GOOGLE_ERROR_MESSAGES[error] || `Error de Google OAuth: ${error}`;
};

// Función para verificar si un error es recuperable
export const isRecoverableGoogleError = (error: string): boolean => {
  const recoverableErrors = [
    'popup_closed_by_user',
    'access_denied',
    'server_error',
    'temporarily_unavailable'
  ];
  return recoverableErrors.includes(error);
}; 