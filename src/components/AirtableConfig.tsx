import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, Check as CheckIcon } from '@mui/icons-material';

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
  viewName: string;
}

interface AirtableConfigProps {
  config: AirtableConfig;
  onConfigChange: (config: AirtableConfig) => void;
  onConnect: () => void;
  connected: boolean;
  loading: boolean;
  userCount?: number;
}

export default function AirtableConfig({ 
  config, 
  onConfigChange, 
  onConnect, 
  connected, 
  loading, 
  userCount = 0 
}: AirtableConfigProps) {
  // Estados para detección automática de bases
  const [availableBases, setAvailableBases] = useState<AirtableBase[]>([]);
  const [loadingBases, setLoadingBases] = useState(false);
  const [basesDetected, setBasesDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Función para detectar bases automáticamente
  const detectAirtableBases = async () => {
    if (!config.apiKey) {
      setError('Por favor ingresa tu API Key de Airtable primero');
      return;
    }

    setLoadingBases(true);
    setError(null);

    try {
      console.log('🔍 Detectando bases de Airtable...');
      
      const response = await fetch('https://api.airtable.com/v0/meta/bases', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifica que sea correcta y tenga los permisos necesarios.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.bases && data.bases.length > 0) {
        const bases: AirtableBase[] = data.bases.map((base: any) => ({
          id: base.id,
          name: base.name,
          permissionLevel: base.permissionLevel || 'unknown'
        }));
        
        setAvailableBases(bases);
        setBasesDetected(true);
        setSuccess(`✅ Se detectaron ${bases.length} bases disponibles. Selecciona una para continuar.`);
        console.log(`📋 Bases detectadas:`, bases.map(b => `${b.name} (${b.id})`));
      } else {
        setError('No se encontraron bases accesibles con esta API Key');
        setAvailableBases([]);
        setBasesDetected(false);
      }
    } catch (error: any) {
      console.error('❌ Error detectando bases:', error);
      setError(`Error detectando bases: ${error.message}`);
      setAvailableBases([]);
      setBasesDetected(false);
    } finally {
      setLoadingBases(false);
    }
  };

  const handleApiKeyChange = (newApiKey: string) => {
    onConfigChange({ ...config, apiKey: newApiKey, baseId: '' });
    // Limpiar estado cuando cambie la API Key
    setBasesDetected(false);
    setAvailableBases([]);
    setError(null);
    setSuccess(null);
  };

  const handleBaseSelect = (baseId: string) => {
    onConfigChange({ ...config, baseId });
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🗂️ Configuración de Airtable
      </Typography>
      
      {/* Mensajes de error y éxito */}
      {error && (
        <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText' }}>
          {error}
        </Box>
      )}
      {success && (
        <Box sx={{ p: 2, mb: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
          {success}
        </Box>
      )}
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* API Key */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Key"
            type="password"
            value={config.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXX"
            helperText="Tu Personal Access Token de Airtable"
          />
        </Grid>
        
        {/* Botón para detectar bases */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'end' }}>
            <Button
              variant="contained"
              onClick={detectAirtableBases}
              disabled={loadingBases || !config.apiKey}
              startIcon={loadingBases ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: 150 }}
            >
              {loadingBases ? 'Detectando...' : 'Detectar Bases'}
            </Button>
            {basesDetected && (
              <Chip 
                label={`${availableBases.length} bases encontradas`}
                color="success"
                icon={<CheckIcon />}
                size="small"
              />
            )}
          </Box>
        </Grid>
        
        {/* Selector de Base - Solo se muestra si hay bases detectadas */}
        {basesDetected && availableBases.length > 0 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Selecciona una Base</InputLabel>
              <Select
                value={config.baseId}
                label="Selecciona una Base"
                onChange={(e) => handleBaseSelect(e.target.value)}
              >
                {availableBases.map(base => (
                  <MenuItem key={base.id} value={base.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>{base.name}</span>
                      <Chip 
                        label={base.permissionLevel} 
                        size="small" 
                        color={base.permissionLevel === 'create' ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <Box component="div" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                Bases detectadas automáticamente con tu API Key
              </Box>
            </FormControl>
          </Grid>
        )}
        
        {/* Nombre de la tabla */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre de la Tabla"
            value={config.tableName}
            onChange={(e) => onConfigChange({ ...config, tableName: e.target.value })}
            placeholder="Usuarios"
            helperText="Nombre exacto de la tabla"
            disabled={!basesDetected || !config.baseId}
          />
        </Grid>
        
        {/* Vista opcional */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Vista (Opcional)"
            value={config.viewName}
            onChange={(e) => onConfigChange({ ...config, viewName: e.target.value })}
            placeholder="Grid view"
            helperText="Nombre de la vista específica"
            disabled={!basesDetected || !config.baseId}
          />
        </Grid>
      </Grid>

      {/* Área de botones y estado */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant={connected ? "outlined" : "contained"}
          onClick={onConnect}
          disabled={loading || !config.apiKey || !config.baseId || !config.tableName || !basesDetected}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Conectando...' : connected ? 'Reconectar' : 'Conectar con Airtable'}
        </Button>
        
        {connected && (
          <Chip 
            label={`${userCount} usuarios encontrados`}
            color="success"
            icon={<CheckIcon />}
          />
        )}
        
        {/* Mostrar información de la base seleccionada */}
        {config.baseId && basesDetected && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: 'background.default', 
            borderRadius: 1, 
            border: 1, 
            borderColor: 'divider',
            flex: 1,
            minWidth: 200
          }}>
            <Typography variant="caption" color="text.secondary">
              Base seleccionada:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {availableBases.find(b => b.id === config.baseId)?.name || 'Desconocida'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {config.baseId}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
} 