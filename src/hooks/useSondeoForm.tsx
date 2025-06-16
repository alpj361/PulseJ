import { useForm } from 'react-hook-form';
import { useMemo } from 'react';

interface SondeoFormData {
  input: string;
  selectedContexts: string[];
}

interface SondeoFormValidation {
  input: {
    required: string;
    minLength: { value: number; message: string };
    maxLength: { value: number; message: string };
  };
  selectedContexts: {
    required: string;
    validate: {
      notEmpty: (value: string[]) => boolean | string;
    };
  };
}

export function useSondeoForm() {
  const validationRules: SondeoFormValidation = useMemo(() => ({
    input: {
      required: 'El tema de consulta es obligatorio',
      minLength: {
        value: 3,
        message: 'El tema debe tener al menos 3 caracteres'
      },
      maxLength: {
        value: 200,
        message: 'El tema no puede exceder 200 caracteres'
      }
    },
    selectedContexts: {
      required: 'Debe seleccionar al menos un contexto',
      validate: {
        notEmpty: (value: string[]) => 
          value && value.length > 0 || 'Debe seleccionar al menos un contexto para sondear'
      }
    }
  }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    getValues,
    reset,
    trigger
  } = useForm<SondeoFormData>({
    mode: 'onChange',
    defaultValues: {
      input: '',
      selectedContexts: ['tendencias']
    }
  });

  // Validaciones personalizadas
  const validateSondeoReady = () => {
    const values = getValues();
    const hasInput = values.input && values.input.trim().length >= 3;
    const hasContexts = values.selectedContexts && values.selectedContexts.length > 0;
    return hasInput && hasContexts;
  };

  const getValidationMessage = () => {
    const values = getValues();
    
    if (!values.input || values.input.trim().length < 3) {
      return 'Ingrese un tema de al menos 3 caracteres';
    }
    
    if (!values.selectedContexts || values.selectedContexts.length === 0) {
      return 'Seleccione al menos un contexto';
    }
    
    return null;
  };

  // Función para actualizar contextos seleccionados
  const updateSelectedContexts = (contexts: string[]) => {
    setValue('selectedContexts', contexts, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
  };

  // Función para actualizar input
  const updateInput = (value: string) => {
    setValue('input', value, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
  };

  return {
    register,
    handleSubmit,
    errors,
    isValid,
    isDirty,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    validationRules,
    validateSondeoReady,
    getValidationMessage,
    updateSelectedContexts,
    updateInput
  };
} 