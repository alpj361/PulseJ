import React, { useState, useCallback, useMemo } from 'react';
import { ProjectDecision, DecisionTimelineItem } from '../../types/projects';
import { useDecisionTimeline, useParentChildDecisions, useProjectDecisions } from '../../hooks/useProjectDecisions';
import { LayeredDecisionCreator } from './LayeredDecisionCreator';
import { DecisionCard } from './DecisionCard';

interface DecisionChronologyProps {
  projectId: string;
  className?: string;
}

const DECISION_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los tipos', icon: '📋' },
  { value: 'enfoque', label: 'Enfoque', icon: '🎯' },
  { value: 'alcance', label: 'Alcance', icon: '📏' },
  { value: 'configuracion', label: 'Configuración', icon: '⚙️' }
];

export const DecisionChronology: React.FC<DecisionChronologyProps> = ({ 
  projectId, 
  className = "" 
}) => {
  const { timelineData, loading, error, refreshTimeline } = useDecisionTimeline(projectId);
  const { createChildDecision } = useParentChildDecisions(projectId);
  const { createDecision, refreshDecisions, deleteDecision } = useProjectDecisions(projectId);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDerivedModalOpen, setIsDerivedModalOpen] = useState(false);
  const [selectedParentDecisionId, setSelectedParentDecisionId] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Organizar decisiones en hilos cronológicos
  const organizeChronology = useCallback((decisions: DecisionTimelineItem[], typeFilter: string) => {
    // Filtrar por tipo si no es 'all'
    let filteredDecisions = decisions;
    if (typeFilter !== 'all') {
      filteredDecisions = decisions.filter(d => d.decision_type === typeFilter);
    }

    // Separar decisiones por tipo y agrupar por capas
    const decisionsByType = filteredDecisions.reduce((acc, decision) => {
      if (!decision.parent_decision_id) { // Solo decisiones raíz (capas)
        if (!acc[decision.decision_type]) {
          acc[decision.decision_type] = [];
        }
        acc[decision.decision_type].push(decision);
      }
      return acc;
    }, {} as Record<string, DecisionTimelineItem[]>);

    // Ordenar cada tipo por fecha de creación (cronológico)
    Object.keys(decisionsByType).forEach(type => {
      decisionsByType[type].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Crear mapa de hijos (decisiones derivadas) para todas las decisiones filtradas
    const childrenMap = new Map<string, DecisionTimelineItem[]>();
    filteredDecisions.forEach(decision => {
      if (decision.parent_decision_id) {
        const siblings = childrenMap.get(decision.parent_decision_id) || [];
        siblings.push(decision);
        childrenMap.set(decision.parent_decision_id, siblings);
      }
    });

    return { decisionsByType, childrenMap };
  }, []);

  // Estadísticas filtradas
  const filteredStats = useMemo(() => {
    const filtered = selectedTypeFilter === 'all' 
      ? timelineData 
      : timelineData.filter(d => d.decision_type === selectedTypeFilter);

    const layers = filtered.filter(d => !d.parent_decision_id).length;
    const derived = filtered.filter(d => d.parent_decision_id).length;

    return { total: filtered.length, layers, derived };
  }, [timelineData, selectedTypeFilter]);

  // Handlers para modal de decisiones
  const handleOpenCreateModal = useCallback(() => {
    setSelectedParentDecisionId(null);
    setIsCreateModalOpen(true);
  }, []);

  // Handler para crear decisión derivada
  const handleOpenDerivedModal = useCallback((parentDecisionId: string) => {
    setSelectedParentDecisionId(parentDecisionId);
    setIsDerivedModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setSelectedParentDecisionId(null);
  }, []);

  const handleCloseDerivedModal = useCallback(() => {
    setIsDerivedModalOpen(false);
    setSelectedParentDecisionId(null);
  }, []);

  const handleDecisionCreated = useCallback(async () => {
    handleCloseCreateModal();
    handleCloseDerivedModal();
    await refreshTimeline();
    await refreshDecisions();
  }, [refreshTimeline, refreshDecisions, handleCloseCreateModal, handleCloseDerivedModal]);

  // Handler para eliminar decisión
  const handleDeleteDecision = useCallback(async (decisionId: string) => {
    try {
      await deleteDecision(decisionId);
      await refreshTimeline();
      await refreshDecisions();
    } catch (error) {
      console.error('Error eliminando decisión:', error);
      throw error;
    }
  }, [deleteDecision, refreshTimeline, refreshDecisions]);

  // Handler para crear decisión hija
  const handleCreateChildDecision = useCallback((parentDecisionId: string) => {
    handleOpenDerivedModal(parentDecisionId);
  }, [handleOpenDerivedModal]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg mb-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-700 font-medium">Error cargando cronología</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={refreshTimeline}
          className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Solo mostrar un hilo (tipo) a la vez
  const { decisionsByType, childrenMap } = organizeChronology(timelineData, selectedTypeFilter);
  const showAll = selectedTypeFilter === 'all';
  const visibleTypes = showAll ? [] : [selectedTypeFilter];

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header con filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Capas</h2>
          <p className="text-gray-600">
            {filteredStats.total} decisión{filteredStats.total !== 1 ? 'es' : ''} 
            • {filteredStats.layers} capa{filteredStats.layers !== 1 ? 's' : ''}
            • {filteredStats.derived} derivada{filteredStats.derived !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por tipo:
            </label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            >
              {DECISION_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenCreateModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            + Nueva Decisión
          </button>
        </div>
      </div>

      {/* Chronology Content */}
      {showAll ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-lg mb-2">
            Selecciona un tipo para ver su hilo cronológico
          </div>
          <p className="text-gray-500">
            Usa el filtro para elegir el tipo de decisión que deseas visualizar
          </p>
        </div>
      ) : (
        visibleTypes.map(type => (
          <div key={type} className="space-y-10">
            {/* Header del tipo de decisión con hilo */}
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 mb-4">
              <h3 className="text-2xl font-bold text-gray-900 capitalize">
                {type === 'enfoque' && '🎯'} 
                {type === 'alcance' && '📏'} 
                {type === 'configuracion' && '⚙️'} 
                Hilo de {DECISION_TYPE_OPTIONS.find(opt => opt.value === type)?.label}
              </h3>
              <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {(decisionsByType[type]?.length || 0)} capa{(decisionsByType[type]?.length !== 1 ? 's' : '')} cronológica{(decisionsByType[type]?.length !== 1 ? 's' : '')}
              </span>
            </div>

            {/* Hilo cronológico de capas */}
            <div className="relative">
              {/* Línea de tiempo vertical */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-12">
                {(decisionsByType[type] || []).map((decision, index) => {
                  const children = childrenMap.get(decision.id) || [];
                  const layerNumber = index + 1;
                  const isLatest = index === (decisionsByType[type]?.length || 1) - 1;
                  
                  return (
                    <div key={decision.id} className="relative flex gap-8 items-start">
                      {/* Indicador cronológico */}
                      <div className="flex-shrink-0 relative pt-2">
                        {/* Punto en la línea de tiempo */}
                        <div className={`w-5 h-5 rounded-full border-2 bg-white relative z-10 shadow ${
                          isLatest 
                            ? 'border-green-500 bg-green-500/80' 
                            : 'border-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 pb-4">
                        {/* Fecha de creación y badge de capa */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-xs text-gray-500 font-mono">
                            {new Date(decision.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full whitespace-nowrap shadow">
                            Capa {layerNumber}
                            {isLatest && <span className="ml-1 text-green-600 font-medium">(Actual)</span>}
                          </div>
                        </div>
                        {/* Decision Card */}
                        <div className="rounded-xl shadow-lg border border-gray-200 bg-white p-6 mb-2">
                          <DecisionCard
                            decision={decision}
                            onCreateChild={() => handleCreateChildDecision(decision.id)}
                            onDelete={handleDeleteDecision}
                          />
                        </div>
                        {/* Decisiones derivadas */}
                        {children.length > 0 && (
                          <div className="mt-6 ml-8 space-y-4 border-l-4 border-blue-100 pl-6">
                            <div className="text-sm font-medium text-blue-500 mb-2">
                              📎 Decisiones Derivadas ({children.length})
                            </div>
                            {children.map((childDecision) => (
                              <div key={childDecision.id} className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-2">
                                <div className="text-xs text-gray-400 mb-1 font-mono">
                                  {new Date(childDecision.created_at).toLocaleDateString('es-ES', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <DecisionCard
                                  decision={childDecision}
                                  onCreateChild={() => handleCreateChildDecision(childDecision.id)}
                                  onDelete={handleDeleteDecision}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal de Creación de Decisiones (Capas) */}
      <LayeredDecisionCreator
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        projectId={projectId}
        parentDecisionId={null}
        onSubmit={async (decisionData: any) => {
          await createDecision(decisionData);
        }}
        onSuccess={handleDecisionCreated}
        loading={loading}
      />

      {/* Modal de Creación de Decisiones Derivadas */}
      <LayeredDecisionCreator
        isOpen={isDerivedModalOpen}
        onClose={handleCloseDerivedModal}
        projectId={projectId}
        parentDecisionId={selectedParentDecisionId}
        onSubmit={async (decisionData: any) => {
          // Marcar como decisión derivada
          const derivedData = { ...decisionData, is_derived: true };
          await createDecision(derivedData);
        }}
        onSuccess={handleDecisionCreated}
        loading={loading}
      />
    </div>
  );
}; 