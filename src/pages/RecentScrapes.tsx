import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const WHATSAPP_BOT_NUMBER = '50252725024';

interface Scrape {
  id: string;
  created_at: string;
  type: string;
  value: string;
  summary: string;
}

const RecentScrapes: React.FC = () => {
  const { user } = useAuth();
  const [scrapes, setScrapes] = useState<Scrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const fetchPhoneAndScrapes = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      // Obtener el número de teléfono del perfil
      const { data: profile, error: profileError } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (profileError || !profile?.phone) {
        setError('No se pudo obtener tu número de teléfono. Ve a Settings para configurarlo.');
        setLoading(false);
        return;
      }
      setUserPhone(profile.phone);
      // Obtener los scrapes asociados a ese número
      const { data, error: scrapesError } = await supabase
        .from('scrapes')
        .select('*')
        .eq('wa_number', profile.phone)
        .order('created_at', { ascending: false });
      if (scrapesError) {
        setError('No se pudieron cargar tus scrapes recientes.');
      } else {
        setScrapes(data || []);
      }
      setLoading(false);
    };
    fetchPhoneAndScrapes();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-4">
            WhatsApp Bot
          </span>
          <a
            href={`https://wa.me/${WHATSAPP_BOT_NUMBER}?text=Hola%20Bot%2C%20quiero%20scrapear%20...`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-semibold"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63A12.07 12.07 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.26-1.44l-.38-.22-3.69.97.99-3.59-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3 .15.19 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z"/></svg>
            Chatear con el Bot
          </a>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {userPhone && <span>Tu número: <span className="font-semibold">{userPhone}</span></span>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
          Tus Scrapes Recientes
        </h2>
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Cargando scrapes...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : scrapes.length === 0 ? (
          <div className="text-gray-500 text-sm">No tienes scrapes recientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Resumen</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {scrapes.map(scrape => (
                  <tr key={scrape.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {new Date(scrape.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {scrape.type}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700 dark:text-blue-300 font-mono">
                      {scrape.value}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 max-w-xs truncate">
                      {scrape.summary || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Opciones futuras: Presentaciones y Comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-400">
          <span className="text-lg font-semibold mb-2" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Presentaciones</span>
          <span className="inline-block px-4 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium">Coming Soon</span>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-400">
          <span className="text-lg font-semibold mb-2" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Comparativas</span>
          <span className="inline-block px-4 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};

export default RecentScrapes;