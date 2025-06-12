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
              height={230} 
            />
          );
          
        case 2: // Distribución por categorías
          return (
            <PieChartVisual
              data={data}
              nameKey="categoria"
              valueKey="valor"
              height={230}
            />
          );
          
        case 3: // Mapa de menciones
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="region"
              barKey="valor"
              height={230}
            />
          );
          
        case 4: // Subtemas relacionados
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="subtema"
              barKey="relacion"
              height={230}
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
              height={230} 
            />
          );
          
        case 2: // Fuentes que cubren más
          return (
            <PieChartVisual
              data={data}
              nameKey="fuente"
              valueKey="cobertura"
              height={230}
            />
          );
          
        case 3: // Evolución de cobertura
          return (
            <LineChartVisual 
              data={data}
              xAxisKey="fecha"
              lineKey="valor"
              height={230}
            />
          );
          
        case 4: // Aspectos cubiertos
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="aspecto"
              barKey="cobertura"
              height={230}
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
              height={230} 
            />
          );
          
        case 2: // Conceptos relacionados
          return (
            <PieChartVisual
              data={data}
              nameKey="concepto"
              valueKey="relacion"
              height={230}
            />
          );
          
        case 3: // Evolución de análisis
          return (
            <AreaChartVisual 
              data={data}
              xAxisKey="fecha"
              areaKey="valor"
              height={230}
            />
          );
          
        case 4: // Aspectos documentados
          return (
            <BarChartVisual 
              data={data}
              xAxisKey="aspecto"
              barKey="profundidad"
              height={230}
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
      const datosMuestra = generarDatosPrueba(tipoContexto, consultaDemo);
      
      // Establecer la consulta de demostración si no hay ninguna
      if (!input) {
        setInput(consultaDemo);
      }
      
      // Actualizar los estados
      setDatosAnalisis(datosMuestra);
      setLlmResponse(`Análisis de "${consultaDemo}" en el contexto de ${tipoContexto === 'tendencias' ? 'tendencias actuales' : 
        tipoContexto === 'noticias' ? 'noticias recientes' : 'documentos del codex'}. 
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
      
      <Grid container spacing={4} sx={{ mb: 6 }}>
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
                    p: 1,
                    backgroundColor: selectedQuestion === question.id ? 'grey.100' : 'grey.50',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: selectedQuestion === question.id ? `${question.color}.main` : 'grey.300',
                    minHeight: 250,
                    height: 250
                  }}
                >
                  {datosAnalisis ? (
                    renderVisualization(question)
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
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
          mb: 6
        }}
      >
        {datosAnalisis ? (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="semibold" color="primary">
              📈 Panel de Análisis de {tipoContexto === 'tendencias' ? 'Tendencias' : tipoContexto === 'noticias' ? 'Noticias' : 'Documentos'}
            </Typography>
            
            <Grid container spacing={4}>
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
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.noticias_relevantes ? (
                  <BarChartVisual 
                    data={datosAnalisis.noticias_relevantes}
                    xAxisKey="titulo"
                    barKey="relevancia"
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.documentos_relevantes ? (
                  <BarChartVisual 
                    data={datosAnalisis.documentos_relevantes}
                    xAxisKey="titulo"
                    barKey="relevancia"
                    height={350}
                    showAverage={true}
                  />
                ) : (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
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
                    height={350}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.fuentes_cobertura ? (
                  <PieChartVisual
                    data={datosAnalisis.fuentes_cobertura}
                    nameKey="fuente"
                    valueKey="cobertura"
                    height={350}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.conceptos_relacionados ? (
                  <PieChartVisual
                    data={datosAnalisis.conceptos_relacionados}
                    nameKey="concepto"
                    valueKey="relacion"
                    height={350}
                  />
                ) : (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
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
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.evolucion_cobertura ? (
                  <LineChartVisual 
                    data={datosAnalisis.evolucion_cobertura}
                    xAxisKey="fecha"
                    lineKey="valor"
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.evolucion_analisis ? (
                  <AreaChartVisual 
                    data={datosAnalisis.evolucion_analisis}
                    xAxisKey="fecha"
                    areaKey="valor"
                    height={350}
                    showAverage={true}
                  />
                ) : (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
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
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'noticias' && datosAnalisis.aspectos_cubiertos ? (
                  <BarChartVisual 
                    data={datosAnalisis.aspectos_cubiertos}
                    xAxisKey="aspecto"
                    barKey="cobertura"
                    height={350}
                    showAverage={true}
                  />
                ) : tipoContexto === 'codex' && datosAnalisis.aspectos_documentados ? (
                  <BarChartVisual 
                    data={datosAnalisis.aspectos_documentados}
                    xAxisKey="aspecto"
                    barKey="profundidad"
                    height={350}
                    showAverage={true}
                  />
                ) : (
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
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