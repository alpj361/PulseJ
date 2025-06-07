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
  sentimiento: 'positivo' | 'negativo' | 'neutral';
  score_sentimiento: number;
  confianza_sentimiento: number;
  emociones_detectadas: string[];
  // Campos de análisis avanzado
  intencion_comunicativa: 'informativo' | 'opinativo' | 'humoristico' | 'alarmista' | 'critico' | 'promocional' | 'conversacional' | 'protesta';
  propagacion_viral: 'viral' | 'alto_engagement' | 'medio_engagement' | 'bajo_engagement' | 'sin_engagement';
  score_propagacion: number;
  entidades_mencionadas: Array<{
    nombre: string;
    tipo: 'persona' | 'organizacion' | 'lugar' | 'evento';
    contexto?: string;
  }>;
  analisis_ai_metadata: {
    modelo?: string;
    timestamp?: string;
    contexto_local?: string;
    intensidad?: 'alta' | 'media' | 'baja';
    categoria?: string;
    tokens_usados?: number;
    costo_estimado?: number;
    error?: string;
  };
  created_at: string;
  updated_at: string;
}