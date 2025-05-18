import React from 'react';
import { ActivitySquare, Moon, Sun, Cog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, darkMode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm py-4 px-6 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <ActivitySquare className="h-8 w-8 text-blue-500 transition-all duration-300 hover:rotate-90" />
          <h1 className="text-xl font-light tracking-wider text-gray-800 dark:text-white uppercase" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Pulse Journal
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center mr-4">
              <span className="text-sm text-gray-600 dark:text-gray-300 mr-2 hidden sm:inline" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                {user.email}
              </span>
              <Link
                to="/settings"
                className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 flex items-center text-sm border border-transparent hover:border-blue-400 mr-2"
                aria-label="Configuración"
                title="Configuración"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.572-1.01c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.01z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors duration-200 flex items-center text-sm border border-transparent hover:border-red-400"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m5.657-5.657a8 8 0 11-11.314 0" />
                </svg>
              </button>
            </div>
          )}
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;