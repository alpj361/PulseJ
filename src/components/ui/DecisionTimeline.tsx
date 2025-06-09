import React, { useState, useCallback } from 'react';
import { ProjectDecision, DecisionTimelineItem } from '../../types/projects';
import { useDecisionTimeline, useParentChildDecisions } from '../../hooks/useProjectDecisions';

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
  
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set());

  // Organizar decisiones en estructura de árbol
  const organizeDecisions = useCallback((decisions: DecisionTimelineItem[]) => {
    const rootDecisions = decisions.filter(d => !d.parent_decision_id);
    const childrenMap = new Map<string, DecisionTimelineItem[]>();
    
    // Agrupar hijos por padre
    decisions.forEach(decision => {
      if (decision.parent_decision_id) {
        const siblings = childrenMap.get(decision.parent_decision_id) || [];
        siblings.push(decision);
        childrenMap.set(decision.parent_decision_id, siblings);
      }
    });

    return { rootDecisions, childrenMap };
  }, []);

  const toggleExpanded = useCallback((decisionId: string) => {
    setExpandedDecisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(decisionId)) {
        newSet.delete(decisionId);
      } else {
        newSet.add(decisionId);
      }
      return newSet;
    });
  }, []);

  const renderDecisionCard = useCallback((decision: DecisionTimelineItem) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">
                #{decision.sequence_number}
              </span>
              {decision.is_root ? (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  🌟 Principal
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  🔗 Derivada
                </span>
              )}
              {decision.children_count > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  👥 {decision.children_count} hija{decision.children_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {decision.title}
            </h3>
            
            <p className="text-gray-600 text-sm line-clamp-2">
              {decision.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 ml-4">
            <div className="text-xs font-medium text-blue-600">
              Capa {decision.timeline_layer}
            </div>
            <div className="text-xs text-gray-500">
              Complejidad: {decision.complexity_score}
            </div>
          </div>
        </div>

        {/* Type and Urgency badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">
            {decision.decision_type}
          </span>
          <span className="px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-600 border border-orange-200">
            {decision.urgency}
          </span>
          {decision.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              {tag}
            </span>
          ))}
        </div>

        {/* Quick stats */}
        {(decision.risks_identified?.length > 0 || Object.keys(decision.success_metrics).length > 0) && (
          <div className="mb-3 p-2 bg-gray-50 rounded border text-xs text-gray-600">
            {decision.risks_identified?.length > 0 && (
              <div>⚠️ {decision.risks_identified.length} riesgo{decision.risks_identified.length !== 1 ? 's' : ''}</div>
            )}
            {Object.keys(decision.success_metrics).length > 0 && (
              <div>📊 {Object.keys(decision.success_metrics).length} métrica{Object.keys(decision.success_metrics).length !== 1 ? 's' : ''}</div>
            )}
          </div>
        )}
      </div>
    );
  }, []);

  const renderDecisionThread = useCallback((
    decision: DecisionTimelineItem, 
    children: DecisionTimelineItem[] = [],
    depth: number = 0,
    isLast: boolean = false
  ): React.ReactNode => {
    const hasChildren = children.length > 0;
    const isExpanded = expandedDecisions.has(decision.id);
    const showChildren = hasChildren && isExpanded;

    return (
      <div key={decision.id} className="relative">
        {/* Thread Line - Vertical connector */}
        {depth > 0 && (
          <div className="absolute left-4 top-0 w-0.5 bg-gray-200 h-full -z-10" />
        )}
        
        {/* Parent connection line */}
        {depth > 0 && (
          <div className="absolute left-4 top-6 w-4 h-0.5 bg-gray-200" />
        )}

        {/* Decision Card Container */}
        <div 
          className={`relative ${depth > 0 ? 'ml-8' : ''} mb-3`}
          style={{ marginLeft: depth > 0 ? `${depth * 32}px` : '0' }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(decision.id)}
              className="absolute -left-6 top-6 z-10 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}

          {/* Decision Card */}
          {renderDecisionCard(decision)}

          {/* Children Thread */}
          {showChildren && (
            <div className="mt-3 relative">
              {children.map((childDecision, index) => {
                const childChildren = timelineData.filter(d => d.parent_decision_id === childDecision.id);
                const isLastChild = index === children.length - 1;
                
                return renderDecisionThread(
                  childDecision,
                  childChildren,
                  depth + 1,
                  isLastChild
                );
              })}
            </div>
          )}
        </div>

        {/* Continuation line for non-last items */}
        {!isLast && depth > 0 && (
          <div className="absolute left-4 bottom-0 w-0.5 bg-gray-200 h-3" />
        )}
      </div>
    );
  }, [timelineData, expandedDecisions, toggleExpanded, renderDecisionCard]);

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

  const { rootDecisions, childrenMap } = organizeDecisions(timelineData);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timeline de Decisiones</h2>
          <p className="text-gray-600 mt-1">
            {timelineData.length} decisión{timelineData.length !== 1 ? 'es' : ''} 
            • {rootDecisions.length} hilo{rootDecisions.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          + Nueva Decisión
        </button>
      </div>

      {/* Timeline Content */}
      {timelineData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-lg mb-2">No hay decisiones aún</div>
          <p className="text-gray-500 mb-4">
            Comienza creando la primera decisión de este proyecto
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            + Crear Primera Decisión
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          {rootDecisions.map((decision, index) => {
            const children = childrenMap.get(decision.id) || [];
            const isLast = index === rootDecisions.length - 1;
            
            return renderDecisionThread(decision, children, 0, isLast);
          })}
        </div>
      )}
    </div>
  );
}; 