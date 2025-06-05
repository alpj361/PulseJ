import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CategoryCount } from '../../types';
import { formatCount } from '../../utils/formatNumbers';

interface BarChartProps {
  data: CategoryCount[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title = 'Distribución por Categoría' }) => {
  const theme = useTheme();
  
  // Sortear datos por conteo (más alto primero) - manteniendo la lógica original
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  // Paleta de colores profesional - inspirada en tu WordCloud
  const barColors = [
    '#1e40af', // Política - azul oscuro
    '#0f766e', // Deportes - teal
    '#7c2d92', // Entretenimiento - púrpura
    '#c2410c', // Tecnología - naranja
    '#065f46', // Economía - verde oscuro
    '#b91c1c', // Salud - rojo
    '#6b21a8', // Educación - púrpura oscuro
    '#374151'  // Otros - gris
  ];

  // Componente personalizado para tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 1.5,
            boxShadow: 3,
            minWidth: 120
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            <strong>{formatCount(payload[0].value)}</strong> tendencias
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Componente personalizado para etiquetas del eje X
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const maxLength = 10;
    const text = payload.value.length > maxLength 
      ? payload.value.substring(0, maxLength) + '...' 
      : payload.value;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill={theme.palette.text.secondary}
          fontSize="11"
          fontWeight="bold"
          transform="rotate(-25)"
        >
          {text}
        </text>
      </g>
    );
  };

  // Si no hay datos
  if (!sortedData || sortedData.length === 0) {
    return (
      <Card sx={{ height: 400 }}>
        <CardHeader>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </CardHeader>
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              color: 'text.secondary'
            }}
          >
            <Typography variant="body1">
              No hay datos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: 450,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardHeader sx={{ pb: 1 }}>
        <Typography 
          variant="h6" 
          component="h3"
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
        >
          Total de categorías: {sortedData.length} • Total tendencias: {sortedData.reduce((acc, item) => acc + item.count, 0)}
        </Typography>
      </CardHeader>
      
      <CardContent sx={{ pt: 0 }}>
        <ResponsiveContainer width="100%" height={350}>
          <RechartsBarChart 
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme.palette.divider}
              opacity={0.5}
            />
            
            <XAxis 
              dataKey="category"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              height={80}
            />
            
            <YAxis 
              tick={{ 
                fontSize: 11, 
                fill: theme.palette.text.secondary,
                fontWeight: 'bold'
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCount}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ 
                fill: theme.palette.action.hover,
                radius: 4
              }}
            />
            
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              stroke={theme.palette.divider}
              strokeWidth={1}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BarChart;