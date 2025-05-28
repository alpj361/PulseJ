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
import { jwtDecode } from 'jwt-decode';
import { GoogleDrivePickerButton } from '../components/GoogleDrivePickerButton';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

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
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

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
  const { isGoogleUser, canUseDrive } = useGoogleDrive();

  useEffect(() => {
    console.log('🟦 [Codex] user:', user);
    console.log('🟦 [Codex] session:', session);
    console.log('🟦 [Codex] ¿Es usuario de Google?:', isGoogleUser);
    console.log('🟦 [Codex] ¿Puede usar Drive?:', canUseDrive);
    if (user) {
      if (user.app_metadata) console.log('🟦 [Codex] user.app_metadata:', user.app_metadata);
      if (user.identities) console.log('🟦 [Codex] user.identities:', user.identities);
    }
    if (session) {
      if (session.provider_token) console.log('🟦 [Codex] session.provider_token:', session.provider_token);
      if (session.user) console.log('🟦 [Codex] session.user:', session.user);
    }
  }, [user, session, isGoogleUser, canUseDrive]);

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

  // Función para manejar archivos seleccionados del picker
  const handleFileFromDrive = (file: any, tipo: string) => {
    console.log('🟩 [Codex] Archivo seleccionado de Drive:', file, 'tipo:', tipo);
    const newItem = {
      id: 'codex-' + Math.random().toString(36).slice(2, 8),
      titulo: file.name,
      tipo: tipo,
      fecha: new Date().toISOString().slice(0, 10),
      etiquetas: [],
      estado: 'Nuevo',
      proyecto: '',
      driveFileId: file.id,
      url: file.url || '',
    };
    setCodexItems(items => [...items, newItem]);
    setTab('explorar');
  };

  // Función para manejar errores del picker
  const handlePickerError = (error: string) => {
    console.error('🟥 [Codex] Error del picker:', error);
    setGoogleDialogError(error);
    setGoogleDialogOpen(true);
  };

  // Cards de carga de fuentes
  function CardSubirDocumento() {
    return (
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
              <GoogleDrivePickerButton
                onFilePicked={(file) => handleFileFromDrive(file, 'documento')}
                onError={handlePickerError}
                buttonText="Conectar desde Google Drive"
              />
            </Stack>
            <InactiveButton icon={<Description />} label="Analizar contenido del PDF" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  function CardSubirAudio() {
    return (
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
              <GoogleDrivePickerButton
                onFilePicked={(file) => handleFileFromDrive(file, 'audio')}
                onError={handlePickerError}
                buttonText="Conectar desde Google Drive"
              />
            </Stack>
            <InactiveButton icon={<Audiotrack />} label="Transcribir audio" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  function CardSubirVideo() {
    return (
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
              <GoogleDrivePickerButton
                onFilePicked={(file) => handleFileFromDrive(file, 'video')}
                onError={handlePickerError}
                buttonText="Conectar desde Google Drive"
              />
            </Stack>
            <InactiveButton icon={<VideoLibrary />} label="Extraer audio" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

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
          {isGoogleUser ? (
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, mt: 1 }}>
              Ya tienes acceso a Google Drive. Puedes seleccionar archivos.
            </Typography>
          ) : (
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600, mt: 1 }}>
              Necesitas iniciar sesión con Google para acceder a Drive.
            </Typography>
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