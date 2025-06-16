import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  Audiotrack as AudioIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  DriveFolderUpload as DriveIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getAvailableCodexItems, assignCodexItemToProject } from '../../services/supabase';

interface CodexItem {
  id: string;
  titulo: string;
  tipo: string;
  descripcion?: string;
  etiquetas: string[];
  fecha: string;
  created_at: string;
  is_drive?: boolean;
  url?: string;
  nombre_archivo?: string;
  tamano?: number;
}

interface AddAssetsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onAssetsAdded: (addedAssets: CodexItem[]) => void;
}

export const AddAssetsModal: React.FC<AddAssetsModalProps> = ({
  open,
  onClose,
  projectId,
  projectTitle,
  onAssetsAdded
}) => {
  const { user } = useAuth();
  const [availableItems, setAvailableItems] = useState<CodexItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar items disponibles del Codex
  useEffect(() => {
    if (open && user) {
      loadAvailableItems();
    }
  }, [open, user]);

  const loadAvailableItems = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const items = await getAvailableCodexItems(user.id);
      setAvailableItems(items);
    } catch (err: any) {
      setError('Error cargando items del Codex: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar items según búsqueda y tipo
  const filteredItems = availableItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.etiquetas.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || item.tipo === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Manejar selección de items
  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Asignar items seleccionados al proyecto
  const handleAssignItems = async () => {
    if (selectedItems.size === 0) {
      setError('Selecciona al menos un activo para agregar');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const addedAssets: CodexItem[] = [];
      
      for (const itemId of selectedItems) {
        await assignCodexItemToProject(itemId, projectId);
        const item = availableItems.find(i => i.id === itemId);
        if (item) {
          addedAssets.push(item);
        }
      }

      setSuccess(`✅ ${addedAssets.length} activo(s) agregado(s) exitosamente`);
      onAssetsAdded(addedAssets);
      
      // Recargar items disponibles
      await loadAvailableItems();
      setSelectedItems(new Set());
      
      // Cerrar modal después de un momento
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setError('Error asignando activos: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Obtener icono según tipo de archivo
  const getTypeIcon = (tipo: string, isDrive: boolean = false) => {
    const iconStyle = { mr: 1 };
    
    if (isDrive) {
      return <DriveIcon sx={{ ...iconStyle, color: '#4285f4' }} />;
    }
    
    switch (tipo) {
      case 'documento':
        return <DocumentIcon sx={{ ...iconStyle, color: '#f44336' }} />;
      case 'audio':
        return <AudioIcon sx={{ ...iconStyle, color: '#ff9800' }} />;
      case 'video':
        return <VideoIcon sx={{ ...iconStyle, color: '#9c27b0' }} />;
      case 'enlace':
        return <LinkIcon sx={{ ...iconStyle, color: '#2196f3' }} />;
      default:
        return <StorageIcon sx={{ ...iconStyle, color: '#757575' }} />;
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            Agregar Activos al Proyecto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por título, descripción o etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Todos"
                  onClick={() => setTypeFilter('all')}
                  color={typeFilter === 'all' ? 'primary' : 'default'}
                  variant={typeFilter === 'all' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Documentos"
                  onClick={() => setTypeFilter('documento')}
                  color={typeFilter === 'documento' ? 'primary' : 'default'}
                  variant={typeFilter === 'documento' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Audio"
                  onClick={() => setTypeFilter('audio')}
                  color={typeFilter === 'audio' ? 'primary' : 'default'}
                  variant={typeFilter === 'audio' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Video"
                  onClick={() => setTypeFilter('video')}
                  color={typeFilter === 'video' ? 'primary' : 'default'}
                  variant={typeFilter === 'video' ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Enlaces"
                  onClick={() => setTypeFilter('enlace')}
                  color={typeFilter === 'enlace' ? 'primary' : 'default'}
                  variant={typeFilter === 'enlace' ? 'filled' : 'outlined'}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de items disponibles */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {availableItems.length === 0 
                ? "No hay activos disponibles en el Codex" 
                : "No se encontraron activos con los filtros aplicados"
              }
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedItems.has(item.id) ? 2 : 1,
                    borderColor: selectedItems.has(item.id) ? 'primary.main' : 'divider',
                    '&:hover': {
                      shadow: 2,
                      borderColor: 'primary.light'
                    }
                  }}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleItemToggle(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label=""
                        sx={{ m: 0, mr: 1 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {getTypeIcon(item.tipo, item.is_drive)}
                          <Typography 
                            variant="subtitle2" 
                            noWrap
                            sx={{ fontWeight: 600 }}
                          >
                            {item.titulo}
                          </Typography>
                        </Box>
                        
                        {item.descripcion && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {item.descripcion}
                          </Typography>
                        )}

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.fecha).toLocaleDateString()}
                            {item.tamano && ` • ${formatFileSize(item.tamano)}`}
                          </Typography>
                        </Box>

                        {item.etiquetas.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {item.etiquetas.slice(0, 3).map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                            {item.etiquetas.length > 3 && (
                              <Chip
                                label={`+${item.etiquetas.length - 3}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={assigning}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleAssignItems}
          disabled={selectedItems.size === 0 || assigning}
          startIcon={assigning ? <CircularProgress size={20} /> : null}
        >
          {assigning 
            ? 'Agregando...' 
            : `Agregar ${selectedItems.size} activo${selectedItems.size !== 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAssetsModal; 