import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import LogRocket from 'logrocket';

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  layerslimit: number;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError(profileError.message);
          return;
        }

        const userProfile: UserProfile = {
          id: data.id,
          email: user.email || 'unknown@email.com',
          credits: data.credits || 0,
          layerslimit: data.layerslimit || 3,
          role: data.role || 'user',
          created_at: data.created_at,
          updated_at: data.updated_at
        };

        setProfile(userProfile);

        // Configurar LogRocket con datos del usuario
        LogRocket.identify(userProfile.id, {
          name: userProfile.email.split('@')[0], // Usar parte antes del @ como nombre
          email: userProfile.email,
          
          // Variables personalizadas del sistema
          credits: userProfile.credits,
          layersLimit: userProfile.layerslimit,
          role: userProfile.role,
          accountType: userProfile.role === 'admin' ? 'admin' : 'user',
          creditsStatus: userProfile.credits > 50 ? 'high' : userProfile.credits > 20 ? 'medium' : 'low',
          hasUnlimitedAccess: userProfile.role === 'admin',
          
          // Metadatos adicionales
          registrationDate: userProfile.created_at,
          lastUpdate: userProfile.updated_at,
          userId: userProfile.id
        });

        console.log('✅ LogRocket configured for user:', userProfile.email, {
          credits: userProfile.credits,
          role: userProfile.role,
          layersLimit: userProfile.layerslimit
        });

      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  // Función para actualizar créditos localmente (para cuando se consumen)
  const updateCredits = (newCredits: number) => {
    if (profile) {
      const updatedProfile = { ...profile, credits: newCredits };
      setProfile(updatedProfile);
      
      // Actualizar LogRocket con nuevos créditos
      LogRocket.identify(profile.id, {
        credits: newCredits,
        creditsStatus: newCredits > 50 ? 'high' : newCredits > 20 ? 'medium' : 'low'
      });
    }
  };

  return {
    profile,
    loading,
    error,
    updateCredits
  };
} 