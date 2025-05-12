export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  excerpt: string;
  category: string;
  keywords: string[];
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export type DateFilter = '24h' | '7d' | '30d' | 'all';