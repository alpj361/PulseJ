import React, { useState } from 'react';
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
  useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CloudUpload, Description, Audiotrack, VideoLibrary, Link as LinkIcon, Add, Search, Label, DriveFolderUpload, Lock } from '@mui/icons-material';

// Estructura de datos simulada
const initialCodexItems = [
  {
    id: '1',
    titulo: 'Entrevista a Ministro de Salud',
    tipo: 'audio',
    driveFileId: 'abc123',
    url: '',
    etiquetas: ['salud', 'gobierno'],
    estado: 'Archivado',
    proyecto: 'COVID-19',
    fecha: '2024-06-01',
  },
  {
    id: '2',
    titulo: 'Informe de Transparencia 2024',
    tipo: 'documento',
    driveFileId: 'def456',
    url: '',
    etiquetas: ['transparencia'],
    estado: 'En análisis',
    proyecto: 'Investigación Corrupción',
    fecha: '2024-06-02',
  },
  {
    id: '3',
    titulo: 'Video Conferencia Prensa Libre',
    tipo: 'video',
    driveFileId: 'ghi789',
    url: '',
    etiquetas: ['prensa'],
    estado: 'Nuevo',
    proyecto: '',
    fecha: '2024-06-03',
  },
  {
    id: '4',
    titulo: 'Artículo: Corrupción en América Latina',
    tipo: 'enlace',
    driveFileId: '',
    url: 'https://ejemplo.com/articulo',
    etiquetas: ['corrupción', 'latam'],
    estado: 'Nuevo',
    proyecto: '',
    fecha: '2024-06-04',
  },
];

const tipoLabels: Record<string, string> = {
  documento: 'Documento',
  audio: 'Audio',
  video: 'Video',
  enlace: 'Enlace',
};

const estadoLabels = ['Nuevo', 'Archivado', 'En análisis'];
const tipoOptions = ['documento', 'audio', 'video', 'enlace'];

const Codex: React.FC = () => {
  const [codexItems, setCodexItems] = useState(initialCodexItems);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', search: '' });
  const [tab, setTab] = useState<'explorar' | 'agregar'>('explorar');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          variant="contained"
          color="inherit"
          startIcon={icon}
          disabled
          sx={{ opacity: 0.6, pointerEvents: 'auto', bgcolor: 'grey.200', color: 'grey.600' }}
        >
          {label}
        </Button>
      </span>
    </Tooltip>
  );

  // Card de resumen general
  const CardResumen = () => (
    <Card sx={{ mb: 4, p: 2, borderRadius: 4, boxShadow: 0 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Resumen general del Codex
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Última actualización: {resumen.ultima || '—'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={2} justifyContent={isMobile ? 'flex-start' : 'flex-end'}>
              <Chip icon={<Description />} label={`Documentos: ${resumen.documento}`} color="primary" />
              <Chip icon={<Audiotrack />} label={`Audios: ${resumen.audio}`} color="secondary" />
              <Chip icon={<VideoLibrary />} label={`Videos: ${resumen.video}`} sx={{ bgcolor: 'blue.100', color: 'blue.800' }} />
              <Chip icon={<LinkIcon />} label={`Enlaces: ${resumen.enlace}`} sx={{ bgcolor: 'grey.100', color: 'grey.700' }} />
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant={tab === 'agregar' ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<Add />}
            onClick={() => setTab('agregar')}
            sx={{ minWidth: 180 }}
          >
            + Agregar nueva fuente
          </Button>
          <Button
            variant={tab === 'explorar' ? 'contained' : 'outlined'}
            color="secondary"
            startIcon={<Search />}
            onClick={() => setTab('explorar')}
            sx={{ minWidth: 180 }}
          >
            Explorar Codex
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Cards de carga de fuentes
  const CardSubirDocumento = () => (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Subir Documento / Nota / PDF
          </Typography>
          <TextField label="Título del documento" fullWidth size="small" />
          <TextField label="Descripción breve" fullWidth size="small" multiline rows={2} />
          <TextField label="Etiquetas" fullWidth size="small" placeholder="Ej: salud, gobierno" InputProps={{ startAdornment: <InputAdornment position="start"><Label fontSize="small" /></InputAdornment> }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <InactiveButton icon={<CloudUpload />} label="Subir PDF desde equipo" />
            <InactiveButton icon={<DriveFolderUpload />} label="Conectar desde Google Drive" />
          </Stack>
          <InactiveButton icon={<Description />} label="Analizar contenido del PDF" />
        </Stack>
      </CardContent>
    </Card>
  );

  const CardSubirAudio = () => (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Subir Audio / Entrevista
          </Typography>
          <TextField label="Nombre del audio" fullWidth size="small" />
          <TextField label="Breve descripción o contexto" fullWidth size="small" multiline rows={2} />
          <TextField label="Relacionar con proyecto (opcional)" fullWidth size="small" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <InactiveButton icon={<CloudUpload />} label="Subir audio desde equipo" />
            <InactiveButton icon={<DriveFolderUpload />} label="Conectar desde Google Drive" />
          </Stack>
          <InactiveButton icon={<Audiotrack />} label="Transcribir audio" />
        </Stack>
      </CardContent>
    </Card>
  );

  const CardSubirVideo = () => (
    <Card sx={{ mb: 3, borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Subir Video / Conferencia
          </Typography>
          <TextField label="Título del video" fullWidth size="small" />
          <TextField label="Descripción breve" fullWidth size="small" multiline rows={2} />
          <TextField label="Participantes clave (opcional)" fullWidth size="small" />
          <InactiveButton icon={<DriveFolderUpload />} label="Conectar desde Google Drive" />
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
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField
            label="Buscar por título"
            size="small"
            value={filtros.search}
            onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {filteredItems.length === 0 ? (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center">
                No se encontraron fuentes con los filtros seleccionados.
              </Typography>
            </Grid>
          ) : (
            filteredItems.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                    boxShadow: 0,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      {item.tipo === 'documento' && <Description color="primary" />}
                      {item.tipo === 'audio' && <Audiotrack color="secondary" />}
                      {item.tipo === 'video' && <VideoLibrary sx={{ color: theme.palette.primary.dark }} />}
                      {item.tipo === 'enlace' && <LinkIcon sx={{ color: theme.palette.grey[700] }} />}
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {item.titulo}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {tipoLabels[item.tipo]} • {item.fecha}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      {item.etiquetas.map(et => (
                        <Chip key={et} label={et} size="small" sx={{ bgcolor: 'grey.100', color: 'grey.700' }} />
                      ))}
                    </Stack>
                    <Chip label={item.estado} size="small" sx={{ bgcolor: 'grey.200', color: 'grey.800', fontWeight: 500 }} />
                  </CardContent>
                  <Box px={2} pb={2}>
                    <InactiveButton icon={<Lock />} label="Relacionar con investigación" />
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Codex
        </Typography>
        <Typography variant="h6" color="text.secondary">
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
    </Container>
  );
};

export default Codex; 