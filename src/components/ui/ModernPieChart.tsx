import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ModernPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Custom Tooltip for white background
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: data.color }}
          />
          <div>
            <p className="text-gray-800 font-medium text-sm">{data.name}</p>
            <p className="text-blue-600 font-bold text-lg">{data.value}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Label
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

  return (
    <text 
      x={x} 
      y={y} 
      fill="rgba(255,255,255,0.95)" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
      style={{
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ModernPieChart: React.FC<ModernPieChartProps> = ({ 
  data, 
  height = 400, 
  showLegend = true,
  innerRadius = 0,
  outerRadius = Math.min(height * 0.35, 140)
}) => {
  // Default colors optimized for white background
  const defaultColors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(14, 165, 233, 0.8)',   // Sky
    'rgba(34, 197, 94, 0.8)',    // Emerald
    'rgba(168, 85, 247, 0.8)',   // Violet
  ];

  // Add colors to data if not provided
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs>
            {/* Create gradients for each slice */}
            {dataWithColors.map((item, index) => (
              <radialGradient key={`gradient-${index}`} id={`pieGradient${index}`}>
                <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
              </radialGradient>
            ))}
          </defs>
          
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={<CustomLabel />}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth={2}
          >
            {dataWithColors.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient${index})`}
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                }}
              />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={50}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '30px',
                fontSize: '11px',
                color: 'rgba(55, 65, 81, 0.8)',
                lineHeight: '1.4'
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernPieChart; 