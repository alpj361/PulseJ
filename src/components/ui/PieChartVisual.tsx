import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Button, Chip } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';

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
  height = 300, // Incrementado para mejor visualización
  title,
  colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#84CC16'],
  showLegend = true,
  emptyMessage = 'No hay datos disponibles para visualizar'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>();
  const [showAllData, setShowAllData] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Función para procesar datos (limitar a 6 elementos para evitar sobrecarga visual)
  const processData = () => {
    if (data.length <= 6 || showAllData) return data;
    
    // Si hay más de 6 elementos, agrupa los más pequeños en "Otros"
    const sortedData = [...data].sort((a, b) => b[valueKey] - a[valueKey]);
    const topItems = sortedData.slice(0, 5);
    
    // Sumar los valores de los elementos restantes
    const otherValue = sortedData.slice(5).reduce((sum, item) => sum + item[valueKey], 0);
    const otherItems = sortedData.slice(5);
    
    return [
      ...topItems, 
      { 
        [nameKey]: 'Otros', 
        [valueKey]: otherValue,
        otherItems // Guardar los elementos agrupados para mostrarlos en el tooltip
      }
    ];
  };
  
  const processedData = processData();

  // Calcular el valor total para porcentajes
  const total = data.reduce((sum, item) => sum + item[valueKey], 0);

  // Configuración para la leyenda
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    // Limitar la cantidad de elementos en la leyenda si hay muchos
    const displayPayload = isMobile && payload.length > 5 && !showAllData
      ? payload.slice(0, 4).concat({
          value: `+${payload.length - 4} más`,
          color: '#999',
          payload: { [nameKey]: 'more' }
        })
      : payload;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        mt: 2
      }}>
        {displayPayload.map((entry: any, index: number) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 1, 
              my: 0.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: selectedCategory === null || selectedCategory === entry.value || 
                      activeIndex === undefined || activeIndex === index ? 1 : 0.5
            }}
            onClick={() => {
              if (entry.value === `+${payload.length - 4} más`) {
                setShowAllData(true);
                return;
              }
              
              setActiveIndex(activeIndex === index ? undefined : index);
              setSelectedCategory(selectedCategory === entry.value ? null : entry.value);
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: entry.color, 
                mr: 1,
                borderRadius: '50%'
              }} 
            />
            <Typography variant="caption" sx={{ 
              fontSize: 12, 
              fontWeight: selectedCategory === entry.value || activeIndex === index ? 'bold' : 'normal',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Función para renderizar un sector activo (animación al hacer hover/click)
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    );
  };

  // Configuración para tooltips personalizados
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item[valueKey] / total) * 100).toFixed(1);
      
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
            {item[nameKey]}
          </Typography>
          <Typography variant="body2">
            {`${valueKey}: ${item[valueKey]}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${percentage}% del total`}
          </Typography>
          
          {/* Si es la categoría "Otros", mostrar detalles de los elementos agrupados */}
          {item[nameKey] === 'Otros' && item.otherItems && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'grey.300' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                Incluye:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {item.otherItems.slice(0, 6).map((subItem: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={`${subItem[nameKey]}: ${subItem[valueKey]}`}
                    size="small"
                    sx={{ fontSize: '10px', height: 20 }}
                  />
                ))}
                {item.otherItems.length > 6 && (
                  <Typography variant="caption">
                    y {item.otherItems.length - 6} más...
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Calcular el tamaño del radio en función del espacio disponible
  const outerRadius = Math.min(height * 0.35, 100);
  const innerRadius = outerRadius * 0.6;

  return (
    <Box sx={{ width: '100%', height, mb: 2 }}>
      {title && (
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={data.length > 6 ? "85%" : "100%"}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy={isMobile ? "40%" : "45%"}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={valueKey}
            nameKey={nameKey}
            paddingAngle={4}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => {
              setActiveIndex(index);
              setSelectedCategory(processedData[index][nameKey]);
            }}
            onMouseLeave={() => {
              if (!selectedCategory) {
                setActiveIndex(undefined);
              }
            }}
            onClick={(_, index) => {
              const clickedCategory = processedData[index][nameKey];
              setSelectedCategory(selectedCategory === clickedCategory ? null : clickedCategory);
              setActiveIndex(selectedCategory === clickedCategory ? undefined : index);
            }}
            animationDuration={1000}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
                stroke={theme.palette.background.paper}
                strokeWidth={2}
                opacity={selectedCategory === null || selectedCategory === entry[nameKey] ? 1 : 0.5}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} verticalAlign="bottom" />}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Botón para mostrar/ocultar datos agrupados */}
      {data.length > 6 && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => {
              setShowAllData(!showAllData);
              setSelectedCategory(null);
              setActiveIndex(undefined);
            }}
            sx={{ 
              fontSize: 12, 
              textTransform: 'none', 
              borderRadius: 4,
              px: 2
            }}
          >
            {showAllData ? 'Mostrar vista simplificada' : 'Ver todas las categorías'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PieChartVisual; 