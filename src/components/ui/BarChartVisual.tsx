import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts';

interface BarChartVisualProps {
  data: any[];
  xAxisKey: string;
  barKey: string;
  height?: number;
  title?: string;
  colors?: string[];
  showGrid?: boolean;
  emptyMessage?: string;
  showAverage?: boolean;
}

/**
 * Componente para visualizar datos en un gráfico de barras
 */
const BarChartVisual: React.FC<BarChartVisualProps> = ({
  data,
  xAxisKey,
  barKey,
  height = 300, // Incrementado para mejor visualización
  title,
  colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#84CC16'],
  showGrid = true,
  emptyMessage = 'No hay datos disponibles para visualizar',
  showAverage = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const [dataLimit, setDataLimit] = useState(isMobile ? 5 : 7);
  const [showAll, setShowAll] = useState(false);

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
    top: 10,
    right: isMobile ? 10 : 30,
    left: isMobile ? 5 : 20,
    bottom: isMobile ? 100 : 60 // Más espacio para etiquetas de eje X
  };

  // Procesar los datos según la cantidad y el estado de visualización
  let processedData = [...data];

  // Si hay muchos datos y no se ha pedido mostrar todos, limitar
  if (data.length > dataLimit && !showAll) {
    processedData = data.slice(0, dataLimit);
  }

  // Calcular el tamaño de las barras según la cantidad de datos
  const calculatedBarSize = Math.max(
    Math.min(
      // Ajustar tamaño según cantidad de elementos
      (processedData.length <= 3) ? 50 : 
      (processedData.length <= 5) ? 40 : 
      (processedData.length <= 7) ? 30 : 
      (processedData.length <= 10) ? 25 : 20, 
      // No permitir barras demasiado grandes en móvil
      isMobile ? 25 : 50
    ), 
    // Mínimo tamaño
    10
  );

  // Función para acortar etiquetas largas
  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    // Determinar longitud máxima según pantalla y número de elementos
    const maxLength = isMobile ? 
      (processedData.length > 5 ? 8 : 12) : 
      (processedData.length > 7 ? 12 : 20);
    
    if (value.length <= maxLength) return value;
    
    // Acortar y añadir puntos suspensivos
    return `${value.substring(0, maxLength)}...`;
  };

  // Calcular el valor promedio para la línea de referencia
  const average = showAverage ? 
    data.reduce((sum, item) => sum + item[barKey], 0) / data.length : 
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: 250
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {label} {/* Mostrar etiqueta completa en tooltip */}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: payload[0].color, borderRadius: '50%' }} />
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
      <ResponsiveContainer width="100%" height={data.length > dataLimit ? "85%" : "100%"}>
        <BarChart
          data={processedData}
          margin={chartMargins}
          barSize={calculatedBarSize}
          layout={processedData.length > 10 ? "vertical" : "horizontal"}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
          <XAxis 
            dataKey={xAxisKey} 
            angle={isMobile || processedData.length > 5 ? -45 : 0} 
            textAnchor={isMobile || processedData.length > 5 ? "end" : "middle"} 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            height={isMobile || processedData.length > 5 ? 80 : 50}
            interval={0}
            tickMargin={10}
            tickFormatter={formatXAxisTick}
            type={processedData.length > 10 ? "number" : "category"}
          />
          <YAxis 
            width={35}
            tickMargin={10}
            type={processedData.length > 10 ? "category" : "number"}
            dataKey={processedData.length > 10 ? xAxisKey : undefined}
            tickFormatter={processedData.length > 10 ? formatXAxisTick : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
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
          <Bar 
            dataKey={barKey} 
            name={barKey}
            animationDuration={1500}
            radius={[4, 4, 0, 0]}
            layout={processedData.length > 10 ? "vertical" : "horizontal"}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Botón para mostrar/ocultar todos los datos cuando hay muchos */}
      {data.length > dataLimit && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => setShowAll(!showAll)}
            sx={{ 
              fontSize: 12, 
              textTransform: 'none', 
              borderRadius: 4,
              px: 2
            }}
          >
            {showAll ? 'Mostrar menos datos' : `Ver todos los datos (${data.length})`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BarChartVisual; 