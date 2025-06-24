import React from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

interface GoogleDrivePickerButtonProps {
  onFilePicked: (file: { id: string; name: string; url?: string; mimeType?: string }) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  autoOpenIfTokenExists?: boolean;
}

export const GoogleDrivePickerButton: React.FC<GoogleDrivePickerButtonProps> = ({
  onFilePicked,
  onError,
  buttonText = 'Importar desde Google Drive',
  disabled = false,
  variant = 'contained',
  size = 'medium',
  autoOpenIfTokenExists = false,
}) => {
  const { 
    isGoogleUser, 
    loading, 
    error, 
    email, 
    canUseDrive,
    hasValidToken,
    openPicker,
    autoOpenPickerIfTokenExists
  } = useGoogleDrive();

  const handleClick = async () => {
    console.log('🟦 [GoogleDrivePickerButton] Botón clicado');
    
    if (!canUseDrive) {
      const msg = 'Debes iniciar sesión con Google para usar esta función';
      console.error('🟥 [GoogleDrivePickerButton]', msg);
      if (onError) onError(msg);
      return;
    }

    if (autoOpenIfTokenExists && hasValidToken) {
      console.log('🟦 [GoogleDrivePickerButton] Intentando auto-abrir picker...');
      const opened = await autoOpenPickerIfTokenExists((file) => {
        console.log('🟩 [GoogleDrivePickerButton] Archivo seleccionado (auto-abrir):', file);
        onFilePicked(file);
      });
      
      if (opened) {
        return;
      }
    }

    openPicker((file) => {
      console.log('🟩 [GoogleDrivePickerButton] Archivo seleccionado (flujo normal):', file);
      onFilePicked(file);
    });
  };

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const getButtonText = () => {
    if (loading) return 'Conectando...';
    if (hasValidToken && autoOpenIfTokenExists) return 'Seleccionar archivo de Drive';
    return buttonText;
  };

  const getButtonColor = () => {
    if (hasValidToken) return 'success';
    return 'primary';
  };

  return (
    <Box>
      <Button
        variant={variant}
        color={getButtonColor() as any}
        onClick={handleClick}
        disabled={loading || disabled || !canUseDrive}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        size={size}
        sx={{ 
          fontWeight: 600, 
          fontSize: size === 'large' ? '1.1rem' : '1rem', 
          borderRadius: 2,
          ...(hasValidToken && {
            backgroundColor: 'success.main',
            '&:hover': {
              backgroundColor: 'success.dark',
            }
          })
        }}
      >
        {getButtonText()}
      </Button>
      
      {!isGoogleUser && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          Necesitas iniciar sesión con Google para usar esta función
        </Typography>
      )}
      
      {hasValidToken && email && (
        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
          ✓ Conectado como: {email}
        </Typography>
      )}
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}; 