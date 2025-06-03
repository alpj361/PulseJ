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
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-3px)'
        }
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <TrendingUp 
          size={20} 
          color={theme.palette.primary.main} 
          style={{ marginRight: 8 }}
        />
        <Typography 
          variant="h6" 
          color="text.primary" 
          fontWeight="medium"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
        >
          {title}
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, py: 1 }}>
        {keywords.slice(0, 10).map((keyword, index) => (
          <React.Fragment key={keyword.keyword}>
            <ListItem
              sx={{
                py: 1,
                px: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateX(4px)'
                },
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(getRankColor(index), 0.15),
                  color: getRankColor(index),
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(getRankColor(index), 0.25),
                  }
                }}
              >
                {getRankIcon(index)}
              </Avatar>
              
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography 
                  variant="body1" 
                  fontWeight="medium"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.primary',
                    fontSize: '0.95rem'
                  }}
                >
                  {keyword.keyword}
                </Typography>
                
                <Chip
                  icon={<TagIcon sx={{ fontSize: '0.8rem !important' }} />}
                  label={formatMentions(keyword.count)}
                  size="small"
                  sx={{ 
                    height: 20,
                    '& .MuiChip-label': { 
                      px: 1, 
                      fontSize: '0.7rem',
                      color: 'text.secondary'
                    },
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    mt: 0.5
                  }}
                />
              </Box>
            </ListItem>
            {index < keywords.length - 1 && index < 9 && (
              <Divider 
                variant="middle" 
                sx={{ 
                  opacity: 0.6,
                  mx: 3,
                  borderStyle: 'dashed'
                }} 
              />
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button
          color="primary"
          endIcon={<ArrowForwardIcon />}
          sx={{ 
            textTransform: 'none',
            fontWeight: 'medium',
            fontSize: '0.85rem',
            '&:hover': {
              background: 'transparent',
              transform: 'translateX(3px)'
            },
            transition: 'transform 0.3s ease'
          }}
        >
          Ver todos los temas
        </Button>
      </Box>
    </Paper>
  );
};

export default KeywordListCard;