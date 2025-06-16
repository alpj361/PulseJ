import React from 'react';
import { TrendingUp } from 'lucide-react';
import { KeywordCount } from '../../types';
import { formatMentions } from '../../utils/formatNumbers';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  Button, 
  Avatar, 
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NumberOneIcon from '@mui/icons-material/LooksOne';
import NumberTwoIcon from '@mui/icons-material/LooksTwo';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TagIcon from '@mui/icons-material/Tag';

interface KeywordListCardProps {
  keywords: KeywordCount[];
  title?: string;
}

const KeywordListCard: React.FC<KeywordListCardProps> = ({
  keywords,
  title = 'Temas Principales'
}) => {
  const theme = useTheme();
  
  // Función para seleccionar el icono según la posición
  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <NumberOneIcon fontSize="small" />;
      case 1: return <NumberTwoIcon fontSize="small" />;
      default: return index + 1;
    }
  };
  
  // Función para obtener color según la posición
  const getRankColor = (index: number): string => {
    const colors = [
      theme.palette.primary.main,    // #1
      theme.palette.info.main,       // #2
      theme.palette.secondary.main,  // #3
      '#8b5cf6',                     // #4
      '#ec4899',                     // #5
      '#f97316',                     // #6
      '#84cc16',                     // #7
      '#06b6d4'                      // #8+
    ];
    return colors[Math.min(index, colors.length - 1)];
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.15),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': {
          boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.12)}`,
          transform: 'translateY(-8px)',
          borderColor: alpha(theme.palette.primary.main, 0.25),
          bgcolor: alpha(theme.palette.background.paper, 0.9),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, 
            ${theme.palette.info.main} 0%, 
            ${alpha(theme.palette.info.main, 0.8)} 50%, 
            ${theme.palette.info.light} 100%)`,
          borderRadius: '4px 4px 0 0',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at bottom right, ${alpha(theme.palette.info.main, 0.03)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: -1
        }
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          bgcolor: alpha(theme.palette.info.main, 0.04),
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: '12px',
            bgcolor: alpha(theme.palette.info.main, 0.1),
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.info.main, 0.15),
              transform: 'scale(1.05)'
            }
          }}
        >
          <TrendingUp 
            size={20} 
            color={theme.palette.info.main}
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))'
            }}
          />
        </Box>
        <Typography 
          variant="h6" 
          color="text.primary" 
          fontWeight="600"
          letterSpacing="-0.025em"
          sx={{
            fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {title}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${keywords.length} temas`}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: theme.palette.info.main,
              fontWeight: '500',
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              backdropFilter: 'blur(4px)'
            }}
          />
        </Box>
      </Box>
      
      <List sx={{ flexGrow: 1, py: 1 }}>
        {keywords.slice(0, 10).map((keyword, index) => (
          <React.Fragment key={keyword.keyword}>
            <ListItem
              sx={{
                py: 1.5,
                px: 2.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  transform: 'translateX(8px)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.15)}`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                  '& .keyword-avatar': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 4px 12px ${alpha(getRankColor(index), 0.3)}`
                  },
                  '& .keyword-text': {
                    color: theme.palette.info.main,
                    fontWeight: '600'
                  }
                },
                borderRadius: 3,
                mx: 1,
                my: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                border: '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: `linear-gradient(180deg, ${getRankColor(index)} 0%, ${alpha(getRankColor(index), 0.6)} 100%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover::before': {
                  opacity: 1
                }
              }}
            >
              <Avatar
                className="keyword-avatar"
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha(getRankColor(index), 0.12),
                  color: getRankColor(index),
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `2px solid ${alpha(getRankColor(index), 0.2)}`,
                  backdropFilter: 'blur(8px)',
                  boxShadow: `0 2px 8px ${alpha(getRankColor(index), 0.2)}`,
                  '&:hover': {
                    bgcolor: alpha(getRankColor(index), 0.2),
                    borderColor: alpha(getRankColor(index), 0.4)
                  }
                }}
              >
                {getRankIcon(index)}
              </Avatar>
              
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography 
                  className="keyword-text"
                  variant="body1" 
                  fontWeight="500"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.primary',
                    fontSize: '0.95rem',
                    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {keyword.keyword}
                </Typography>
                
                <Chip
                  icon={<TagIcon sx={{ fontSize: '0.8rem !important' }} />}
                  label={formatMentions(typeof keyword.count === 'number' ? keyword.count : 0)}
                  size="small"
                  sx={{ 
                    height: 22,
                    '& .MuiChip-label': { 
                      px: 1.5, 
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: 'text.secondary'
                    },
                    bgcolor: alpha(getRankColor(index), 0.08),
                    border: `1px solid ${alpha(getRankColor(index), 0.15)}`,
                    backdropFilter: 'blur(4px)',
                    mt: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(getRankColor(index), 0.12),
                      borderColor: alpha(getRankColor(index), 0.25)
                    }
                  }}
                />
              </Box>
            </ListItem>
            {index < keywords.length - 1 && index < 9 && (
              <Divider 
                variant="middle" 
                sx={{ 
                  opacity: 0.3,
                  mx: 4,
                  borderStyle: 'dashed',
                  borderColor: alpha(theme.palette.info.main, 0.2),
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    opacity: 0.6
                  }
                }} 
              />
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Box
        sx={{
          p: 2.5,
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.info.main, 0.1),
          display: 'flex',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.info.main, 0.02),
          backdropFilter: 'blur(8px)'
        }}
      >
        <Button
          color="primary"
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            textTransform: 'none',
            fontWeight: '500',
            fontSize: '0.875rem',
            px: 3,
            py: 1.5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
            backdropFilter: 'blur(8px)',
            color: theme.palette.info.main,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.01em',
            '&:hover': {
              bgcolor: alpha(theme.palette.info.main, 0.12),
              borderColor: alpha(theme.palette.info.main, 0.25),
              transform: 'translateX(4px)',
              boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.2)}`,
              '& .MuiButton-endIcon': {
                transform: 'translateX(2px)'
              }
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiButton-endIcon': {
              transition: 'transform 0.3s ease'
            }
          }}
        >
          Ver todos los temas
        </Button>
      </Box>
    </Paper>
  );
};

export default KeywordListCard;