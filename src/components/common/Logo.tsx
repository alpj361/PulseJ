import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

interface PulseLogoProps {
  size?: number;
  variant?: 'full' | 'icon'; // 'full' includes text, 'icon' is just the SVG
  textColor?: string;
}

const PulseLogoComponent: React.FC<PulseLogoProps> = ({ size, variant = 'full', textColor }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const defaultSize = isMobile ? 40 : 50;
  const logoSize = size !== undefined ? size : defaultSize;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: variant === 'full' ? (isMobile ? 1 : 1.5) : 0 }}>
      <svg width={logoSize} height={logoSize} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="waveGradientLogo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.palette.primary.light} />
            <stop offset="50%" stopColor={theme.palette.primary.main} />
            <stop offset="100%" stopColor={theme.palette.primary.dark} />
          </linearGradient>
        </defs>
        <path d="M10 50 Q15 25, 20 50 T30 50" stroke="url(#waveGradientLogo)" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M20 50 Q25 20, 30 50 T40 50" stroke="url(#waveGradientLogo)" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <path d="M30 50 Q35 15, 40 50 T50 50" stroke="url(#waveGradientLogo)" strokeWidth="8" fill="none" strokeLinecap="round"/>
        <path d="M40 50 Q45 10, 50 50 T60 50" stroke="url(#waveGradientLogo)" strokeWidth="9" fill="none" strokeLinecap="round"/>
      </svg>
      {variant === 'full' && (
        <Box sx={{ textAlign: 'left', lineHeight: 1 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight="bold"
            color={textColor || 'text.primary'}
            sx={{ lineHeight: 1, mb: 0 }}
          >
            pulse
          </Typography>
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            color={textColor || 'text.secondary'}
            fontWeight="medium"
            sx={{
              letterSpacing: isMobile ? 1.5 : 2,
              lineHeight: 1,
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              textTransform: 'uppercase'
            }}
          >
            JOURNAL
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PulseLogoComponent; 