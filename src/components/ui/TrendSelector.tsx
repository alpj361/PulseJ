import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { createClient } from '@supabase/supabase-js';

interface TrendSelectorProps {
  selectedTrends: string[];
  onTrendChange: (trends: string[]) => void;
}

interface TrendItem {
  name?: string;
  query?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TrendSelector: React.FC<TrendSelectorProps> = ({ selectedTrends, onTrendChange }) => {
  const [trends, setTrends] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        // Obtener las últimas tendencias de la tabla trends
        const { data, error } = await supabase
          .from('trends')
          .select('raw_data')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching trends:', error);
          throw error;
        }

        // Extraer las tendencias del raw_data
        const trendsList = (data?.raw_data?.trends || []) as TrendItem[];
        
        // Obtener los nombres de las tendencias y filtrar únicos
        const uniqueTrends = Array.from(new Set(
          trendsList
            .map((trend: TrendItem) => trend.name || trend.query || '')
            .filter(Boolean)
        )) as string[];

        console.log('Tendencias obtenidas:', uniqueTrends);
        setTrends(uniqueTrends);
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  const handleTrendToggle = (trend: string) => {
    if (selectedTrends.includes(trend)) {
      onTrendChange(selectedTrends.filter(t => t !== trend));
    } else {
      onTrendChange([...selectedTrends, trend]);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Selecciona Tendencias
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {trends.map(trend => (
            <Chip
              key={trend}
              label={trend}
              variant={selectedTrends.includes(trend) ? 'filled' : 'outlined'}
              color={selectedTrends.includes(trend) ? 'primary' : 'default'}
              onClick={() => handleTrendToggle(trend)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TrendSelector; 