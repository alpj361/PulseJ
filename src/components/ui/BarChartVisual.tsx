import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartVisualProps {
  data: any[];
  xAxisKey: string;
  barKey: string;
  height?: number;
  title?: string;
  colors?: string[];
  showGrid?: boolean;
  emptyMessage?: string;
}

/**
 * Componente para visualizar datos en un gráfico de barras
 */
const BarChartVisual: React.FC<BarChartVisualProps> = ({
  data,
  xAxisKey,
  barKey,
  height = 250,
  title,
  colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#84CC16'],
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
        <BarChart
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
            formatter={(value: number) => [value, barKey]}
            labelFormatter={(label) => `${xAxisKey}: ${label}`}
          />
          <Bar dataKey={barKey} name={barKey}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarChartVisual; 