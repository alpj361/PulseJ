import React from 'react';
import { Calendar, Bookmark } from 'lucide-react';
import { NewsItem } from '../../types';

interface NewsCardProps {
  news: NewsItem;
}

const NewsRecentActivity: React.FC<NewsCardProps> = ({ news }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white leading-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            {news.title}
          </h3>
          <button 
            className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors duration-200"
            aria-label="Bookmark article"
          >
            <Bookmark size={20} />
          </button>
        </div>
        
        <div className="flex items-center mt-3 space-x-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {news.source}
          </span>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(news.date)}</span>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
            {news.excerpt}
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span 
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              news.category === 'Technology' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
              news.category === 'Environment' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              news.category === 'Health' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
              news.category === 'Business' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
              news.category === 'Science' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
              news.category === 'Finance' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {news.category}
          </span>
          
          <button className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200">
            Read more
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsRecentActivity;