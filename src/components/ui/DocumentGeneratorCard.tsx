import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Description as DocumentIcon,
  AutoFixHigh as AIIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { openAIService, DocumentRequest } from '../../services/openai';
import { supabase } from '../../services/supabase';
import { saveCodexItem, getCodexItemsByUser } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

interface DocumentGeneratorCardProps {
  onDocumentGenerated?: (document: any) => void;
}

const DocumentGeneratorCard: React.FC<DocumentGeneratorCardProps> = ({ onDocumentGenerated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DocumentRequest>({
    titulo: '',
    necesidad: '',
    contexto: ''
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [documentType, setDocumentType] = useState('general');
  const [previewTab, setPreviewTab] = useState(0);
  const [contextSource, setContextSource] = useState('none');
  const [availableContext, setAvailableContext] = useState<{
    trends: any[];
    recentTweets: any[];
    library: any[];
  }>({
    trends: [],
    recentTweets: [],
    library: []
  });
  const [selectedContextItems, setSelectedContextItems] = useState<string[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptPreviewTab, setPromptPreviewTab] = useState(0);

  // Plantillas de prompts guiados
  const documentTemplates = {
    analisis_politico: {
      label: 'Análisis Político',
      prompt: 'análisis político detallado sobre [tema/candidato/partido]',
      contexto: 'Incluye antecedentes, posiciones actuales, impacto en la opinión pública'
    },
    evento: {
      label: 'Plantilla de Evento',
      prompt: 'plantilla para evento [tipo de evento]',
      contexto: 'Incluye agenda, logística, público objetivo, objetivos'
    },
    analisis_tweets: {
      label: 'Análisis de Tweets',
      prompt: 'tabla de análisis de tweets sobre [hashtag/tema]',
      contexto: 'Incluye métricas de engagement, sentimiento, influencers clave'
    },
    comunicado: {
      label: 'Comunicado de Prensa',
      prompt: 'comunicado de prensa sobre [tema/anuncio]',
      contexto: 'Incluye declaraciones oficiales, contexto, información de contacto'
    },
    carta_oficial: {
      label: 'Carta Oficial',
      prompt: 'carta oficial dirigida a [destinatario]',
      contexto: 'Incluye saludo formal, cuerpo del mensaje, cierre protocolar'
    },
    contenido_creador: {
      label: 'Material para Creador',
      prompt: 'material de contenido para [plataforma/objetivo]',
      contexto: 'Incluye llamadas a la acción, hashtags relevantes, timing de publicación'
    },
    general: {
      label: 'Documento General',
      prompt: '',
      contexto: ''
    }
  };

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const templateKey = event.target.value;
    setDocumentType(templateKey);
    
    if (templateKey !== 'general') {
      const template = documentTemplates[templateKey as keyof typeof documentTemplates];
      setFormData(prev => ({
        ...prev,
        necesidad: template.prompt,
        contexto: template.contexto
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        necesidad: '',
        contexto: ''
      }));
    }
  };

  const handleInputChange = (field: keyof DocumentRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.titulo.trim() || !formData.necesidad.trim()) {
      setError('Por favor, completa al menos el título y qué necesitas redactar');
      return;
    }

    console.log('🚀 Iniciando generación de documento...');
    console.log('📝 Datos del formulario:', formData);

    // Construir contexto completo combinando el seleccionado y el adicional
    const selectedContext = buildContextFromSelection();
    const fullContext = selectedContext + (selectedContext && formData.contexto ? '\n\n' : '') + formData.contexto;
    
    const requestData = {
      ...formData,
      contexto: fullContext
    };

    console.log('📋 Contexto final:', fullContext);

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      console.log('🤖 Llamando a OpenAI Service...');
      const result = await openAIService.generateDocument(requestData);
      console.log('✅ Documento generado exitosamente:', {
        titulo: result.titulo,
        tipo: result.tipo,
        htmlLength: result.html.length,
        htmlPreview: result.html.substring(0, 200) + '...'
      });
      
      setGeneratedDocument(result);
      setSuccess('¡Documento generado exitosamente!');
    } catch (err: any) {
      console.error('❌ Error generando documento:', err);
      setError(err.message || 'Error generando el documento');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToCodex = async () => {
    if (!generatedDocument || !user) {
      setError('No hay documento generado o usuario no autenticado');
      return;
    }

    console.log('💾 Iniciando guardado en Codex...');
    console.log('👤 Usuario:', user.id);
    console.log('📄 Documento:', generatedDocument.titulo);

    setSaving(true);
    setError('');

    try {
      // Crear un blob con el HTML
      const htmlBlob = new Blob([generatedDocument.html], { type: 'text/html' });
      const fileName = `${generatedDocument.titulo.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.html`;
      
      console.log('📁 Nombre del archivo:', fileName);
      console.log('📊 Tamaño del blob:', htmlBlob.size);
      
      // Subir a Supabase Storage
      const filePath = `${user.id}/documentos/${fileName}`;
      console.log('🗂️ Ruta del archivo:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('digitalstorage')
        .upload(filePath, htmlBlob);

      if (uploadError) {
        console.error('❌ Error subiendo archivo:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Archivo subido exitosamente:', uploadData);

      // Obtener URL firmada
      const { data: urlData } = await supabase.storage
        .from('digitalstorage')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 días

      console.log('🔗 URL firmada generada:', urlData?.signedUrl ? 'Sí' : 'No');

      // Preparar datos para el Codex
      const codexItem = {
        user_id: user.id,
        titulo: generatedDocument.titulo,
        tipo: 'documento',
        fecha: new Date().toISOString().slice(0, 10),
        etiquetas: ['Material Creado', 'Documento Generado', generatedDocument.tipo],
        estado: 'Nuevo',
        proyecto: 'PulseJornal - Documentos',
        storagePath: filePath,
        url: urlData?.signedUrl || '',
        isSupabase: true,
        descripcion: `Documento creado: ${formData.necesidad}`,
        nombreArchivo: fileName,
        tamano: htmlBlob.size
      };

      console.log('📋 Datos del item del Codex:', codexItem);

      // Guardar en el Codex
      await saveCodexItem(codexItem);
      
      console.log('✅ Item guardado en codex_items exitosamente');
      
      setSuccess('¡Documento guardado en el Codex exitosamente!');
      setGeneratedDocument(null);
      setFormData({ titulo: '', necesidad: '', contexto: '' });
      setContextSource('none');
      setSelectedContextItems([]);
      
      if (onDocumentGenerated) {
        onDocumentGenerated(codexItem);
      }
      
    } catch (err: any) {
      console.error('❌ Error completo en handleSaveToCodex:', err);
      setError(err.message || 'Error guardando el documento');
    } finally {
      setSaving(false);
    }
  };

  // Función para cargar contexto desde diferentes fuentes
  const loadContextFromSource = async (source: string) => {
    if (source === 'none' || !user) return;
    
    setLoadingContext(true);
    try {
      switch (source) {
        case 'library':
          const libraryItems = await getCodexItemsByUser(user.id);
          setAvailableContext(prev => ({
            ...prev,
            library: libraryItems.slice(0, 10) // Limitar a 10 items más recientes
          }));
          break;
          
        case 'recentTweets':
          // Obtener tweets recientes del usuario
          const { data: profileData } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .single();
            
          if (profileData?.phone) {
            const { data: recentScrapes } = await supabase
              .from('scrapes')
              .select('*')
              .eq('wa_number', profileData.phone)
              .eq('type', 'Hashtag')
              .order('created_at', { ascending: false })
              .limit(5);
            
            setAvailableContext(prev => ({
              ...prev,
              recentTweets: recentScrapes || []
            }));
          }
          break;
          
        case 'trends':
          // Obtener tendencias desde Supabase con información completa
          try {
            const { data: trendsData, error: trendsError } = await supabase
              .from('trends')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(1);
            
            if (trendsError) {
              console.error('Error obteniendo tendencias:', trendsError);
              setAvailableContext(prev => ({
                ...prev,
                trends: []
              }));
            } else if (trendsData && trendsData.length > 0) {
              // Usar los top_keywords de la tendencia más reciente, pero conservar info completa
              const latestTrend = trendsData[0];
              const keywords = latestTrend.top_keywords || [];
              const aboutInfo = latestTrend.about || [];
              const categoryData = latestTrend.category_data || [];
              
              // Combinar keywords con información de about si está disponible
              const enrichedTrends = keywords.slice(0, 10).map((keyword: any, index: number) => {
                // Buscar información de about para esta keyword
                const aboutMatch = aboutInfo.find((about: any) => 
                  about.nombre && about.nombre.toLowerCase().includes(keyword.keyword.toLowerCase())
                );
                
                // Buscar categoría si está disponible
                const categoryMatch = categoryData.find((cat: any) => 
                  cat.category && keyword.keyword.toLowerCase().includes(cat.category.toLowerCase())
                );
                
                return {
                  ...keyword,
                  id: keyword.keyword + '_' + index,
                  about: aboutMatch || null,
                  category: aboutMatch?.categoria || categoryMatch?.category || null
                };
              });
              
              setAvailableContext(prev => ({
                ...prev,
                trends: enrichedTrends
              }));
            } else {
              setAvailableContext(prev => ({
                ...prev,
                trends: []
              }));
            }
          } catch (error) {
            console.error('Error cargando tendencias desde Supabase:', error);
            setAvailableContext(prev => ({
              ...prev,
              trends: []
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error cargando contexto:', error);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleContextSourceChange = (event: SelectChangeEvent<string>) => {
    const source = event.target.value;
    setContextSource(source);
    setSelectedContextItems([]);
    if (source !== 'none') {
      loadContextFromSource(source);
    }
  };

  const handleContextItemToggle = (itemId: string) => {
    setSelectedContextItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const buildContextFromSelection = () => {
    let contextText = '';
    
    if (contextSource === 'library' && selectedContextItems.length > 0) {
      const selectedItems = availableContext.library.filter((item: any) => 
        selectedContextItems.includes(item.id)
      );
      contextText += 'Documentos de referencia:\n';
      selectedItems.forEach((item: any) => {
        contextText += `- ${item.titulo}: ${item.descripcion}\n`;
      });
    }
    
    if (contextSource === 'recentTweets' && selectedContextItems.length > 0) {
      const selectedTweets = availableContext.recentTweets.filter((item: any) => 
        selectedContextItems.includes(item.id)
      );
      contextText += 'Análisis de tweets recientes:\n';
      selectedTweets.forEach((item: any) => {
        try {
          const tweetData = JSON.parse(item.value);
          if (tweetData.meta && tweetData.meta.hashtag) {
            contextText += `- #${tweetData.meta.hashtag}: ${tweetData.meta.count || 0} tweets analizados\n`;
          }
        } catch (e) {
          contextText += `- Análisis de ${item.created_at}\n`;
        }
      });
    }
    
    if (contextSource === 'trends' && selectedContextItems.length > 0) {
      const selectedTrends = availableContext.trends.filter((item: any) => 
        selectedContextItems.includes(item.keyword || item.id || item.name)
      );
      contextText += 'Tendencias actuales:\n';
      selectedTrends.forEach((item: any) => {
        const keyword = item.keyword || item.name;
        const count = item.count || item.volume || 'tendencia actual';
        
        // Información básica
        contextText += `- ${keyword}: ${count} menciones\n`;
        
        // Agregar información de categoría si está disponible
        if (item.category) {
          contextText += `  • Categoría: ${item.category}\n`;
        }
        
        // Agregar información detallada de about si está disponible
        if (item.about) {
          if (item.about.resumen) {
            contextText += `  • Contexto: ${item.about.resumen}\n`;
          }
          if (item.about.relevancia) {
            contextText += `  • Relevancia: ${item.about.relevancia}\n`;
          }
          if (item.about.razon_tendencia) {
            contextText += `  • Razón de tendencia: ${item.about.razon_tendencia}\n`;
          }
          if (item.about.contexto_local !== undefined) {
            contextText += `  • Contexto local: ${item.about.contexto_local ? 'Sí' : 'Global'}\n`;
          }
          if (item.about.palabras_clave && Array.isArray(item.about.palabras_clave)) {
            contextText += `  • Palabras clave relacionadas: ${item.about.palabras_clave.join(', ')}\n`;
          }
        }
        
        contextText += '\n'; // Espacio entre tendencias
      });
    }
    
    return contextText;
  };

  // Función para construir el prompt completo (igual que en OpenAI service)
  const buildFullPrompt = () => {
    const selectedContext = buildContextFromSelection();
    const fullContext = selectedContext + (selectedContext && formData.contexto ? '\n\n' : '') + formData.contexto;
    
    return `
Necesito que crees un documento profesional con las siguientes especificaciones:

**Título del documento:** ${formData.titulo}

**Qué necesito redactar:** ${formData.necesidad}

**Contexto adicional:** ${fullContext}

Por favor, genera un documento HTML completo y profesional que cumpla con estos requerimientos. El documento debe ser adecuado para uso profesional en periodismo y comunicación política.

Incluye estilos CSS inline para que el documento se vea profesional y esté listo para imprimir o convertir a otros formatos.
`;
  };

  // Prompt del sistema completo
  const getSystemPrompt = () => {
    return `Eres un asistente especializado en crear documentos profesionales para periodistas, analistas políticos y comunicadores. 

Tu tarea es generar HTML bien estructurado y profesional basado en las necesidades del usuario. El HTML debe:

1. Ser completo y bien formateado
2. Incluir estilos CSS inline para que se vea profesional
3. Ser adecuado para convertir a DOCX
4. Incluir elementos como títulos, subtítulos, párrafos, listas, tablas según sea necesario
5. Tener un diseño limpio y profesional

Tipos de documentos que puedes crear:
- Análisis políticos
- Reportes de eventos
- Tablas de análisis de tweets/redes sociales
- Comunicados de prensa
- Cartas oficiales
- Documentos para creadores de contenido
- Plantillas para eventos

Responde SOLO con el HTML generado, sin explicaciones adicionales.`;
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 4, border: '2px solid', borderColor: 'primary.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DocumentIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" fontWeight="bold">
            Creación de Documento
          </Typography>
          
        </Box>

        {/* Tipo de documento */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Tipo de documento</InputLabel>
          <Select
            value={documentType}
            label="Tipo de documento"
            onChange={handleTemplateChange}
          >
            {Object.entries(documentTemplates).map(([key, template]) => (
              <MenuItem key={key} value={key}>
                {template.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack spacing={2}>
          <TextField
            label="Título del documento"
            fullWidth
            size="small"
            value={formData.titulo}
            onChange={handleInputChange('titulo')}
            placeholder="Ej: Análisis Electoral Guatemala 2025"
          />

          <TextField
            label="¿Qué necesitas redactar?"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={formData.necesidad}
            onChange={handleInputChange('necesidad')}
            placeholder="Describe específicamente qué tipo de documento necesitas..."
          />

          {/* Sección de Contexto */}
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Contexto de referencia
            </Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Fuente de contexto</InputLabel>
              <Select
                value={contextSource}
                label="Fuente de contexto"
                onChange={handleContextSourceChange}
              >
                <MenuItem value="none">Sin contexto adicional</MenuItem>
                <MenuItem value="trends">Tendencias actuales</MenuItem>
                <MenuItem value="recentTweets">Análisis de tweets recientes</MenuItem>
                <MenuItem value="library">Mi librería (Codex)</MenuItem>
              </Select>
            </FormControl>

            {loadingContext && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Cargando contexto...
                </Typography>
              </Box>
            )}

            {contextSource !== 'none' && !loadingContext && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Selecciona elementos para incluir como contexto:
                </Typography>
                
                {contextSource === 'library' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableContext.library.map((item: any) => (
                      <Chip
                        key={item.id}
                        label={item.titulo}
                        variant={selectedContextItems.includes(item.id) ? "filled" : "outlined"}
                        color={selectedContextItems.includes(item.id) ? "primary" : "default"}
                        size="small"
                        onClick={() => handleContextItemToggle(item.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                )}

                {contextSource === 'recentTweets' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableContext.recentTweets.map((item: any) => {
                      let displayName = 'Tweet análisis';
                      try {
                        const tweetData = JSON.parse(item.value);
                        if (tweetData.meta && tweetData.meta.hashtag) {
                          displayName = `#${tweetData.meta.hashtag}`;
                        }
                      } catch (e) {
                        displayName = new Date(item.created_at).toLocaleDateString();
                      }
                      
                      return (
                        <Chip
                          key={item.id}
                          label={displayName}
                          variant={selectedContextItems.includes(item.id) ? "filled" : "outlined"}
                          color={selectedContextItems.includes(item.id) ? "primary" : "default"}
                          size="small"
                          onClick={() => handleContextItemToggle(item.id)}
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </Box>
                )}

                {contextSource === 'trends' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableContext.trends.map((item: any, index: number) => {
                      const chipId = item.keyword || index.toString();
                      const isSelected = selectedContextItems.includes(chipId);
                      const keyword = item.keyword || `Tendencia ${index + 1}`;
                      const count = item.count || 0;
                      
                      return (
                        <Chip
                          key={chipId}
                          label={`${keyword} (${count})`}
                          variant={isSelected ? "filled" : "outlined"}
                          color={isSelected ? "primary" : "default"}
                          size="small"
                          onClick={() => handleContextItemToggle(chipId)}
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </Box>
                )}

                {selectedContextItems.length > 0 && (
                  <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
                    {selectedContextItems.length} elemento(s) seleccionado(s)
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <TextField
            label="Contexto adicional"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={formData.contexto}
            onChange={handleInputChange('contexto')}
            placeholder="Información adicional, fuentes, datos específicos..."
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowPromptPreview(true)}
              disabled={!formData.titulo.trim() || !formData.necesidad.trim()}
              startIcon={<PreviewIcon />}
              sx={{ minWidth: 140 }}
            >
              Preview Prompt
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : <AIIcon />}
              sx={{ flex: 1 }}
            >
              {generating ? 'Generando...' : 'Generar Documento'}
            </Button>

            {generatedDocument && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSaveToCodex}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Guardando...' : 'Guardar en Codex'}
              </Button>
            )}
          </Box>

          {/* Dialog para Preview del Prompt */}
          <Dialog 
            open={showPromptPreview} 
            onClose={() => setShowPromptPreview(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PreviewIcon color="primary" />
                <Typography variant="h6">Preview del Prompt</Typography>
                
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Tabs 
                value={promptPreviewTab} 
                onChange={(e, newValue) => setPromptPreviewTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}
              >
                <Tab 
                  icon={<DocumentIcon />} 
                  label="Prompt Usuario" 
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  icon={<CodeIcon />} 
                  label="Contexto Sistema" 
                  sx={{ minHeight: 48 }}
                />
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                {promptPreviewTab === 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📝 Prompt que se enviará a IA:
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'grey.50', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}>
                      {buildFullPrompt()}
                    </Box>

                    {/* Estadísticas del prompt */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${buildFullPrompt().length} caracteres`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`~${Math.ceil(buildFullPrompt().length / 4)} tokens aprox.`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                      <Chip 
                        label={selectedContextItems.length > 0 ? `${selectedContextItems.length} contextos incluidos` : 'Sin contexto adicional'} 
                        size="small" 
                        variant="outlined" 
                        color={selectedContextItems.length > 0 ? "secondary" : "default"}
                      />
                    </Box>
                  </Box>
                )}

                {promptPreviewTab === 1 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      🤖 Instrucciones del Sistema para IA:
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'grey.100', 
                      p: 2, 
                      borderRadius: 1, 
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}>
                      {getSystemPrompt()}
                    </Box>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="caption" color="warning.dark">
                        ⚙️ <strong>Contexto del Sistema:</strong> Estas instrucciones definen el comportamiento del AI. 
                        Le indican que debe crear documentos HTML profesionales para periodismo y comunicación política.
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="info.dark">
                    💡 <strong>Información:</strong> Este preview te permite revisar exactamente qué información 
                    se enviará a IA antes de generar el documento. Asegúrate de que toda la información 
                    necesaria esté incluida.
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setShowPromptPreview(false)}>
                Cerrar Preview
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setShowPromptPreview(false);
                  handleGenerate();
                }}
                startIcon={<AIIcon />}
                disabled={!formData.titulo.trim() || !formData.necesidad.trim()}
              >
                Proceder a Generar
              </Button>
            </DialogActions>
          </Dialog>

          {generatedDocument && (
            <Accordion sx={{ mt: 2 }} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Documento Generado: {generatedDocument.titulo}
                  </Typography>
                  <Chip 
                    label={generatedDocument.tipo} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%' }}>
                  <Tabs 
                    value={previewTab} 
                    onChange={(e, newValue) => setPreviewTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Tab 
                      icon={<VisibilityIcon />} 
                      label="Vista Previa" 
                      sx={{ minHeight: 48 }}
                    />
                    <Tab 
                      icon={<CodeIcon />} 
                      label="Código HTML" 
                      sx={{ minHeight: 48 }}
                    />
                  </Tabs>
                  
                  {/* Vista Previa Renderizada */}
                  {previewTab === 0 && (
                    <Box 
                      sx={{ 
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: 'white',
                        maxHeight: 400,
                        overflow: 'auto',
                        '& h1, & h2, & h3': { color: 'text.primary' },
                        '& p': { color: 'text.secondary', lineHeight: 1.6 },
                        '& table': { width: '100%', borderCollapse: 'collapse' },
                        '& td, & th': { border: '1px solid #ddd', padding: '8px' }
                      }}
                      dangerouslySetInnerHTML={{ __html: generatedDocument.html }}
                    />
                  )}
                  
                  {/* Código HTML */}
                  {previewTab === 1 && (
                    <Box 
                      sx={{ 
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        maxHeight: 400,
                        overflow: 'auto'
                      }}
                    >
                      <pre 
                        style={{ 
                          margin: 0,
                          padding: '16px',
                          fontSize: '12px',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {generatedDocument.html}
                      </pre>
                    </Box>
                  )}
                  
                  {/* Información adicional */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      📄 <strong>Tamaño:</strong> {generatedDocument.html.length} caracteres | 
                      🏷️ <strong>Tipo:</strong> {generatedDocument.tipo} | 
                      📅 <strong>Generado:</strong> {new Date().toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DocumentGeneratorCard; 