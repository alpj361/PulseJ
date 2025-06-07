"use client";
import React, { useMemo, useRef } from "react";
import { motion } from "framer-motion";

interface UseDimensionsResult {
  width: number;
  height: number;
}

const useDimensions = (ref: React.RefObject<HTMLElement>): UseDimensionsResult => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (ref.current) {
        setDimensions({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [ref]);

  return dimensions;
};

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
      ? "blur-3xl"
      : "blur-[100px]";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${blurClass}`}>
        {colors.map((color, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient"
            style={
              {
                top: `${Math.random() * 50}%`,
                left: `${Math.random() * 50}%`,
                "--background-gradient-speed": `${1 / speed}s`,
                "--tx-1": Math.random() - 0.5,
                "--ty-1": Math.random() - 0.5,
                "--tx-2": Math.random() - 0.5,
                "--ty-2": Math.random() - 0.5,
                "--tx-3": Math.random() - 0.5,
                "--ty-3": Math.random() - 0.5,
                "--tx-4": Math.random() - 0.5,
                "--ty-4": Math.random() - 0.5,
              } as React.CSSProperties
            }
            width={circleSize * randomInt(0.1, 0.3)}
            height={circleSize * randomInt(0.1, 0.3)}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={color}
              className="opacity-20 dark:opacity-[0.08]"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

// Hook para obtener el saludo basado en la hora actual
const useTimeGreeting = () => {
  const [greeting, setGreeting] = React.useState('');

  React.useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateGreeting();
    // Actualizar cada minuto para cambios de hora
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return greeting;
};

// Función para obtener colores según la hora del día
const getTimeBasedColors = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    // Mañana - Azules suaves
    return ["#E0F2FE", "#BAE6FD", "#7DD3FC", "#38BDF8"];
  } else if (hour >= 12 && hour < 18) {
    // Tarde - Naranjas y amarillos
    return ["#FEF3C7", "#FDE68A", "#FBBF24", "#F59E0B"];
  } else {
    // Noche - Purpuras y azules oscuros
    return ["#E0E7FF", "#C7D2FE", "#A5B4FC", "#818CF8"];
  }
};

interface GoodMorningTitleProps {
  userName?: string;
}

const GoodMorningTitle: React.FC<GoodMorningTitleProps> = ({ userName }) => {
  const greeting = useTimeGreeting();
  const colors = getTimeBasedColors();

  return (
    <div 
      className="relative w-full flex items-center justify-center overflow-hidden rounded-lg"
      style={{ 
        height: '48px',
        background: 'linear-gradient(90deg, #e0e7ff 0%, #f0fdfa 100%)',
        borderBottom: '2px solid #c7d2fe',
        boxShadow: '0 2px 8px 0 rgba(59,130,246,0.07)',
        marginBottom: 0,
        marginTop: 0
      }}
    >
      <AnimatedGradient 
        colors={colors} 
        speed={0.1} 
        blur="light" 
      />
      
      <div className="relative z-20 flex items-center justify-center w-full px-4">
        <span
          style={{
            color: '#1e293b', // slate-800
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '0.01em',
            textAlign: 'center',
            width: '100%',
            textShadow: '0 1px 2px rgba(255,255,255,0.8)'
          }}
        >
          {greeting || 'Good Morning'}
        </span>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes background-gradient {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(calc(50% * var(--tx-1, 1)), calc(50% * var(--ty-1, 1))); }
            40% { transform: translate(calc(50% * var(--tx-2, -1)), calc(50% * var(--ty-2, 1))); }
            60% { transform: translate(calc(50% * var(--tx-3, 1)), calc(50% * var(--ty-3, -1))); }
            80% { transform: translate(calc(50% * var(--tx-4, -1)), calc(50% * var(--ty-4, -1))); }
          }
          .animate-background-gradient {
            animation: background-gradient var(--background-gradient-speed, 20s) cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
          }
        `
      }} />
    </div>
  );
};

export default GoodMorningTitle; 