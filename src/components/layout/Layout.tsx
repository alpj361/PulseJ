import React, { useState } from 'react';
import Header from './Header';
import { SessionNavBar } from '../ui/sidebar';
import { LanguageProvider } from '../../context/LanguageContext';
import { ViztaChatUI } from '../ui/vizta-chat';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLogRocketEvents } from '../../hooks/useLogRocketEvents';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const { isDemo, user, session } = useAuth();
  

  
  // Configurar LogRocket automáticamente cuando el usuario esté autenticado
  const { profile, error } = useUserProfile();
  const { trackPageView } = useLogRocketEvents();
  const location = useLocation();
  
  // Rastrear cambios de página automáticamente
  useEffect(() => {
    if (profile && !isDemo) {
      const pageName = location.pathname.replace('/', '') || 'dashboard';
      trackPageView(pageName, {
        fullPath: location.pathname,
        search: location.search,
        timestamp: new Date().toISOString()
      });
    }
  }, [location, profile, trackPageView, isDemo]);
  
  if (error && !isDemo) {
    console.warn('⚠️ Error obteniendo perfil de usuario para LogRocket:', error);
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <LanguageProvider>
      <div className="flex h-screen bg-background">
        {/* Indicador de modo demo */}
        {isDemo && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: 'primary.main',
              color: 'white',
              py: 0.5,
              px: 2,
              textAlign: 'center',
              boxShadow: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <PlayArrow sx={{ fontSize: 16 }} />
              <Typography variant="body2" fontWeight="medium">
                🎭 MODO DEMO - Todas las funcionalidades habilitadas para evaluación (Admin activado)
              </Typography>
              <Chip 
                label="EVALUACIÓN" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(255,255,255,0.5)'
                }} 
              />
            </Box>
          </Box>
        )}

        {/* Nuevo sidebar autónomo */}
        <SessionNavBar />
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 ml-12" style={{ marginTop: isDemo ? '40px' : '0' }}>
          {/* Header */}
          <Header toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
          
          {/* Main content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
        
        {/* Vizta Chat */}
        <ViztaChatUI />
      </div>
    </LanguageProvider>
  );
};

export default Layout;