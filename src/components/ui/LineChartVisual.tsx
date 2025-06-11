import React from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartVisualProps {
  data: any[];
  xAxisKey: string;
  lineKey: string;
  height?: number;
  title?: string;
  color?: string;
  showGrid?: boolean;
  emptyMessage?: string;
}

/**
 * Componente para visualizar datos en un gráfico de líneas
 */
const LineChartVisual: React.FC<LineChartVisualProps> = ({
  data,
  xAxisKey,
  lineKey,
  height = 250,
  title,
  color = '#3B82F6',
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
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
        >
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
            formatter={(value: number) => [value, lineKey]}
            labelFormatter={(label) => `${xAxisKey}: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey={lineKey} 
            stroke={color} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChartVisual; 