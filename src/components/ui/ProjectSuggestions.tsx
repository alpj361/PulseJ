import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AutoAwesome as SuggestionsIcon,
  Refresh as RefreshIcon,
  Schedule as TimeIcon,
  Build as ToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as IdeaIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Project, ProjectDecision, ProjectSuggestion, SuggestionsResponse } from '../../types/projects';
import { supabase } from '../../services/supabase.ts';
import {
  getProjectSuggestions,
  getSuggestionsFromDatabase,
  saveSuggestionsToDatabase,
  getSuggestionsFromCache,
  getSuggestionIcon,
  getPriorityColor
} from '../../services/geminiSuggestions';

interface ProjectSuggestionsProps {
  project: Project;
  decisions: ProjectDecision[];
  onSuggestionsUpdated?: () => void; // Callback para refrescar el proyecto
}

const ProjectSuggestions: React.FC<ProjectSuggestionsProps> = ({ project, decisions, onSuggestionsUpdated }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  // Cargar sugerencias desde base de datos al inicializar
  useEffect(() => {
    console.log('🚀 [ProjectSuggestions] useEffect ejecutado:', {
      projectId: project.id,
      projectTitle: project.title,
      projectSuggestions: project.suggestions
    });

    const loadSuggestions = async () => {
      // Primero intentar cargar desde la base de datos
      const dbSuggestions = getSuggestionsFromDatabase(project);
      if (dbSuggestions) {
        console.log('✅ [ProjectSuggestions] Sugerencias cargadas desde DB:', dbSuggestions);
        setSuggestions(dbSuggestions);
        return;
      }
      
      console.log('🔄 [ProjectSuggestions] No hay sugerencias válidas en DB, probando localStorage...');
      // Fallback a localStorage si no hay en la base de datos
      const cached = getSuggestionsFromCache(project.id);
      if (cached) {
        console.log('✅ [ProjectSuggestions] Sugerencias cargadas desde localStorage:', cached);
        setSuggestions(cached);
        return;
      }
      
      console.log('🔄 [ProjectSuggestions] No hay sugerencias válidas, generando automáticamente...');
      // Si no hay sugerencias válidas, generarlas automáticamente
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const userToken = session?.access_token || 'test-token';
        
        const newSuggestions = await getProjectSuggestions(project, decisions, userToken);
        setSuggestions(newSuggestions);
        
        // Guardar en base de datos
        await saveSuggestionsToDatabase(project.id, newSuggestions);
        console.log('💾 [ProjectSuggestions] Sugerencias generadas y guardadas automáticamente');
        
        // Notificar al componente padre para que refresque el proyecto
        if (onSuggestionsUpdated) {
          onSuggestionsUpdated();
        }
      } catch (err) {
        console.error('❌ [ProjectSuggestions] Error generando sugerencias automáticamente:', err);
        setError(err instanceof Error ? err.message : 'Error generando sugerencias automáticamente');
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [project.id, project.suggestions]);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener el token de acceso de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token || 'test-token';
      
      const newSuggestions = await getProjectSuggestions(project, decisions, userToken);
      
      setSuggestions(newSuggestions);
      
      // Guardar en base de datos
      await saveSuggestionsToDatabase(project.id, newSuggestions);
      console.log('💾 [ProjectSuggestions] Sugerencias guardadas en base de datos');
      
      // Notificar al componente padre para que refresque el proyecto
      if (onSuggestionsUpdated) {
        onSuggestionsUpdated();
      }
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setError(err instanceof Error ? err.message : 'Error obteniendo sugerencias');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryLabel = (category: ProjectSuggestion['category']) => {
    switch (category) {
      case 'analysis': return 'Análisis';
      case 'research': return 'Investigación';
      case 'platform': return 'Plataforma';
      case 'external': return 'Externo';
      case 'documentation': return 'Documentación';
      default: return 'General';
    }
  };

  const getPriorityLabel = (priority: ProjectSuggestion['priority']) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  };

  const toggleSuggestionExpansion = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)',
        border: '1px solid #e3f2fd',
        borderRadius: 2
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header compacto */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <SuggestionsIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="600" color="primary.main">
                Sugerencias IA
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Análisis especializado en auditoría
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {suggestions && (
              <Chip 
                label={`${suggestions.suggestions.length} sugerencias`} 
                size="small" 
                sx={{ bgcolor: 'primary.main', color: 'white', fontSize: '11px', height: 22 }}
              />
            )}
            <IconButton
              onClick={handleGetSuggestions}
              disabled={loading}
              size="small"
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                width: 28,
                height: 28,
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' }
              }}
            >
              {loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, py: 1 }}>
            <Typography variant="caption">{error}</Typography>
          </Alert>
        )}

        {/* Botón principal si no hay sugerencias */}
        {!suggestions && !loading && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <IdeaIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" gutterBottom color="text.secondary">
              Obtén sugerencias personalizadas
            </Typography>
            <Button
              variant="contained"
              onClick={handleGetSuggestions}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <SuggestionsIcon />}
              size="small"
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                borderRadius: 2,
                px: 3,
                mt: 1
              }}
            >
              {loading ? 'Generando...' : 'Recibir Sugerencias'}
            </Button>
          </Box>
        )}

        {/* Sugerencias desplegables */}
        {suggestions && (
          <Accordion 
            defaultExpanded={false}
            elevation={0}
            sx={{ 
              background: 'transparent',
              '&:before': { display: 'none' },
              border: 'none'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                borderRadius: 1,
                border: '1px solid rgba(33, 150, 243, 0.2)',
                minHeight: 40,
                '&.Mui-expanded': { minHeight: 40 },
                '& .MuiAccordionSummary-content': { 
                  margin: '8px 0',
                  '&.Mui-expanded': { margin: '8px 0' }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: 'primary.main', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <SuggestionsIcon sx={{ fontSize: 14, color: 'white' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="600">
                    Ver {suggestions.suggestions.length} sugerencias disponibles
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {suggestions && formatDate(suggestions.generatedAt)}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ p: 0, mt: 1 }}>
              {/* Análisis general compacto */}
              {suggestions.analysis && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 1, borderLeft: '3px solid #2196F3' }}>
                  <Typography variant="caption" color="primary.main" fontWeight="600" display="block" gutterBottom>
                    📊 ANÁLISIS DEL PROYECTO
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {suggestions.analysis.length > 300 ? suggestions.analysis.substring(0, 300) + '...' : suggestions.analysis}
                  </Typography>
                </Box>
              )}

              {/* Scroll horizontal de sugerencias */}
              <Box sx={{ 
                overflowX: 'auto', 
                pb: 1,
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(33, 150, 243, 0.3)', borderRadius: 3 }
              }}>
                <Box sx={{ display: 'flex', gap: 2, minWidth: 'max-content', pb: 1 }}>
                  {suggestions.suggestions.map((suggestion, index) => {
                    const isExpanded = expandedSuggestions.has(suggestion.id);
                    return (
                    <Card 
                      key={suggestion.id}
                      elevation={0}
                      sx={{ 
                        minWidth: 280,
                        maxWidth: isExpanded ? 400 : 280,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Header de la tarjeta */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                          <Typography variant="h6" fontSize="20px" sx={{ mt: 0.5 }}>
                            {getSuggestionIcon(suggestion.category)}
                          </Typography>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              mb: 0.5
                            }}>
                              {suggestion.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Chip
                                label={getPriorityLabel(suggestion.priority)}
                                size="small"
                                className={getPriorityColor(suggestion.priority)}
                                sx={{ fontSize: '10px', height: 18 }}
                              />
                              <Chip
                                label={getCategoryLabel(suggestion.category)}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '10px', height: 18 }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        {/* Descripción */}
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          display: isExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: isExpanded ? 'none' : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          mb: 1.5
                        }}>
                          {suggestion.description}
                        </Typography>

                        {/* Acción recomendada */}
                        <Box sx={{ 
                          bgcolor: 'rgba(33, 150, 243, 0.08)', 
                          p: 1, 
                          borderRadius: 1, 
                          mb: 1.5,
                          borderLeft: '2px solid #2196F3'
                        }}>
                          <Typography variant="caption" color="primary.main" fontWeight="600" display="block">
                            🎯 ACCIÓN
                          </Typography>
                          <Typography variant="caption" color="text.primary" sx={{ 
                            display: isExpanded ? 'block' : '-webkit-box',
                            WebkitLineClamp: isExpanded ? 'none' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.2
                          }}>
                            {suggestion.action}
                          </Typography>
                        </Box>

                        {/* Footer con tiempo y herramientas */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {suggestion.estimatedTime}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ToolsIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {suggestion.tools.length} herramientas
                            </Typography>
                          </Box>
                        </Box>

                        {/* Herramientas */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: isExpanded ? 1.5 : 0 }}>
                          {(isExpanded ? suggestion.tools : suggestion.tools.slice(0, 3)).map((tool, toolIndex) => (
                            <Chip
                              key={toolIndex}
                              label={tool}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '9px', height: 16 }}
                            />
                          ))}
                          {!isExpanded && suggestion.tools.length > 3 && (
                            <Chip
                              label={`+${suggestion.tools.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '9px', height: 16, color: 'text.secondary' }}
                            />
                          )}
                        </Box>

                        {/* Información adicional cuando está expandido */}
                        {isExpanded && (
                          <Box sx={{ 
                            bgcolor: 'rgba(0, 0, 0, 0.03)', 
                            p: 1.5, 
                            borderRadius: 1, 
                            mb: 1.5,
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                          }}>
                            <Typography variant="caption" color="text.primary" fontWeight="600" display="block" gutterBottom>
                              💡 DETALLES ADICIONALES
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                              Esta sugerencia se basa en el análisis de las decisiones actuales del proyecto y 
                              puede ayudar a mejorar la eficiencia y resultados del mismo. 
                              El tiempo estimado incluye investigación, implementación y validación.
                            </Typography>
                          </Box>
                        )}

                        {/* Botón de expansión */}
                        <Box sx={{ textAlign: 'center', pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                          <IconButton
                            onClick={() => toggleSuggestionExpansion(suggestion.id)}
                            size="small"
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                    );
                  })}
                </Box>
              </Box>

              {/* Botón para regenerar al final */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleGetSuggestions}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                  size="small"
                  sx={{ 
                    fontSize: '11px',
                    py: 0.5,
                    px: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  {loading ? 'Generando...' : 'Actualizar Sugerencias'}
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectSuggestions; 