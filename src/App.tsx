import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { Trends } from './pages/Trends';
import RecentActivity from './pages/RecentActivity';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import TestHashtagCard from './components/test/TestHashtagCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import Codex from './pages/Codex';

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Ruta de prueba para el nuevo formato JSON */}
          <Route path="/test-hashtag" element={
            <Layout>
              <TestHashtagCard />
            </Layout>
          } />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Trends />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/recent" element={
            <ProtectedRoute>
              <Layout>
                <RecentActivity />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sources" element={
            <ProtectedRoute>
              <Layout>
                <Sources />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/library" element={
            <ProtectedRoute>
              <Layout>
                <Codex />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;