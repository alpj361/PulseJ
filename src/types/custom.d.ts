// WordCloud component types
declare interface WordCloudItem {
  text: string;
  value: number;
  color: string;
}

declare module '../components/ui/WordCloud' {
  interface WordCloudProps {
    data: WordCloudItem[];
    width?: number;
    height?: number;
  }
  const WordCloud: React.FC<WordCloudProps>;
  export default WordCloud;
}

declare module '../components/ui/BarChart' {
  interface BarChartProps {
    data: import('../types').CategoryCount[];
  }
  const BarChart: React.FC<BarChartProps>;
  export default BarChart;
}

declare module '../components/ui/KeywordListCard' {
  interface KeywordListCardProps {
    keywords: import('../types').KeywordCount[];
    title: string;
  }
  const KeywordListCard: React.FC<KeywordListCardProps>;
  export default KeywordListCard;
} 