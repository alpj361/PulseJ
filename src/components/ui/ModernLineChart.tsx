import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
  Dot
} from 'recharts';

interface ModernLineChartProps {
  data: Array<{
    name: string;
    value: number;
    target?: number;
  }>;
  height?: number;
  showArea?: boolean;
  showTarget?: boolean;
  targetValue?: number;
  darkMode?: boolean;
}

// Custom Dot Component for white background
const CustomDot = (props: any) => {
  const { cx, cy, fill, payload, index } = props;
  
  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={fill}
        opacity={0.2}
        style={{
          filter: 'blur(2px)'
        }}
      />
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
        }}
      />
      {/* Inner highlight */}
      <circle
        cx={cx - 1}
        cy={cy - 1}
        r={1.5}
        fill="rgba(255,255,255,0.9)"
      />
    </g>
  );
};

// Custom Tooltip for white background
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl p-4 shadow-xl">
        <p className="text-gray-800 font-medium text-sm mb-3">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-2">
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 text-sm">
              {entry.name}: <span className="font-bold text-blue-600">{entry.value}</span>
            </span>
          </div>
        ))}
        {payload[0]?.payload?.target && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
            <div className="w-3 h-1 bg-orange-500 rounded-full" />
            <span className="text-gray-700 text-sm">
              Target: <span className="font-bold text-orange-600">{payload[0].payload.target}</span>
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Line Component with segment styling
const CustomLine = (props: any) => {
  const { stroke, strokeWidth, points } = props;
  
  if (!points || points.length < 2) return null;
  
  // Create path for smooth curve
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // Calculate control points for smooth curve
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = curr.x - (curr.x - prev.x) * 0.5;
    const cp2y = curr.y;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  
  return (
    <g>
      {/* Glow effect */}
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth + 2}
        fill="none"
        opacity={0.3}
        style={{
          filter: 'blur(2px)'
        }}
      />
      {/* Main line */}
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
        }}
      />
    </g>
  );
};

const ModernLineChart: React.FC<ModernLineChartProps> = ({ 
  data, 
  height = 400, 
  showArea = true, 
  showTarget = true,
  targetValue = 0,
  darkMode = false
}) => {
  // Calculate average for target line
  const avgValue = targetValue || data.reduce((sum, item) => sum + item.value, 0) / data.length;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{
            top: 40,
            right: 40,
            left: 30,
            bottom: 50,
          }}
        >
          <defs>
            {/* Area gradient for white background */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
            </linearGradient>
            
            {/* Line gradient for white background */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 1)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 1)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 1)" />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="2 2" 
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
            tick={{ fontSize: 11, fill: 'rgba(55, 65, 81, 0.8)' }}
            height={60}
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
          
          {/* Target line */}
          {showTarget && (
            <ReferenceLine 
              y={avgValue} 
              stroke="rgba(251, 146, 60, 0.8)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Target",
                position: "top",
                fill: "rgba(251, 146, 60, 1)",
                fontSize: 12,
                fontWeight: "bold"
              }}
            />
          )}
          
          {/* Area fill */}
          {showArea && (
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#areaGradient)"
            />
          )}
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{
              r: 6,
              stroke: 'rgba(255,255,255,0.9)',
              strokeWidth: 2,
              fill: 'rgba(59, 130, 246, 1)',
              style: {
                filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))'
              }
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernLineChart; 