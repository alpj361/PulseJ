import React, { useState, useCallback } from 'react';

interface MockDecision {
  id: string;
  title: string;
  description: string;
  decision_type: 'strategic' | 'tactical' | 'operational' | 'research' | 'analytical';
  sequence_number: number;
  parent_decision_id?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  risks_identified: string[];
  success_metrics: Record<string, any>;
  timeline_layer: number;
  children_count: number;
  is_root: boolean;
  complexity_score: number;
  created_at: string;
}

interface DecisionTimelineMockProps {
  className?: string;
}

export const DecisionTimelineMock: React.FC<DecisionTimelineMockProps> = ({ 
  className = "" 
}) => {
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set(['decision-1', 'decision-4']));

  // Mock data
  const mockDecisions: MockDecision[] = [
    {
      id: 'decision-1',
      title: 'Implementar Sistema de Análisis de Tendencias',
      description: 'Desarrollar un sistema automatizado para detectar y analizar tendencias en redes sociales usando IA y machine learning.',
      decision_type: 'strategic',
      sequence_number: 1,
      urgency: 'high',
      tags: ['IA', 'Machine Learning', 'Redes Sociales'],
      risks_identified: ['Costo elevado de infraestructura', 'Complejidad técnica alta'],
      success_metrics: { 'Precisión': { target: 85, unit: '%' }, 'Tiempo procesamiento': { target: 2, unit: 'min' } },
      timeline_layer: 0,
      children_count: 2,
      is_root: true,
      complexity_score: 8,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'decision-2',
      title: 'Seleccionar Framework de ML',
      description: 'Evaluar y seleccionar el framework más adecuado para el análisis de sentimientos y detección de tendencias.',
      decision_type: 'tactical',
      sequence_number: 2,
      parent_decision_id: 'decision-1',
      urgency: 'medium',
      tags: ['TensorFlow', 'PyTorch', 'Evaluación'],
      risks_identified: ['Incompatibilidad con sistemas existentes'],
      success_metrics: { 'Tiempo evaluación': { target: 2, unit: 'semanas' } },
      timeline_layer: 1,
      children_count: 0,
      is_root: false,
      complexity_score: 4,
      created_at: '2024-01-16T14:30:00Z'
    },
    {
      id: 'decision-3',
      title: 'Configurar Pipeline de Datos',
      description: 'Diseñar e implementar el pipeline para la ingesta, procesamiento y almacenamiento de datos de redes sociales.',
      decision_type: 'operational',
      sequence_number: 3,
      parent_decision_id: 'decision-1',
      urgency: 'high',
      tags: ['Pipeline', 'ETL', 'Big Data'],
      risks_identified: ['Pérdida de datos', 'Problemas de escalabilidad'],
      success_metrics: { 'Throughput': { target: 10000, unit: 'tweets/min' } },
      timeline_layer: 1,
      children_count: 1,
      is_root: false,
      complexity_score: 6,
      created_at: '2024-01-17T09:15:00Z'
    },
    {
      id: 'decision-4',
      title: 'Desarrollar Dashboard Ejecutivo',
      description: 'Crear un dashboard intuitivo para que los ejecutivos puedan visualizar las tendencias y métricas clave.',
      decision_type: 'strategic',
      sequence_number: 4,
      urgency: 'medium',
      tags: ['Dashboard', 'UX', 'Visualización'],
      risks_identified: ['Requisitos cambiantes'],
      success_metrics: { 'Satisfacción usuario': { target: 4.5, unit: '/5' } },
      timeline_layer: 0,
      children_count: 2,
      is_root: true,
      complexity_score: 5,
      created_at: '2024-01-18T11:45:00Z'
    },
    {
      id: 'decision-5',
      title: 'Implementar Monitoreo en Tiempo Real',
      description: 'Configurar sistema de monitoreo para detectar problemas en el pipeline de datos automáticamente.',
      decision_type: 'operational',
      sequence_number: 5,
      parent_decision_id: 'decision-3',
      urgency: 'critical',
      tags: ['Monitoreo', 'Alertas', 'DevOps'],
      risks_identified: ['Falsos positivos', 'Sobrecarga de alertas'],
      success_metrics: { 'Uptime': { target: 99.9, unit: '%' } },
      timeline_layer: 2,
      children_count: 0,
      is_root: false,
      complexity_score: 3,
      created_at: '2024-01-19T08:20:00Z'
    },
    {
      id: 'decision-6',
      title: 'Diseñar Interfaz de Usuario',
      description: 'Crear wireframes y prototipos para la interfaz del dashboard ejecutivo.',
      decision_type: 'tactical',
      sequence_number: 6,
      parent_decision_id: 'decision-4',
      urgency: 'medium',
      tags: ['UI/UX', 'Wireframes', 'Prototipos'],
      risks_identified: ['Feedback tardío de stakeholders'],
      success_metrics: { 'Iteraciones': { target: 3, unit: 'versiones' } },
      timeline_layer: 1,
      children_count: 0,
      is_root: false,
      complexity_score: 2,
      created_at: '2024-01-20T13:10:00Z'
    },
    {
      id: 'decision-7',
      title: 'Implementar Autenticación',
      description: 'Configurar sistema de autenticación y autorización para el acceso al dashboard.',
      decision_type: 'operational',
      sequence_number: 7,
      parent_decision_id: 'decision-4',
      urgency: 'high',
      tags: ['Seguridad', 'Auth', 'JWT'],
      risks_identified: ['Vulnerabilidades de seguridad'],
      success_metrics: { 'Tiempo login': { target: 2, unit: 'seg' } },
      timeline_layer: 1,
      children_count: 0,
      is_root: false,
      complexity_score: 4,
      created_at: '2024-01-21T16:30:00Z'
    }
  ];

  // Organizar decisiones en estructura de árbol
  const organizeDecisions = useCallback((decisions: MockDecision[]) => {
    const rootDecisions = decisions.filter(d => !d.parent_decision_id);
    const childrenMap = new Map<string, MockDecision[]>();
    
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

  const getDecisionTypeColor = (type: string) => {
    const colors = {
      strategic: 'bg-purple-50 text-purple-600 border-purple-200',
      tactical: 'bg-blue-50 text-blue-600 border-blue-200',
      operational: 'bg-green-50 text-green-600 border-green-200',
      research: 'bg-orange-50 text-orange-600 border-orange-200',
      analytical: 'bg-pink-50 text-pink-600 border-pink-200'
    };
    return colors[type as keyof typeof colors] || colors.strategic;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'bg-gray-50 text-gray-600 border-gray-200',
      medium: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      high: 'bg-orange-50 text-orange-600 border-orange-200',
      critical: 'bg-red-50 text-red-600 border-red-200'
    };
    return colors[urgency as keyof typeof colors] || colors.medium;
  };

  const getComplexityLevel = (score: number) => {
    if (score >= 8) return { level: 'Muy Alta', color: 'text-red-600' };
    if (score >= 6) return { level: 'Alta', color: 'text-orange-600' };
    if (score >= 4) return { level: 'Media', color: 'text-yellow-600' };
    if (score >= 2) return { level: 'Baja', color: 'text-green-600' };
    return { level: 'Muy Baja', color: 'text-gray-600' };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace unos minutos';
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  };

  const renderDecisionCard = useCallback((decision: MockDecision) => {
    const complexity = getComplexityLevel(decision.complexity_score);
    const timeAgo = formatTimeAgo(decision.created_at);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500">
                #{decision.sequence_number}
              </span>
              {decision.is_root ? (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                  🌟 Principal
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  🔗 Derivada
                </span>
              )}
              {decision.children_count > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  👥 {decision.children_count} hija{decision.children_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {decision.title}
            </h3>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              {decision.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 ml-4">
            <div className="text-xs font-medium text-blue-600">
              Capa {decision.timeline_layer}
            </div>
            <div className={`text-xs font-medium ${complexity.color}`}>
              {complexity.level}
            </div>
            <div className="text-xs text-gray-500">
              {timeAgo}
            </div>
          </div>
        </div>

        {/* Type and Urgency badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getDecisionTypeColor(decision.decision_type)}`}>
            {decision.decision_type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getUrgencyColor(decision.urgency)}`}>
            {decision.urgency}
          </span>
          {decision.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200">
              {tag}
            </span>
          ))}
          {decision.tags.length > 2 && (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
              +{decision.tags.length - 2} más
            </span>
          )}
        </div>

        {/* Quick stats */}
        {(decision.risks_identified?.length > 0 || Object.keys(decision.success_metrics).length > 0) && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
            {decision.risks_identified?.length > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-orange-500">⚠️</span>
                <span className="font-medium">{decision.risks_identified.length} riesgo{decision.risks_identified.length !== 1 ? 's' : ''} identificado{decision.risks_identified.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {Object.keys(decision.success_metrics).length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-blue-500">📊</span>
                <span className="font-medium">{Object.keys(decision.success_metrics).length} métrica{Object.keys(decision.success_metrics).length !== 1 ? 's' : ''} de éxito</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex gap-3">
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Ver detalles
            </button>
            <button className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
              + Decisión derivada
            </button>
          </div>
        </div>
      </div>
    );
  }, []);

  const renderDecisionThread = useCallback((
    decision: MockDecision, 
    children: MockDecision[] = [],
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
          <div className="absolute left-4 top-0 w-0.5 bg-gray-300 h-full -z-10" />
        )}
        
        {/* Parent connection line */}
        {depth > 0 && (
          <div className="absolute left-4 top-6 w-4 h-0.5 bg-gray-300" />
        )}

        {/* Decision Card Container */}
        <div 
          className={`relative ${depth > 0 ? 'ml-8' : ''} mb-4`}
          style={{ marginLeft: depth > 0 ? `${depth * 32}px` : '0' }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(decision.id)}
              className="absolute -left-6 top-6 z-10 w-5 h-5 bg-white border-2 border-blue-300 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
            >
              <span className="text-blue-600 font-bold text-sm">
                {isExpanded ? '−' : '+'}
              </span>
            </button>
          )}

          {/* Decision Card */}
          {renderDecisionCard(decision)}

          {/* Children Thread */}
          {showChildren && (
            <div className="mt-4 relative">
              {children.map((childDecision, index) => {
                const childChildren = mockDecisions.filter(d => d.parent_decision_id === childDecision.id);
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
          <div className="absolute left-4 bottom-0 w-0.5 bg-gray-300 h-4" />
        )}
      </div>
    );
  }, [mockDecisions, expandedDecisions, toggleExpanded, renderDecisionCard]);

  const { rootDecisions, childrenMap } = organizeDecisions(mockDecisions);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Timeline de Decisiones</h2>
          <p className="text-gray-600 mt-2">
            {mockDecisions.length} decisión{mockDecisions.length !== 1 ? 'es' : ''} 
            • {rootDecisions.length} hilo{rootDecisions.length !== 1 ? 's' : ''} principal{rootDecisions.length !== 1 ? 'es' : ''}
          </p>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <span className="text-lg">+</span>
          Nueva Decisión
        </button>
      </div>

      {/* Timeline Content */}
      <div className="space-y-0">
        {rootDecisions.map((decision, index) => {
          const children = childrenMap.get(decision.id) || [];
          const isLast = index === rootDecisions.length - 1;
          
          return renderDecisionThread(decision, children, 0, isLast);
        })}
      </div>
    </div>
  );
}; 