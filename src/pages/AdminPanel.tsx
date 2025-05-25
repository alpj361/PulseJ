import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../services/supabase';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Groups as GroupsIcon,
  VpnKey as KeyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

interface InvitationCode {
  id: string;
  code: string;
  description: string;
  created_at: string;
  expires_at: string | null;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  max_uses: number;
  current_uses: number;
}

interface CodeStats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

export default function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [stats, setStats] = useState<CodeStats>({ total: 0, active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCodeData, setNewCodeData] = useState({
    prefix: 'PRESS',
    description: '',
    expiresIn: '30', // días
    maxUses: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);

      // Calcular estadísticas
      const now = new Date();
      const stats = {
        total: data?.length || 0,
        active: data?.filter(code => 
          !code.used && 
          (!code.expires_at || new Date(code.expires_at) > now) &&
          code.current_uses < code.max_uses
        ).length || 0,
        used: data?.filter(code => code.used).length || 0,
        expired: data?.filter(code => 
          code.expires_at && new Date(code.expires_at) <= now
        ).length || 0
      };
      setStats(stats);
    } catch (error: any) {
      setError('Error cargando códigos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  // Si no es admin, redirigir - DESPUÉS de todos los hooks
  if (adminLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const generateCode = async (preset?: { prefix: string; description: string }) => {
    try {
      setError(null);
      
      // Usar preset si está disponible, sino usar newCodeData
      const codeData = preset ? {
        prefix: preset.prefix,
        description: preset.description,
        expiresIn: '30', // valor por defecto para presets
        maxUses: 1 // valor por defecto para presets
      } : newCodeData;
      
      // Calcular fecha de expiración
      const expiresAt = codeData.expiresIn ? 
        new Date(Date.now() + parseInt(codeData.expiresIn) * 24 * 60 * 60 * 1000).toISOString() : 
        null;

      // Generar código usando la función SQL
      const { data: generatedCode, error: codeError } = await supabase
        .rpc('generate_invitation_code', {
          code_prefix: codeData.prefix,
          code_length: 8
        });

      if (codeError) throw codeError;

      // Insertar en la base de datos
      const { error: insertError } = await supabase
        .from('invitation_codes')
        .insert({
          code: generatedCode,
          description: codeData.description,
          expires_at: expiresAt,
          max_uses: codeData.maxUses
        });

      if (insertError) throw insertError;

      setSuccess(`Código generado: ${generatedCode}`);
      setOpenDialog(false);
      setNewCodeData({ prefix: 'PRESS', description: '', expiresIn: '30', maxUses: 1 });
      loadCodes();
    } catch (error: any) {
      setError('Error generando código: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Código copiado: ${text}`);
  };

  const getStatusChip = (code: InvitationCode) => {
    const now = new Date();
    const isExpired = code.expires_at && new Date(code.expires_at) <= now;
    const isUsed = code.used || code.current_uses >= code.max_uses;

    if (isUsed) {
      return <Chip label="Usado" color="error" size="small" icon={<CancelIcon />} />;
    }
    if (isExpired) {
      return <Chip label="Expirado" color="warning" size="small" icon={<CancelIcon />} />;
    }
    return <Chip label="Activo" color="success" size="small" icon={<CheckIcon />} />;
  };

  const presetCodes = [
    { prefix: 'JOURNALIST', description: 'Código para periodistas profesionales' },
    { prefix: 'MEDIA', description: 'Código para empresas de medios' },
    { prefix: 'PRESS', description: 'Código general de prensa' },
    { prefix: 'INVESTIGATIVE', description: 'Código para periodistas de investigación' },
    { prefix: 'SPORTS', description: 'Código para periodistas deportivos' }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AdminIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Panel de Administración
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestiona códigos de invitación para nuevos usuarios
        </Typography>
      </Box>

      {/* Alertas */}
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

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Códigos
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Activos
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.active}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupsIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Usados
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.used}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CancelIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Expirados
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.expired}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Generadores Rápidos */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generadores Rápidos
        </Typography>
        <Grid container spacing={2}>
          {presetCodes.map((preset) => (
            <Grid item xs={12} sm={6} md={4} key={preset.prefix}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {preset.prefix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {preset.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => generateCode(preset)}>
                    Generar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabla de Códigos */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Códigos de Invitación
          </Typography>
          <IconButton onClick={loadCodes}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Usos</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell>Expira</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay códigos generados
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {code.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>{getStatusChip(code)}</TableCell>
                    <TableCell>
                      {code.current_uses}/{code.max_uses}
                    </TableCell>
                    <TableCell>
                      {new Date(code.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {code.expires_at ? 
                        new Date(code.expires_at).toLocaleDateString() : 
                        'Sin expiración'
                      }
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Copiar código">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* FAB para crear código personalizado */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Dialog para código personalizado */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Código Personalizado</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prefijo"
                value={newCodeData.prefix}
                onChange={(e) => setNewCodeData({...newCodeData, prefix: e.target.value.toUpperCase()})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Usos máximos"
                type="number"
                value={newCodeData.maxUses}
                onChange={(e) => setNewCodeData({...newCodeData, maxUses: parseInt(e.target.value)})}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={newCodeData.description}
                onChange={(e) => setNewCodeData({...newCodeData, description: e.target.value})}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Expiración"
                value={newCodeData.expiresIn}
                onChange={(e) => setNewCodeData({...newCodeData, expiresIn: e.target.value})}
              >
                <MenuItem value="">Sin expiración</MenuItem>
                <MenuItem value="7">7 días</MenuItem>
                <MenuItem value="30">30 días</MenuItem>
                <MenuItem value="90">90 días</MenuItem>
                <MenuItem value="365">1 año</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={() => generateCode()} variant="contained">
            Generar Código
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 