import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  Chip,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  Article,
  LibraryBooks,
  Psychology,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

interface SondeoProgressIndicatorProps {
  isLoading: boolean;
  currentStep?: string;
  progress?: number;
  selectedContexts?: string[];
  error?: string | null;
  variant?: 'circular' | 'linear' | 'steps';
}

const contextIcons = {
  tendencias: <TrendingUp />,
  noticias: <Article />,
  codex: <LibraryBooks />
};

const contextLabels = {
  tendencias: 'Tendencias',
  noticias: 'Noticias',
  codex: 'Codex'
};

const steps = [
  { key: 'preparing', label: 'Preparando contexto', icon: <Psychology /> },
  { key: 'fetching', label: 'Obteniendo datos', icon: <TrendingUp /> },
  { key: 'analyzing', label: 'Analizando con IA', icon: <Psychology /> },
  { key: 'generating', label: 'Generando visualizaciones', icon: <CheckCircle /> }
];

const SondeoProgressIndicator: React.FC<SondeoProgressIndicatorProps> = ({
  isLoading,
  currentStep = 'preparing',
  progress = 0,
  selectedContexts = [],
  error = null,
  variant = 'circular'
}) => {
  if (!isLoading && !error) return null;

  if (error) {
    return (
      <Fade in={true}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'error.light',
            borderRadius: 2,
            mb: 2
          }}
        >
          <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        </Box>
      </Fade>
    );
  }

  if (variant === 'circular') {
    return (
      <Fade in={isLoading}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            mb: 2
          }}
        >
          <CircularProgress 
            size={48} 
            sx={{ mb: 2 }}
            variant={progress > 0 ? 'determinate' : 'indeterminate'}
            value={progress}
          />
          <Typography variant="h6" gutterBottom>
            Sondeando tema...
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {currentStep === 'preparing' && 'Preparando contexto de análisis'}
            {currentStep === 'fetching' && 'Obteniendo datos relevantes'}
            {currentStep === 'analyzing' && 'Analizando con inteligencia artificial'}
            {currentStep === 'generating' && 'Generando visualizaciones'}
          </Typography>
          
          {selectedContexts.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {selectedContexts.map((context) => (
                <Chip
                  key={context}
                  icon={contextIcons[context as keyof typeof contextIcons]}
                  label={contextLabels[context as keyof typeof contextLabels]}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Box>
      </Fade>
    );
  }

  if (variant === 'linear') {
    return (
      <Fade in={isLoading}>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Sondeando...
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress 
                variant={progress > 0 ? 'determinate' : 'indeterminate'}
                value={progress}
              />
            </Box>
            {progress > 0 && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {currentStep === 'preparing' && 'Preparando contexto...'}
            {currentStep === 'fetching' && 'Obteniendo datos...'}
            {currentStep === 'analyzing' && 'Analizando con IA...'}
            {currentStep === 'generating' && 'Generando visualizaciones...'}
          </Typography>
        </Box>
      </Fade>
    );
  }

  if (variant === 'steps') {
    const currentStepIndex = steps.findIndex(step => step.key === currentStep);
    
    return (
      <Fade in={isLoading}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            mb: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Procesando sondeo
          </Typography>
          
          <Stack spacing={2}>
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <Box
                  key={step.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    {isCompleted ? (
                      <CheckCircle color="success" />
                    ) : isActive ? (
                      <CircularProgress size={24} />
                    ) : (
                      step.icon
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isCompleted ? 'success.main' : 'text.primary'
                    }}
                  >
                    {step.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          
          {selectedContexts.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Contextos seleccionados:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {selectedContexts.map((context) => (
                  <Chip
                    key={context}
                    icon={contextIcons[context as keyof typeof contextIcons]}
                    label={contextLabels[context as keyof typeof contextLabels]}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Fade>
    );
  }

  return null;
};

export default SondeoProgressIndicator; 