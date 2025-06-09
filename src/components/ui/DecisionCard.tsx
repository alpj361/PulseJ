import React, { useState } from 'react';
import { DecisionTimelineItem } from '../../types/projects';
import { Badge } from './Badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DecisionCardProps {
  decision: DecisionTimelineItem;
  onCreateChild: () => void;
  className?: string;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ 
  decision, 
  onCreateChild, 
  className = "" 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDecisionTypeColor = (type: string) => {
    const colors = {
      strategic: 'bg-purple-100 text-purple-800 border-purple-200',
      tactical: 'bg-blue-100 text-blue-800 border-blue-200',
      operational: 'bg-green-100 text-green-800 border-green-200',
      research: 'bg-orange-100 text-orange-800 border-orange-200',
      analytical: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[type as keyof typeof colors] || colors.strategic;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600 border-gray-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      critical: 'bg-red-100 text-red-700 border-red-200'
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

  const complexity = getComplexityLevel(decision.complexity_score);
  const timeAgo = formatDistanceToNow(new Date(decision.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">
              #{decision.sequence_number}
            </span>
            {decision.is_root ? (
              <Badge variant="outline" className="text-xs">
                🌟 Principal
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                🔗 Derivada
              </Badge>
            )}
            {decision.children_count > 0 && (
              <Badge variant="outline" className="text-xs">
                👥 {decision.children_count} hija{decision.children_count !== 1 ? 's' : ''}
              </Badge>
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
          <div className={`text-xs font-medium ${complexity.color}`}>
            Complejidad: {complexity.level}
          </div>
          <div className="text-xs text-gray-500">
            {timeAgo}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs border ${getDecisionTypeColor(decision.decision_type)}`}>
          {decision.decision_type}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs border ${getUrgencyColor(decision.urgency)}`}>
          {decision.urgency}
        </span>
        {decision.tags.slice(0, 2).map((tag, index) => (
          <span key={index} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">
            {tag}
          </span>
        ))}
        {decision.tags.length > 2 && (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
            +{decision.tags.length - 2} más
          </span>
        )}
      </div>

      {/* Metrics and Risks Preview */}
      {(decision.risks_identified?.length > 0 || Object.keys(decision.success_metrics).length > 0) && (
        <div className="mb-3 p-2 bg-gray-50 rounded border">
          {decision.risks_identified?.length > 0 && (
            <div className="text-xs text-gray-600 mb-1">
              ⚠️ <span className="font-medium">{decision.risks_identified.length} riesgo{decision.risks_identified.length !== 1 ? 's' : ''} identificado{decision.risks_identified.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {Object.keys(decision.success_metrics).length > 0 && (
            <div className="text-xs text-gray-600">
              📊 <span className="font-medium">{Object.keys(decision.success_metrics).length} métrica{Object.keys(decision.success_metrics).length !== 1 ? 's' : ''} de éxito</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          
          <button
            onClick={onCreateChild}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            + Decisión derivada
          </button>
        </div>

        <div className="text-xs text-gray-400">
          Capa {decision.timeline_layer}
        </div>
      </div>

      {/* Extended Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {decision.rationale && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Justificación</h4>
              <p className="text-sm text-gray-600">{decision.rationale}</p>
            </div>
          )}
          
          {decision.expected_impact && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Impacto Esperado</h4>
              <p className="text-sm text-gray-600">{decision.expected_impact}</p>
            </div>
          )}

          {decision.resources_required && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Recursos Necesarios</h4>
              <p className="text-sm text-gray-600">{decision.resources_required}</p>
            </div>
          )}

          {decision.risks_identified && decision.risks_identified.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Riesgos Identificados</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {decision.risks_identified.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠️</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(decision.success_metrics).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Métricas de Éxito</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(decision.success_metrics).map(([key, metric]) => (
                  <div key={key} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="font-medium text-gray-700">{key}</div>
                    <div className="text-gray-600">
                      Objetivo: {metric.target} {metric.unit}
                      {metric.actual !== undefined && (
                        <span className="ml-2">• Actual: {metric.actual} {metric.unit}</span>
                      )}
                    </div>
                    {metric.description && (
                      <div className="text-gray-500 mt-1">{metric.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 