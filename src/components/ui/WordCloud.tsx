import React, { useEffect, useRef, useState, MouseEvent } from 'react';

interface WordCloudItem {
  text: string;
  value: number;
  color: string;
}

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
  onWordClick?: (word: string, value: number) => void;
}

const WordCloud: React.FC<WordCloudProps> = ({ 
  data, 
  width = 600, 
  height = 400,
  onWordClick 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wordPositions, setWordPositions] = useState<Array<{
    text: string,
    value: number,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  }>>([]);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

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
    const placedAreas: {
      text: string,
      value: number,
      x: number, 
      y: number, 
      width: number, 
      height: number,
      color: string
    }[] = [];
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Increase spacing between words (add a spacing factor)
    const spacingFactor = 1.8; // Adjust this value to control spacing
    
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
      const maxAttempts = 200; // Increased max attempts for better placement
      
      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Generate position in spiral pattern around center with more spacing
        const angle = attempts * 0.1;
        const radius = 6 * Math.sqrt(attempts); // Increased radius for more spacing
        const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
        const y = centerY + radius * Math.sin(angle) + wordHeight / 4;
        
        // Check if this position overlaps with any placed word, with increased spacing
        const overlaps = placedAreas.some(area => {
          return !(
            x + wordWidth * spacingFactor < area.x || 
            x > area.x + area.width * spacingFactor || 
            y - wordHeight * spacingFactor > area.y || 
            y < area.y - area.height * spacingFactor
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
            text: word.text,
            value: word.value,
            x, 
            y: y - wordHeight, 
            width: wordWidth, 
            height: wordHeight,
            color: word.color
          });
          placed = true;
        }
      }
    });
    
    setWordPositions(placedAreas);
  }, [data, width, height]);

  // Handler for mouse movement to detect hovering
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Scale the mouse coordinates if the canvas is scaled on the display
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = mouseX * scaleX;
    const scaledY = mouseY * scaleY;
    
    let isHovering = false;
    for (const word of wordPositions) {
      if (
        scaledX >= word.x && 
        scaledX <= word.x + word.width && 
        scaledY >= word.y && 
        scaledY <= word.y + word.height
      ) {
        setHoveredWord(word.text);
        isHovering = true;
        
        // Redraw canvas with hover effect
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, width, height);
          
          // Redraw all words
          wordPositions.forEach(w => {
            const fontSize = w.value / 10 + 10;
            ctx.font = `${fontSize}px sans-serif`;
            
            if (w.text === word.text) {
              // Highlighted word (hovered)
              ctx.fillStyle = '#f97316'; // Orange highlight color
              ctx.font = `bold ${fontSize}px sans-serif`; // Make it bold
            } else {
              ctx.fillStyle = w.color;
            }
            
            ctx.fillText(w.text, w.x, w.y + w.height);
          });
        }
        break;
      }
    }
    
    if (!isHovering && hoveredWord) {
      setHoveredWord(null);
      
      // Reset canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Redraw all words normally
        wordPositions.forEach(w => {
          const fontSize = w.value / 10 + 10;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = w.color;
          ctx.fillText(w.text, w.x, w.y + w.height);
        });
      }
    }
  };
  
  // Handler for click events
  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onWordClick) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Scale the mouse coordinates if the canvas is scaled on the display
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = mouseX * scaleX;
    const scaledY = mouseY * scaleY;
    
    for (const word of wordPositions) {
      if (
        scaledX >= word.x && 
        scaledX <= word.x + word.width && 
        scaledY >= word.y && 
        scaledY <= word.y + word.height
      ) {
        onWordClick(word.text, word.value);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer transition-all duration-200"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {hoveredWord && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md text-sm shadow-lg">
          {hoveredWord}
        </div>
      )}
    </div>
  );
};

export default WordCloud;