import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartVisualProps {
  data: any[];
  xAxisKey: string;
  areaKey: string;
  height?: number;
  title?: string;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  showGrid?: boolean;
  emptyMessage?: string;
}

/**
 * Componente para visualizar datos en un gráfico de áreas
 */
const AreaChartVisual: React.FC<AreaChartVisualProps> = ({
  data,
  xAxisKey,
  areaKey,
  height = 250,
  title,
  color = '#3B82F6',
  gradientStart = '#3B82F6',
  gradientEnd = 'rgba(59, 130, 246, 0.1)',
  showGrid = true,
  emptyMessage = 'No hay datos disponibles para visualizar'
}) => {
  // Validar que hay datos para mostrar
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'grey.300',
        borderRadius: 1
      }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientStart} stopOpacity={0.8} />
              <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxisKey} 
            angle={-45} 
            textAnchor="end" 
            tick={{ fontSize: 12 }}
            height={60}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [value, areaKey]}
            labelFormatter={(label) => `${xAxisKey}: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AreaChartVisual; 