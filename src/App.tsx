import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Trends from './pages/Trends';
import RecentScrapes from './pages/RecentScrapes';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Trends />} />
          <Route path="/recent" element={<RecentScrapes />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;