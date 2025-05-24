import React, { useEffect, useRef, useState, MouseEvent } from 'react';

interface WordCloudItem {
  text: string;
  value: number;
  color?: string;
}

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
  onWordClick?: (word: string, value: number) => void;
}

// Paleta de azules
const bluePalette = [
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#bae6fd', // sky-200
  '#e0f2fe', // sky-100
  '#1e40af', // blue-800
  '#38bdf8', // sky-400
  '#0ea5e9', // sky-500
  '#0284c7', // sky-700
];

const MAX_WORDS = 12;
const PADDING = 16;

const WordCloud: React.FC<WordCloudProps> = ({ 
  data, 
  width = 800, 
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
    color: string,
    fontSize: number
  }>>([]);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // --- Dibuja el "mundo" central con gradiente ---
    const centerX = width / 2;
    const centerY = height / 2;
    const worldRadius = Math.min(width, height) * 0.32;
    const grad = ctx.createRadialGradient(centerX, centerY, worldRadius * 0.3, centerX, centerY, worldRadius);
    grad.addColorStop(0, 'rgba(186,230,253,0.95)');
    grad.addColorStop(0.5, 'rgba(59,130,246,0.18)');
    grad.addColorStop(1, 'rgba(30,64,175,0.10)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, worldRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(59,130,246,0.18)';
    ctx.shadowBlur = 32;
    ctx.fill();
    ctx.restore();

    // --- Palabras ---
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, MAX_WORDS);
    const minFont = 28, maxFont = 64;
    const minVal = Math.min(...sorted.map(w => w.value));
    const maxVal = Math.max(...sorted.map(w => w.value));
    const scaleFont = (v: number) => minFont + ((v - minVal) / Math.max(1, maxVal - minVal)) * (maxFont - minFont);

    // Algoritmo de colocación con colisión y padding
    const placed: typeof wordPositions = [];
    const usedAngles: number[] = [];
    const n = sorted.length;
    const ringStep = (2 * Math.PI) / Math.max(6, n);
    const minR = worldRadius + 24;
    const maxR = Math.min(width, height) / 2 - 32;

    sorted.forEach((word, i) => {
      const fontSize = scaleFont(word.value);
      ctx.font = `bold ${fontSize}px Helvetica Neue, Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      const color = bluePalette[i % bluePalette.length];
      const metrics = ctx.measureText(word.text);
      const w = metrics.width;
      const h = fontSize;
      // Palabras grandes cerca del mundo, pequeñas más lejos
      const frac = i / Math.max(1, n - 1);
      const r = minR + frac * (maxR - minR);
      let angle = (i % 2 === 0 ? 1 : -1) * (Math.floor(i / 2) + 1) * ringStep / 1.2 + Math.PI / 2;
      let found = false;
      let attempts = 0;
      while (!found && attempts < 32) {
        const x = centerX + r * Math.cos(angle) - w / 2;
        const y = centerY + r * Math.sin(angle) - h / 2;
        // Bounding box con padding
        const box = { x: x - PADDING, y: y - PADDING, w: w + 2 * PADDING, h: h + 2 * PADDING };
        // No permitir fuera del canvas
        if (box.x < 0 || box.y < 0 || box.x + box.w > width || box.y + box.h > height) {
          angle += ringStep / 2;
          attempts++;
          continue;
        }
        // No permitir dentro del mundo
        const distToCenter = Math.sqrt(Math.pow(x + w / 2 - centerX, 2) + Math.pow(y + h / 2 - centerY, 2));
        if (distToCenter < worldRadius + h / 2 + 8) {
          angle += ringStep / 2;
          attempts++;
          continue;
        }
        // No permitir colisión con otras palabras
        const collision = placed.some(p =>
          !(box.x + box.w < p.x || box.x > p.x + p.width || box.y + box.h < p.y || box.y > p.y + p.height)
        );
        if (collision) {
          angle += ringStep / 2;
          attempts++;
          continue;
        }
        // Si pasa todo, colocar
        ctx.save();
        ctx.shadowColor = 'rgba(30,64,175,0.13)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.fillText(word.text, x + w / 2, y + h / 2);
        ctx.restore();
        placed.push({
          text: word.text,
          value: word.value,
          x,
          y,
          width: w,
          height: h,
          color,
          fontSize
        });
        found = true;
      }
      // Si no se pudo colocar tras varios intentos, omitir la palabra
    });
    setWordPositions(placed);
  }, [data, width, height]);

  // Hover
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = mouseX * scaleX;
    const scaledY = mouseY * scaleY;
    let found = false;
    for (const word of wordPositions) {
      if (
        scaledX >= word.x && 
        scaledX <= word.x + word.width && 
        scaledY >= word.y && 
        scaledY <= word.y + word.height
      ) {
        setHoveredWord(word.text);
        setHoveredPos({x: word.x + word.width/2, y: word.y});
        // Redibujar con highlight
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          // Redibuja el mundo
          const centerX = width / 2;
          const centerY = height / 2;
          const worldRadius = Math.min(width, height) * 0.32;
          const grad = ctx.createRadialGradient(centerX, centerY, worldRadius * 0.3, centerX, centerY, worldRadius);
          grad.addColorStop(0, 'rgba(186,230,253,0.95)');
          grad.addColorStop(0.5, 'rgba(59,130,246,0.18)');
          grad.addColorStop(1, 'rgba(30,64,175,0.10)');
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, worldRadius, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(59,130,246,0.18)';
          ctx.shadowBlur = 32;
          ctx.fill();
          ctx.restore();
          // Palabras
          wordPositions.forEach(w => {
            ctx.save();
            ctx.font = `bold ${w.fontSize}px Helvetica Neue, Arial, sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            if (w.text === word.text) {
              ctx.fillStyle = '#1e40af'; // blue-800
              ctx.shadowColor = '#2563eb';
              ctx.shadowBlur = 16;
            } else {
              ctx.fillStyle = w.color;
              ctx.shadowColor = 'rgba(30,64,175,0.13)';
              ctx.shadowBlur = 8;
            }
            ctx.fillText(w.text, w.x + w.width/2, w.y + w.height/2);
            ctx.restore();
          });
        }
        found = true;
        break;
      }
    }
    if (!found && hoveredWord) {
      setHoveredWord(null);
      setHoveredPos(null);
      // Redibujar normal
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          // Redibuja el mundo
          const centerX = width / 2;
          const centerY = height / 2;
          const worldRadius = Math.min(width, height) * 0.32;
          const grad = ctx.createRadialGradient(centerX, centerY, worldRadius * 0.3, centerX, centerY, worldRadius);
          grad.addColorStop(0, 'rgba(186,230,253,0.95)');
          grad.addColorStop(0.5, 'rgba(59,130,246,0.18)');
          grad.addColorStop(1, 'rgba(30,64,175,0.10)');
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, worldRadius, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(59,130,246,0.18)';
          ctx.shadowBlur = 32;
          ctx.fill();
          ctx.restore();
          // Palabras
          wordPositions.forEach(w => {
            ctx.save();
            ctx.font = `bold ${w.fontSize}px Helvetica Neue, Arial, sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = w.color;
            ctx.shadowColor = 'rgba(30,64,175,0.13)';
            ctx.shadowBlur = 8;
            ctx.fillText(w.text, w.x + w.width/2, w.y + w.height/2);
            ctx.restore();
          });
        }
      }
    }
  };

  // Click
  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onWordClick) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
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
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(30,64,175,0.06)' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {hoveredWord && hoveredPos && (
        <div style={{
          position: 'absolute',
          left: hoveredPos.x,
          top: hoveredPos.y - 36,
          background: 'rgba(30,64,175,0.97)',
          color: '#fff',
          padding: '7px 18px',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 18,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(30,64,175,0.18)',
          zIndex: 10,
          whiteSpace: 'nowrap',
          transform: 'translate(-50%, -100%)',
        }}>
          {hoveredWord}
        </div>
      )}
    </div>
  );
};

export default WordCloud;