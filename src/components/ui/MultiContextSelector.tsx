import React, { useState, useRef, useEffect } from 'react';
import { Box, Chip, Typography, Tooltip, ClickAwayListener } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendSelector from './TrendSelector';

interface ContextOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

interface MultiContextSelectorProps {
  selectedContexts: string[];
  onContextChange: (contexts: string[]) => void;
  disabled?: boolean;
}

const contextOptions: ContextOption[] = [
  {
    value: 'tendencias',
    label: 'Tendencias',
    description: 'Análisis de tendencias actuales y patrones emergentes',
    icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
  },
  {
    value: 'noticias',
    label: 'Noticias',
    description: 'Cobertura mediática y análisis de noticias recientes',
    icon: <ArticleIcon sx={{ fontSize: 20 }} />,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
  },
  {
    value: 'codex',
    label: 'Documentos',
    description: 'Base de conocimientos y documentos del codex',
    icon: <LibraryBooksIcon sx={{ fontSize: 20 }} />,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
  }
];

const MultiContextSelector: React.FC<MultiContextSelectorProps> = ({
  selectedContexts,
  onContextChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTrendSelector, setShowTrendSelector] = useState(false);
  
  const handleContextToggle = (contextValue: string) => {
    if (disabled) return;
    
    if (selectedContexts.includes(contextValue)) {
      // Remove context
      onContextChange(selectedContexts.filter(c => c !== contextValue));
      if (contextValue === 'tendencias') {
        setShowTrendSelector(false);
      }
    } else {
      // Add context
      onContextChange([...selectedContexts, contextValue]);
      if (contextValue === 'tendencias') {
        setShowTrendSelector(true);
      }
    }
  };

  const getDisplayLabel = () => {
    if (selectedContexts.length === 0) return 'Contexto';
    if (selectedContexts.length === 1) {
      const option = contextOptions.find(opt => opt.value === selectedContexts[0]);
      return option?.label || 'Contexto';
    }
    return `${selectedContexts.length} seleccionados`;
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        {/* Toggle Button */}
        <Box
          onClick={() => !disabled && setIsOpen(!isOpen)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            minWidth: '160px',
            px: 1.5,
            py: 1,
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.6 : 1,
            '&:hover': !disabled ? {
              backgroundColor: '#F9FAFB'
            } : {},
            '&:focus': {
              outline: 'none',
              borderColor: '#3B82F6',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '14px', color: '#374151' }}>
            {getDisplayLabel()}
          </Typography>
          <KeyboardArrowDownIcon 
            sx={{ 
              fontSize: 20, 
              color: '#6B7280',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </Box>

        {/* Dropdown Menu */}
        {isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              py: 1.5,
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 10
            }}
          >
            {contextOptions.map((option) => {
              const isSelected = selectedContexts.includes(option.value);
              
              return (
                <Box
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextToggle(option.value);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.5,
                    mx: 1,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#F9FAFB'
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by parent onClick
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                      accentColor: '#3B82F6'
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      userSelect: 'none'
                    }}
                  >
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Trend Selector */}
        {showTrendSelector && <TrendSelector />}
      </Box>
    </ClickAwayListener>
  );
};

export default MultiContextSelector; 