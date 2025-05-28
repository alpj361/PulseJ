import React from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

interface GoogleDrivePickerButtonProps {
  onFilePicked: (file: { id: string; name: string; url?: string; mimeType?: string }) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export const GoogleDrivePickerButton: React.FC<GoogleDrivePickerButtonProps> = ({
  onFilePicked,
  onError,
  buttonText = 'Importar desde Google Drive',
  disabled = false,
}) => {
  const { 
    isGoogleUser, 
    loading, 
    error, 
    email, 
    canUseDrive,
    openPicker 
  } = useGoogleDrive();

  const handleClick = () => {
    console.log('🟦 [GoogleDrivePickerButton] Botón clicado');
    
    if (!canUseDrive) {
      const msg = 'Debes iniciar sesión con Google para usar esta función';
      console.error('🟥 [GoogleDrivePickerButton]', msg);
      if (onError) onError(msg);
      return;
    }

    openPicker((file) => {
      console.log('🟩 [GoogleDrivePickerButton] Archivo seleccionado:', file);
      onFilePicked(file);
    });
  };

  // Llamar onError cuando hay errores del hook
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        disabled={loading || disabled || !canUseDrive}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}
      >
        {buttonText}
      </Button>
      
      {!isGoogleUser && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
          Necesitas iniciar sesión con Google para usar esta función
        </Typography>
      )}
      
      {email && (
        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
          Conectado como: {email}
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