"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  LocationOn,
  Assessment,
  Search as SearchIcon
} from '@mui/icons-material';
import { getLatestNews, getCodexItemsByUser, getSondeosByUser } from '../services/supabase';
import { sendSondeoToExtractorW, getLatestTrends } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NewsItem } from '../types';
import type { TrendResponse } from '../services/api';
import SondeosMap, { Sondeo } from '../components/SondeosMap';
import BarChartVisual from '../components/ui/BarChartVisual';
import LineChartVisual from '../components/ui/LineChartVisual';
import AreaChartVisual from '../components/ui/AreaChartVisual';
import PieChartVisual from '../components/ui/PieChartVisual';

// Utilidad mejorada para buscar relevancia por palabras clave del input
function filtrarPorRelevancia(texto: string, input: string) {
  if (!texto || !input) return false;
  // Extraer palabras del input (ignorando signos y mayúsculas, y palabras cortas)
  const palabrasInput = input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .split(/\W+/)
    .filter(p => p.length >= 3); // Solo palabras de 3+ letras
  if (palabrasInput.length === 0) return false;
  const textoLower = texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  // Coincidencia: al menos una palabra del input está en el texto
  return palabrasInput.some(palabra => textoLower.includes(palabra));
}

function resumirTexto(texto: string, maxLen = 220) {
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

const Sondeos: React.FC = () => {
  const { user, session } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [codex, setCodex] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // loading de datos iniciales
  const [loadingSondeo, setLoadingSondeo] = useState(false); // loading solo para el botón Sondear
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [contexto, setContexto] = useState<any>(null);
  const [showContext, setShowContext] = useState(false);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmSources, setLlmSources] = useState<any>(null);
  const [sondeos, setSondeos] = useState<Sondeo[]>([]);
  const [loadingSondeos, setLoadingSondeos] = useState(false);
  
  // Nuevo estado para el tipo de contexto seleccionado
  const [tipoContexto, setTipoContexto] = useState<string>('tendencias');
  
  // Nuevo estado para datos de visualización
  const [datosAnalisis, setDatosAnalisis] = useState<any>(null);

  // Opciones para el dropdown de contexto
  const opcionesContexto = [
    { value: 'tendencias', label: 'Tendencias actuales' },
    { value: 'noticias', label: 'Noticias recientes' },
    { value: 'codex', label: 'Documentos del Codex' },
  ];

  const questions = [
    {
      id: 1,
      title: '¿Qué temas preocupan más a las personas hoy?',
      icon: <TrendingUp />,
      description: 'Análisis de tendencias emergentes y preocupaciones ciudadanas',
      color: 'primary'
    },
    {
      id: 2,
      title: '¿Hay coherencia entre lo que se cubre y lo que se opina?',
      icon: <Assessment />,
      description: 'Comparación entre cobertura mediática y opinión pública',
      color: 'secondary'
    },
    {
      id: 3,
      title: '¿Dónde se están generando los focos de atención?',
      icon: <LocationOn />,
      description: 'Mapeo geográfico de tendencias y puntos de interés',
      color: 'success'
    },
    {
      id: 4,
      title: '¿Qué tan alineadas están las tendencias mediáticas con la agenda ciudadana?',
      icon: <BarChart />,
      description: 'Medición de sincronía entre medios y ciudadanía',
      color: 'warning'
    }
  ];

  // Obtener preguntas específicas según el tipo de contexto
  const getQuestionsByContext = () => {
    if (tipoContexto === 'tendencias') {
      return [
        {
          id: 1,
          title: '¿Qué temas son tendencia en relación a mi búsqueda?',
          icon: <TrendingUp />,
          description: 'Análisis de tendencias relevantes al tema consultado',
          color: 'primary',
          dataKey: 'temas_relevantes'
        },
        {
          id: 2,
          title: '¿Cómo se distribuyen las categorías en este tema?',
          icon: <Assessment />,
          description: 'Distribución por categorías para el tema consultado',
          color: 'secondary',
          dataKey: 'distribucion_categorias'
        },
        {
          id: 3,
          title: '¿Dónde se mencionan más estos temas?',
          icon: <LocationOn />,
          description: 'Análisis geográfico de menciones sobre el tema',
          color: 'success',
          dataKey: 'mapa_menciones'
        },
        {
          id: 4,
          title: '¿Qué subtemas están relacionados con mi búsqueda?',
          icon: <BarChart />,
          description: 'Relaciones entre el tema principal y subtemas',
          color: 'warning',
          dataKey: 'subtemas_relacionados'
        }
      ];
    } else if (tipoContexto === 'noticias') {
      return [
        {
          id: 1,
          title: '¿Qué noticias son más relevantes para mi tema?',
          icon: <TrendingUp />,
          description: 'Análisis de relevancia de noticias para el tema consultado',
          color: 'primary',
          dataKey: 'noticias_relevantes'
        },
        {
          id: 2,
          title: '¿Qué fuentes cubren más mi tema?',
          icon: <Assessment />,
          description: 'Análisis de fuentes que cubren el tema consultado',
          color: 'secondary',
          dataKey: 'fuentes_cobertura'
        },
        {
          id: 3,
          title: '¿Cómo ha evolucionado la cobertura de este tema?',
          icon: <LocationOn />,
          description: 'Evolución temporal de la cobertura del tema',
          color: 'success',
          dataKey: 'evolucion_cobertura'
        },
        {
          id: 4,
          title: '¿Qué aspectos del tema reciben más atención?',
          icon: <BarChart />,
          description: 'Análisis de los aspectos más cubiertos del tema',
          color: 'warning',
          dataKey: 'aspectos_cubiertos'
        }
      ];
    } else if (tipoContexto === 'codex') {
      return [
        {
          id: 1,
          title: '¿Qué documentos son más relevantes para mi tema?',
          icon: <TrendingUp />,
          description: 'Análisis de relevancia de documentos para el tema consultado',
          color: 'primary',
          dataKey: 'documentos_relevantes'
        },
        {
          id: 2,
          title: '¿Qué conceptos se relacionan más con mi tema?',
          icon: <Assessment />,
          description: 'Análisis de conceptos relacionados con el tema',
          color: 'secondary',
          dataKey: 'conceptos_relacionados'
        },
        {
          id: 3,
          title: '¿Cómo ha evolucionado el análisis de este tema?',
          icon: <LocationOn />,
          description: 'Evolución temporal del análisis del tema',
          color: 'success',
          dataKey: 'evolucion_analisis'
        },
        {
          id: 4,
          title: '¿Qué aspectos del tema se analizan más a fondo?',
          icon: <BarChart />,
          description: 'Análisis de los aspectos más documentados del tema',
          color: 'warning',
          dataKey: 'aspectos_documentados'
        }
      ];
    }
    
    // Retornar las preguntas por defecto si no hay coincidencia
    return questions;
  };
  
  // Obtener las preguntas dinámicas según el contexto
  const currentQuestions = getQuestionsByContext();
  
  // Función auxiliar para renderizar visualizaciones según la pregunta
  const renderVisualization = (question: any) => {
    if (!datosAnalisis || !question.dataKey || !datosAnalisis[question.dataKey]) {
      return (
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles para esta visualización
        </Typography>
      );
    }

    const data = datosAnalisis[question.dataKey];
    
    // Visualizaciones específicas según el tipo de contexto y pregunta
    if (tipoContexto === 'tendencias') {
      switch (question.id) {
        case 1: // Temas relevantes
          return (
            <BarChartVisual 
              data={data} 
              xAxisKey="tema" 
              barKey="valor" 
              height={180} 
            />
          );
          
        case 2: // Distribución por categorías
          return (
            <PieChartVisual
              data={data}
              nameKey="categoria"
              valueKey="valor"
              height={180}
            />
          );
          
        case 3: // Mapa de menciones
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="region"
              barKey="valor"
              height={180}
            />
          );
          
        case 4: // Subtemas relacionados
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="subtema"
              barKey="relacion"
              height={180}
            />
          );
      }
    } else if (tipoContexto === 'noticias') {
      switch (question.id) {
        case 1: // Noticias más relevantes
          return (
            <BarChartVisual 
              data={data} 
              xAxisKey="titulo" 
              barKey="relevancia" 
              height={180} 
            />
          );
          
        case 2: // Fuentes que cubren más
          return (
            <PieChartVisual
              data={data}
              nameKey="fuente"
              valueKey="cobertura"
              height={180}
            />
          );
          
        case 3: // Evolución de cobertura
          return (
            <LineChartVisual 
              data={data}
              xAxisKey="fecha"
              lineKey="valor"
              height={180}
            />
          );
          
        case 4: // Aspectos cubiertos
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="aspecto"
              barKey="cobertura"
              height={180}
            />
          );
      }
    } else if (tipoContexto === 'codex') {
      switch (question.id) {
        case 1: // Documentos más relevantes
          return (
            <BarChartVisual 
              data={data} 
              xAxisKey="titulo" 
              barKey="relevancia" 
              height={180} 
            />
          );
          
        case 2: // Conceptos relacionados
          return (
            <PieChartVisual
              data={data}
              nameKey="concepto"
              valueKey="relacion"
              height={180}
            />
          );
          
        case 3: // Evolución de análisis
          return (
            <AreaChartVisual 
              data={data}
              xAxisKey="fecha"
              areaKey="valor"
              height={180}
            />
          );
          
        case 4: // Aspectos documentados
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="aspecto"
              barKey="profundidad"
              height={180}
            />
          );
      }
    }
    
    // Si no hay una visualización específica, mostrar los datos en JSON
    return (
      <pre style={{ fontSize: 12, maxHeight: 120, overflow: 'auto', margin: 0 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    Promise.all([
      getLatestNews(),
      getCodexItemsByUser(user.id)
    ]).then(([newsData, codexData]) => {
      setNews(newsData);
      setCodex(codexData);
    }).catch(e => {
      setError('Error al obtener contexto: ' + (e.message || e));
    }).finally(() => setLoading(false));
  }, [user]);

  // Función para sondear tema según el tipo de contexto seleccionado
  const sondearTema = async () => {
    setLlmResponse(null);
    setLlmSources(null);
    setDatosAnalisis(null);
    setShowContext(true);
    setLoadingSondeo(true);
    setError('');
    
    try {
      let contextoArmado: any = { 
        input,
        tipo_contexto: tipoContexto 
      };
      
      // Obtener datos según el tipo de contexto seleccionado
      if (tipoContexto === 'tendencias') {
        // Obtener tendencias actuales
        const tendenciasData = await getLatestTrends();
        if (tendenciasData) {
          contextoArmado = {
            ...contextoArmado,
            tipo: 'tendencias',
            tema_consulta: input,
            tendencias: tendenciasData.topKeywords?.map(k => k.keyword) || [],
            wordcloud: tendenciasData.wordCloudData || [],
            categorias: tendenciasData.categoryData || [],
            about: tendenciasData.about || [],
            timestamp: tendenciasData.timestamp
          };
        } else {
          throw new Error('No se pudieron obtener las tendencias actuales');
        }
      } else if (tipoContexto === 'noticias') {
        // Filtrar noticias relevantes
        const noticiasRelevantes = news.filter(n =>
          filtrarPorRelevancia(n.title, input) ||
          filtrarPorRelevancia(n.excerpt, input) ||
          (n.keywords || []).some(k => filtrarPorRelevancia(k, input))
        ).slice(0, 3);
        
        contextoArmado = {
          ...contextoArmado,
          tipo: 'noticias',
          tema_consulta: input,
          noticias: noticiasRelevantes.map(n => ({
            titulo: n.title,
            resumen: resumirTexto(n.excerpt),
            fuente: n.source,
            fecha: n.date,
            url: n.url,
            categoria: n.category,
            keywords: n.keywords
          }))
        };
      } else if (tipoContexto === 'codex') {
        // Filtrar documentos relevantes
        const codexRelevantes = codex.filter((d: any) =>
          filtrarPorRelevancia(d.titulo, input) ||
          filtrarPorRelevancia(d.descripcion, input) ||
          ((d.etiquetas || []).some((k: string) => filtrarPorRelevancia(k, input)))
        ).slice(0, 3);
        
        contextoArmado = {
          ...contextoArmado,
          tipo: 'codex',
          tema_consulta: input,
          codex: codexRelevantes.map((d: any) => ({
            titulo: d.titulo,
            descripcion: resumirTexto(d.descripcion),
            tipo: d.tipo,
            fecha: d.fecha,
            etiquetas: d.etiquetas,
            url: d.url
          }))
        };
      }
      
      setContexto(contextoArmado);
      
      // --- Llamada a ExtractorW/Perplexity ---
      try {
        console.log('Enviando contexto para sondeo:', contextoArmado);
        const result = await sendSondeoToExtractorW(contextoArmado, input, session?.access_token);
        console.log('Respuesta del sondeo:', result);
        
        // Manejar respuesta de texto
        let respuesta = '';
        if (result.about && Array.isArray(result.about) && result.about.length > 0) {
          respuesta = result.about[0].resumen || result.about[0].summary || JSON.stringify(result.about[0]);
        } else if (result.llm_response) {
          respuesta = result.llm_response;
        } else {
          respuesta = 'No se obtuvo respuesta del LLM.';
        }
        setLlmResponse(respuesta);
        
        // Manejar datos para visualizaciones
        if (result.datos_analisis) {
          console.log('Datos para visualizaciones recibidos:', result.datos_analisis);
          setDatosAnalisis(result.datos_analisis);
        } else {
          // Si no hay datos de análisis específicos, generar datos de muestra para testing
          console.log('Generando datos de prueba para visualizaciones');
          const datosPrueba = generarDatosPrueba(tipoContexto, input);
          setDatosAnalisis(datosPrueba);
        }
        
        setLlmSources(result);
      } catch (e: any) {
        setError('Error al consultar análisis: ' + (e.message || e));
      }
    } catch (e: any) {
      setError('Error al armar contexto: ' + (e.message || e));
    } finally {
      setLoadingSondeo(false);
    }
  };
  
  // Función para generar datos de prueba para visualizaciones
  // Esto es temporal hasta que el backend implemente la respuesta estructurada
  const generarDatosPrueba = (tipo: string, consulta: string) => {
    if (tipo === 'tendencias') {
      return {
        temas_relevantes: [
          { tema: `${consulta} en política`, valor: 75 },
          { tema: `${consulta} en economía`, valor: 62 },
          { tema: `${consulta} internacional`, valor: 48 },
          { tema: `${consulta} y tecnología`, valor: 35 },
          { tema: `${consulta} en deportes`, valor: 28 }
        ],
        distribucion_categorias: [
          { categoria: 'Política', valor: 32 },
          { categoria: 'Economía', valor: 28 },
          { categoria: 'Internacional', valor: 20 },
          { categoria: 'Tecnología', valor: 15 },
          { categoria: 'Deportes', valor: 5 }
        ],
        mapa_menciones: [
          { region: 'Ciudad Capital', valor: 45 },
          { region: 'Occidente', valor: 25 },
          { region: 'Oriente', valor: 15 },
          { region: 'Sur', valor: 10 },
          { region: 'Norte', valor: 5 }
        ],
        subtemas_relacionados: [
          { subtema: 'Subtema 1', relacion: 85 },
          { subtema: 'Subtema 2', relacion: 65 },
          { subtema: 'Subtema 3', relacion: 55 },
          { subtema: 'Subtema 4', relacion: 35 },
          { subtema: 'Subtema 5', relacion: 25 }
        ]
      };
    } else if (tipo === 'noticias') {
      return {
        noticias_relevantes: [
          { titulo: `Noticia 1 sobre ${consulta}`, relevancia: 95 },
          { titulo: `Noticia 2 sobre ${consulta}`, relevancia: 85 },
          { titulo: `Noticia 3 sobre ${consulta}`, relevancia: 75 },
          { titulo: `Noticia 4 sobre ${consulta}`, relevancia: 65 },
          { titulo: `Noticia 5 sobre ${consulta}`, relevancia: 55 }
        ],
        fuentes_cobertura: [
          { fuente: 'Fuente 1', cobertura: 45 },
          { fuente: 'Fuente 2', cobertura: 35 },
          { fuente: 'Fuente 3', cobertura: 30 },
          { fuente: 'Fuente 4', cobertura: 25 },
          { fuente: 'Fuente 5', cobertura: 15 }
        ],
        evolucion_cobertura: [
          { fecha: '2023-01', valor: 10 },
          { fecha: '2023-02', valor: 15 },
          { fecha: '2023-03', valor: 25 },
          { fecha: '2023-04', valor: 35 },
          { fecha: '2023-05', valor: 45 }
        ],
        aspectos_cubiertos: [
          { aspecto: 'Aspecto 1', cobertura: 55 },
          { aspecto: 'Aspecto 2', cobertura: 45 },
          { aspecto: 'Aspecto 3', cobertura: 35 },
          { aspecto: 'Aspecto 4', cobertura: 25 },
          { aspecto: 'Aspecto 5', cobertura: 15 }
        ]
      };
    } else if (tipo === 'codex') {
      return {
        documentos_relevantes: [
          { titulo: `Documento 1 sobre ${consulta}`, relevancia: 95 },
          { titulo: `Documento 2 sobre ${consulta}`, relevancia: 85 },
          { titulo: `Documento 3 sobre ${consulta}`, relevancia: 75 },
          { titulo: `Documento 4 sobre ${consulta}`, relevancia: 65 },
          { titulo: `Documento 5 sobre ${consulta}`, relevancia: 55 }
        ],
        conceptos_relacionados: [
          { concepto: 'Concepto 1', relacion: 85 },
          { concepto: 'Concepto 2', relacion: 75 },
          { concepto: 'Concepto 3', relacion: 65 },
          { concepto: 'Concepto 4', relacion: 55 },
          { concepto: 'Concepto 5', relacion: 45 }
        ],
        evolucion_analisis: [
          { fecha: '2023-01', valor: 15 },
          { fecha: '2023-02', valor: 25 },
          { fecha: '2023-03', valor: 35 },
          { fecha: '2023-04', valor: 45 },
          { fecha: '2023-05', valor: 55 }
        ],
        aspectos_documentados: [
          { aspecto: 'Aspecto 1', profundidad: 85 },
          { aspecto: 'Aspecto 2', profundidad: 75 },
          { aspecto: 'Aspecto 3', profundidad: 65 },
          { aspecto: 'Aspecto 4', profundidad: 55 },
          { aspecto: 'Aspecto 5', profundidad: 45 }
        ]
      };
    }
    
    // Datos genéricos por defecto
    return {
      datos_genericos: [
        { etiqueta: 'Categoría 1', valor: 85 },
        { etiqueta: 'Categoría 2', valor: 65 },
        { etiqueta: 'Categoría 3', valor: 45 },
        { etiqueta: 'Categoría 4', valor: 25 },
        { etiqueta: 'Categoría 5', valor: 15 }
      ]
    };
  };

  // Cargar sondeos para el mapa
  useEffect(() => {
    if (!user) return;
    setLoadingSondeos(true);
    getSondeosByUser(user.id)
      .then((data) => {
        // Mapear los datos de Supabase al tipo Sondeo
        const mapped = (data || []).map((s: any) => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          zona: s.zona || undefined,
          lugar: s.lugar || undefined,
          municipio: s.municipio || undefined,
          departamento: s.departamento || undefined,
          pregunta: s.pregunta,
          created_at: s.created_at
        }));
        setSondeos(mapped);
      })
      .catch(() => setSondeos([]))
      .finally(() => setLoadingSondeos(false));
  }, [user]);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary">
          Sondeos
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Unificando señales dispersas para entender el pulso social
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="tipo-contexto-label">Tipo de contexto</InputLabel>
            <Select
              labelId="tipo-contexto-label"
              id="tipo-contexto-select"
              value={tipoContexto}
              label="Tipo de contexto"
              onChange={(e) => setTipoContexto(e.target.value)}
              size="small"
            >
              {opcionesContexto.map((opcion) => (
                <MenuItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            type="text"
            placeholder="Tema o pregunta a sondear..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, fontSize: '1.1rem', padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'semibold', borderRadius: 2, textTransform: 'none', boxShadow: 3, '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}
            disabled={loading || !input}
            onClick={sondearTema}
          >
            🧠 Sondear
          </Button>
        </Box>
        {loading && <Typography color="primary">Cargando contexto inicial...</Typography>}
        {loadingSondeo && <Typography color="primary">Cargando contexto y respuesta de IA...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {llmResponse && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Respuesta de la IA:</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>{llmResponse}</Typography>
            <Button size="small" onClick={() => setShowContext(v => !v)} sx={{ mt: 1 }}>
              {showContext ? 'Ocultar contexto' : 'Ver contexto enviado'}
            </Button>
            {showContext && contexto && (
              <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f7fafc', padding: 12, borderRadius: 8, maxHeight: 350, overflow: 'auto' }}>{JSON.stringify(contexto, null, 2)}</pre>
            )}
            {llmSources && (
              <Button size="small" onClick={() => setLlmSources(null)} sx={{ mt: 1, ml: 2 }} disabled>
                Fuentes usadas (ver JSON)
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Objective Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="semibold" color="primary">
          🎯 Objetivo del Módulo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Unificar señales dispersas (contenido, conversación, cobertura y territorio) para generar 
          insights estratégicos sobre la opinión pública y las tendencias mediáticas.
        </Typography>
      </Paper>

      {/* Questions Grid */}
      <Typography variant="h5" gutterBottom fontWeight="semibold" sx={{ mb: 3 }}>
        Preguntas Clave
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {currentQuestions.map((question) => (
          <Grid item xs={12} md={6} key={question.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                },
                ...(selectedQuestion === question.id ? {
                  borderColor: `${question.color}.main`,
                  borderWidth: 2,
                  borderStyle: 'solid'
                } : {})
              }}
              onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      mr: 2,
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${question.color}.light`,
                      color: `${question.color}.contrastText`,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {question.icon}
                  </Box>
                  <Chip
                    label={`Pregunta ${question.id}`}
                    color={question.color as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="h6" gutterBottom fontWeight="semibold" lineHeight={1.3}>
                  {question.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {question.description}
                </Typography>
                
                {/* Área para visualización */}
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    backgroundColor: selectedQuestion === question.id ? 'grey.100' : 'grey.50',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: selectedQuestion === question.id ? `${question.color}.main` : 'grey.300',
                    minHeight: 150
                  }}
                >
                  {datosAnalisis ? (
                    renderVisualization(question)
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      📊 Sondee un tema para ver análisis
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytics Space */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 4, 
          backgroundColor: datosAnalisis ? 'background.paper' : 'grey.50',
          borderRadius: 2,
          border: datosAnalisis ? 'none' : '2px dashed',
          borderColor: 'grey.300',
          mb: 4
        }}
      >
        {datosAnalisis ? (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="semibold" color="primary">
              📈 Panel de Análisis de {tipoContexto === 'tendencias' ? 'Tendencias' : tipoContexto === 'noticias' ? 'Noticias' : 'Documentos'}
            </Typography>
            
            <Grid container spacing={3}>
              {/* Primera fila de gráficas */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="semibold">
                  {tipoContexto === 'tendencias' ? 'Temas Populares' : 
                   tipoContexto === 'noticias' ? 'Relevancia de Noticias' : 
                   'Relevancia de Documentos'}
                </Typography>
                {tipoContexto === 'tendencias' && datosAnalisis.temas_relevantes ? (
                  <BarChartVisual 
                    data={datosAnalisis.temas_relevantes}
                    xAxisKey="tema"
                    barKey="valor"
                    height={250}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.noticias_relevantes ? (
                  <BarChartVisual 
                    data={datosAnalisis.noticias_relevantes}
                    xAxisKey="titulo"
                    barKey="relevancia"
                    height={250}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.documentos_relevantes ? (
                  <BarChartVisual 
                    data={datosAnalisis.documentos_relevantes}
                    xAxisKey="titulo"
                    barKey="relevancia"
                    height={250}
                  />
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="semibold">
                  {tipoContexto === 'tendencias' ? 'Distribución por Categoría' : 
                   tipoContexto === 'noticias' ? 'Fuentes de Cobertura' : 
                   'Conceptos Relacionados'}
                </Typography>
                {tipoContexto === 'tendencias' && datosAnalisis.distribucion_categorias ? (
                  <PieChartVisual
                    data={datosAnalisis.distribucion_categorias}
                    nameKey="categoria"
                    valueKey="valor"
                    height={250}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.fuentes_cobertura ? (
                  <PieChartVisual
                    data={datosAnalisis.fuentes_cobertura}
                    nameKey="fuente"
                    valueKey="cobertura"
                    height={250}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.conceptos_relacionados ? (
                  <PieChartVisual
                    data={datosAnalisis.conceptos_relacionados}
                    nameKey="concepto"
                    valueKey="relacion"
                    height={250}
                  />
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </Grid>

              {/* Segunda fila de gráficas */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="semibold">
                  {tipoContexto === 'tendencias' ? 'Distribución Geográfica' : 
                   tipoContexto === 'noticias' ? 'Evolución de Cobertura' : 
                   'Evolución de Análisis'}
                </Typography>
                {tipoContexto === 'tendencias' && datosAnalisis.mapa_menciones ? (
                  <BarChartVisual 
                    data={datosAnalisis.mapa_menciones}
                    xAxisKey="region"
                    barKey="valor"
                    height={250}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.evolucion_cobertura ? (
                  <LineChartVisual 
                    data={datosAnalisis.evolucion_cobertura}
                    xAxisKey="fecha"
                    lineKey="valor"
                    height={250}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.evolucion_analisis ? (
                  <AreaChartVisual 
                    data={datosAnalisis.evolucion_analisis}
                    xAxisKey="fecha"
                    areaKey="valor"
                    height={250}
                  />
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="semibold">
                  {tipoContexto === 'tendencias' ? 'Subtemas Relacionados' : 
                   tipoContexto === 'noticias' ? 'Aspectos Cubiertos' : 
                   'Aspectos Documentados'}
                </Typography>
                {tipoContexto === 'tendencias' && datosAnalisis.subtemas_relacionados ? (
                  <BarChartVisual 
                    data={datosAnalisis.subtemas_relacionados}
                    xAxisKey="subtema"
                    barKey="relacion"
                    height={250}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.aspectos_cubiertos ? (
                  <BarChartVisual 
                    data={datosAnalisis.aspectos_cubiertos}
                    xAxisKey="aspecto"
                    barKey="cobertura"
                    height={250}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.aspectos_documentados ? (
                  <BarChartVisual 
                    data={datosAnalisis.aspectos_documentados}
                    xAxisKey="aspecto"
                    barKey="profundidad"
                    height={250}
                  />
                ) : (
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom fontWeight="semibold" color="text.secondary">
              📈 Panel de Análisis Principal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Utilice el campo de búsqueda para iniciar un sondeo y visualizar los resultados aquí.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Mapa de Sondeos */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="semibold" color="primary">
          🗺️ Mapa de Exploración de Sondeos
        </Typography>
        {loadingSondeos ? (
          <Typography color="primary">Cargando mapa...</Typography>
        ) : (
          <SondeosMap sondeos={sondeos} />
        )}
      </Box>
    </Box>
  );
};

export default Sondeos; 