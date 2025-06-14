import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface ModernBarChartProps {
  data: Array<{
    name: string;
    value: number;
    category?: string;
  }>;
  height?: number;
  gradient?: boolean;
  glassmorphism?: boolean;
  darkMode?: boolean;
}

// Custom Bar Shape Component for white background
const GlassBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  return (
    <g>
      {/* Main bar with glassmorphism effect for white background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={8}
        ry={8}
        style={{
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.15))',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      />
      {/* Highlight effect */}
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={Math.max(height * 0.3, 4)}
        fill="rgba(255,255,255,0.6)"
        rx={6}
        ry={6}
      />
    </g>
  );
};

// Custom Tooltip for white background
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl p-4 shadow-xl">
        <p className="text-gray-800 font-medium text-sm mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="text-gray-700 text-sm">
            {payload[0].name}: <span className="font-bold text-blue-600">{payload[0].value}</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Label for white background
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text 
      x={x + width / 2} 
      y={y - 6} 
      fill="rgba(55, 65, 81, 0.8)" 
      textAnchor="middle" 
      fontSize="12"
      fontWeight="500"
    >
      {value}
    </text>
  );
};

const ModernBarChart: React.FC<ModernBarChartProps> = ({ 
  data, 
  height = 400, 
  gradient = true, 
  glassmorphism = true,
  darkMode = false
}) => {
  // Generate colors based on values - optimized for white background
  const getBarColor = (value: number, index: number) => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',  // Blue
      'rgba(16, 185, 129, 0.8)',  // Green  
      'rgba(245, 101, 101, 0.8)', // Red
      'rgba(251, 191, 36, 0.8)',  // Yellow
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 40,
            right: 40,
            left: 30,
            bottom: 60,
          }}
          barCategoryGap="25%"
          maxBarSize={80}
        >
          <defs>
            {/* Gradient definitions optimized for white background */}
            <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
            </linearGradient>
            <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.9)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.6)" />
            </linearGradient>
            <linearGradient id="barGradient3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245, 101, 101, 0.9)" />
              <stop offset="100%" stopColor="rgba(245, 101, 101, 0.6)" />
            </linearGradient>
            <linearGradient id="barGradient4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.9)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.6)" />
            </linearGradient>
            <linearGradient id="barGradient5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.9)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.6)" />
            </linearGradient>
            <linearGradient id="barGradient6" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(236, 72, 153, 0.9)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0.6)" />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(0,0,0,0.1)" 
            horizontal={true}
            vertical={false}
          />
          
          <XAxis 
            dataKey="name" 
            stroke="rgba(55, 65, 81, 0.7)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11, fill: 'rgba(55, 65, 81, 0.8)' }}
          />
          
          <YAxis 
            stroke="rgba(55, 65, 81, 0.7)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={60}
            tick={{ fontSize: 11, fill: 'rgba(55, 65, 81, 0.8)' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            shape={glassmorphism ? <GlassBar /> : undefined}
          >
            <LabelList content={<CustomLabel />} />
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={gradient ? `url(#barGradient${(index % 6) + 1})` : getBarColor(entry.value, index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernBarChart; 