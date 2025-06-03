import React, { useEffect, useRef } from 'react';
import { CategoryCount } from '../../types';
import { useTheme } from '@mui/material/styles';
import { formatCount } from '../../utils/formatNumbers';

interface BarChartProps {
  data: CategoryCount[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title = 'Distribución por Categoría' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  
  // Animación para las barras
  const animationRef = useRef<number | null>(null);
  const animationProgress = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Sortear datos por conteo (más alto primero)
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Calcular escalas
    const maxCount = Math.max(...sortedData.map(item => item.count));
    const barWidth = chartWidth / sortedData.length * 0.6;
    const barSpacing = chartWidth / sortedData.length * 0.4;
    
    // Colores según el tema
    const isDark = theme.palette.mode === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const axisColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    
    // Paleta de colores para las barras
    const barColors = [
      { from: theme.palette.primary.main, to: theme.palette.primary.light },
      { from: '#3b82f6', to: '#93c5fd' },
      { from: '#8b5cf6', to: '#c4b5fd' },
      { from: '#ec4899', to: '#f9a8d4' },
      { from: '#f97316', to: '#fdba74' }
    ];
    
    // Animación de dibujado
    const animate = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, width, height);
      
      // Incrementar progreso de animación
      animationProgress.current += 0.02;
      if (animationProgress.current > 1) {
        animationProgress.current = 1;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
      
      // Dibujar eje Y
      ctx.beginPath();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.stroke();
      
      // Dibujar eje X
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();
      
      // Dibujar etiquetas y líneas de cuadrícula del eje Y
      const yTickCount = 6;
      ctx.textAlign = 'right';
      ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
      
      for (let i = 0; i <= yTickCount; i++) {
        const value = Math.round((maxCount / yTickCount) * i);
        const y = height - padding.bottom - (chartHeight / yTickCount) * i;
        
        // Línea de cuadrícula
        ctx.beginPath();
        ctx.strokeStyle = gridColor;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Etiqueta
        ctx.fillStyle = textColor;
        ctx.fillText(formatCount(value), padding.left - 10, y + 4);
      }
      
      // Dibujar barras y etiquetas del eje X
      ctx.textAlign = 'center';
      
      sortedData.forEach((item, index) => {
        const x = padding.left + (chartWidth / sortedData.length) * index + (chartWidth / sortedData.length - barWidth) / 2;
        const fullBarHeight = (item.count / maxCount) * chartHeight;
        // Aplicar animación
        const currentBarHeight = fullBarHeight * animationProgress.current;
        const y = height - padding.bottom - currentBarHeight;
        
        // Seleccionar color para esta barra
        const colorIndex = index % barColors.length;
        const colorFrom = barColors[colorIndex].from;
        const colorTo = barColors[colorIndex].to;
        
        // Barra con gradiente
        const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
        gradient.addColorStop(0, colorFrom);
        gradient.addColorStop(1, colorTo);
        
        // Dibujar sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        
        // Barra redondeada
        ctx.beginPath();
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + barWidth - 4, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + 4);
        ctx.lineTo(x + barWidth, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom);
        ctx.lineTo(x, y + 4);
        ctx.quadraticCurveTo(x, y, x + 4, y);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Resetear sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Borde
        ctx.strokeStyle = colorFrom;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Valor de la barra
        if (currentBarHeight > 25) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
          ctx.fillText(formatCount(item.count), x + barWidth / 2, y + 18);
        }
        
        // Etiqueta del eje X
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
        
        // Rotar etiqueta si es demasiado larga
        ctx.save();
        ctx.translate(x + barWidth / 2, height - padding.bottom + 15);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(item.category, 0, 0);
        ctx.restore();
      });
      
      // Continuar animación
      if (animationProgress.current < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Iniciar animación
    animationProgress.current = 0;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
    
    // Limpiar animación al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, title, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{
        maxWidth: '100%',
        height: 'auto',
        margin: '0 auto',
        borderRadius: theme.shape.borderRadius * 2,
        transition: 'all 0.3s ease'
      }}
    />
  );
};

export default BarChart;