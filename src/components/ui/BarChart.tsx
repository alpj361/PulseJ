import React, { useEffect, useRef } from 'react';
import { CategoryCount } from '../../types';

interface BarChartProps {
  data: CategoryCount[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title = 'Distribución por Categoría' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw title
    // ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#fff' : '#333';
    // ctx.font = 'bold 16px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.fillText(title, width / 2, 20);

    // Sort data by count (highest first)
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Calculate scales
    const maxCount = Math.max(...sortedData.map(item => item.count));
    const barWidth = chartWidth / sortedData.length * 0.6;
    const barSpacing = chartWidth / sortedData.length * 0.4;
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();
    
    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Draw y-axis labels and grid lines
    const yTickCount = 5;
    ctx.textAlign = 'right';
    ctx.font = '12px sans-serif';
    
    for (let i = 0; i <= yTickCount; i++) {
      const value = Math.round((maxCount / yTickCount) * i);
      const y = height - padding.bottom - (chartHeight / yTickCount) * i;
      
      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#444' : '#e0e0e0';
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#aaa' : '#666';
      ctx.fillText(value.toString(), padding.left - 10, y + 5);
    }
    
    // Draw bars and x-axis labels
    ctx.textAlign = 'center';
    
    sortedData.forEach((item, index) => {
      const x = padding.left + (chartWidth / sortedData.length) * index + (chartWidth / sortedData.length - barWidth) / 2;
      const barHeight = (item.count / maxCount) * chartHeight;
      const y = height - padding.bottom - barHeight;
      
      // Bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#60A5FA');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Bar border
      ctx.strokeStyle = '#2563EB';
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Bar value
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      if (barHeight > 25) {
        ctx.fillText(item.count.toString(), x + barWidth / 2, y + 15);
      }
      
      // X-axis label
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#aaa' : '#666';
      ctx.font = '12px sans-serif';
      
      // Rotate label if too long
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding.bottom + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(item.category, 0, 0);
      ctx.restore();
    });
    
  }, [data, title]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="max-w-full h-auto mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-colors duration-200"
    />
  );
};

export default BarChart;