import React, { useEffect, useRef } from 'react';

interface WordCloudItem {
  text: string;
  value: number;
  color: string;
}

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
}

const WordCloud: React.FC<WordCloudProps> = ({ data, width = 600, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sort words by size (largest first) for better placement
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    // Create a map to track placed words and avoid overlap
    const placedAreas: {x: number, y: number, width: number, height: number}[] = [];
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    sortedData.forEach(word => {
      // Set font size based on value
      const fontSize = word.value / 10 + 10;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = word.color;
      
      // Measure text
      const metrics = ctx.measureText(word.text);
      const wordWidth = metrics.width;
      const wordHeight = fontSize;
      
      // Try to place word
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Generate position in spiral pattern around center
        const angle = attempts * 0.1;
        const radius = 5 * Math.sqrt(attempts);
        const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
        const y = centerY + radius * Math.sin(angle) + wordHeight / 4;
        
        // Check if this position overlaps with any placed word
        const overlaps = placedAreas.some(area => {
          return !(
            x + wordWidth < area.x || 
            x > area.x + area.width || 
            y - wordHeight > area.y || 
            y < area.y - area.height
          );
        });
        
        // If no overlap and within canvas, place the word
        if (!overlaps && 
            x >= 0 && 
            x + wordWidth <= width && 
            y >= wordHeight && 
            y <= height) {
          ctx.fillText(word.text, x, y);
          placedAreas.push({
            x, 
            y: y - wordHeight, 
            width: wordWidth, 
            height: wordHeight
          });
          placed = true;
        }
      }
    });
    
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="max-w-full h-auto mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm"
    />
  );
};

export default WordCloud;