import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  People as PeopleIcon,
  Source as SourceIcon
} from '@mui/icons-material';

interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  tags: string[];
  audience: string;
  expectedSources: string[];
  createdAt: Date;
  updatedAt: Date;
}

const projectTypes = [
  'Investigación de mercado',
  'Análisis de sentimiento',
  'Monitoreo de marca',
  'Estudio de tendencias',
  'Análisis competitivo',
  'Investigación social',
  'Otro'
];

const audienceOptions = [
  'Público general',
  'Adolescentes (13-19)',
  'Jóvenes adultos (20-35)',
  'Adultos (36-55)',
  'Adultos mayores (56+)',
  'Profesionales',
  'Estudiantes',
  'Específico'
];

const sourceOptions = [
  'Twitter/X',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'TikTok',
  'YouTube',
  'Noticias online',
  'Blogs',
  'Foros',
  'Reddit'
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    tags: [] as string[],
    audience: '',
    expectedSources: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      tags: [],
      audience: '',
      expectedSources: []
    });
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        description: project.description,
        type: project.type,
        tags: project.tags,
        audience: project.audience,
        expectedSources: project.expectedSources
      });
    } else {
      setEditingProject(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    resetForm();
  };

  const handleSaveProject = () => {
    const now = new Date();
    
    if (editingProject) {
      // Update existing project
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { ...editingProject, ...formData, updatedAt: now }
          : p
      ));
    } else {
      // Create new project
      const newProject: Project = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now
      };
      setProjects(prev => [...prev, newProject]);
    }
    
    handleCloseDialog();
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
          Proyectos de Investigación
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Esta sección te permite crear y gestionar proyectos de investigación para dar contexto
          a tus análisis y operar de manera más organizada en base a objetivos específicos.
        </Typography>
        
        {/* Action Bar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Crear Proyecto
          </Button>
          
          <TextField
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 250 }}
          />
        </Box>
      </Box>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.default' }}>
          <FolderOpen sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay proyectos creados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comienza creando tu primer proyecto de investigación
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Crear Primer Proyecto
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
                    {project.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {project.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={project.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {project.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LabelIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Etiquetas
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {project.tags.length > 3 && (
                          <Chip
                            label={`+${project.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Audiencia: {project.audience}
                      </Typography>
                    </Box>
                  </Box>

                  {project.expectedSources.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <SourceIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Fuentes ({project.expectedSources.length})
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(project)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProject(project.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Título del proyecto"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              placeholder="Ej: Análisis de sentimiento sobre elecciones 2024"
            />

            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe los objetivos, metodología y alcance de tu investigación..."
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de proyecto</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                label="Tipo de proyecto"
              >
                {projectTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={[]}
              freeSolo
              value={formData.tags}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, tags: newValue }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Etiquetas"
                  placeholder="Presiona Enter para agregar etiquetas"
                  helperText="Agrega palabras clave para organizar tu proyecto"
                />
              )}
            />

            <FormControl fullWidth required>
              <InputLabel>Audiencia objetivo</InputLabel>
              <Select
                value={formData.audience}
                onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                label="Audiencia objetivo"
              >
                {audienceOptions.map((audience) => (
                  <MenuItem key={audience} value={audience}>
                    {audience}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={sourceOptions}
              value={formData.expectedSources}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, expectedSources: newValue }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fuentes esperadas"
                  placeholder="Selecciona las fuentes de datos"
                  helperText="Indica de qué plataformas esperas recopilar información"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveProject}
            variant="contained"
            disabled={!formData.title || !formData.description || !formData.type || !formData.audience}
          >
            {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects; 