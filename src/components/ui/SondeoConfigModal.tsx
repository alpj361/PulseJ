import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArticleIcon from '@mui/icons-material/Article';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsIcon from '@mui/icons-material/Sports';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TemplateIcon from '@mui/icons-material/ViewModule';
import TrendSelector from './TrendSelector';

interface SondeoConfigModalProps {
  open: boolean;
  onClose: () => void;
  selectedContexts: string[];
}

interface Question {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
  context: string;
  enabled: boolean;
  chartType: 'bar' | 'pie' | 'line';
  editable?: boolean;
}

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  questions: Omit<Question, 'id'>[];
}

interface ChartType {
  type: 'bar' | 'pie' | 'line';
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const chartTypes: ChartType[] = [
  {
    type: 'bar',
    label: 'Barras',
    icon: <BarChartIcon />,
    description: 'Ideal para comparar valores',
    color: '#3B82F6'
  },
  {
    type: 'pie',
    label: 'Circular',
    icon: <PieChartIcon />,
    description: 'Perfecto para proporciones',
    color: '#10B981'
  },
  {
    type: 'line',
    label: 'Líneas',
    icon: <ShowChartIcon />,
    description: 'Excelente para tendencias',
    color: '#8B5CF6'
  }
];

const templates: Template[] = [
  {
    id: 'agenda-social',
    name: '📅 Agenda Social',
    icon: <GroupsIcon />,
    description: 'Sondeo introspectivo sobre temas sociales',
    color: '#10B981',
    questions: [
      {
        title: '¿Dónde está el foco de la ciudadanía en temas sociales actualmente?',
        icon: <TrendingUpIcon />,
        description: 'Identifica los temas sociales más recurrentes y emocionalmente cargados en medios y redes',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Qué preocupaciones colectivas emergen con mayor fuerza?',
        icon: <AssessmentIcon />,
        description: 'Detecta temáticas ligadas a salud, seguridad, educación, vivienda, etc.',
        context: 'noticias',
        enabled: true,
        chartType: 'pie',
        editable: true
      },
      {
        title: '¿Quiénes están liderando o amplificando las conversaciones sociales clave?',
        icon: <LocationOnIcon />,
        description: 'Analiza el rol de líderes comunitarios, influencers, ONGs o instituciones',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Qué nivel de esperanza o frustración predomina en torno a los temas sociales?',
        icon: <ShowChartIcon />,
        description: 'Gráficas de polaridad emocional, por región o por tema',
        context: 'noticias',
        enabled: true,
        chartType: 'line',
        editable: true
      }
    ]
  },
  {
    id: 'deportes',
    name: '⚽ Deportes',
    icon: <SportsIcon />,
    description: 'Sondeo introspectivo sobre el mundo deportivo',
    color: '#F59E0B',
    questions: [
      {
        title: '¿Qué eventos deportivos capturan más la atención ciudadana actualmente?',
        icon: <TrendingUpIcon />,
        description: 'Analiza cobertura e interés en eventos locales, regionales o internacionales',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Qué figuras deportivas despiertan mayor admiración o polémica?',
        icon: <AssessmentIcon />,
        description: 'Mide la intensidad emocional de la conversación en torno a atletas o equipos',
        context: 'noticias',
        enabled: true,
        chartType: 'pie',
        editable: true
      },
      {
        title: '¿Qué valores sociales se están proyectando en la conversación deportiva?',
        icon: <LocationOnIcon />,
        description: 'Ej: esfuerzo, meritocracia, identidad nacional, rivalidad, inclusión',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Cómo se relaciona el deporte con el sentido de pertenencia o cohesión social?',
        icon: <ShowChartIcon />,
        description: 'Identifica patrones narrativos vinculados a unidad o fragmentación',
        context: 'noticias',
        enabled: true,
        chartType: 'line',
        editable: true
      }
    ]
  },
  {
    id: 'economia',
    name: '💰 Economía',
    icon: <AttachMoneyIcon />,
    description: 'Sondeo introspectivo sobre temas económicos',
    color: '#EF4444',
    questions: [
      {
        title: '¿Qué dimensiones económicas preocupan más a la ciudadanía hoy?',
        icon: <TrendingUpIcon />,
        description: 'Costo de vida, desempleo, inversión extranjera, informalidad, etc.',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Qué expectativas tiene la gente sobre el futuro económico del país?',
        icon: <ShowChartIcon />,
        description: 'Optimismo/pesimismo medido a través de lenguaje y tendencias',
        context: 'noticias',
        enabled: true,
        chartType: 'line',
        editable: true
      },
      {
        title: '¿Qué actores económicos concentran más atención o crítica?',
        icon: <AssessmentIcon />,
        description: 'Gobierno, sector privado, bancos, comercio exterior, organismos multilaterales',
        context: 'tendencias',
        enabled: true,
        chartType: 'pie',
        editable: true
      },
      {
        title: '¿Cómo percibe la población el impacto económico en su vida diaria?',
        icon: <LocationOnIcon />,
        description: 'Gráficas por sector, región o grupo demográfico',
        context: 'noticias',
        enabled: true,
        chartType: 'bar',
        editable: true
      }
    ]
  },
  {
    id: 'politica',
    name: '🏛️ Política',
    icon: <AccountBalanceIcon />,
    description: 'Sondeo introspectivo sobre el panorama político',
    color: '#8B5CF6',
    questions: [
      {
        title: '¿Qué temas políticos realmente movilizan o dividen a la ciudadanía?',
        icon: <TrendingUpIcon />,
        description: 'Ej: reformas, corrupción, elecciones, justicia',
        context: 'tendencias',
        enabled: true,
        chartType: 'bar',
        editable: true
      },
      {
        title: '¿Qué liderazgos generan más confianza o desconfianza pública?',
        icon: <AssessmentIcon />,
        description: 'Ranking con análisis de sentimiento, influencia, cobertura',
        context: 'noticias',
        enabled: true,
        chartType: 'pie',
        editable: true
      },
      {
        title: '¿Qué percepciones hay sobre el rumbo político del país?',
        icon: <ShowChartIcon />,
        description: 'Resumen de visión crítica, conformismo, esperanza o incertidumbre',
        context: 'tendencias',
        enabled: true,
        chartType: 'line',
        editable: true
      },
      {
        title: '¿Dónde se sitúa el debate ideológico en este momento?',
        icon: <LocationOnIcon />,
        description: 'Identificación de posturas polarizadas y zonas de consenso',
        context: 'noticias',
        enabled: true,
        chartType: 'bar',
        editable: true
      }
    ]
  }
];

// Componente sortable para preguntas individuales
const SortableQuestionItem: React.FC<{
  question: Question;
  onToggle: (id: number) => void;
  onChangeChartType: (id: number, chartType: 'bar' | 'pie' | 'line') => void;
  onUpdateTitle: (id: number, title: string) => void;
  onUpdateDescription: (id: number, description: string) => void;
}> = ({ question, onToggle, onChangeChartType, onUpdateTitle, onUpdateDescription }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(question.title);
  const [editDescription, setEditDescription] = useState(question.description);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleSaveEdit = () => {
    onUpdateTitle(question.id, editTitle);
    onUpdateDescription(question.id, editDescription);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(question.title);
    setEditDescription(question.description);
    setIsEditing(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        opacity: question.enabled ? 1 : 0.6,
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Handle de drag separado */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              cursor: isDragging ? 'grabbing' : 'grab',
              color: 'text.secondary',
              mr: 1,
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            ⋮⋮
          </Box>
          
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {question.icon}
              <FormControlLabel
                control={
                  <Switch
                    checked={question.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggle(question.id);
                    }}
                    size="small"
                  />
                }
                label=""
                sx={{ ml: 1, mr: 1 }}
              />
              {isEditing ? (
                <TextField
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ ml: 1 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Typography variant="subtitle2" sx={{ ml: 1, flexGrow: 1 }}>
                  {question.title}
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                sx={{ ml: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {isEditing ? (
              <TextField
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {question.description}
              </Typography>
            )}

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                >
                  Guardar
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {chartTypes.map((chartType) => (
                <Tooltip key={chartType.type} title={chartType.description}>
                  <Chip
                    icon={chartType.icon as React.ReactElement}
                    label={chartType.label}
                    variant={question.chartType === chartType.type ? 'filled' : 'outlined'}
                    color={question.chartType === chartType.type ? 'primary' : 'default'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeChartType(question.id, chartType.type);
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: chartType.color + '20'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
          
          <Chip
            label={question.context}
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const SondeoConfigModal: React.FC<SondeoConfigModalProps> = ({
  open,
  onClose,
  selectedContexts
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Preguntas predefinidas basadas en contextos
  const getQuestionsByContext = (contexts: string[]): Question[] => {
    const baseQuestions: Question[] = [];
    
    if (contexts.includes('tendencias')) {
      baseQuestions.push(
        {
          id: 1,
          title: '¿Cuáles son las tendencias más relevantes actualmente?',
          icon: <TrendingUpIcon />,
          description: 'Analiza las tendencias con mayor impacto y relevancia social',
          context: 'tendencias',
          enabled: true,
          chartType: 'bar'
        },
        {
          id: 2,
          title: '¿Qué temas generan mayor engagement en redes sociales?',
          icon: <AssessmentIcon />,
          description: 'Identifica los temas que más interacción generan',
          context: 'tendencias',
          enabled: true,
          chartType: 'pie'
        },
        {
          id: 3,
          title: '¿Cómo evolucionan las tendencias a lo largo del tiempo?',
          icon: <ShowChartIcon />,
          description: 'Visualiza la evolución temporal de las tendencias',
          context: 'tendencias',
          enabled: false,
          chartType: 'line'
        },
        {
          id: 4,
          title: '¿Qué tendencias tienen mayor alcance geográfico?',
          icon: <LocationOnIcon />,
          description: 'Mapea la distribución geográfica de las tendencias',
          context: 'tendencias',
          enabled: false,
          chartType: 'bar'
        }
      );
    }

    if (contexts.includes('noticias')) {
      baseQuestions.push(
        {
          id: 5,
          title: '¿Cuáles son las noticias más impactantes del período?',
          icon: <ArticleIcon />,
          description: 'Identifica las noticias con mayor impacto mediático',
          context: 'noticias',
          enabled: true,
          chartType: 'bar'
        },
        {
          id: 6,
          title: '¿Qué categorías de noticias predominan?',
          icon: <AssessmentIcon />,
          description: 'Analiza la distribución por categorías temáticas',
          context: 'noticias',
          enabled: true,
          chartType: 'pie'
        },
        {
          id: 7,
          title: '¿Cómo varía el sentimiento en las noticias?',
          icon: <ShowChartIcon />,
          description: 'Evalúa la polaridad emocional de las noticias',
          context: 'noticias',
          enabled: false,
          chartType: 'line'
        },
        {
          id: 8,
          title: '¿Qué fuentes tienen mayor credibilidad?',
          icon: <LocationOnIcon />,
          description: 'Analiza la confiabilidad de las fuentes informativas',
          context: 'noticias',
          enabled: false,
          chartType: 'bar'
        }
      );
    }

    if (contexts.includes('codex')) {
      baseQuestions.push(
        {
          id: 9,
          title: '¿Qué documentos son más relevantes para el análisis?',
          icon: <LibraryBooksIcon />,
          description: 'Identifica los documentos con mayor valor analítico',
          context: 'codex',
          enabled: true,
          chartType: 'bar'
        },
        {
          id: 10,
          title: '¿Cómo se distribuyen los temas en el codex?',
          icon: <AssessmentIcon />,
          description: 'Visualiza la distribución temática del conocimiento',
          context: 'codex',
          enabled: true,
          chartType: 'pie'
        },
        {
          id: 11,
          title: '¿Qué patrones emergen del análisis documental?',
          icon: <ShowChartIcon />,
          description: 'Identifica patrones y conexiones en los documentos',
          context: 'codex',
          enabled: false,
          chartType: 'line'
        },
        {
          id: 12,
          title: '¿Cuál es la calidad de la información disponible?',
          icon: <LocationOnIcon />,
          description: 'Evalúa la calidad y completitud de los datos',
          context: 'codex',
          enabled: false,
          chartType: 'bar'
        }
      );
    }

    return baseQuestions;
  };

  const [questions, setQuestions] = useState<Question[]>(() => 
    getQuestionsByContext(selectedContexts)
  );

  // Mapeo de contextos para labels y colores
  const contextLabels: Record<string, string> = {
    tendencias: 'Tendencias',
    noticias: 'Noticias',
    codex: 'Codex'
  };

  const contextColors: Record<string, string> = {
    tendencias: '#F59E0B',
    noticias: '#3B82F6',
    codex: '#8B5CF6'
  };

  const toggleQuestion = (questionId: number) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, enabled: !q.enabled } : q
      )
    );
  };

  const changeChartType = (questionId: number, chartType: 'bar' | 'pie' | 'line') => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, chartType } : q
      )
    );
  };

  const updateQuestionTitle = (questionId: number, newTitle: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, title: newTitle } : q
      )
    );
  };

  const updateQuestionDescription = (questionId: number, newDescription: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, description: newDescription } : q
      )
    );
  };

  // Handler para drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const applyTemplate = (template: Template) => {
    const newQuestions = template.questions.map((q, index) => ({
      ...q,
      id: Date.now() + index // Generate unique IDs
    }));
    setQuestions(newQuestions);
    setCurrentTab(1); // Switch to questions tab
  };

  const enabledCount = questions.filter(q => q.enabled).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EditIcon />
          <Typography variant="h5" fontWeight="bold">
            Configuración de Sondeos
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Pestañas */}
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab 
            icon={<TemplateIcon />} 
            label="Plantillas" 
            iconPosition="start"
          />
          <Tab 
            icon={<EditIcon />} 
            label="Preguntas Personalizadas" 
            iconPosition="start"
          />
        </Tabs>

        {/* Contenido de Plantillas */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1F2937', mb: 3 }}>
              🎯 Selecciona una Plantilla Temática
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  sx={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      borderColor: template.color
                    }
                  }}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ color: template.color, fontSize: '2rem' }}>
                        {template.icon}
                      </Box>
                      <Typography variant="h6" sx={{ color: '#1F2937' }}>
                        {template.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>

                    <Typography variant="caption" sx={{ color: template.color, fontWeight: 600 }}>
                      {template.questions.length} preguntas incluidas
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Contenido de Preguntas Personalizadas */}
        {currentTab === 1 && (
          <>
            {/* Resumen de configuración */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%)',
                p: 3,
                borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                📊 Resumen de Configuración
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Chip
                  label={`${enabledCount} preguntas activas`}
                  color="primary"
                  variant="filled"
                />
                <Chip
                  label={`${selectedContexts.length} contextos seleccionados`}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Lista de preguntas */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1F2937', mb: 3 }}>
                🎯 Preguntas de Análisis
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedContexts.includes('tendencias') && (
                  <TrendSelector 
                    selectedTrends={selectedTrends} 
                    onTrendChange={setSelectedTrends} 
                  />
                )}
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {questions.map((question) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        onToggle={toggleQuestion}
                        onChangeChartType={changeChartType}
                        onUpdateTitle={updateQuestionTitle}
                        onUpdateDescription={updateQuestionDescription}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderTop: '1px solid rgba(59, 130, 246, 0.1)'
        }}
      >
        <Button onClick={onClose} sx={{ color: '#6B7280' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
            }
          }}
        >
          Guardar Configuración
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SondeoConfigModal; 