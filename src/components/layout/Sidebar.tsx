import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Database, Layers, LineChart, Lock } from 'lucide-react';

interface SidebarProps {
  closeSidebar: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  closeSidebar: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, disabled = false, closeSidebar }) => {
  if (disabled) {
    return (
      <div className="flex items-center px-4 py-3 text-gray-400 cursor-not-allowed group relative">
        <div className="mr-3">{icon}</div>
        <span>{label}</span>
        <span className="absolute right-2 text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
          Coming Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        } transition-colors duration-200`
      }
      onClick={closeSidebar}
    >
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  return (
    <div className="h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Dashboard</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <NavItem
          to="/"
          icon={<BarChart3 size={20} />}
          label="Trends"
          closeSidebar={closeSidebar}
        />
        <NavItem
          to="/recent"
          icon={<Layers size={20} />}
          label="Recent Scrapes"
          closeSidebar={closeSidebar}
        />
        <NavItem
          to="/sources"
          icon={<Database size={20} />}
          label="Sources"
          disabled={true}
          closeSidebar={closeSidebar}
        />
        <NavItem
          to="/analytics"
          icon={<LineChart size={20} />}
          label="Analytics"
          disabled={true}
          closeSidebar={closeSidebar}
        />
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Lock size={14} className="mr-1" />
          <span>Pulse Journal v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;