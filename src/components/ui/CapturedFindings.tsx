import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Assessment as AnalysisIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DocumentIcon,
  Audiotrack as AudioIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
  Insights as InsightsIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { Project } from '../../types/projects';
import { getProjectAssets } from '../../services/supabase';

interface CapturedFindingsProps {
  project: Project;
}

interface AssetAnalysis {
  totalAssets: number;
  assetsByType: { [key: string]: number };
  assetsByMonth: { [key: string]: number };
  topTags: { tag: string; count: number }[];
  recentAssets: any[];
  findings: {
    patterns: string[];
    insights: string[];
    recommendations: string[];
  };
}

const CapturedFindings: React.FC<CapturedFindingsProps> = ({ project }) => {
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    if (project) {
      analyzeProjectAssets();
    }
  }, [project.id]);

  const analyzeProjectAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const assets = await getProjectAssets(project.id);
      
      if (assets.length === 0) {
        setAnalysis({
          totalAssets: 0,
          assetsByType: {},
          assetsByMonth: {},
          topTags: [],
          recentAssets: [],
          findings: {
            patterns: ['No hay activos para analizar'],
            insights: ['Agrega documentos, audios o videos para generar insights'],
            recommendations: ['Comienza subiendo archivos relevantes al proyecto']
          }
        });
        setLoading(false);
        return;
      }

      // Análisis por tipo
      const assetsByType: { [key: string]: number } = {};
      assets.forEach(asset => {
        assetsByType[asset.tipo] = (assetsByType[asset.tipo] || 0) + 1;
      });

      // Análisis temporal
      const assetsByMonth: { [key: string]: number } = {};
      assets.forEach(asset => {
        const month = new Date(asset.created_at).toISOString().slice(0, 7);
        assetsByMonth[month] = (assetsByMonth[month] || 0) + 1;
      });

      // Análisis de tags
      const tagCounts: { [key: string]: number } = {};
      assets.forEach(asset => {
        if (asset.etiquetas && Array.isArray(asset.etiquetas)) {
          asset.etiquetas.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      // Activos recientes
      const recentAssets = assets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Generar hallazgos automáticos
      const findings = generateFindings(assets, assetsByType, topTags);

      setAnalysis({
        totalAssets: assets.length,
        assetsByType,
        assetsByMonth,
        topTags,
        recentAssets,
        findings
      });

    } catch (err) {
      console.error('Error analyzing assets:', err);
      setError('Error analizando los activos del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const generateFindings = (assets: any[], assetsByType: { [key: string]: number }, topTags: { tag: string; count: number }[]) => {
    const patterns: string[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Patrones detectados
    const mostCommonType = Object.entries(assetsByType).sort(([,a], [,b]) => b - a)[0];
    if (mostCommonType) {
      patterns.push(`El tipo de activo más común es "${mostCommonType[0]}" con ${mostCommonType[1]} elementos (${Math.round((mostCommonType[1] / assets.length) * 100)}%)`);
    }

    if (topTags.length > 0) {
      patterns.push(`Las etiquetas más frecuentes son: ${topTags.slice(0, 3).map(t => t.tag).join(', ')}`);
    }

    const recentActivity = assets.filter(asset => {
      const daysSince = (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    if (recentActivity.length > 0) {
      patterns.push(`Se han agregado ${recentActivity.length} activos en los últimos 7 días`);
    }

    // Insights generados
    if (assets.length >= 10) {
      insights.push('Tienes una base sólida de activos para el análisis del proyecto');
    } else if (assets.length >= 5) {
      insights.push('Estás construyendo una buena colección de recursos para el proyecto');
    } else {
      insights.push('El proyecto está en fase inicial de recopilación de activos');
    }

    if (assetsByType['documento'] && assetsByType['audio']) {
      insights.push('La combinación de documentos y audios permite un análisis multidimensional');
    }

    if (topTags.length >= 5) {
      insights.push('La diversidad de etiquetas indica un enfoque amplio en la investigación');
    }

    // Recomendaciones
    const typeCount = Object.keys(assetsByType).length;
    if (typeCount === 1) {
      recommendations.push('Considera agregar diferentes tipos de activos (audio, video, enlaces) para enriquecer el análisis');
    }

    if (!assetsByType['enlace'] && assets.length > 3) {
      recommendations.push('Agrega enlaces web relevantes para complementar la investigación');
    }

    if (topTags.length < 3) {
      recommendations.push('Utiliza más etiquetas descriptivas para mejorar la organización y búsqueda');
    }

    if (recentActivity.length === 0 && assets.length > 0) {
      recommendations.push('Considera actualizar el proyecto con nuevos activos o revisar los existentes');
    }

    return { patterns, insights, recommendations };
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'documento': return <DocumentIcon sx={{ fontSize: 16, color: '#f44336' }} />;
      case 'audio': return <AudioIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
      case 'video': return <VideoIcon sx={{ fontSize: 16, color: '#9c27b0' }} />;
      case 'enlace': return <LinkIcon sx={{ fontSize: 16, color: '#2196f3' }} />;
      default: return <StorageIcon sx={{ fontSize: 16, color: '#757575' }} />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #e3f2fd', borderRadius: 2 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Analizando activos del proyecto...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Box sx={{ space: 2 }}>
      {/* Header principal */}
      <Card 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)',
          border: '1px solid #e3f2fd',
          borderRadius: 2,
          mb: 2
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AnalysisIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="600" color="primary.main">
                Hallazgos Capturados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Análisis automático de {analysis.totalAssets} activos
              </Typography>
            </Box>
          </Box>

          {/* Métricas rápidas */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {analysis.totalAssets}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Activos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {Object.keys(analysis.assetsByType).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tipos de Archivo
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1 }}>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {analysis.topTags.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Etiquetas Únicas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(156, 39, 176, 0.08)', borderRadius: 1 }}>
                <Typography variant="h6" color="secondary.main" fontWeight="bold">
                  {analysis.recentAssets.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recientes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Secciones expandibles */}
      <Box sx={{ space: 1 }}>
        {/* Resumen por tipos */}
        <Accordion 
          expanded={expandedSections.has('types')}
          onChange={() => toggleSection('types')}
          elevation={0}
          sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CategoryIcon sx={{ color: 'primary.main' }} />
              <Typography variant="body2" fontWeight="600">
                Distribución por Tipos de Archivo
              </Typography>
              <Chip size="small" label={Object.keys(analysis.assetsByType).length + ' tipos'} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(analysis.assetsByType).map(([tipo, count]) => (
                <Grid item xs={12} sm={6} md={4} key={tipo}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {getTypeIcon(tipo)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                        {tipo}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(count / analysis.totalAssets) * 100}
                          sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {count} ({Math.round((count / analysis.totalAssets) * 100)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Etiquetas principales */}
        {analysis.topTags.length > 0 && (
          <Accordion 
            expanded={expandedSections.has('tags')}
            onChange={() => toggleSection('tags')}
            elevation={0}
            sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2" fontWeight="600">
                  Etiquetas Más Frecuentes
                </Typography>
                <Chip size="small" label={analysis.topTags.length + ' etiquetas'} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.topTags.map(({ tag, count }) => (
                  <Chip
                    key={tag}
                    label={`${tag} (${count})`}
                    size="small"
                    variant="outlined"
                    sx={{ bgcolor: 'success.50' }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Hallazgos y patrones */}
        <Accordion 
          expanded={expandedSections.has('findings')}
          onChange={() => toggleSection('findings')}
          elevation={0}
          sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InsightsIcon sx={{ color: 'warning.main' }} />
              <Typography variant="body2" fontWeight="600">
                Patrones e Insights Detectados
              </Typography>
              <Chip size="small" label="Análisis IA" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon sx={{ fontSize: 16 }} />
                  Patrones Detectados
                </Typography>
                {analysis.findings.patterns.map((pattern, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ mb: 1, pl: 2, borderLeft: '2px solid #2196f3' }}>
                    • {pattern}
                  </Typography>
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon sx={{ fontSize: 16 }} />
                  Insights Generados
                </Typography>
                {analysis.findings.insights.map((insight, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ mb: 1, pl: 2, borderLeft: '2px solid #4caf50' }}>
                    • {insight}
                  </Typography>
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingIcon sx={{ fontSize: 16 }} />
                  Recomendaciones
                </Typography>
                {analysis.findings.recommendations.map((rec, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ mb: 1, pl: 2, borderLeft: '2px solid #ff9800' }}>
                    • {rec}
                  </Typography>
                ))}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Activos recientes */}
        {analysis.recentAssets.length > 0 && (
          <Accordion 
            expanded={expandedSections.has('recent')}
            onChange={() => toggleSection('recent')}
            elevation={0}
            sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimelineIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="body2" fontWeight="600">
                  Activos Recientes
                </Typography>
                <Chip size="small" label={analysis.recentAssets.length + ' elementos'} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ space: 1 }}>
                {analysis.recentAssets.map((asset, index) => (
                  <Box key={asset.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    p: 1.5, 
                    bgcolor: index % 2 === 0 ? 'grey.50' : 'transparent',
                    borderRadius: 1
                  }}>
                    {getTypeIcon(asset.tipo)}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="600" noWrap>
                        {asset.titulo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(asset.created_at)} • {asset.tipo}
                      </Typography>
                    </Box>
                    {asset.etiquetas && asset.etiquetas.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {asset.etiquetas.slice(0, 2).map((tag: string, idx: number) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ fontSize: '10px', height: 16 }} />
                        ))}
                        {asset.etiquetas.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{asset.etiquetas.length - 2}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  );
};

export default CapturedFindings; 