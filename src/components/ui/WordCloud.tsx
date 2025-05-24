import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
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

interface OrbitingWord extends WordCloudItem {
  orbitRadius: number;
  angle: number;
  fontSize: number;
  x: number;
  y: number;
  hovered: boolean;
}

const categories = [
  { name: 'Política', color: '#1e40af', glow: '#3b82f6' },
  { name: 'Deportes', color: '#0f766e', glow: '#14b8a6' },
  { name: 'Entretenimiento', color: '#7c2d92', glow: '#a855f7' },
  { name: 'Tecnología', color: '#c2410c', glow: '#ea580c' },
  { name: 'Economía', color: '#065f46', glow: '#059669' },
  { name: 'Salud', color: '#b91c1c', glow: '#dc2626' },
  { name: 'Educación', color: '#6b21a8', glow: '#9333ea' },
  { name: 'Otros', color: '#374151', glow: '#6b7280' }
];

const ProfessionalTrendGlobe: React.FC<WordCloudProps> = ({ 
  data, 
  width = 800, 
  height = 500, 
  onWordClick 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const [orbitingWords, setOrbitingWords] = useState<OrbitingWord[]>([]);
  const [hoveredWord, setHoveredWord] = useState<OrbitingWord | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordCloudItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Preparar palabras para órbitas
  const prepareOrbitingWords = useCallback((words: WordCloudItem[]): OrbitingWord[] => {
    const sorted = [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, 12); // Máximo 12 palabras para claridad

    const baseRadius = 120;
    const maxRadius = 250;
    
    return sorted.map((word, i) => {
      const progress = i / Math.max(1, sorted.length - 1);
      const orbitRadius = baseRadius + progress * (maxRadius - baseRadius);
      const angle = (i * (2 * Math.PI / sorted.length)) + (i * 0.3);
      const fontSize = Math.max(16, 32 - (i * 1.8));
      
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

  // Dibujar globo terráqueo profesional
  const drawProfessionalGlobe = (ctx: CanvasRenderingContext2D, rotation: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 75;

    // Sombra sutil del globo
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX + 5, centerY + 8, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.filter = 'blur(10px)';
    ctx.fill();
    ctx.restore();

    // Base del globo con gradiente profesional
    const globeGradient = ctx.createRadialGradient(
      centerX - 25, centerY - 25, 0,
      centerX, centerY, radius
    );
    globeGradient.addColorStop(0, '#3b82f6');
    globeGradient.addColorStop(0.4, '#1d4ed8');
    globeGradient.addColorStop(0.8, '#1e40af');
    globeGradient.addColorStop(1, '#1e3a8a');

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = globeGradient;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Continentes detallados y realistas
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#065f46';
    
    // América del Norte
    ctx.beginPath();
    ctx.ellipse(centerX - 35, centerY - 15, 18, 12, rotation * 0.05, 0, 2 * Math.PI);
    ctx.fill();
    
    // América del Sur
    ctx.beginPath();
    ctx.ellipse(centerX - 25, centerY + 25, 12, 20, rotation * 0.05, 0, 2 * Math.PI);
    ctx.fill();
    
    // Europa/África
    ctx.beginPath();
    ctx.ellipse(centerX + 10, centerY - 5, 15, 25, rotation * 0.05, 0, 2 * Math.PI);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(centerX + 35, centerY - 10, 20, 18, rotation * 0.05, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();

    // Líneas de latitud y longitud sutiles
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 1;
    
    // Ecuador
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Trópicos
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 25, radius, radius * 0.2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 25, radius, radius * 0.2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Meridiano principal
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.1, radius, rotation * 0.05, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.restore();

    // Brillo profesional
    ctx.save();
    ctx.globalAlpha = 0.2;
    const highlight = ctx.createRadialGradient(
      centerX - 30, centerY - 30, 0,
      centerX - 30, centerY - 30, 35
    );
    highlight.addColorStop(0, '#ffffff');
    highlight.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(centerX - 30, centerY - 30, 35, 0, 2 * Math.PI);
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.restore();
  };

  // Dibujar palabras con tipografía profesional
  const drawProfessionalWords = (ctx: CanvasRenderingContext2D, words: OrbitingWord[], rotation: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    words.forEach((word, index) => {
      const currentAngle = word.angle + rotation * 0.3; // Rotación más lenta y seria
      const x = centerX + word.orbitRadius * Math.cos(currentAngle);
      const y = centerY + word.orbitRadius * Math.sin(currentAngle) * 0.7; // Efecto 3D sutil

      // Actualizar posición para detección de hover
      word.x = x;
      word.y = y;

      const { color, glow } = getCategoryColor(word.category);
      
      ctx.save();
      
      // Tipografía profesional y bold
      if (word.hovered) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 1;
        ctx.font = `bold ${word.fontSize + 3}px 'Inter', 'Segoe UI', 'Roboto', sans-serif`;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.95;
        ctx.font = `bold ${word.fontSize}px 'Inter', 'Segoe UI', 'Roboto', sans-serif`;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      
      // Efecto de profundidad profesional
      const depth = (y - centerY) / 150;
      ctx.globalAlpha *= Math.max(0.6, 1 - Math.abs(depth) * 0.2);
      
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
      word.hovered = distance < word.fontSize * 0.8;
      
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

  // Animación profesional (más lenta y suave)
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Globo terráqueo profesional
    drawProfessionalGlobe(ctx, rotation);
    
    // Palabras profesionales
    drawProfessionalWords(ctx, orbitingWords, rotation);

    // Incrementar rotación lentamente
    setRotation(prev => prev + 0.002); // Mucho más lenta
    
    animationRef.current = requestAnimationFrame(animate);
  }, [orbitingWords, rotation, width, height]);

  // Inicialización
  useEffect(() => {
    setOrbitingWords(prepareOrbitingWords(data));
  }, [data, prepareOrbitingWords]);

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
      {/* Contenedor principal profesional */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
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

        {/* Panel informativo minimalista */}
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            top: 15,
            right: 15,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            color: '#1e293b',
            zIndex: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            maxWidth: 220
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <GlobeIcon sx={{ mr: 1, color: '#3b82f6', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ fontFamily: 'Inter' }}>
              Análisis Global
            </Typography>
          </Box>
          
          <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.3 }}>
            {orbitingWords.length} tendencias principales identificadas
          </Typography>
        </Paper>

        {/* Leyenda minimalista */}
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            bottom: 15,
            left: 15,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            color: '#1e293b',
            zIndex: 3,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            maxWidth: 180
          }}
        >
          <Typography variant="caption" fontWeight="bold" sx={{ mb: 1, display: 'block', fontFamily: 'Inter' }}>
            Categorías
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {categories.slice(0, 4).map(cat => (
              <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: cat.color
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {cat.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Tooltip profesional para hover */}
        {hoveredWord && (
          <Fade in={!!hoveredWord}>
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                left: mousePos.x + 15,
                top: mousePos.y - 35,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#fff',
                zIndex: 4,
                pointerEvents: 'none',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                {hoveredWord.text}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                {hoveredWord.category || 'Sin categoría'}
              </Typography>
            </Paper>
          </Fade>
        )}
      </Box>

      {/* Modal de detalles profesional */}
      <Dialog
        open={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Inter' }}>
            {selectedWord?.text}
          </Typography>
          <IconButton onClick={() => setSelectedWord(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Categoría
              </Typography>
              <Chip
                label={selectedWord?.category || 'Sin categoría'}
                sx={{
                  bgcolor: getCategoryColor(selectedWord?.category).color,
                  color: '#fff',
                  fontWeight: 'bold',
                  fontFamily: 'Inter'
                }}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Relevancia
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary" sx={{ fontFamily: 'Inter' }}>
                {selectedWord?.value || 0}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pt: 0 }}>
          <Button 
            onClick={() => setSelectedWord(null)} 
            variant="contained"
            sx={{ fontFamily: 'Inter' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalTrendGlobe;