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

  useEffect(() => {
    const loadLatestTrends = async () => {
      try {
        console.log('Intentando cargar las últimas tendencias...');
        const latestData = await getLatestTrends();
        console.log('Datos de tendencias recibidos:', latestData);
        if (latestData) {
          setWordCloudData(latestData.wordCloudData);
          setTopKeywords(latestData.topKeywords);
          setCategoryData(latestData.categoryData);
          setLastUpdated(new Date(latestData.timestamp));
        }
      } catch (err) {
        console.error('Error loading latest trends:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadLatestTrends();
  }, []);

  const fetchTrendingData = async () => {
    console.log('Botón Buscar Tendencias clickeado');
    setIsLoading(true);
    setError(null);
    
    setTimeout(async () => {
      try {
        console.log('Llamando a fetchAndStoreTrends()...');
        const data = await fetchAndStoreTrends();
        console.log('Datos recibidos de fetchAndStoreTrends:', data);
        
        if (!data || !data.wordCloudData || !data.topKeywords || !data.categoryData) {
          console.error('Datos recibidos con estructura inválida:', data);
          setError('Los datos recibidos no tienen el formato esperado. Por favor, intente de nuevo.');
        } else {
          setWordCloudData(data.wordCloudData);
          setTopKeywords(data.topKeywords);
          setCategoryData(data.categoryData);
          setLastUpdated(new Date(data.timestamp) || new Date());
          console.log('Estado actualizado con nuevos datos');
        }
      } catch (err) {
        console.error('Error fetching trend data:', err);
        setError('Error al obtener datos de tendencias. Por favor, intente nuevamente.');
      } finally {
        console.log('Finalizando carga, isLoading establecido a false');
        setIsLoading(false);
      }
    }, 100);
  };

  const handleWordClick = (word: string, value: number) => {
    setSelectedKeyword(word);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 glass p-4 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando datos de tendencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100/20 dark:border-gray-700/20">
        <div className="flex items-center">
          <LayoutDashboard className="h-7 w-7 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Resumen de Tendencias</h1>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Evento de click en botón detectado');
              fetchTrendingData();
            }}
            disabled={isLoading}
            className="flex items-center px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-sm hover:shadow-md"
          >
            <Search className="h-5 w-5 mr-2" />
            {isLoading ? 'Buscando...' : 'Buscar Tendencias'}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Última actualización: {new Intl.DateTimeFormat('es-ES', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            }).format(lastUpdated)}
          </span>
        </div>
      </header>

      <section className="glass rounded-2xl p-6 border border-gray-100/20 dark:border-gray-700/20 transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center justify-between" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
          <span className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            Palabras Clave Tendencia
          </span>
          {selectedKeyword && (
            <span className="text-sm font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-1.5 rounded-full">
              Seleccionado: {selectedKeyword}
            </span>
          )}
        </h2>
        <div className="aspect-video max-h-[400px]">
          <WordCloud 
            data={wordCloudData} 
            width={800} 
            height={400} 
            onWordClick={handleWordClick}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 glass rounded-2xl p-6 border border-gray-100/20 dark:border-gray-700/20">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            <BarChartIcon className="h-5 w-5 text-blue-500 mr-2" />
            Distribución por Tema
          </h2>
          <BarChart data={categoryData} />
        </section>

        <section className="lg:col-span-1">
          <KeywordListCard 
            keywords={topKeywords} 
            title="Temas Principales" 
          />
        </section>
      </div>

      {error && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-2xl shadow-lg max-w-md mx-4">
            <div className="text-red-500 mb-4 text-center text-xl">Error</div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <div className="flex justify-center">
              <button 
                onClick={() => setError(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-xl transition-all duration-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-6 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-700 dark:text-gray-300">Obteniendo datos de tendencias...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trends;