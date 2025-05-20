import React from 'react';
import { ActivitySquare, Moon, Sun } from 'lucide-react';
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

interface HeaderProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, darkMode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Navigate first, then sign out to prevent reloading trends
      navigate('/login');
      // Use setTimeout to ensure navigation completes before signOut
      setTimeout(async () => {
        await signOut();
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
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
          <ActivitySquare 
            size={32} 
            color="#3b82f6" 
            style={{ marginRight: 12, transition: 'all 0.3s' }}
            className="hover:rotate-90"
          />
          <Typography 
            variant="h6" 
            component="h1" 
            sx={{ 
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: 300,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: darkMode ? 'white' : 'text.primary'
            }}
          >
            Pulse Journal
          </Typography>
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