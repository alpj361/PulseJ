import * as React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Color del glow (tailwind color key). Ej: 'blue', 'purple', 'green'.
   * También acepta cualquier string de clases Tailwind personalizadas.
   * @default 'blue'
   */
  glowColor?: string;
  /**
   * Si se pasa, el componente no aplica padding por defecto para que el
   * consumidor establezca su propio tamaño. (true = sin padding interno)
   */
  customSize?: boolean;
}

/**
 * GlowCard
 * Tarjeta con borde/brillo sutil que se intensifica al hacer hover.
 * Inspirada en soluciones de glassmorphism + spotlight.
 */
export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      className,
      children,
      glowColor = "blue",
      customSize = false,
      ...props
    },
    ref
  ) => {
    // Mapas básicos de gradientes. Se pueden extender fácilmente.
    const gradientMap: Record<string, string> = {
      blue: "from-blue-400/20 via-blue-500/30 to-blue-600/10",
      purple: "from-purple-400/20 via-purple-500/30 to-purple-600/10",
      green: "from-green-400/20 via-green-500/30 to-green-600/10",
      indigo: "from-indigo-400/20 via-indigo-500/30 to-indigo-600/10",
    };

    const gradient = gradientMap[glowColor] ?? gradientMap.blue;

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-md transition-shadow duration-200 group hover:shadow-lg",
          customSize ? undefined : "p-6",
          className
        )}
        {...props}
      >
        {/* Capa de glow */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 scale-105 opacity-0 blur-lg transition-opacity duration-700 group-hover:opacity-100",
            `bg-gradient-to-br ${gradient}`
          )}
        />
        {/* Contenido */}
        {children}
      </div>
    );
  }
);
GlowCard.displayName = "GlowCard"; 