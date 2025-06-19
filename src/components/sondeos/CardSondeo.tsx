import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export interface CardSondeoProps {
  /** Encabezado de la tarjeta */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Gradiente CSS para el encabezado. Ej: "linear-gradient(90deg,#8b5cf6,#ec4899)" */
  headerGradient?: string;
  /** Icono MUI/Lucide a renderizar en el encabezado */
  icon?: React.ReactNode;
  /** Contenido principal de la tarjeta (gráfico u otro) */
  children: React.ReactNode;
  /** Extra footer (métricas rápidas, botones, etc.) */
  footer?: React.ReactNode;
  /** Estilos extra al contenedor Card */
  sx?: SxProps<Theme>;
}

/**
 * CardSondeo – Tarjeta estilizada inspirada en SondeosSample.
 * Utiliza MUI pero admite gradientes y glassmorphism.
 */
const CardSondeo: React.FC<CardSondeoProps> = ({
  title,
  subtitle,
  headerGradient = 'linear-gradient(90deg,#6366f1,#8b5cf6)',
  icon,
  children,
  footer,
  sx
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.4)',
        ...sx
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: headerGradient,
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <CardContent>{children}</CardContent>

      {footer && (
        <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid rgba(0,0,0,0.05)' }}>{footer}</Box>
      )}
    </Card>
  );
};

export default CardSondeo;
