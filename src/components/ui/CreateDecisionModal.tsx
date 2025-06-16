import React, { useState, useEffect } from 'react';
import { CreateProjectDecisionData, SuccessMetric } from '../../types/projects';
import { useProjectValidation } from '../../hooks/useProjectDecisions';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parentDecisionId?: string | null;
  onSuccess: () => void;
}

export const CreateDecisionModal: React.FC<CreateDecisionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  parentDecisionId,
  onSuccess
}) => {
  const { createDecisionWithValidation, loading, error } = useProjectValidation();
  
  const [formData, setFormData] = useState<CreateProjectDecisionData>({
    title: '',
    description: '',
    decision_type: 'enfoque',
    rationale: '',
    expected_impact: '',
    resources_required: '',
    risks_identified: [],
    urgency: 'medium',
    tags: [],
    success_metrics: {}
  });

  const [currentRisk, setCurrentRisk] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [currentMetric, setCurrentMetric] = useState({
    name: '',
    target: '',
    unit: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        decision_type: 'enfoque',
        rationale: '',
        expected_impact: '',
        resources_required: '',
        risks_identified: [],
        urgency: 'medium',
        tags: [],
        success_metrics: {}
      });
      setFormErrors([]);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.title?.trim()) {
      errors.push('El título es requerido');
    }
    
    if (!formData.description?.trim()) {
      errors.push('La descripción es requerida');
    }

    if (formData.title && formData.title.length > 255) {
      errors.push('El título no puede exceder 255 caracteres');
    }

    if (formData.description && formData.description.length > 5000) {
      errors.push('La descripción no puede exceder 5000 caracteres');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const decisionData: CreateProjectDecisionData = {
        ...formData,
        parent_decision_id: parentDecisionId || undefined
      };

      await createDecisionWithValidation(projectId, decisionData);
      onSuccess();
    } catch (err) {
      console.error('Error creando decisión:', err);
    }
  };

  const addRisk = () => {
    if (currentRisk.trim() && !formData.risks_identified?.includes(currentRisk.trim())) {
      setFormData(prev => ({
        ...prev,
        risks_identified: [...(prev.risks_identified || []), currentRisk.trim()]
      }));
      setCurrentRisk('');
    }
  };

  const removeRisk = (index: number) => {
    setFormData(prev => ({
      ...prev,
      risks_identified: prev.risks_identified?.filter((_, i) => i !== index) || []
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  const addMetric = () => {
    if (currentMetric.name.trim() && currentMetric.target.trim() && currentMetric.unit.trim()) {
      const metric: SuccessMetric = {
        target: parseFloat(currentMetric.target),
        unit: currentMetric.unit.trim(),
        description: currentMetric.description.trim() || undefined
      };

      setFormData(prev => ({
        ...prev,
        success_metrics: {
          ...(prev.success_metrics || {}),
          [currentMetric.name.trim()]: metric
        }
      }));

      setCurrentMetric({ name: '', target: '', unit: '', description: '' });
    }
  };

  const removeMetric = (name: string) => {
    setFormData(prev => {
      const newMetrics = { ...(prev.success_metrics || {}) };
      delete newMetrics[name];
      return {
        ...prev,
        success_metrics: newMetrics
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {parentDecisionId ? 'Crear Decisión Derivada' : 'Nueva Decisión'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Form Errors */}
          {formErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-medium mb-2">Errores en el formulario:</h3>
              <ul className="text-red-700 text-sm space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título conciso de la decisión"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Decisión
                </label>
                <select
                  value={formData.decision_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, decision_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="enfoque">Enfoque</option>
                  <option value="alcance">Alcance</option>
                  <option value="configuracion">Configuración</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgencia
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe la decisión en detalle"
                maxLength={5000}
              />
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justificación
                </label>
                <textarea
                  value={formData.rationale || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="¿Por qué es necesaria esta decisión?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impacto Esperado
                </label>
                <textarea
                  value={formData.expected_impact || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_impact: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="¿Qué impacto se espera de esta decisión?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recursos Necesarios
                </label>
                <textarea
                  value={formData.resources_required || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, resources_required: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="¿Qué recursos se necesitan para implementar esta decisión?"
                />
              </div>
            </div>

            {/* Risks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Riesgos Identificados
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentRisk}
                  onChange={(e) => setCurrentRisk(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe un riesgo..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRisk())}
                />
                <button
                  type="button"
                  onClick={addRisk}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.risks_identified?.map((risk, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {risk}
                    <button
                      type="button"
                      onClick={() => removeRisk(index)}
                      className="text-orange-600 hover:text-orange-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar etiqueta..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Success Metrics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métricas de Éxito
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <input
                  type="text"
                  value={currentMetric.name}
                  onChange={(e) => setCurrentMetric(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre métrica"
                />
                <input
                  type="number"
                  value={currentMetric.target}
                  onChange={(e) => setCurrentMetric(prev => ({ ...prev, target: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Objetivo"
                />
                <input
                  type="text"
                  value={currentMetric.unit}
                  onChange={(e) => setCurrentMetric(prev => ({ ...prev, unit: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unidad"
                />
                <button
                  type="button"
                  onClick={addMetric}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
              <input
                type="text"
                value={currentMetric.description}
                onChange={(e) => setCurrentMetric(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                placeholder="Descripción de la métrica (opcional)"
              />
              <div className="space-y-2">
                {Object.entries(formData.success_metrics || {}).map(([name, metric]) => (
                  <div key={name} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <div className="font-medium text-green-800">{name}</div>
                      <div className="text-green-600 text-sm">
                        Objetivo: {metric.target} {metric.unit}
                        {metric.description && <span className="ml-2">• {metric.description}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMetric(name)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando...' : 'Crear Decisión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 