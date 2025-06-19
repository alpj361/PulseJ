import React from 'react';
import ModernBarChart from '../ui/ModernBarChart';
import ModernLineChart from '../ui/ModernLineChart';
import ModernPieChart from '../ui/ModernPieChart';

export type ChartType = 'bar' | 'line' | 'pie';

export interface GraficoSondeoProps {
  type: ChartType;
  data: any[];
  height?: number;
}

/**
 * Wrapper genérico que decide qué ModernChart usar según `type`.
 */
const GraficoSondeo: React.FC<GraficoSondeoProps> = ({ type, data, height = 280 }) => {
  switch (type) {
    case 'bar':
      return <ModernBarChart data={data} height={height} />;
    case 'line':
      return <ModernLineChart data={data} height={height} />;
    case 'pie':
    default:
      return <ModernPieChart data={data} height={height} showLegend />;
  }
};

export default GraficoSondeo;
