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
  Search as SearchIcon,
  Edit as EditIcon
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
import ModernBarChart from '../components/ui/ModernBarChart';
import ModernLineChart from '../components/ui/ModernLineChart';
import ModernPieChart from '../components/ui/ModernPieChart';
import MultiContextSelector from '../components/ui/MultiContextSelector';
import AIResponseDisplay from '../components/ui/AIResponseDisplay';
import SondeoConfigModal from '../components/ui/SondeoConfigModal';

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
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['tendencias']);
  
  // Nuevo estado para datos de visualización
  const [datosAnalisis, setDatosAnalisis] = useState<any>(null);
  
  // Estado para el modal de configuración
  const [configModalOpen, setConfigModalOpen] = useState(false);

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
    // Si hay múltiples contextos, usar el primero para las preguntas por ahora
    const primaryContext = selectedContexts[0] || 'tendencias';
    if (primaryContext === 'tendencias') {
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
    } else if (primaryContext === 'noticias') {
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
    } else if (primaryContext === 'codex') {
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
    const primaryContext = selectedContexts[0] || 'tendencias';
    
    // Visualizaciones específicas según el tipo de contexto y pregunta
    if (primaryContext === 'tendencias') {
      switch (question.id) {
        case 1: // Temas relevantes
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.tema, value: item.valor }))} 
              height={280} 
              gradient={true}
              glassmorphism={true}
            />
          );
          
        case 2: // Distribución por categorías
          return (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.categoria, value: item.valor }))}
              height={280}
              showLegend={true}
            />
          );
          
        case 3: // Mapa de menciones
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.region, value: item.valor }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
          
        case 4: // Subtemas relacionados
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.subtema, value: item.relacion }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
      }
    } else if (primaryContext === 'noticias') {
      switch (question.id) {
        case 1: // Noticias más relevantes
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.titulo.substring(0, 20) + '...', value: item.relevancia }))} 
              height={280} 
              gradient={true}
              glassmorphism={true}
            />
          );
          
        case 2: // Fuentes que cubren más
          return (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.fuente, value: item.cobertura }))}
              height={280}
              showLegend={true}
            />
          );
          
        case 3: // Evolución de cobertura
          return (
            <ModernLineChart 
              data={data.map((item: any) => ({ name: item.fecha, value: item.valor }))}
              height={280}
              showArea={true}
              showTarget={false}
            />
          );
          
        case 4: // Aspectos cubiertos
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.aspecto, value: item.cobertura }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
      }
    } else if (primaryContext === 'codex') {
      switch (question.id) {
        case 1: // Documentos más relevantes
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.titulo.substring(0, 20) + '...', value: item.relevancia }))} 
              height={280} 
              gradient={true}
              glassmorphism={true}
            />
          );
          
        case 2: // Conceptos relacionados
          return (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.concepto, value: item.relacion }))}
              height={280}
              showLegend={true}
            />
          );
          
        case 3: // Evolución de análisis
          return (
            <ModernLineChart 
              data={data.map((item: any) => ({ name: item.fecha, value: item.valor }))}
              height={280}
              showArea={true}
              showTarget={false}
            />
          );
          
        case 4: // Aspectos documentados
          return (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.aspecto, value: item.profundidad }))}
              height={280}
              gradient={true}
              glassmorphism={true}
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

  // Función para sondear tema según los contextos seleccionados
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
        contextos_seleccionados: selectedContexts,
        tipo_contexto: selectedContexts.join('+') // Para compatibilidad con backend
      };
      
      // Obtener datos según los contextos seleccionados
      if (selectedContexts.includes('tendencias')) {
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
      }
      
      if (selectedContexts.includes('noticias')) {
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
      }
      
      if (selectedContexts.includes('codex')) {
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
          const primaryContext = selectedContexts[0] || 'tendencias';
          const datosPrueba = generarDatosPrueba(primaryContext, input);
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
  
  // Mejorar la función de generación de datos de prueba para visualizaciones
  // Ahora generando más datos para probar la capacidad de manejo de muchos elementos
  const generarDatosPrueba = (tipo: string, consulta: string) => {
    // Datos mejorados para tendencias con más elementos
    if (tipo === 'tendencias') {
      return {
        temas_relevantes: [
          { tema: `${consulta} en política nacional`, valor: 85 },
          { tema: `${consulta} en economía regional`, valor: 67 },
          { tema: `${consulta} y relaciones internacionales`, valor: 54 },
          { tema: `${consulta} e innovación tecnológica`, valor: 42 },
          { tema: `${consulta} y expresiones culturales`, valor: 38 },
          { tema: `${consulta} en el sector salud`, valor: 32 },
          { tema: `${consulta} en eventos deportivos`, valor: 25 },
          { tema: `${consulta} y desarrollo sostenible`, valor: 22 },
          { tema: `${consulta} en educación superior`, valor: 19 },
          { tema: `${consulta} y seguridad ciudadana`, valor: 17 },
          { tema: `${consulta} en medios de comunicación`, valor: 15 },
          { tema: `${consulta} y transparencia gubernamental`, valor: 12 }
        ],
        distribucion_categorias: [
          { categoria: 'Política', valor: 35 },
          { categoria: 'Economía', valor: 28 },
          { categoria: 'Internacional', valor: 17 },
          { categoria: 'Tecnología', valor: 12 },
          { categoria: 'Cultura', valor: 10 },
          { categoria: 'Salud', valor: 8 },
          { categoria: 'Deportes', valor: 5 },
          { categoria: 'Educación', valor: 8 },
          { categoria: 'Seguridad', valor: 6 },
          { categoria: 'Medioambiente', valor: 9 },
          { categoria: 'Transporte', valor: 4 },
          { categoria: 'Vivienda', valor: 3 }
        ],
        mapa_menciones: [
          { region: 'Ciudad Capital', valor: 48 },
          { region: 'Zona Metropolitana', valor: 35 },
          { region: 'Occidente', valor: 25 },
          { region: 'Oriente', valor: 18 },
          { region: 'Sur', valor: 12 },
          { region: 'Norte', valor: 8 },
          { region: 'Petén', valor: 4 },
          { region: 'Altiplano', valor: 15 },
          { region: 'Costa Sur', valor: 10 },
          { region: 'Verapaces', valor: 7 },
          { region: 'Izabal', valor: 5 },
          { region: 'Región Fronteriza', valor: 3 }
        ],
        subtemas_relacionados: [
          { subtema: 'Financiamiento', relacion: 85 },
          { subtema: 'Regulación', relacion: 72 },
          { subtema: 'Desarrollo sostenible', relacion: 64 },
          { subtema: 'Impacto social', relacion: 53 },
          { subtema: 'Inversión pública', relacion: 47 },
          { subtema: 'Infraestructura', relacion: 39 },
          { subtema: 'Educación', relacion: 28 },
          { subtema: 'Gobernanza', relacion: 25 },
          { subtema: 'Investigación', relacion: 22 },
          { subtema: 'Cooperación', relacion: 19 },
          { subtema: 'Participación ciudadana', relacion: 17 },
          { subtema: 'Fiscalización', relacion: 15 }
        ]
      };
    } 
    // Datos mejorados para noticias con más elementos
    else if (tipo === 'noticias') {
      return {
        noticias_relevantes: [
          { titulo: `El impacto de ${consulta} en el desarrollo económico nacional`, relevancia: 92 },
          { titulo: `Gobierno central anuncia nuevas políticas sobre ${consulta}`, relevancia: 87 },
          { titulo: `Comunidades rurales se organizan en torno a ${consulta}`, relevancia: 76 },
          { titulo: `Especialistas internacionales debaten sobre el futuro de ${consulta}`, relevancia: 68 },
          { titulo: `${consulta}: perspectivas a mediano y largo plazo en Guatemala`, relevancia: 61 },
          { titulo: `Análisis internacional sobre impacto de ${consulta} en la región`, relevancia: 53 },
          { titulo: `El sector privado y su relación estratégica con ${consulta}`, relevancia: 45 },
          { titulo: `Universidad San Carlos presenta estudio sobre ${consulta}`, relevancia: 39 },
          { titulo: `Sociedad civil propone alternativas en torno a ${consulta}`, relevancia: 35 },
          { titulo: `Municipalidades se unen para abordar ${consulta} de forma integral`, relevancia: 31 },
          { titulo: `Expertos analizan el marco legal actual para ${consulta}`, relevancia: 28 },
          { titulo: `La juventud guatemalteca frente a los desafíos de ${consulta}`, relevancia: 24 }
        ],
        fuentes_cobertura: [
          { fuente: 'Prensa Libre', cobertura: 32 },
          { fuente: 'Nuestro Diario', cobertura: 27 },
          { fuente: 'El Periódico', cobertura: 21 },
          { fuente: 'La Hora', cobertura: 15 },
          { fuente: 'Soy502', cobertura: 12 },
          { fuente: 'Plaza Pública', cobertura: 8 },
          { fuente: 'Nómada', cobertura: 6 },
          { fuente: 'Emisoras Unidas', cobertura: 9 },
          { fuente: 'República GT', cobertura: 7 },
          { fuente: 'Publinews', cobertura: 6 },
          { fuente: 'Canal Antigua', cobertura: 5 },
          { fuente: 'Otras fuentes', cobertura: 7 }
        ],
        evolucion_cobertura: [
          { fecha: '2023-01', valor: 15 },
          { fecha: '2023-02', valor: 18 },
          { fecha: '2023-03', valor: 25 },
          { fecha: '2023-04', valor: 42 },
          { fecha: '2023-05', valor: 38 },
          { fecha: '2023-06', valor: 45 },
          { fecha: '2023-07', valor: 52 },
          { fecha: '2023-08', valor: 64 },
          { fecha: '2023-09', valor: 58 },
          { fecha: '2023-10', valor: 49 },
          { fecha: '2023-11', valor: 55 },
          { fecha: '2023-12', valor: 62 }
        ],
        aspectos_cubiertos: [
          { aspecto: 'Impacto económico', cobertura: 65 },
          { aspecto: 'Aspectos políticos', cobertura: 58 },
          { aspecto: 'Dimensión social', cobertura: 47 },
          { aspecto: 'Implicaciones legales', cobertura: 41 },
          { aspecto: 'Innovación tecnológica', cobertura: 35 },
          { aspecto: 'Sostenibilidad', cobertura: 29 },
          { aspecto: 'Cooperación internacional', cobertura: 22 },
          { aspecto: 'Presupuesto y recursos', cobertura: 19 },
          { aspecto: 'Participación comunitaria', cobertura: 17 },
          { aspecto: 'Transparencia', cobertura: 15 },
          { aspecto: 'Investigación académica', cobertura: 12 },
          { aspecto: 'Impacto cultural', cobertura: 9 }
        ]
      };
    } 
    // Datos mejorados para codex con más elementos
    else if (tipo === 'codex') {
      return {
        documentos_relevantes: [
          { titulo: `Análisis estratégico integral de ${consulta} en Guatemala`, relevancia: 95 },
          { titulo: `Estudio sectorial comparativo sobre ${consulta}`, relevancia: 88 },
          { titulo: `Políticas públicas y normativa relacionada con ${consulta}`, relevancia: 82 },
          { titulo: `Aspectos legales e institucionales de ${consulta} en Guatemala`, relevancia: 75 },
          { titulo: `Impacto social y comunitario de ${consulta}: casos de estudio nacionales`, relevancia: 68 },
          { titulo: `${consulta} y su influencia en la economía regional centroamericana`, relevancia: 61 },
          { titulo: `Perspectivas a futuro y recomendaciones sobre ${consulta}`, relevancia: 54 },
          { titulo: `Marco conceptual y teórico actualizado para ${consulta}`, relevancia: 48 },
          { titulo: `Metodologías de evaluación aplicadas a ${consulta}`, relevancia: 43 },
          { titulo: `Experiencias internacionales comparadas en materia de ${consulta}`, relevancia: 38 },
          { titulo: `Análisis de actores e intereses en torno a ${consulta}`, relevancia: 34 },
          { titulo: `Lineamientos estratégicos para el abordaje integral de ${consulta}`, relevancia: 30 }
        ],
        conceptos_relacionados: [
          { concepto: 'Desarrollo sostenible', relacion: 78 },
          { concepto: 'Política pública', relacion: 65 },
          { concepto: 'Participación ciudadana', relacion: 59 },
          { concepto: 'Marco regulatorio', relacion: 52 },
          { concepto: 'Innovación', relacion: 45 },
          { concepto: 'Inclusión social', relacion: 38 },
          { concepto: 'Cooperación institucional', relacion: 31 },
          { concepto: 'Planificación estratégica', relacion: 28 },
          { concepto: 'Gobernanza', relacion: 25 },
          { concepto: 'Análisis sistémico', relacion: 22 },
          { concepto: 'Indicadores de desempeño', relacion: 19 },
          { concepto: 'Modelos de gestión', relacion: 17 }
        ],
        evolucion_analisis: [
          { fecha: '2023-Q1', valor: 22 },
          { fecha: '2023-Q2', valor: 35 },
          { fecha: '2023-Q3', valor: 48 },
          { fecha: '2023-Q4', valor: 42 },
          { fecha: '2024-Q1', valor: 55 },
          { fecha: '2024-Q2', valor: 68 }
        ],
        aspectos_documentados: [
          { aspecto: 'Marco conceptual', profundidad: 82 },
          { aspecto: 'Estudios de caso', profundidad: 75 },
          { aspecto: 'Análisis comparativo', profundidad: 68 },
          { aspecto: 'Proyecciones', profundidad: 62 },
          { aspecto: 'Aspectos legales', profundidad: 55 },
          { aspecto: 'Metodologías', profundidad: 48 },
          { aspecto: 'Bibliografía especializada', profundidad: 41 },
          { aspecto: 'Marcos institucionales', profundidad: 38 },
          { aspecto: 'Análisis de tendencias', profundidad: 35 },
          { aspecto: 'Evaluación de impacto', profundidad: 32 },
          { aspecto: 'Recomendaciones', profundidad: 29 },
          { aspecto: 'Apéndices técnicos', profundidad: 26 }
        ]
      };
    }
    
    // Datos genéricos por defecto con muchos elementos
    return {
      datos_genericos: [
        { etiqueta: 'Categoría 1', valor: 85 },
        { etiqueta: 'Categoría 2', valor: 65 },
        { etiqueta: 'Categoría 3', valor: 45 },
        { etiqueta: 'Categoría 4', valor: 25 },
        { etiqueta: 'Categoría 5', valor: 15 },
        { etiqueta: 'Categoría 6', valor: 35 },
        { etiqueta: 'Categoría 7', valor: 55 },
        { etiqueta: 'Categoría 8', valor: 40 },
        { etiqueta: 'Categoría 9', valor: 30 },
        { etiqueta: 'Categoría 10', valor: 20 },
        { etiqueta: 'Categoría 11', valor: 10 },
        { etiqueta: 'Categoría 12', valor: 5 }
      ]
    };
  };



  // Agrega esta función después de generarDatosPrueba para mostrar datos inmediatamente sin tener que consultar:
  // Esta función es sólo para propósitos de demostración
  const cargarDatosDemostracion = () => {
    // Si ya hay datos cargados, no hacer nada
    if (datosAnalisis) return;
    
    // Simular carga
    setLoadingSondeo(true);
    
    // Esperar brevemente para simular una carga
    setTimeout(() => {
      // Usar una consulta por defecto si no hay nada ingresado
      const consultaDemo = input || "desarrollo económico";
      
      // Generar datos de muestra para el tipo de contexto seleccionado
      const primaryContext = selectedContexts[0] || 'tendencias';
    const datosMuestra = generarDatosPrueba(primaryContext, consultaDemo);
      
      // Establecer la consulta de demostración si no hay ninguna
      if (!input) {
        setInput(consultaDemo);
      }
      
      // Actualizar los estados
      setDatosAnalisis(datosMuestra);
          const contextLabels = selectedContexts.map(ctx => 
      ctx === 'tendencias' ? 'tendencias actuales' :
      ctx === 'noticias' ? 'noticias recientes' : 'documentos del codex'
    ).join(', ');
    setLlmResponse(`Análisis de "${consultaDemo}" combinando contextos de ${contextLabels}. 
        Este es un texto de muestra generado para visualizar los gráficos. En un análisis real, 
        aquí se mostraría un resumen detallado elaborado por la IA sobre el tema consultado, 
        basado en el contexto seleccionado y la información relevante disponible.`);
      
      // Finalizar carga simulada
      setLoadingSondeo(false);
      setShowContext(true);
    }, 1500);
  };

  // Dentro del componente Sondeos, agrega este useEffect para cargar datos de demostración automáticamente
  useEffect(() => {
    // Cargar datos de demostración después de montar el componente
    cargarDatosDemostracion();
    // Solo ejecutar una vez al montar el componente
  }, []);

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
    <Box sx={{ maxWidth: '1280px', mx: 'auto', p: { xs: 2, sm: 3, lg: 4 } }}>
      {/* Buscador + Contexto + Configuración */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        justifyContent: 'center',
        gap: 2,
        mb: 6
      }}>
        <input
          type="text"
          placeholder='Buscar tema (ej. "desarrollo económico")'
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ 
            width: '100%',
            maxWidth: '600px',
            fontSize: '14px', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #D1D5DB',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
            e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        />
        
        {/* Contexto */}
        <Box sx={{ minWidth: '160px' }}>
          <MultiContextSelector
            selectedContexts={selectedContexts}
            onContextChange={setSelectedContexts}
            disabled={loading || loadingSondeo}
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setConfigModalOpen(true)}
          sx={{ 
            px: 2, 
            py: 1, 
            fontSize: '14px', 
            fontWeight: 500, 
            borderRadius: '6px', 
            textTransform: 'none',
            borderColor: '#D1D5DB',
            color: '#374151',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              backgroundColor: '#F9FAFB',
              borderColor: '#D1D5DB'
            }, 
            transition: 'all 0.2s ease',
            minWidth: 'auto'
          }}
        >
          Configurar
        </Button>

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          disabled={loading || !input || selectedContexts.length === 0}
          onClick={sondearTema}
          sx={{ 
            px: 2, 
            py: 1, 
            fontSize: '14px', 
            fontWeight: 600, 
            borderRadius: '6px', 
            textTransform: 'none',
            backgroundColor: '#3B82F6',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': { 
              backgroundColor: '#2563EB'
            }, 
            transition: 'all 0.2s ease',
            minWidth: 'auto'
          }}
        >
          Sondear
        </Button>
      </Box>

      {/* Análisis (Expandible) */}
      {llmResponse && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: '8px', 
          border: '1px solid rgba(59, 130, 246, 0.1)', 
          backgroundColor: 'rgba(59, 130, 246, 0.02)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '-0.025em' }}>
                Análisis
              </Typography>
              <Button
                size="small"
                onClick={() => setShowContext(v => !v)}
                sx={{ 
                  minWidth: 'auto', 
                  p: 0.5,
                  color: '#3B82F6',
                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                {showContext ? '▲' : '▼'}
              </Button>
            </Box>
            {showContext && (
              <Box sx={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', pt: 2 }}>
                <AIResponseDisplay
                  response={llmResponse}
                  contexts={selectedContexts}
                  contextData={contexto}
                  onContextToggle={() => setShowContext(v => !v)}
                  showContext={showContext}
                  sources={llmSources}
                  loading={loadingSondeo}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading States */}
      {loading && <Typography color="primary" sx={{ textAlign: 'center', mb: 4 }}>Cargando contexto inicial...</Typography>}
      {loadingSondeo && <Typography color="primary" sx={{ textAlign: 'center', mb: 4 }}>Cargando contexto y respuesta de IA...</Typography>}
      {error && <Typography color="error" sx={{ textAlign: 'center', mb: 4 }}>{error}</Typography>}
      
      {loadingSondeo && !llmResponse && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: '8px', 
          border: '1px solid rgba(59, 130, 246, 0.1)', 
          backgroundColor: 'rgba(59, 130, 246, 0.02)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <AIResponseDisplay
              response=""
              contexts={selectedContexts}
              contextData={contexto}
              loading={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Objetivo */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 2, 
        p: 3, 
        mb: 4,
        borderRadius: '8px', 
        backgroundColor: 'rgba(59, 130, 246, 0.02)', 
        boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          color: '#3B82F6',
          flexShrink: 0
        }}>
          🎯
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: '-0.025em', mb: 0.5 }}>
            Objetivo del Módulo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Proporcionar una visión estratégica basada en datos para tomar decisiones informadas sobre desarrollo económico.
          </Typography>
        </Box>
      </Box>

      {/* Cuadrícula de Preguntas */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {currentQuestions.map((question) => (
          <Grid item xs={12} sm={6} lg={6} key={question.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                },
                ...(selectedQuestion === question.id ? {
                  borderColor: '#3B82F6',
                  borderWidth: 2
                } : {})
              }}
              onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: '-0.025em', mb: 1 }}>
                  Pregunta {question.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {question.title}
                </Typography>
                
                {/* Área para visualización */}
                <Box sx={{ mt: 2, flexGrow: 1 }}>
                  <Box sx={{ height: 280 }}>
                    {datosAnalisis ? (
                      renderVisualization(question)
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'text.secondary',
                        fontSize: '14px'
                      }}>
                        📊 Sondee un tema para ver análisis
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* Acciones Globales */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 6,
        mb: 4
      }}>
        <Button
          variant="contained"
          startIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
              <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>
              <path d="M7 3v4a1 1 0 0 0 1 1h7"/>
            </svg>
          }
          sx={{
            px: 2,
            py: 1,
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '6px',
            textTransform: 'none',
            backgroundColor: '#3B82F6',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': {
              backgroundColor: '#2563EB'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Guardar Cambios
        </Button>
        <Button
          variant="outlined"
          startIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
          }
          onClick={cargarDatosDemostracion}
          sx={{
            px: 2,
            py: 1,
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '6px',
            textTransform: 'none',
            borderColor: '#D1D5DB',
            color: '#374151',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': {
              backgroundColor: '#F9FAFB',
              borderColor: '#D1D5DB'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Regenerar Todo
        </Button>
      </Box>

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

      {/* Modal de Configuración */}
      <SondeoConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        selectedContexts={selectedContexts}
      />

    </Box>
  );
};

export default Sondeos; 