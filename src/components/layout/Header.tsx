import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Tooltip,
  Link
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { supabase } from '../../services/supabase';

interface HeaderProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, darkMode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('Iniciando logout...');
      
      // Limpiar inmediatamente el estado local
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Llamar a signOut de Supabase sin esperar
      supabase.auth.signOut().catch((error: any) => {
        console.log('Error en signOut (ignorado):', error);
      });
      
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Siempre redirigir con recarga completa
      console.log('Redirigiendo a login...');
      window.location.href = '/login';
    }
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={1}
      sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'background-color 0.2s'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Logo SVG Component */}
          <Box sx={{ mr: 2 }}>
            <svg width={40} height={40} viewBox="0 0 100 100">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <path d="M10 50 Q15 25, 20 50 T30 50" stroke="url(#waveGradient)" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <path d="M20 50 Q25 20, 30 50 T40 50" stroke="url(#waveGradient)" strokeWidth="7" fill="none" strokeLinecap="round"/>
              <path d="M30 50 Q35 15, 40 50 T50 50" stroke="url(#waveGradient)" strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M40 50 Q45 10, 50 50 T60 50" stroke="url(#waveGradient)" strokeWidth="9" fill="none" strokeLinecap="round"/>
            </svg>
          </Box>
          
          <Box sx={{ textAlign: 'left' }}>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              color="text.primary"
              sx={{ lineHeight: 1, mb: 0 }}
            >
              pulse
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              fontWeight="medium"
              sx={{ 
                letterSpacing: 2,
                lineHeight: 1,
                fontSize: '0.7rem'
              }}
            >
              JOURNAL
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mr: 2, 
                  display: { xs: 'none', sm: 'block' },
                  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                }}
              >
                {user.email}
              </Typography>
              
              <Tooltip title="Configuración">
                <IconButton 
                  component={RouterLink} 
                  to="/settings"
                  sx={{ 
                    mr: 1,
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      opacity: 0.1
                    }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Cerrar sesión">
                <IconButton 
                  onClick={handleLogout} 
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.light',
                      opacity: 0.1
                    }
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
            <IconButton 
              onClick={toggleDarkMode} 
              color="inherit"
              sx={{ ml: 1 }}
            >
              {darkMode ? (
                <Sun size={20} color="#fbbf24" />
              ) : (
                <Moon size={20} color="#4b5563" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;