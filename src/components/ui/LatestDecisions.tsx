import React, { useState, useCallback } from 'react';
import { ProjectDecision, DecisionTimelineItem } from '../../types/projects';
import { useDecisionTimeline, useParentChildDecisions, useProjectDecisions } from '../../hooks/useProjectDecisions';
import { LayeredDecisionCreator } from './LayeredDecisionCreator';
import { DecisionCard } from './DecisionCard';

interface LatestDecisionsProps {
  projectId: string;
  className?: string;
}

export const LatestDecisions: React.FC<LatestDecisionsProps> = ({ 
  projectId, 
  className = "" 
}) => {
  const { timelineData, loading, error, refreshTimeline } = useDecisionTimeline(projectId);
  const { createChildDecision } = useParentChildDecisions(projectId);
  const { createDecision, refreshDecisions, deleteDecision } = useProjectDecisions(projectId);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDerivedModalOpen, setIsDerivedModalOpen] = useState(false);
  const [selectedParentDecisionId, setSelectedParentDecisionId] = useState<string | null>(null);

  // Obtener solo la capa más reciente de cada tipo
  const getLatestDecisions = useCallback((decisions: DecisionTimelineItem[]) => {
    // Separar solo decisiones raíz (sin padre) por tipo
    const decisionsByType = decisions.reduce((acc, decision) => {
      if (!decision.parent_decision_id) { // Solo decisiones raíz (capas)
        if (!acc[decision.decision_type]) {
          acc[decision.decision_type] = [];
        }
        acc[decision.decision_type].push(decision);
      }
      return acc;
    }, {} as Record<string, DecisionTimelineItem[]>);

    // Obtener la más reciente de cada tipo (por fecha de creación)
    const latestDecisions: Record<string, DecisionTimelineItem> = {};
    Object.entries(decisionsByType).forEach(([type, decisions]) => {
      const sorted = [...decisions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      if (sorted.length > 0) {
        latestDecisions[type] = sorted[0];
      }
    });

    // Crear mapa de hijos para las decisiones más recientes
    const childrenMap = new Map<string, DecisionTimelineItem[]>();
    decisions.forEach(decision => {
      if (decision.parent_decision_id && latestDecisions[decision.decision_type]?.id === decision.parent_decision_id) {
        const siblings = childrenMap.get(decision.parent_decision_id) || [];
        siblings.push(decision);
        childrenMap.set(decision.parent_decision_id, siblings);
      }
    });

    return { latestDecisions, childrenMap };
  }, []);

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
        <div className="text-red-700 font-medium">Error cargando decisiones</div>
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

  const { latestDecisions, childrenMap } = getLatestDecisions(timelineData);
  const decisionTypes = Object.keys(latestDecisions);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Decisiones Actuales</h2>
          <p className="text-gray-600 mt-1">
            Capas más recientes • {decisionTypes.length} tipo{decisionTypes.length !== 1 ? 's' : ''} activo{decisionTypes.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={() => handleOpenCreateModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          + Nueva Decisión
        </button>
      </div>

      {/* Latest Decisions Content */}
      {decisionTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-lg mb-2">No hay decisiones aún</div>
          <p className="text-gray-500">
            Usa el botón "Nueva Decisión" para crear la primera decisión de este proyecto
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(latestDecisions).map(([type, decision]) => {
            const children = childrenMap.get(decision.id) || [];
            
            return (
              <div key={type} className="space-y-3">
                {/* Header del tipo de decisión */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {type === 'enfoque' && '🎯'} 
                    {type === 'alcance' && '📏'} 
                    {type === 'configuracion' && '⚙️'} 
                    {type}
                  </h3>
                  <span className="text-sm text-gray-500 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Capa actual
                  </span>
                </div>

                {/* Decision Card */}
                <div className="relative">
                  <DecisionCard
                    decision={decision}
                    onCreateChild={() => handleCreateChildDecision(decision.id)}
                    onDelete={handleDeleteDecision}
                  />

                  {/* Decisiones derivadas */}
                  {children.length > 0 && (
                    <div className="mt-4 ml-8 space-y-2">
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        📎 Decisiones Derivadas ({children.length})
                      </div>
                      {children.map((childDecision) => (
                        <div key={childDecision.id} className="border-l-2 border-gray-200 pl-4">
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