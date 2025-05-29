import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  LocationOn,
  Assessment,
  Search as SearchIcon
} from '@mui/icons-material';
import { getLatestNews, getCodexItemsByUser } from '../services/supabase';
import { getLatestTrends } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NewsItem } from '../types';
import type { TrendResponse } from '../services/api';

// Utilidad mejorada para buscar relevancia por palabras clave del input
function filtrarPorRelevancia(texto: string, input: string) {
  if (!texto || !input) return false;
  // Extraer palabras del input (ignorando signos y mayúsculas)
  const palabrasInput = input.toLowerCase().split(/\W+/).filter(Boolean);
  const textoLower = texto.toLowerCase();
  return palabrasInput.some(palabra => textoLower.includes(palabra));
}

function resumirTexto(texto: string, maxLen = 220) {
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

const Sondeos: React.FC = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [codex, setCodex] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [contexto, setContexto] = useState<any>(null);
  const [showContext, setShowContext] = useState(false);

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

  // Armado de contexto
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    Promise.all([
      getLatestNews(),
      getLatestTrends(),
      getCodexItemsByUser(user.id)
    ]).then(([newsData, trendsData, codexData]) => {
      setNews(newsData);
      setTrends(trendsData);
      setCodex(codexData);
    }).catch(e => {
      setError('Error al obtener contexto: ' + (e.message || e));
    }).finally(() => setLoading(false));
  }, [user]);

  // Armado de contexto relevante
  const armarContexto = () => {
    // Preprocesar palabras del input para todos los filtros
    const palabrasInput = input.toLowerCase().split(/\W+/).filter(Boolean);

    // Filtrar noticias relevantes
    const noticiasRelevantes = news.filter(n =>
      filtrarPorRelevancia(n.title, input) ||
      filtrarPorRelevancia(n.excerpt, input) ||
      n.keywords.some(k => filtrarPorRelevancia(k, input))
    ).slice(0, 3);

    // Filtrar documentos relevantes
    const codexRelevantes = codex.filter((d: any) =>
      filtrarPorRelevancia(d.titulo, input) ||
      filtrarPorRelevancia(d.descripcion, input) ||
      (d.etiquetas || []).some((k: string) => filtrarPorRelevancia(k, input))
    ).slice(0, 3);

    // Filtrar tendencias relevantes (about)
    let tendenciasRelevantes: any[] = [];
    if (trends && trends.about && Array.isArray(trends.about)) {
      tendenciasRelevantes = trends.about.filter((t: any) => {
        // Filtro robusto para palabras_clave
        const keywordMatch = (t.palabras_clave || []).some((k: string) => {
          const keywordLower = k.toLowerCase();
          return palabrasInput.some(palabra => keywordLower.includes(palabra) || palabra.includes(keywordLower));
        });
        return (
          filtrarPorRelevancia(t.nombre, input) ||
          filtrarPorRelevancia(t.resumen, input) ||
          keywordMatch
        );
      }).slice(0, 3);
    }

    // Armar contexto estructurado
    const contextoArmado = {
      input,
      noticias: noticiasRelevantes.map(n => ({
        titulo: n.title,
        resumen: resumirTexto(n.excerpt),
        fuente: n.source,
        fecha: n.date,
        url: n.url,
        categoria: n.category,
        keywords: n.keywords
      })),
      codex: codexRelevantes.map((d: any) => ({
        titulo: d.titulo,
        descripcion: resumirTexto(d.descripcion),
        tipo: d.tipo,
        fecha: d.fecha,
        etiquetas: d.etiquetas,
        url: d.url
      })),
      tendencias: tendenciasRelevantes.map((t: any) => ({
        nombre: t.nombre,
        resumen: resumirTexto(t.resumen),
        categoria: t.categoria,
        relevancia: t.relevancia,
        fecha_evento: t.fecha_evento,
        palabras_clave: t.palabras_clave,
        razon_tendencia: t.razon_tendencia
      }))
    };
    setContexto(contextoArmado);
    setShowContext(true);
  };

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
            onClick={armarContexto}
          >
            🧠 Sondear
          </Button>
        </Box>
        {loading && <Typography color="primary">Cargando contexto...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {showContext && contexto && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Contexto armado para la consulta:</Typography>
            <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f7fafc', padding: 12, borderRadius: 8, maxHeight: 350, overflow: 'auto' }}>{JSON.stringify(contexto, null, 2)}</pre>
            <Button size="small" onClick={() => setShowContext(false)} sx={{ mt: 1 }}>Ocultar</Button>
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
        {questions.map((question) => (
          <Grid item xs={12} md={6} key={question.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
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
                
                {/* Placeholder for chart/data */}
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    📊 Espacio reservado para gráficos y análisis
                  </Typography>
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
          backgroundColor: 'grey.50',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom fontWeight="semibold" color="text.secondary">
            📈 Panel de Análisis Principal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí se mostrarán los resultados integrados del sondeo, 
            correlaciones entre datos y visualizaciones interactivas.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Sondeos; 