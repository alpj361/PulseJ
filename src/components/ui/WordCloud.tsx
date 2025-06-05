import React, { useCallback, useEffect, useRef, useState } from 'react';
import createGlobe, { COBEOptions } from "cobe";
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

// Helper para clases CSS
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

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

// Configuración del globo COBE
const GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.1,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [59/255, 130/255, 246/255], // Azul profesional
  markerColor: [251/255, 100/255, 21/255],
  glowColor: [59/255, 130/255, 246/255],
  markers: [
    // Guatemala (punto principal)
    { location: [14.6349, -90.5069], size: 0.1 },
    // Otros puntos importantes
    { location: [19.4326, -99.1332], size: 0.07 }, // México
    { location: [40.7128, -74.006], size: 0.08 },  // Nueva York
    { location: [51.5074, -0.1278], size: 0.06 },  // Londres
    { location: [35.6762, 139.6503], size: 0.05 }, // Tokio
    { location: [-23.5505, -46.6333], size: 0.06 }, // São Paulo
    { location: [28.6139, 77.2090], size: 0.05 },  // Delhi
    { location: [39.9042, 116.4074], size: 0.07 },  // Beijing
    { location: [55.7558, 37.6176], size: 0.04 },   // Moscú
    { location: [-33.8688, 151.2093], size: 0.04 }  // Sydney
  ],
};

const ProfessionalTrendGlobe: React.FC<WordCloudProps> = ({ 
  data, 
  width = 800, 
  height = 500, 
  onWordClick 
}) => {
  let phi = 0;
  const [globeWidth, setGlobeWidth] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pointerInteracting = useRef<any>(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);
  
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

    const baseRadius = 200;
    const maxRadius = 350;
    
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

  // Actualizar interacción del puntero
  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
    }
  };

  // Actualizar movimiento
  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  // Renderizado del globo COBE
  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.005;
      state.phi = phi + r;
      state.width = globeWidth * 2;
      state.height = globeWidth * 2;
    },
    [r, globeWidth],
  );

  // Redimensionar globo
  const onResize = useCallback(() => {
    if (canvasRef.current) {
      setGlobeWidth(canvasRef.current.offsetWidth);
    }
  }, []);

  // Dibujar palabras orbitando
  const drawOrbitingWords = useCallback((ctx: CanvasRenderingContext2D, words: OrbitingWord[], rotation: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    words.forEach((word, index) => {
      const currentAngle = word.angle + rotation * 0.3;
      const x = centerX + word.orbitRadius * Math.cos(currentAngle);
      const y = centerY + word.orbitRadius * Math.sin(currentAngle) * 0.7;

      // Actualizar posición para detección de hover
      word.x = x;
      word.y = y;

      // const { color, glow } = getCategoryColor(word.category); // No se usa color de categoría para el texto
      const glow = getCategoryColor(word.category).glow; // Mantenemos glow para el hover
      
      ctx.save();
      
      // Tipografía profesional
      if (word.hovered) {
        ctx.shadowColor = glow; // Usar glow original de la categoría
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
      
      // Estilo de texto: blanco con borde negro
      ctx.fillStyle = '#FFFFFF'; // Texto blanco
      ctx.strokeStyle = '#000000'; // Borde negro
      ctx.lineWidth = 2; // Grosor del borde

      // Efecto de profundidad
      const depth = (y - centerY) / 150;
      ctx.globalAlpha *= Math.max(0.6, 1 - Math.abs(depth) * 0.2);
      
      ctx.strokeText(word.text, x, y); // Dibujar borde
      ctx.fillText(word.text, x, y); // Dibujar relleno
      ctx.restore();
    });
  }, [width, height]);

  // Detectar hover sobre palabras
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wordCanvasRef.current) return;
    
    const rect = wordCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePos({ x, y });
    updateMovement(event.clientX);

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
    if (wordCanvasRef.current) {
      wordCanvasRef.current.style.cursor = foundHover ? 'pointer' : 'default';
    }
  };

  // Manejar click en palabras
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const clickedWord = orbitingWords.find(word => word.hovered);
    if (clickedWord) {
      // setSelectedWord(clickedWord); // Ya no se muestra el modal
      if (onWordClick) {
        onWordClick(clickedWord);
      }
    }
  };

  // Animación de palabras
  const animateWords = useCallback(() => {
    const canvas = wordCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas de palabras
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar palabras orbitando
    drawOrbitingWords(ctx, orbitingWords, rotation);

    // Incrementar rotación
    setRotation(prev => prev + 0.002);
    
    animationRef.current = requestAnimationFrame(animateWords);
  }, [orbitingWords, rotation, drawOrbitingWords]);

  // Inicialización
  useEffect(() => {
    setOrbitingWords(prepareOrbitingWords(data));
  }, [data, prepareOrbitingWords]);

  // Inicializar globo COBE
  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    if (canvasRef.current && globeWidth > 0) {
      const globe = createGlobe(canvasRef.current, {
        ...GLOBE_CONFIG,
        width: globeWidth * 2,
        height: globeWidth * 2,
        onRender,
      });

      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = "1";
        }
      }, 100);

      return () => {
        globe.destroy();
        window.removeEventListener("resize", onResize);
      };
    }
  }, [onRender, globeWidth, onResize]);

  // Iniciar animación de palabras
  useEffect(() => {
    if (orbitingWords.length > 0) {
      animationRef.current = requestAnimationFrame(animateWords);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateWords, orbitingWords]);

  return (
    <Box sx={{ position: 'relative', width, height, mx: 'auto', my: 2 }}>
      {/* Contenedor principal */}
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
        {/* Globo COBE */}
        <div
          className={cn(
            "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[400px]",
            "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          )}
        >
          <canvas
            className={cn(
              "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
            )}
            ref={canvasRef}
            onPointerDown={(e) =>
              updatePointerInteraction(
                e.clientX - pointerInteractionMovement.current,
              )
            }
            onPointerUp={() => updatePointerInteraction(null)}
            onPointerOut={() => updatePointerInteraction(null)}
            onMouseMove={(e) => updateMovement(e.clientX)}
            onTouchMove={(e) =>
              e.touches[0] && updateMovement(e.touches[0].clientX)
            }
          />
        </div>

        {/* Canvas de palabras orbitando */}
        <canvas
          ref={wordCanvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            pointerEvents: 'auto'
          }}
        />

        {/* Panel informativo - ELIMINADO */}
        {/* <Paper
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
        </Paper> */}

        {/* Leyenda - ELIMINADO */}
        {/* <Paper
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
        </Paper> */}
      </Box>
    </Box>
  );
};

export default ProfessionalTrendGlobe;