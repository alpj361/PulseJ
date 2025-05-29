import React from 'react';
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

const Sondeos: React.FC = () => {
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
        
        <Button
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'semibold',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          🧠 Sondear
        </Button>
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