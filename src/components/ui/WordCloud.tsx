import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Tooltip, 
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Public as GlobeIcon } from '@mui/icons-material';

interface WordCloudItem {
  text: string;
  value: number;
  color?: string;
  category?: string;
}

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
  onWordClick?: (word: WordCloudItem) => void;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
}

interface OrbitingWord extends WordCloudItem {
  orbitRadius: number;
  angle: number;
  fontSize: number;
  x: number;
  y: number;
  hovered: boolean;
}

const categories = [
  { name: 'Política', color: '#3b82f6', glow: '#60a5fa' },
  { name: 'Deportes', color: '#22d3ee', glow: '#67e8f9' },
  { name: 'Entretenimiento', color: '#a78bfa', glow: '#c4b5fd' },
  { name: 'Tecnología', color: '#f59e0b', glow: '#fbbf24' },
  { name: 'Economía', color: '#10b981', glow: '#34d399' },
  { name: 'Salud', color: '#ef4444', glow: '#f87171' },
  { name: 'Educación', color: '#8b5cf6', glow: '#a78bfa' },
  { name: 'Otros', color: '#6b7280', glow: '#9ca3af' }
];

const TrendGlobeWordCloud: React.FC<WordCloudProps> = ({ 
  data, 
  width = 800, 
  height = 500, 
  onWordClick 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const [stars, setStars] = useState<Star[]>([]);
  const [orbitingWords, setOrbitingWords] = useState<OrbitingWord[]>([]);
  const [hoveredWord, setHoveredWord] = useState<OrbitingWord | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordCloudItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Generar estrellas
  const generateStars = useCallback((count: number): Star[] => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01
    }));
  }, [width, height]);

  // Preparar palabras para órbitas
  const prepareOrbitingWords = useCallback((words: WordCloudItem[]): OrbitingWord[] => {
    const sorted = [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, 16); // Máximo 16 palabras

    const baseRadius = 140;
    const maxRadius = 280;
    
    return sorted.map((word, i) => {
      const progress = i / Math.max(1, sorted.length - 1);
      const orbitRadius = baseRadius + progress * (maxRadius - baseRadius);
      const angle = (i * (2 * Math.PI / sorted.length)) + Math.random() * 0.5;
      const fontSize = Math.max(14, 28 - (i * 1.2));
      
      return {
        ...word,
        orbitRadius,
        angle,
        fontSize,
        x: 0,
        y: 0,
        hovered: false
      };
    });
  }, []);

  // Obtener color por categoría
  const getCategoryColor = (category?: string): { color: string; glow: string } => {
    const cat = categories.find(c => c.name === category) || categories[categories.length - 1];
    return { color: cat.color, glow: cat.glow };
  };

  // Dibujar estrellas con parpadeo
  const drawStars = (ctx: CanvasRenderingContext2D, stars: Star[]) => {
    stars.forEach(star => {
      ctx.save();
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = star.radius * 3;
      ctx.fill();
      ctx.restore();

      // Efecto parpadeo
      star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.1;
      star.alpha = Math.max(0.1, Math.min(1, star.alpha));
    });
  };

  // Dibujar globo terráqueo 3D
  const drawGlobe = (ctx: CanvasRenderingContext2D, rotation: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 85;

    // Sombra del globo
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX + 10, centerY + 15, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.filter = 'blur(15px)';
    ctx.fill();
    ctx.restore();

    // Globo base con gradiente
    const globeGradient = ctx.createRadialGradient(
      centerX - 30, centerY - 30, 0,
      centerX, centerY, radius
    );
    globeGradient.addColorStop(0, '#60a5fa');
    globeGradient.addColorStop(0.3, '#3b82f6');
    globeGradient.addColorStop(0.7, '#1e40af');
    globeGradient.addColorStop(1, '#1e3a8a');

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = globeGradient;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.restore();

    // Continentes (simulados con curvas)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#10b981';
    
    // Continente 1
    ctx.beginPath();
    ctx.ellipse(centerX - 20, centerY - 10, 25, 15, rotation * 0.1, 0, 2 * Math.PI);
    ctx.fill();
    
    // Continente 2
    ctx.beginPath();
    ctx.ellipse(centerX + 15, centerY + 20, 20, 12, rotation * 0.1, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();

    // Brillo
    ctx.save();
    ctx.globalAlpha = 0.4;
    const highlight = ctx.createRadialGradient(
      centerX - 35, centerY - 35, 0,
      centerX - 35, centerY - 35, 40
    );
    highlight.addColorStop(0, '#ffffff');
    highlight.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(centerX - 35, centerY - 35, 40, 0, 2 * Math.PI);
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.restore();

    // Anillos orbitales tenues
    for (let i = 1; i <= 3; i++) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + (i * 50), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Dibujar palabras orbitando
  const drawOrbitingWords = (ctx: CanvasRenderingContext2D, words: OrbitingWord[], rotation: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    words.forEach((word, index) => {
      const currentAngle = word.angle + rotation + (index * 0.1);
      const x = centerX + word.orbitRadius * Math.cos(currentAngle);
      const y = centerY + word.orbitRadius * Math.sin(currentAngle) * 0.6; // Elipse para efecto 3D

      // Actualizar posición para detección de hover
      word.x = x;
      word.y = y;

      const { color, glow } = getCategoryColor(word.category);
      
      ctx.save();
      
      // Efecto hover
      if (word.hovered) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 1;
        ctx.font = `bold ${word.fontSize + 4}px 'Inter', 'Roboto', sans-serif`;
      } else {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.9;
        ctx.font = `600 ${word.fontSize}px 'Inter', 'Roboto', sans-serif`;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      
      // Efecto de profundidad basado en posición Y
      const depth = (y - centerY) / 100;
      ctx.globalAlpha *= Math.max(0.4, 1 - Math.abs(depth) * 0.3);
      
      ctx.fillText(word.text, x, y);
      ctx.restore();
    });
  };

  // Detectar hover sobre palabras
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePos({ x, y });

    let foundHover = false;
    orbitingWords.forEach(word => {
      const distance = Math.sqrt((x - word.x) ** 2 + (y - word.y) ** 2);
      const wasHovered = word.hovered;
      word.hovered = distance < word.fontSize;
      
      if (word.hovered && !foundHover) {
        foundHover = true;
        if (!wasHovered) {
          setHoveredWord(word);
        }
      }
    });
    
    if (!foundHover && hoveredWord) {
      setHoveredWord(null);
    }

    // Cambiar cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = foundHover ? 'pointer' : 'default';
    }
  };

  // Manejar click en palabras
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const clickedWord = orbitingWords.find(word => word.hovered);
    if (clickedWord) {
      setSelectedWord(clickedWord);
      if (onWordClick) {
        onWordClick(clickedWord);
      }
    }
  };

  // Animación principal
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo espacial
    drawStars(ctx, stars);
    
    // Globo terráqueo
    drawGlobe(ctx, rotation);
    
    // Palabras orbitando
    drawOrbitingWords(ctx, orbitingWords, rotation);

    // Incrementar rotación
    setRotation(prev => prev + 0.005);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [stars, orbitingWords, rotation, width, height]);

  // Inicialización
  useEffect(() => {
    setStars(generateStars(80));
    setOrbitingWords(prepareOrbitingWords(data));
  }, [data, generateStars, prepareOrbitingWords]);

  // Iniciar animación
  useEffect(() => {
    if (orbitingWords.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, orbitingWords]);

  return (
    <Box sx={{ position: 'relative', width, height, mx: 'auto', my: 2 }}>
      {/* Contenedor principal con fondo espacial */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        {/* Canvas principal */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />

        {/* Panel informativo superior */}
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            px: 3,
            py: 2,
            borderRadius: 3,
            backdropFilter: 'blur(12px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            zIndex: 3,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            maxWidth: 280
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <GlobeIcon sx={{ mr: 1, color: '#60a5fa' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Inter' }}>
              Tendencias Globales
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, lineHeight: 1.4 }}>
            {orbitingWords.length} tendencias orbitando según su importancia
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.slice(0, 4).map(cat => (
              <Chip
                key={cat.name}
                label={cat.name}
                size="small"
                sx={{
                  bgcolor: `${cat.color}40`,
                  color: cat.color,
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  border: `1px solid ${cat.color}60`
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Leyenda de categorías */}
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            px: 2.5,
            py: 2,
            borderRadius: 3,
            backdropFilter: 'blur(12px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            zIndex: 3,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            maxWidth: 200
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, fontFamily: 'Inter' }}>
            Categorías
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {categories.slice(0, 6).map(cat => (
              <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: cat.color,
                    boxShadow: `0 0 8px ${cat.glow}60`
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  {cat.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Tooltip para hover */}
        {hoveredWord && (
          <Fade in={!!hoveredWord}>
            <Paper
              elevation={12}
              sx={{
                position: 'absolute',
                left: mousePos.x + 20,
                top: mousePos.y - 40,
                px: 2,
                py: 1,
                borderRadius: 2,
                backdropFilter: 'blur(8px)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                zIndex: 4,
                pointerEvents: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {hoveredWord.text}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Categoría: {hoveredWord.category || 'Sin categoría'}
              </Typography>
            </Paper>
          </Fade>
        )}
      </Box>

      {/* Modal de detalles */}
      <Dialog
        open={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {selectedWord?.text}
          </Typography>
          <IconButton onClick={() => setSelectedWord(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Categoría
              </Typography>
              <Chip
                label={selectedWord?.category || 'Sin categoría'}
                sx={{
                  bgcolor: getCategoryColor(selectedWord?.category).color,
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Puntuación de tendencia
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {selectedWord?.value || 0}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedWord(null)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrendGlobeWordCloud;