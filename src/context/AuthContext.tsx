import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Definir el tipo del contexto
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isDemo: boolean;
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario demo simulado
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@pulsej.com',
  user_metadata: {
    name: 'Usuario Demo',
    full_name: 'Usuario Demo',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

// Sesión demo simulada
const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
} as Session;

// Verificar si estamos en modo demo
const isDemoMode = () => {
  // Verificar si hay un parámetro de URL para forzar modo demo
  const urlParams = new URLSearchParams(window.location.search);
  const hasDemoParam = urlParams.get('demo') === 'true';
  
  console.log('🔍 Verificando modo demo:', {
    url: window.location.href,
    search: window.location.search,
    demoParam: urlParams.get('demo'),
    hasDemoParam
  });
  
  if (hasDemoParam) {
    console.log('🎭 Modo demo activado por parámetro URL');
    return true;
  }
  
  // Verificar si las variables de entorno de Supabase están configuradas
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔍 Variables de entorno:', { 
    supabaseUrl: supabaseUrl || 'No configurada', 
    hasKey: !!supabaseKey 
  });
  
  // Si no están configuradas, activar modo demo automáticamente
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://example.com' || supabaseUrl === '') {
    console.log('🎭 Modo demo activado por falta de configuración de Supabase');
    return true;
  }
  
  console.log('🔒 Modo autenticado - Supabase configurado');
  return false;
};

// Proveedor de contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  // Escuchar cambios de URL para activar/desactivar modo demo
  useEffect(() => {
    const checkDemoMode = () => {
      const newDemoMode = isDemoMode();
      if (newDemoMode !== isDemo) {
        console.log('🔄 Cambio de modo demo detectado:', newDemoMode);
        setIsDemo(newDemoMode);
      }
    };

    // Verificar inmediatamente
    checkDemoMode();

    // Escuchar cambios de navegación
    window.addEventListener('popstate', checkDemoMode);
    
    // También verificar cuando la URL cambia programáticamente
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(checkDemoMode, 0);
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(checkDemoMode, 0);
    };

    return () => {
      window.removeEventListener('popstate', checkDemoMode);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      // En modo demo, configurar usuario demo inmediatamente
      console.log('🎭 AuthContext - Modo demo activado');
      setSession(DEMO_SESSION);
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Lógica original para modo autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext - Sesión inicial:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 AuthContext - Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      if (isDemo) {
        // En modo demo, simplemente recargar la página
        window.location.href = '/';
        return;
      }

      // Limpiar estado inmediatamente
      setSession(null);
      setUser(null);
      
      // Llamar a signOut de Supabase
      await supabase.auth.signOut();
      
      // Limpiar almacenamiento local
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error("Error en signOut de Supabase:", error);
      // Incluso si hay error, limpiar estado local
      setSession(null);
      setUser(null);
      // Limpiar almacenamiento local incluso si hay error
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  // Valor del contexto
  const value = {
    session,
    user,
    loading,
    signOut,
    isDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
} 