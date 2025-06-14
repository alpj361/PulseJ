import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DataObjectIcon from '@mui/icons-material/DataObject';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface AIResponseDisplayProps {
  response: string;
  contexts: string[];
  contextData?: any;
  onContextToggle?: () => void;
  showContext?: boolean;
  sources?: any;
  loading?: boolean;
}

const contextLabels: Record<string, string> = {
  'tendencias': 'Tendencias',
  'noticias': 'Noticias', 
  'codex': 'Documentos'
};

const contextColors: Record<string, string> = {
  'tendencias': '#3B82F6',
  'noticias': '#10B981',
  'codex': '#8B5CF6'
};

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  response,
  contexts,
  contextData,
  onContextToggle,
  showContext = false,
  sources,
  loading = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const formatContextPreview = (contextData: any) => {
    if (!contextData) return { input: '', contexts: contexts, dataPoints: 0 };
    
    const preview = {
      input: contextData.input || '',
      contexts: contexts,
      dataPoints: 0
    };

    // Count data points
    if (contextData.tendencias) preview.dataPoints += contextData.tendencias.length || 0;
    if (contextData.noticias) preview.dataPoints += contextData.noticias.length || 0;
    if (contextData.codex) preview.dataPoints += contextData.codex.length || 0;
    if (contextData.wordcloud) preview.dataPoints += contextData.wordcloud.length || 0;
    if (contextData.categorias) preview.dataPoints += contextData.categorias.length || 0;

    return preview;
  };

  const contextPreview = formatContextPreview(contextData);

  if (loading) {
    return (
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}
          >
            <SmartToyIcon />
          </Box>
          <Typography variant="h6" fontWeight="600">
            Analizando con IA...
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Box 
            sx={{ 
              width: '30%', 
              height: 4, 
              borderRadius: 2, 
              background: 'rgba(255,255,255,0.5)',
              animation: 'loading 1.5s ease-in-out infinite'
            }} 
          />
          <Box 
            sx={{ 
              width: '50%', 
              height: 4, 
              borderRadius: 2, 
              background: 'rgba(255,255,255,0.3)',
              animation: 'loading 1.5s ease-in-out infinite 0.2s'
            }} 
          />
          <Box 
            sx={{ 
              width: '20%', 
              height: 4, 
              borderRadius: 2, 
              background: 'rgba(255,255,255,0.4)',
              animation: 'loading 1.5s ease-in-out infinite 0.4s'
            }} 
          />
        </Box>
        
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Procesando contexto y generando insights...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={3}
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              <AutoAwesomeIcon />
            </Box>
            <Typography variant="h6" fontWeight="600">
              Análisis
            </Typography>
          </Box>
          
          <IconButton
            onClick={handleCopyResponse}
            sx={{ 
              color: 'white', 
              background: 'rgba(255,255,255,0.1)',
              '&:hover': { background: 'rgba(255,255,255,0.2)' }
            }}
          >
            <CopyAllIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Context chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {contexts.map((context) => (
            <Chip
              key={context}
              label={contextLabels[context] || context}
              size="small"
              sx={{
                background: contextColors[context] || '#666',
                color: 'white',
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            />
          ))}
          {contextPreview.dataPoints > 0 && (
            <Chip
              label={`${contextPreview.dataPoints} puntos de datos`}
              size="small"
              sx={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 500
              }}
            />
          )}
        </Box>
        
        {copied && (
          <Typography variant="body2" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
            ✓ Respuesta copiada al portapapeles
          </Typography>
        )}
      </Box>
      
      {/* Response content */}
      <Box sx={{ p: 3, pt: 0, color: 'white' }}>
        <Typography 
          variant="body1" 
          sx={{ 
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            fontSize: '1.1rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {response}
        </Typography>
      </Box>
      
      {/* Actions */}
      <Box 
        sx={{ 
          p: 3, 
          pt: 0,
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        <Button
          variant="outlined"
          startIcon={showContext ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={onContextToggle}
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.1)'
            }
          }}
          size="small"
        >
          {showContext ? 'Ocultar contexto' : 'Ver contexto enviado'}
        </Button>
        
        {sources && (
          <Button
            variant="outlined"
            startIcon={<DataObjectIcon />}
            disabled
            sx={{
              color: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.2)'
            }}
            size="small"
          >
            Fuentes disponibles
          </Button>
        )}
      </Box>
      
      {/* Context accordion */}
      {showContext && contextData && (
        <Accordion 
          expanded={showContext}
          sx={{ 
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            boxShadow: 'none',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
            sx={{ 
              color: 'white',
              '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2 }
            }}
          >
            <DataObjectIcon />
            <Typography variant="subtitle1" fontWeight="600">
              Contexto Enviado ({contextPreview.dataPoints} elementos)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ color: 'white' }}>
            <Box
              component="pre"
              sx={{
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(0,0,0,0.2)',
                p: 2,
                borderRadius: 2,
                maxHeight: 400,
                overflow: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace'
              }}
            >
              {JSON.stringify(contextData, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default AIResponseDisplay; 