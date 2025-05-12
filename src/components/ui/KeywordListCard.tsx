import React from 'react';
import { TrendingUp } from 'lucide-react';
import { KeywordCount } from '../../types';

interface KeywordListCardProps {
  keywords: KeywordCount[];
  title?: string;
}

const KeywordListCard: React.FC<KeywordListCardProps> = ({
  keywords,
  title = 'Top Keywords'
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-medium text-gray-800 dark:text-white flex items-center">
          <TrendingUp size={18} className="mr-2 text-blue-500" />
          {title}
        </h3>
      </div>
      
      <div className="p-4">
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {keywords.slice(0, 10).map((keyword, index) => (
            <li key={keyword.keyword} className="py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    {index + 1}.
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {keyword.keyword}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {keyword.count}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
        <button className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200">
          View all keywords →
        </button>
      </div>
    </div>
  );
};

export default KeywordListCard;