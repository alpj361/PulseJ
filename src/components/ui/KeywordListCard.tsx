import React from 'react';
import { TrendingUp } from 'lucide-react';
import { KeywordCount } from '../../types';

interface KeywordListCardProps {
  keywords: KeywordCount[];
  title?: string;
}

const KeywordListCard: React.FC<KeywordListCardProps> = ({
  keywords,
  title = 'Temas Principales'
}) => {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-gray-100/20 dark:border-gray-700/20 transition-all duration-300 hover:shadow-lg">
      <div className="px-6 py-4 border-b border-gray-100/20 dark:border-gray-700/20">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
          <TrendingUp size={18} className="mr-2 text-blue-500" />
          {title}
        </h3>
      </div>
      
      <div className="p-4">
        <ul className="divide-y divide-gray-100/10 dark:divide-gray-700/10 stagger-children">
          {keywords.slice(0, 10).map((keyword, index) => (
            <li 
              key={keyword.keyword} 
              className="py-3 px-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300 rounded-xl group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white">
                    {index + 1}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {keyword.keyword}
                  </span>
                </div>
                <span className="glass text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  {keyword.count}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100/20 dark:border-gray-700/20">
        <button className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-300">
          Ver todos los temas →
        </button>
      </div>
    </div>
  );
};

export default KeywordListCard;