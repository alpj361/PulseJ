import { useMemo } from 'react';

type Language = 'es' | 'en';

interface Translations {
  es: Record<string, string>;
  en: Record<string, string>;
}

const translations: Translations = {
  es: {
    // Estados de carga
    'loading': 'Cargando...',
    'loading.sondeo': 'Sondeando tema...',
    'loading.data': 'Cargando datos...',
    'loading.context': 'Preparando contexto...',
    
    // Errores
    'error': 'Error',
    'error.general': 'Ha ocurrido un error',
    'error.network': 'Error de conexión',
    'error.sondeo': 'Error al sondear tema',
    'error.context': 'Error al obtener contexto',
    'error.validation': 'Error de validación',
    
    // Validaciones
    'validation.required': 'Este campo es obligatorio',
    'validation.minLength': 'Mínimo {min} caracteres',
    'validation.maxLength': 'Máximo {max} caracteres',
    'validation.noContexts': 'Debe seleccionar al menos un contexto',
    'validation.noInput': 'Ingrese un tema de consulta',
    
    // Botones y acciones
    'button.sondear': 'Sondear',
    'button.cancel': 'Cancelar',
    'button.retry': 'Reintentar',
    'button.config': 'Configurar',
    'button.reset': 'Limpiar',
    
    // Contextos
    'context.tendencias': 'Tendencias actuales',
    'context.noticias': 'Noticias recientes',
    'context.codex': 'Documentos del Codex',
    
    // Estados
    'status.ready': 'Listo para sondear',
    'status.processing': 'Procesando...',
    'status.completed': 'Completado',
    'status.failed': 'Falló',
    
    // Mensajes
    'message.noData': 'No hay datos disponibles',
    'message.noResults': 'No se encontraron resultados',
    'message.selectContext': 'Seleccione al menos un contexto',
    'message.enterTopic': 'Ingrese un tema para sondear'
  },
  en: {
    // Loading states
    'loading': 'Loading...',
    'loading.sondeo': 'Polling topic...',
    'loading.data': 'Loading data...',
    'loading.context': 'Preparing context...',
    
    // Errors
    'error': 'Error',
    'error.general': 'An error occurred',
    'error.network': 'Connection error',
    'error.sondeo': 'Error polling topic',
    'error.context': 'Error getting context',
    'error.validation': 'Validation error',
    
    // Validations
    'validation.required': 'This field is required',
    'validation.minLength': 'Minimum {min} characters',
    'validation.maxLength': 'Maximum {max} characters',
    'validation.noContexts': 'Must select at least one context',
    'validation.noInput': 'Enter a topic to poll',
    
    // Buttons and actions
    'button.sondear': 'Poll',
    'button.cancel': 'Cancel',
    'button.retry': 'Retry',
    'button.config': 'Configure',
    'button.reset': 'Clear',
    
    // Contexts
    'context.tendencias': 'Current trends',
    'context.noticias': 'Recent news',
    'context.codex': 'Codex documents',
    
    // States
    'status.ready': 'Ready to poll',
    'status.processing': 'Processing...',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    
    // Messages
    'message.noData': 'No data available',
    'message.noResults': 'No results found',
    'message.selectContext': 'Select at least one context',
    'message.enterTopic': 'Enter a topic to poll'
  }
};

export function useI18n(language: Language = 'es') {
  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      let text = translations[language][key] || key;
      
      // Reemplazar parámetros si existen
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(`{${param}}`, String(value));
        });
      }
      
      return text;
    };
  }, [language]);

  const getContextLabel = (context: string) => {
    return t(`context.${context}`);
  };

  const getStatusLabel = (status: string) => {
    return t(`status.${status}`);
  };

  const getErrorMessage = (errorType: string) => {
    return t(`error.${errorType}`);
  };

  const getValidationMessage = (validationType: string, params?: Record<string, string | number>) => {
    return t(`validation.${validationType}`, params);
  };

  return {
    t,
    getContextLabel,
    getStatusLabel,
    getErrorMessage,
    getValidationMessage
  };
} 