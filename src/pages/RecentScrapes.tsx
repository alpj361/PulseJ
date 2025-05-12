import React, { useState, useMemo } from 'react';
import { Filter, Newspaper } from 'lucide-react';
import NewsCard from '../components/ui/NewsCard';
import FilterBar from '../components/ui/FilterBar';
import { DateFilter, NewsItem } from '../types';
import { newsItems } from '../data/mockData';

const RecentScrapes: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  // Extract unique categories and sources for filter options
  const categories = useMemo(() => {
    return Array.from(new Set(newsItems.map(item => item.category)));
  }, []);

  const sources = useMemo(() => {
    return Array.from(new Set(newsItems.map(item => item.source)));
  }, []);

  // Filter news items based on selected filters
  const filteredNews = useMemo(() => {
    let filtered = [...newsItems];
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (dateFilter) {
        case '24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.date) >= cutoff);
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Apply source filter
    if (sourceFilter) {
      filtered = filtered.filter(item => item.source === sourceFilter);
    }
    
    return filtered;
  }, [newsItems, dateFilter, categoryFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Newspaper className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent News</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredNews.length} articles found
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        categories={categories}
        sources={sources}
      />

      {/* News Grid */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No results found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your filters to find more articles.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentScrapes;