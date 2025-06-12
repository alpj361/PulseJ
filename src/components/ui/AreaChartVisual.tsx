import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';

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
  showAverage?: boolean;
}

/**
 * Componente para visualizar datos en un gráfico de áreas
 */
const AreaChartVisual: React.FC<AreaChartVisualProps> = ({
  data,
  xAxisKey,
  areaKey,
  height = 300, // Incrementado para mejor visualización
  title,
  color = '#3B82F6',
  gradientStart = '#3B82F6',
  gradientEnd = 'rgba(59, 130, 246, 0.1)',
  showGrid = true,
  emptyMessage = 'No hay datos disponibles para visualizar',
  showAverage = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));

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

  // Calcular márgenes basados en el tamaño de la pantalla
  const chartMargins = {
    top: 15,
    right: isMobile ? 10 : 30,
    left: isMobile ? 0 : 20,
    bottom: isMobile ? 80 : 40 // Más espacio para etiquetas de eje X
  };

  // Calcular el valor promedio para la línea de referencia
  const average = showAverage ? 
    data.reduce((sum, item) => sum + item[areaKey], 0) / data.length : 
    undefined;

  // Customizar tooltip para mejor presentación
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          backgroundColor: 'background.paper', 
          p: 1.5, 
          border: '1px solid', 
          borderColor: 'grey.300', 
          borderRadius: 1,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              background: `linear-gradient(135deg, ${gradientStart} 0%, ${color} 100%)`,
              borderRadius: '50%' 
            }} />
            <Typography variant="body2">
              {`${payload[0].name}: ${payload[0].value}`}
            </Typography>
          </Box>
          {showAverage && average !== undefined && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              {`Promedio: ${average.toFixed(2)}`}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height, mb: 2 }}>
      {title && (
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={chartMargins}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientStart} stopOpacity={0.8} />
              <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />}
          <XAxis 
            dataKey={xAxisKey} 
            angle={isMobile ? -45 : 0} 
            textAnchor={isMobile ? "end" : "middle"} 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            height={isMobile ? 80 : 50}
            tickMargin={10}
            tickFormatter={(value) => {
              // Si es fecha, darle formato más corto para pantallas pequeñas
              if (value.includes('-') && isMobile) {
                return value.split('-').slice(1).join('-');
              }
              return value;
            }}
          />
          <YAxis 
            width={35}
            tickMargin={8}
            tickFormatter={(value) => 
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => <span style={{ fontSize: '12px', color: '#666' }}>{value}</span>}
          />
          {showAverage && average !== undefined && (
            <ReferenceLine 
              y={average} 
              stroke="#FF5722"
              strokeDasharray="3 3"
              label={{ 
                position: 'right',
                value: 'Promedio',
                fill: '#FF5722',
                fontSize: 11
              }}
            />
          )}
          <Area 
            type="monotone" 
            dataKey={areaKey} 
            name={areaKey}
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorGradient)"
            activeDot={{ 
              r: isMobile ? 5 : 6,
              fill: color,
              stroke: theme.palette.background.paper,
              strokeWidth: 2
            }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AreaChartVisual; 