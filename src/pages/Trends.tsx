import React, { useState, useEffect } from 'react';
import { BarChart3 as BarChartIcon, LayoutDashboard, Search, TrendingUp } from 'lucide-react';
import WordCloud from '../components/ui/WordCloud';
import BarChart from '../components/ui/BarChart';
import KeywordListCard from '../components/ui/KeywordListCard';
import { wordCloudData as mockWordCloudData, topKeywords as mockTopKeywords, categoryData as mockCategoryData } from '../data/mockData';
import { fetchAndStoreTrends, getLatestTrends } from '../services/api';

const Trends: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wordCloudData, setWordCloudData] = useState(mockWordCloudData);
  const [topKeywords, setTopKeywords] = useState(mockTopKeywords);
  const [categoryData, setCategoryData] = useState(mockCategoryData);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Load latest trend data when component mounts
  useEffect(() => {
    const loadLatestTrends = async () => {
      try {
        const latestData = await getLatestTrends();
        
        if (latestData) {
          setWordCloudData(latestData.wordCloudData);
          setTopKeywords(latestData.topKeywords);
          setCategoryData(latestData.categoryData);
          setLastUpdated(new Date(latestData.timestamp));
        }
      } catch (err) {
        console.error('Error loading latest trends:', err);
        // Keep the mock data if there's an error
      } finally {
        setInitialLoading(false);
      }
    };

    loadLatestTrends();
  }, []);

  const fetchTrendingData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call our API service to fetch trends from VPS and store in Supabase
      const data = await fetchAndStoreTrends();
      
      // Update state with the new data
      setWordCloudData(data.wordCloudData);
      setTopKeywords(data.topKeywords);
      setCategoryData(data.categoryData);
      setLastUpdated(new Date(data.timestamp) || new Date());
    } catch (err) {
      console.error('Error fetching trend data:', err);
      setError('Failed to fetch trending data. Please try again later.');
      // Keep the existing data displayed
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = (word: string, value: number) => {
    setSelectedKeyword(word);
    // You could implement additional functionality here
    // For example, filtering news items that contain this keyword
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading trends data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <LayoutDashboard className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Trends Overview</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchTrendingData}
            disabled={isLoading}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-blue-300"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search Trends'}
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Word Cloud Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
          <span>Trending Keywords</span>
          {selectedKeyword && (
            <span className="text-sm font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">
              Selected: {selectedKeyword}
            </span>
          )}
        </h3>
        <div className="aspect-video max-h-[400px]">
          <WordCloud 
            data={wordCloudData} 
            width={800} 
            height={400} 
            onWordClick={handleWordClick}
          />
        </div>
      </div>

      {/* Trending Topics Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Trending Topics
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topKeywords.slice(0, 10).map((keyword, index) => (
            <div 
              key={keyword.keyword} 
              className={`p-3 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                selectedKeyword === keyword.keyword ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''
              }`}
              onClick={() => setSelectedKeyword(keyword.keyword)}
            >
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 dark:text-white font-medium truncate">
                    {keyword.keyword}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {keyword.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center mb-4">
          <BarChartIcon className="h-5 w-5 text-blue-500 mr-2" />
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

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-700 dark:text-gray-300">Fetching trend data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
            <div className="text-red-500 mb-4 text-center text-xl">Error</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <div className="flex justify-center">
              <button 
                onClick={() => setError(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trends;