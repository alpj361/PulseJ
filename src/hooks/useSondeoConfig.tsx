import { useState, useMemo } from 'react';
import { TrendingUp, Assessment, LocationOn, BarChart } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface Question {
  id: number;
  title: string;
  icon: ReactNode;
  description: string;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  dataKey?: string;
}

export function useSondeoConfig() {
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['tendencias']);

  const baseQuestions: Question[] = [
    { id: 1, title: '¿Qué temas preocupan más a las personas hoy?', icon: <TrendingUp />, description: 'Análisis de tendencias emergentes y preocupaciones ciudadanas', color: 'primary' },
    { id: 2, title: '¿Hay coherencia entre lo que se cubre y lo que se opina?', icon: <Assessment />, description: 'Comparación entre cobertura mediática y opinión pública', color: 'secondary' },
    { id: 3, title: '¿Dónde se están generando los focos de atención?', icon: <LocationOn />, description: 'Mapeo geográfico de tendencias y puntos de interés', color: 'success' },
    { id: 4, title: '¿Qué tan alineadas están las tendencias mediáticas con la agenda ciudadana?', icon: <BarChart />, description: 'Medición de sincronía entre medios y ciudadanía', color: 'warning' }
  ];

  const questions = useMemo(() => {
    const ctx = selectedContexts[0] || 'tendencias';
    if (ctx === 'tendencias') {
      return [
        { id: 1, title: '¿Qué temas son tendencia en relación a mi búsqueda?', icon: <TrendingUp />, description: 'Análisis de tendencias relevantes al tema consultado', color: 'primary', dataKey: 'temas_relevantes' },
        { id: 2, title: '¿Cómo se distribuyen las categorías en este tema?', icon: <Assessment />, description: 'Distribución por categorías para el tema consultado', color: 'secondary', dataKey: 'distribucion_categorias' },
        { id: 3, title: '¿Dónde se mencionan más estos temas?', icon: <LocationOn />, description: 'Análisis geográfico de menciones sobre el tema', color: 'success', dataKey: 'mapa_menciones' },
        { id: 4, title: '¿Qué subtemas están relacionados con mi búsqueda?', icon: <BarChart />, description: 'Relaciones entre el tema principal y subtemas', color: 'warning', dataKey: 'subtemas_relacionados' }
      ];
    } else if (ctx === 'noticias') {
      return [
        { id: 1, title: '¿Qué noticias son más relevantes para mi tema?', icon: <TrendingUp />, description: 'Análisis de relevancia de noticias para el tema consultado', color: 'primary', dataKey: 'noticias_relevantes' },
        { id: 2, title: '¿Qué fuentes cubren más mi tema?', icon: <Assessment />, description: 'Análisis de fuentes que cubren el tema consultado', color: 'secondary', dataKey: 'fuentes_cobertura' },
        { id: 3, title: '¿Cómo ha evolucionado la cobertura de este tema?', icon: <LocationOn />, description: 'Evolución temporal de la cobertura del tema', color: 'success', dataKey: 'evolucion_cobertura' },
        { id: 4, title: '¿Qué aspectos del tema reciben más atención?', icon: <BarChart />, description: 'Análisis de los aspectos más cubiertos del tema', color: 'warning', dataKey: 'aspectos_cubiertos' }
      ];
    } else if (ctx === 'codex') {
      return [
        { id: 1, title: '¿Qué documentos son más relevantes para mi tema?', icon: <TrendingUp />, description: 'Análisis de relevancia de documentos para el tema consultado', color: 'primary', dataKey: 'documentos_relevantes' },
        { id: 2, title: '¿Qué conceptos se relacionan más con mi tema?', icon: <Assessment />, description: 'Análisis de conceptos relacionados con el tema', color: 'secondary', dataKey: 'conceptos_relacionados' },
        { id: 3, title: '¿Cómo ha evolucionado el análisis de este tema?', icon: <LocationOn />, description: 'Evolución temporal del análisis del tema', color: 'success', dataKey: 'evolucion_analisis' },
        { id: 4, title: '¿Qué aspectos del tema se analizan más a fondo?', icon: <BarChart />, description: 'Análisis de los aspectos más documentados del tema', color: 'warning', dataKey: 'aspectos_documentados' }
      ];
    } else {
      return baseQuestions;
    }
  }, [selectedContexts]);

  return { selectedContexts, setSelectedContexts, questions };
} 