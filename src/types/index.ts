export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  excerpt: string;
  category: string;
  keywords: string[];
  url?: string;
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

export interface TrendingTweet {
  id: number;
  trend_original: string;
  trend_clean: string;
  categoria: 'Política' | 'Económica' | 'Sociales' | 'General';
  tweet_id: string;
  usuario: string;
  fecha_tweet: string | null;
  texto: string;
  enlace: string | null;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
  location: string;
  fecha_captura: string;
  raw_data: any;
  created_at: string;
  updated_at: string;
}