import React from 'react';
import { DecisionTimelineMock } from '../components/ui/DecisionTimelineMock';

export const DecisionTimelineDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Timeline de Decisiones - Demo
          </h1>
          <p className="text-gray-600">
            Demo del sistema de timeline de decisiones estilo Twitter thread
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Funcionalidades demostradas:</strong> Estructura de hilos, líneas de conexión, 
              badges de tipo y urgencia, botones de expansión, métricas de complejidad y sistema de capas.
            </p>
          </div>
        </div>

        <DecisionTimelineMock className="bg-white rounded-lg shadow-sm p-6" />
      </div>
    </div>
  );
}; 