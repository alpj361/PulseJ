import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description = 'This feature is currently under development and will be available soon.'
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <Construction size={64} className="text-blue-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-md">{description}</p>
      <div className="mt-8">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default ComingSoon;