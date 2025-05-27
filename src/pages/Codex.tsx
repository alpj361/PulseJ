import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CloudUpload, Description, Audiotrack, VideoLibrary, Link as LinkIcon, Add, Search, Label, DriveFolderUpload, Lock, Delete } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Estructura de datos simulada - Iniciar con array vacío
const initialCodexItems: any[] = [];

const tipoLabels: Record<string, string> = {
  documento: 'Documento',
  audio: 'Audio',
  video: 'Video',
  enlace: 'Enlace',
};

const estadoLabels = ['Nuevo', 'Archivado', 'En análisis'];
const tipoOptions = ['documento', 'audio', 'video', 'enlace'];

const GOOGLE_PICKER_API_KEY = 'AIzaSyA0oumyL3f8EaXraPvdYOVE2IYLbcO6lEo';

function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const Codex: React.FC = () => {
  const [codexItems, setCodexItems] = useState(initialCodexItems);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', search: '' });
  const [tab, setTab] = useState<'explorar' | 'agregar'>('explorar');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pickerApiLoaded = useRef(false);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const [googleDialogError, setGoogleDialogError] = useState('');
  const { user, session } = useAuth();
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);

  useEffect(() => {
    console.log('[Codex] user:', user);
    console.log('[Codex] session:', session);
    
    // Verificar si el usuario está autenticado con Google y tiene los scopes necesarios
    if (user && session) {
      const isGoogleUser = user.app_metadata?.provider === 'google';
      console.log('[Codex] Es usuario de Google:', isGoogleUser);
      
      if (isGoogleUser) {
        // Verificar si tenemos acceso a Google Drive
        const providerToken = session.provider_token;
        console.log('[Codex] Provider token disponible:', !!providerToken);
        
        if (!providerToken) {
          console.log('[Codex] No hay provider token, necesita reautenticación');
          setNeedsGoogleAuth(true);
        } else {
          setNeedsGoogleAuth(false);
        }
      } else {
        console.log('[Codex] Usuario no autenticado con Google');
        setNeedsGoogleAuth(true);
      }
    } else {
      setNeedsGoogleAuth(true);
    }
  }, [user, session]);

  // Cargar scripts de Google Picker
  useEffect(() => {
    async function loadGoogleApis() {
      console.log('[Codex] Cargando APIs de Google...');
      
      try {
        // Cargar Google API base
        if (!(window as any).gapi) {
          console.log('[Codex] Cargando Google API base...');
          await loadScript('https://apis.google.com/js/api.js');
        }
        
        // Cargar Google Picker API
        console.log('[Codex] Cargando Google Picker...');
        await new Promise((resolve, reject) => {
          (window as any).gapi.load('picker', {
            callback: () => {
              console.log('[Codex] Google Picker API cargada');
              
              // Esperar a que ViewMode esté disponible con reintentos
              const checkViewMode = (attempts = 0) => {
                if ((window as any).google && (window as any).google.picker && (window as any).google.picker.ViewMode) {
                  pickerApiLoaded.current = true;
                  console.log('[Codex] ViewMode disponible:', Object.keys((window as any).google.picker.ViewMode));
                  resolve(true);
                } else if (attempts < 10) {
                  console.log(`[Codex] ViewMode no disponible aún, reintentando... (${attempts + 1}/10)`);
                  setTimeout(() => checkViewMode(attempts + 1), 500);
                } else {
                  console.warn('[Codex] ViewMode no disponible después de 10 intentos, continuando sin él');
                  pickerApiLoaded.current = true; // Marcar como cargado de todas formas
                  resolve(true);
                }
              };
              
              checkViewMode();
            },
            onerror: (error: any) => {
              console.error('[Codex] Error cargando Picker:', error);
              reject(error);
            }
          });
        });
        
        console.log('[Codex] Todas las APIs de Google cargadas exitosamente');
        
      } catch (error) {
        console.error('[Codex] Error cargando APIs de Google:', error);
        setGoogleDialogError('Error cargando los servicios de Google. Recarga la página e intenta de nuevo.');
      }
    }
    
    loadGoogleApis();
  }, []);

  // Filtros
  const filteredItems = codexItems.filter(item => {
    const matchTipo = filtros.tipo ? item.tipo === filtros.tipo : true;
    const matchEstado = filtros.estado ? item.estado === filtros.estado : true;
    const matchSearch = filtros.search
      ? item.titulo.toLowerCase().includes(filtros.search.toLowerCase())
      : true;
    return matchTipo && matchEstado && matchSearch;
  });

  // Resumen general
  const resumen = {
    documento: codexItems.filter(i => i.tipo === 'documento').length,
    audio: codexItems.filter(i => i.tipo === 'audio').length,
    video: codexItems.filter(i => i.tipo === 'video').length,
    enlace: codexItems.filter(i => i.tipo === 'enlace').length,
    total: codexItems.length,
    ultima: codexItems.reduce((acc, curr) => acc > curr.fecha ? acc : curr.fecha, ''),
  };

  // UI para botones inactivos
  const InactiveButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Tooltip title="🔒 Función disponible próximamente" arrow>
    <span>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<LockIcon sx={{ mr: 0.5, color: 'grey.400' }} />}
        disabled
        sx={{
          opacity: 0.7,
          pointerEvents: 'auto',
          bgcolor: 'grey.100',
          color: 'grey.500',
          borderColor: 'grey.200',
          fontWeight: 500,
          fontSize: '1rem',
          px: 2.5,
          py: 1.2,
          borderRadius: 2,
        }}
      >
        {label}
      </Button>
    </span>
  </Tooltip>
);

  // Card de resumen general
  const CardResumen = () => (
    <Card sx={{ mb: 6, p: 4, borderRadius: 5, boxShadow: 0 }}>
      <CardContent sx={{ px: { xs: 1, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: -1, mb: 1 }}>
              Resumen general del Codex
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Última actualización: {resumen.ultima || '—'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={3.5} justifyContent={isMobile ? 'flex-start' : 'flex-end'} useFlexGap flexWrap="wrap" sx={{ mt: { xs: 2, sm: 0 } }}>
              <Chip icon={<Description />} label={`Documentos: ${resumen.documento}`} color="primary" sx={{ fontSize: '1rem', px: 2, py: 1, my: 0.5 }} />
              <Chip icon={<Audiotrack />} label={`Audios: ${resumen.audio}`} color="secondary" sx={{ fontSize: '1rem', px: 2, py: 1, my: 0.5 }} />
              <Chip icon={<VideoLibrary />} label={`Videos: ${resumen.video}`} sx={{ bgcolor: 'blue.100', color: 'blue.800', fontSize: '1rem', px: 2, py: 1, my: 0.5 }} />
              <Chip icon={<LinkIcon />} label={`Enlaces: ${resumen.enlace}`} sx={{ bgcolor: 'grey.100', color: 'grey.700', fontSize: '1rem', px: 2, py: 1, my: 0.5 }} />
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <Button
            variant={tab === 'agregar' ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<Add />}
            onClick={() => setTab('agregar')}
            sx={{ minWidth: 220, fontWeight: 600, fontSize: '1.1rem', py: 1.3, borderRadius: 2, boxShadow: tab === 'agregar' ? 2 : 0 }}
          >
            + Agregar nueva fuente
          </Button>
          <Button
            variant={tab === 'explorar' ? 'contained' : 'outlined'}
            color="secondary"
            startIcon={<Search />}
            onClick={() => setTab('explorar')}
            sx={{ minWidth: 220, fontWeight: 600, fontSize: '1.1rem', py: 1.3, borderRadius: 2, boxShadow: tab === 'explorar' ? 2 : 0 }}
          >
            Explorar Codex
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Cards de carga de fuentes
  const CardSubirDocumento = () => (
    <Card sx={{ mb: 5, borderRadius: 4, p: 2, boxShadow: 0 }}>
      <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1.2rem', letterSpacing: -0.5 }}>
            Subir Documento / Nota / PDF
          </Typography>
          <TextField label="Título del documento" fullWidth size="medium" />
          <TextField label="Descripción breve" fullWidth size="medium" multiline rows={2} />
          <TextField label="Etiquetas" fullWidth size="medium" placeholder="Ej: salud, gobierno" InputProps={{ startAdornment: <InputAdornment position="start"><Label fontSize="small" /></InputAdornment> }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <Button
              variant="outlined"
              startIcon={<DriveFolderUpload />}
              onClick={() => handleAddFromDriveWithType('documento')}
              sx={{ fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}
            >
              Conectar desde Google Drive
            </Button>
          </Stack>
          <InactiveButton icon={<Description />} label="Analizar contenido del PDF" />
        </Stack>
      </CardContent>
    </Card>
  );

  const CardSubirAudio = () => (
    <Card sx={{ mb: 5, borderRadius: 4, p: 2, boxShadow: 0 }}>
      <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1.2rem', letterSpacing: -0.5 }}>
            Subir Audio / Entrevista
          </Typography>
          <TextField label="Nombre del audio" fullWidth size="medium" />
          <TextField label="Breve descripción o contexto" fullWidth size="medium" multiline rows={2} />
          <TextField label="Relacionar con proyecto (opcional)" fullWidth size="medium" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <Button
              variant="outlined"
              startIcon={<DriveFolderUpload />}
              onClick={() => handleAddFromDriveWithType('audio')}
              sx={{ fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}
            >
              Conectar desde Google Drive
            </Button>
          </Stack>
          <InactiveButton icon={<Audiotrack />} label="Transcribir audio" />
        </Stack>
      </CardContent>
    </Card>
  );

  const CardSubirVideo = () => (
    <Card sx={{ mb: 5, borderRadius: 4, p: 2, boxShadow: 0 }}>
      <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1.2rem', letterSpacing: -0.5 }}>
            Subir Video / Conferencia
          </Typography>
          <TextField label="Título del video" fullWidth size="medium" />
          <TextField label="Descripción breve" fullWidth size="medium" multiline rows={2} />
          <TextField label="Participantes clave (opcional)" fullWidth size="medium" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
            <Button
              variant="outlined"
              startIcon={<DriveFolderUpload />}
              onClick={() => handleAddFromDriveWithType('video')}
              sx={{ fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}
            >
              Conectar desde Google Drive
            </Button>
          </Stack>
          <InactiveButton icon={<VideoLibrary />} label="Extraer audio" />
        </Stack>
      </CardContent>
    </Card>
  );

  const CardSubirEnlace = () => (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Enlace o artículo externo
          </Typography>
          <TextField label="URL" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" /></InputAdornment> }} />
          <TextField label="Comentario propio" fullWidth size="small" multiline rows={2} />
          <FormControl fullWidth size="small">
            <InputLabel>Relevancia</InputLabel>
            <Select label="Relevancia" defaultValue="media">
              <MenuItem value="alta">Alta</MenuItem>
              <MenuItem value="media">Media</MenuItem>
              <MenuItem value="baja">Baja</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );

  // Explorador de Codex
  const ExploradorCodex = () => (
    <Card sx={{ borderRadius: 4, p: 2, boxShadow: 0 }}>
      <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={3}>
          <TextField
            label="Buscar por título"
            size="medium"
            value={filtros.search}
            onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="medium" sx={{ minWidth: 180 }}>
            <InputLabel>Tipo de fuente</InputLabel>
            <Select
              label="Tipo de fuente"
              value={filtros.tipo}
              onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              {tipoOptions.map(tipo => (
                <MenuItem key={tipo} value={tipo}>{tipoLabels[tipo]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="medium" sx={{ minWidth: 180 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={filtros.estado}
              onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              {estadoLabels.map(estado => (
                <MenuItem key={estado} value={estado}>{estado}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={4}>
          {filteredItems.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: '1.2rem', mb: 2 }}>
                  {codexItems.length === 0 
                    ? 'Tu Codex está vacío' 
                    : 'No se encontraron fuentes con los filtros seleccionados'
                  }
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', mb: 3 }}>
                  {codexItems.length === 0 
                    ? 'Comienza agregando documentos, audios, videos o enlaces desde Google Drive.' 
                    : 'Intenta ajustar los filtros para encontrar lo que buscas.'
                  }
                </Typography>
                {codexItems.length === 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setTab('agregar')}
                    sx={{ fontWeight: 600, fontSize: '1rem', px: 3, py: 1.5, borderRadius: 2 }}
                  >
                    Agregar primera fuente
                  </Button>
                )}
              </Box>
            </Grid>
          ) : (
            filteredItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                    boxShadow: 0,
                    p: 3,
                  }}
                >
                  <CardContent sx={{ px: 0, py: 0 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      {item.tipo === 'documento' && <Description color="primary" />}
                      {item.tipo === 'audio' && <Audiotrack color="secondary" />}
                      {item.tipo === 'video' && <VideoLibrary sx={{ color: theme.palette.primary.dark }} />}
                      {item.tipo === 'enlace' && <LinkIcon sx={{ color: theme.palette.grey[700] }} />}
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ fontSize: '1.1rem' }}>
                        {item.titulo}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontSize: '1rem' }}>
                      {tipoLabels[item.tipo]} • {item.fecha}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1.5}>
                      {item.etiquetas.map((et: string) => (
                        <Chip key={et} label={et} size="small" sx={{ bgcolor: 'grey.100', color: 'grey.700', fontWeight: 500, fontSize: '0.95rem' }} />
                      ))}
                    </Stack>
                    <Chip label={item.estado} size="small" sx={{ bgcolor: 'grey.200', color: 'grey.800', fontWeight: 600, fontSize: '0.95rem', mb: 1.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.98rem', mb: 1.5 }}>
                      Proyecto: <b>{item.proyecto || '—'}</b>
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1.5}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Chip label="Ver en Google Drive" icon={<DriveFolderUpload fontSize="small" />} clickable sx={{ bgcolor: 'blue.50', color: 'primary.main', fontWeight: 500, fontSize: '0.98rem' }} />
                      </a>
                      <Chip 
                        label="Eliminar" 
                        icon={<Delete fontSize="small" />} 
                        clickable 
                        onClick={() => handleDeleteItem(item.id)}
                        sx={{ 
                          bgcolor: 'red.50', 
                          color: 'error.main', 
                          fontWeight: 500, 
                          fontSize: '0.98rem',
                          '&:hover': {
                            bgcolor: 'red.100'
                          }
                        }} 
                      />
                    </Stack>
                  </CardContent>
                  <Box px={0} pb={0}>
                    <InactiveButton icon={<LockIcon />} label="Relacionar con investigación" />
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  // Función para eliminar un item del Codex
  const handleDeleteItem = (itemId: string) => {
    console.log('[Codex] Eliminando item:', itemId);
    setCodexItems(items => items.filter(item => item.id !== itemId));
  };

  // Función principal para agregar desde Google Drive
  const handleAddFromDriveWithType = async (forcedType: string) => {
    console.log('[Codex] handleAddFromDriveWithType called. user:', user);
    
    // Verificar si el usuario está autenticado
    if (!user || !session) {
      setGoogleDialogError('Debes iniciar sesión para acceder a Google Drive.');
      setNeedsGoogleAuth(true);
      setGoogleDialogOpen(true);
      return;
    }

    // Verificar si el usuario está autenticado con Google
    const isGoogleUser = user.app_metadata?.provider === 'google';
    if (!isGoogleUser) {
      setGoogleDialogError('Para acceder a Google Drive, debes iniciar sesión con tu cuenta de Google.');
      setNeedsGoogleAuth(true);
      setGoogleDialogOpen(true);
      return;
    }

    // Verificar si tenemos el token de Google
    const googleToken = session.provider_token;
    if (!googleToken) {
      setGoogleDialogError('Necesitas autorizar el acceso a Google Drive para usar esta función.');
      setNeedsGoogleAuth(true);
      setGoogleDialogOpen(true);
      return;
    }

    // Verificar si los scripts de Google están cargados
    if (!pickerApiLoaded.current) {
      setGoogleDialogError('Los servicios de Google aún se están cargando. Espera unos segundos e intenta de nuevo.');
      setNeedsGoogleAuth(false);
      setGoogleDialogOpen(true);
      return;
    }

    // Verificar que Google Picker esté disponible
    if (!(window as any).google || !(window as any).google.picker) {
      console.error('[Codex] Google Picker no está disponible');
      setGoogleDialogError('Los servicios de Google Picker no están disponibles. Recarga la página e intenta de nuevo.');
      setNeedsGoogleAuth(false);
      setGoogleDialogOpen(true);
      return;
    }

    console.log('[Codex] Token de Google disponible, abriendo picker.');
    
    // Crear y mostrar el picker
    try {
      console.log('[Codex] Creando vista del picker...');
      const view = new (window as any).google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);
      
      // Intentar aplicar modo LIST si está disponible
      try {
        if ((window as any).google.picker.ViewMode && (window as any).google.picker.ViewMode.LIST) {
          view.setMode((window as any).google.picker.ViewMode.LIST);
          console.log('[Codex] Modo LIST aplicado');
        } else {
          console.warn('[Codex] LIST mode no disponible, usando modo por defecto');
        }
      } catch (viewModeError) {
        console.warn('[Codex] Error aplicando ViewMode, usando modo por defecto:', viewModeError);
      }
      
      console.log('[Codex] Creando picker builder...');
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(googleToken)
        .setDeveloperKey(GOOGLE_PICKER_API_KEY)
        .setCallback(async (data: any) => {
          console.log('[Codex] Picker callback ejecutado:', data);
          if (data.action === 'picked' && data.docs && data.docs.length > 0) {
            const file = data.docs[0];
            console.log('[Codex] Archivo seleccionado:', file);
            
            try {
              // Cargar Google Drive API si no está cargada
              console.log('[Codex] Cargando Google Drive API...');
              if (!(window as any).gapi.client) {
                await new Promise((resolve) => {
                  (window as any).gapi.load('client', resolve);
                });
              }
              
              await (window as any).gapi.client.init({
                apiKey: GOOGLE_PICKER_API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              
              (window as any).gapi.client.setToken({ access_token: googleToken });
              
              console.log('[Codex] Obteniendo metadatos del archivo...');
              const driveFile = await (window as any).gapi.client.drive.files.get({
                fileId: file.id,
                fields: 'id, name, mimeType, modifiedTime, webViewLink',
              });
              
              const meta = driveFile.result;
              console.log('[Codex] Metadatos del archivo:', meta);
              
              // Determinar tipo basado en el tipo forzado y el mimeType
              let tipo: string = forcedType;
              if (forcedType === 'audio' && !meta.mimeType.startsWith('audio')) tipo = 'documento';
              if (forcedType === 'video' && !meta.mimeType.startsWith('video')) tipo = 'documento';
              
              // Agregar al Codex
              const newItem = {
                id: 'codex-' + Math.random().toString(36).slice(2, 8),
                titulo: meta.name,
                tipo,
                fecha: meta.modifiedTime?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                etiquetas: [],
                estado: 'Nuevo',
                proyecto: '',
                driveFileId: meta.id,
                url: meta.webViewLink,
              };
              
              console.log('[Codex] Agregando nuevo item:', newItem);
              setCodexItems(items => [...items, newItem]);
              setTab('explorar');
              
            } catch (error: any) {
              console.error('[Codex] Error procesando archivo:', error);
              if (error.status === 403) {
                setGoogleDialogError('No tienes permisos para acceder a Google Drive. Necesitas autorizar el acceso.');
                setNeedsGoogleAuth(true);
              } else {
                setGoogleDialogError('Error al procesar el archivo seleccionado. Intenta de nuevo.');
                setNeedsGoogleAuth(false);
              }
              setGoogleDialogOpen(true);
            }
          }
        })
        .setTitle('Selecciona un archivo de Google Drive')
        .build();
      
      console.log('[Codex] Mostrando picker...');
      picker.setVisible(true);
      
    } catch (error: any) {
      console.error('[Codex] Error creando picker:', error);
      if (error.status === 403) {
        setGoogleDialogError('No tienes permisos para acceder a Google Drive. Necesitas autorizar el acceso.');
        setNeedsGoogleAuth(true);
      } else {
        setGoogleDialogError('Error al abrir el selector de archivos. Los servicios de Google pueden no estar completamente cargados. Recarga la página e intenta de nuevo.');
        setNeedsGoogleAuth(false);
      }
      setGoogleDialogOpen(true);
    }
  };

  // Función para manejar la reautenticación con Google (con scopes de Drive)
  const handleGoogleReauth = async () => {
    try {
      // Construir URL de callback basada en la ubicación actual
      const currentUrl = new URL(window.location.href);
      const callbackUrl = `${currentUrl.protocol}//${currentUrl.host}/auth/callback`;
      
      console.log('[Codex] Solicitando autorización para Google Drive...');
      console.log('[Codex] Callback URL:', callbackUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      
      setGoogleDialogOpen(false);
    } catch (error: any) {
      console.error('[Codex] Error en reautenticación:', error);
      setGoogleDialogError('Error al autorizar Google Drive: ' + error.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box textAlign="center" mb={7}>
        <Typography variant="h2" fontWeight={800} gutterBottom sx={{ letterSpacing: -2, fontSize: { xs: '2.2rem', sm: '2.8rem' } }}>
          Codex
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '1.1rem', sm: '1.3rem' }, mb: 1 }}>
          Tu archivo personal de fuentes, documentos, audios, videos y enlaces. Conecta tu Google Drive para comenzar a organizar y analizar tus materiales periodísticos.
        </Typography>
      </Box>
      <CardResumen />
      {tab === 'agregar' && (
        <Box>
          <CardSubirDocumento />
          <CardSubirAudio />
          <CardSubirVideo />
          <CardSubirEnlace />
        </Box>
      )}
      {tab === 'explorar' && <ExploradorCodex />}
      
      {/* Dialog para errores de Google */}
      <Dialog open={googleDialogOpen} onClose={() => setGoogleDialogOpen(false)}>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <GoogleIcon sx={{ fontSize: 48, color: '#4285F4', mb: 1 }} />
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Acceso a Google Drive
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {googleDialogError}
          </Typography>
          {needsGoogleAuth && (
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleReauth}
              sx={{ bgcolor: '#4285F4', color: 'white', fontWeight: 600, fontSize: '1.1rem', mb: 1, '&:hover': { bgcolor: '#357ae8' } }}
            >
              Iniciar sesión con Google
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoogleDialogOpen(false)} color="primary" autoFocus>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Codex; 