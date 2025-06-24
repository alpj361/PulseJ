import React, { useState, useCallback } from 'react';
import { ProjectDecision, DecisionTimelineItem } from '../../types/projects';
import { useDecisionTimeline, useParentChildDecisions, useProjectDecisions } from '../../hooks/useProjectDecisions';
import { LayeredDecisionCreator } from './LayeredDecisionCreator';
import { EditDecisionModal } from './EditDecisionModal';
import { DecisionCard } from './DecisionCard';

interface DecisionTimelineProps {
  projectId: string;
  className?: string;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({ 
  projectId, 
  className = "" 
}) => {
  const { timelineData, loading, error, refreshTimeline } = useDecisionTimeline(projectId);
  const { createChildDecision } = useParentChildDecisions(projectId);
  const { createDecision, refreshDecisions, deleteDecision, updateDecision } = useProjectDecisions(projectId);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDerivedModalOpen, setIsDerivedModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParentDecisionId, setSelectedParentDecisionId] = useState<string | null>(null);
  const [selectedDecisionForEdit, setSelectedDecisionForEdit] = useState<DecisionTimelineItem | null>(null);

  // Organizar decisiones en estructura de capas y derivadas
  const organizeDecisions = useCallback((decisions: DecisionTimelineItem[]) => {
    // Separar decisiones por tipo y agrupar por capas
    const decisionsByType = decisions.reduce((acc, decision) => {
      if (!decision.parent_decision_id) { // Solo decisiones raíz (capas)
        if (!acc[decision.decision_type]) {
          acc[decision.decision_type] = [];
        }
        acc[decision.decision_type].push(decision);
      }
      return acc;
    }, {} as Record<string, DecisionTimelineItem[]>);

    // Ordenar cada tipo por fecha de creación para numeración correcta
    Object.keys(decisionsByType).forEach(type => {
      decisionsByType[type].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Crear mapa de hijos (decisiones derivadas)
    const childrenMap = new Map<string, DecisionTimelineItem[]>();
    decisions.forEach(decision => {
      if (decision.parent_decision_id) {
        const siblings = childrenMap.get(decision.parent_decision_id) || [];
        siblings.push(decision);
        childrenMap.set(decision.parent_decision_id, siblings);
      }
    });

    return { decisionsByType, childrenMap };
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

  const handleOpenEditModal = useCallback((decision: DecisionTimelineItem) => {
    setSelectedDecisionForEdit(decision);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedDecisionForEdit(null);
  }, []);

  const handleDecisionCreated = useCallback(async () => {
    handleCloseCreateModal();
    handleCloseDerivedModal();
    await refreshTimeline();
    await refreshDecisions();
  }, [refreshTimeline, refreshDecisions, handleCloseCreateModal, handleCloseDerivedModal]);

  const handleDecisionUpdated = useCallback(async () => {
    handleCloseEditModal();
    await refreshTimeline();
    await refreshDecisions();
  }, [refreshTimeline, refreshDecisions, handleCloseEditModal]);

  // Handler para eliminar decisión
  const handleDeleteDecision = useCallback(async (decisionId: string) => {
    try {
      await deleteDecision(decisionId);
      await refreshTimeline();
      await refreshDecisions();
    } catch (error) {
      console.error('Error eliminando decisión:', error);
      // Podrías agregar un toast o notificación aquí
      throw error; // Re-throw para que DecisionCard pueda manejar el estado de carga
    }
  }, [deleteDecision, refreshTimeline, refreshDecisions]);

  // Handler para crear decisión hija
  const handleCreateChildDecision = useCallback((parentDecisionId: string) => {
    handleOpenDerivedModal(parentDecisionId);
  }, [handleOpenDerivedModal]);

  // Handler para actualizar decisión
  const handleUpdateDecision = useCallback(async (decisionId: string, updates: Partial<ProjectDecision>) => {
    try {
      await updateDecision(decisionId, updates);
      await handleDecisionUpdated();
    } catch (error) {
      console.error('Error actualizando decisión:', error);
      throw error;
    }
  }, [updateDecision, handleDecisionUpdated]);

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

  const { decisionsByType, childrenMap } = organizeDecisions(timelineData);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timeline de Decisiones</h2>
          <p className="text-gray-600 mt-1">
            {timelineData.length} decisión{timelineData.length !== 1 ? 'es' : ''} 
            • {Object.keys(decisionsByType).length} cap{Object.keys(decisionsByType).length !== 1 ? 'as' : ''}
          </p>
        </div>
        
        <button
          onClick={() => handleOpenCreateModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          + Nueva Decisión
        </button>
      </div>

      {/* Timeline Content */}
      {timelineData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-lg mb-2">No hay decisiones aún</div>
          <p className="text-gray-500">
            Usa el botón "Nueva Decisión" para crear la primera decisión de este proyecto
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(decisionsByType).map(([type, decisions]) => (
            <div key={type} className="space-y-3">
              {/* Header del tipo de decisión */}
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {type === 'enfoque' && '🎯'} 
                  {type === 'alcance' && '📏'} 
                  {type === 'configuracion' && '⚙️'} 
                  {type}
                </h3>
                <span className="text-sm text-gray-500">
                  {decisions.length} capa{decisions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Capas del tipo */}
              <div className="space-y-3">
                {decisions.map((decision, index) => {
                  const children = childrenMap.get(decision.id) || [];
                  const layerNumber = index + 1;
                  
                  return (
                    <div key={decision.id} className="relative">
                      {/* Indicador de capa */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-6 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            Capa {layerNumber}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          {/* Decision Card */}
                          <DecisionCard
                            decision={decision}
                            onCreateChild={() => handleCreateChildDecision(decision.id)}
                            onDelete={handleDeleteDecision}
                            onEdit={handleOpenEditModal}
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
                                    onEdit={handleOpenEditModal}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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

      {/* Modal de Edición de Decisiones */}
      <EditDecisionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        decision={selectedDecisionForEdit}
        onSubmit={handleUpdateDecision}
        loading={loading}
      />
    </div>
  );
}; 