import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { VisibilityOutlined } from '@mui/icons-material';

export interface AnalisisGeneradoProps {
  /** Texto principal resumido */
  resumen: string;
  /** Conclusión opcional (insight) */
  conclusion?: string;
  /** Metodología opcional */
  methodology?: string;
  /** Métricas rápidas para mostrar en badges */
  metrics?: Array<{ label: string; value: string | number; color?: string }>;
}

/**
 * Componente de sección "Análisis Generado", inspirado en SondeosSample.
 * Queda estilizado con glassmorphism y adaptable a dark/light mode.
 */
const AnalisisGenerado: React.FC<AnalisisGeneradoProps> = ({
  resumen,
  conclusion,
  methodology,
  metrics = []
}) => {
  return (
    <Box
      sx={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 3,
        p: 4
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <VisibilityOutlined color="primary" sx={{ fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          Resumen Ejecutivo
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
        {resumen}
      </Typography>

      {conclusion && (
        <>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
            Conclusión
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {conclusion}
          </Typography>
        </>
      )}

      {methodology && (
        <>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
            Metodología
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {methodology}
          </Typography>
        </>
      )}

      {metrics.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          {metrics.map((m, idx) => (
            <Chip
              key={idx}
              label={`${m.label}: ${m.value}`}
              size="small"
              sx={{
                backgroundColor: m.color || 'primary.light',
                color: 'primary.contrastText'
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default AnalisisGenerado;
