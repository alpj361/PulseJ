import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { LanguageProvider } from '../../context/LanguageContext';
import { Box, IconButton, useMediaQuery, useTheme, CssBaseline } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <LanguageProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
        
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Mobile sidebar toggle */}
          {isMobile && (
            <IconButton
              onClick={toggleSidebar}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 20,
                backgroundColor: 'background.paper',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                },
                transition: 'all 0.3s',
              }}
            >
              {sidebarOpen ? 
                <X size={24} color={darkMode ? "#cbd5e1" : "#374151"} /> : 
                <Menu size={24} color={darkMode ? "#cbd5e1" : "#374151"} />
              }
            </IconButton>
          )}

          {/* Sidebar */}
          <Box
            sx={{
              position: { xs: 'fixed', md: 'relative' },
              top: 0,
              bottom: 0,
              left: 0,
              transform: {
                xs: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                md: 'translateX(0)',
              },
              zIndex: 10,
              transition: 'transform 0.3s ease-in-out',
              height: '100%',
            }}
          >
            <Sidebar closeSidebar={() => setSidebarOpen(false)} />
          </Box>

          {/* Main content */}
          <Box 
            component="main" 
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              bgcolor: darkMode ? 'grey.900' : 'grey.50',
              transition: 'background-color 0.2s'
            }}
          >
            <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 3, py: 4 }}>
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </LanguageProvider>
  );
};

export default Layout;