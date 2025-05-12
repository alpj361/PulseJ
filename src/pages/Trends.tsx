import React from 'react';
import { ChartBar, LayoutDashboard } from 'lucide-react';
import WordCloud from '../components/ui/WordCloud';
import BarChart from '../components/ui/BarChart';
import KeywordListCard from '../components/ui/KeywordListCard';
import { wordCloudData, topKeywords, categoryData } from '../data/mockData';

const Trends: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <LayoutDashboard className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Trends Overview</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date())}
        </div>
      </div>

      {/* Word Cloud Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Trending Keywords
        </h3>
        <div className="aspect-video max-h-[400px]">
          <WordCloud 
            data={wordCloudData} 
            width={800} 
            height={400} 
          />
        </div>
      </div>

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <ChartBar className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              News Distribution
            </h3>
          </div>
          <BarChart data={categoryData} />
        </div>

        {/* Keyword List */}
        <div className="lg:col-span-1">
          <KeywordListCard 
            keywords={topKeywords} 
            title="Top Keywords" 
          />
        </div>
      </div>
    </div>
  );
};

export default Trends;