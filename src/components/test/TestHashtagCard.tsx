import React from 'react';
import { Box, Typography, Container, Grid, Tabs, Tab } from '@mui/material';
import ActivityCard from '../ui/ActivityCard';
import sampleData from '../../sample/sample_hashtag_data.json';
import sampleData2 from '../../sample/sample_hashtag_data2.json';

const TestHashtagCard = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  
  // Convertir los datos de ejemplo a string para simular cómo vendrían de la base de datos
  const jsonString1 = JSON.stringify(sampleData);
  const jsonString2 = JSON.stringify(sampleData2);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tarjetas de Actividad con Nuevo Formato JSON
      </Typography>
      
      <Typography sx={{ mb: 3 }}>
        Las tarjetas ahora muestran datos enriquecidos: sentimiento, tendencias y detalles de tweets.
        Haz clic en la flecha para expandir y ver los tweets individuales.
      </Typography>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Ejemplo Barcelona" />
        <Tab label="Ejemplo Fútbol" />
      </Tabs>
      
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ActivityCard 
              value={jsonString1}
              type="Hashtag"
              created_at={new Date().toISOString()}
              sentimiento="neutral"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Estructura del JSON:
              </Typography>
              <pre style={{ 
                overflowX: 'auto', 
                whiteSpace: 'pre-wrap',
                fontSize: '0.8rem',
                backgroundColor: '#f8f8f8',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #eaeaea'
              }}>
                {JSON.stringify(sampleData, null, 2)}
              </pre>
            </Box>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ActivityCard 
              value={jsonString2}
              type="Hashtag"
              created_at={new Date().toISOString()}
              sentimiento="positivo"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Estructura del JSON:
              </Typography>
              <pre style={{ 
                overflowX: 'auto', 
                whiteSpace: 'pre-wrap',
                fontSize: '0.8rem',
                backgroundColor: '#f8f8f8',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #eaeaea'
              }}>
                {JSON.stringify(sampleData2, null, 2)}
              </pre>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default TestHashtagCard; 