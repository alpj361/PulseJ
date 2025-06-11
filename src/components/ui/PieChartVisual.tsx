import React from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartVisualProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  height?: number;
  title?: string;
  colors?: string[];
  showLegend?: boolean;
  emptyMessage?: string;
}

/**
 * Componente para visualizar datos en un gráfico de pastel
 */
const PieChartVisual: React.FC<PieChartVisualProps> = ({
  data,
  nameKey,
  valueKey,
  height = 250,
  title,
  colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#84CC16'],
  showLegend = true,
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

  // Configuración para la leyenda
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontSize: 12 }}>
        {payload.map((entry: any, index: number) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2, 
              mb: 0.5 
            }}
          >
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                backgroundColor: entry.color, 
                mr: 0.5,
                borderRadius: '50%'
              }} 
            />
            <Typography variant="caption" sx={{ fontSize: 11 }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Configuración para tooltips personalizados
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          backgroundColor: 'background.paper', 
          p: 1, 
          border: '1px solid', 
          borderColor: 'grey.300', 
          borderRadius: 1
        }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {payload[0].name}
          </Typography>
          <Typography variant="caption" display="block">
            {`${valueKey}: ${payload[0].value}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`${Math.round(payload[0].percent * 100)}%`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={height > 200 ? 50 : 30}
            outerRadius={height > 200 ? 80 : 60}
            dataKey={valueKey}
            nameKey={nameKey}
            paddingAngle={2}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} verticalAlign="bottom" />}
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PieChartVisual; 