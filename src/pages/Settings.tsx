import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      setSuccess('');
      const { data, error } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (error) {
        setError('No se pudo cargar el perfil');
      } else if (data && data.phone) {
        setPhone(data.phone);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const { error } = await supabase.from('profiles').upsert({ id: user.id, phone });
    if (error) {
      setError('No se pudo guardar el número');
    } else {
      setSuccess('Número actualizado correctamente');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
        Configuración de Usuario
      </h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de teléfono asociado a tu cuenta
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
            placeholder="Ej: +502 1234 5678"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      </form>
    </div>
  );
};

export default Settings; 