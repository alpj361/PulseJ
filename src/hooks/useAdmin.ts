import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkAdminRole() {
      console.log('🎯 useAdmin hook called, user:', user?.id);
      console.log('🔍 Checking admin role for user:', user?.id);
      
      if (!user) {
        console.log('❌ No user found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Making Supabase query...');
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log('📊 Supabase response:', { data, error });

        if (error) {
          console.error('❌ Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          const isAdminUser = data?.role === 'admin';
          console.log('👤 User role:', data?.role, '| Is admin:', isAdminUser);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error('💥 Exception checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
        console.log('🎯 useAdmin hook result:', { isAdmin, loading: false, userId: user?.id });
      }
    }

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
} 