import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Header toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed z-20 bottom-4 right-4 glass rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X size={24} className="text-gray-700 dark:text-gray-300" /> : <Menu size={24} className="text-gray-700 dark:text-gray-300" />}
        </button>

        {/* Sidebar */}
        <div
          className={`md:relative fixed inset-y-0 left-0 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 z-10 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-theme">
          <div className="container mx-auto px-4 py-8 stagger-children">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};