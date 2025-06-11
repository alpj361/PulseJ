import React, { useState } from 'react';
import Header from './Header';
import { SessionNavBar } from '../ui/sidebar';
import { LanguageProvider } from '../../context/LanguageContext';
import { ViztaChatUI } from '../ui/vizta-chat';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <LanguageProvider>
      <div className="flex h-screen bg-background">
        {/* Nuevo sidebar autónomo */}
        <SessionNavBar />
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 ml-12">
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