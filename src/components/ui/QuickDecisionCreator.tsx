import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiZap, 
  FiTrendingUp, 
  FiTarget, 
  FiAlertTriangle,
  FiX,
  FiSend
} from 'react-icons/fi';
import { CreateProjectDecisionData } from '../../types/projects';

interface QuickDecisionCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parentDecisionId?: string | null;
  onSubmit: (decision: CreateProjectDecisionData) => Promise<void>;
  onSuccess?: () => void;
  loading?: boolean;
}

export const QuickDecisionCreator: React.FC<QuickDecisionCreatorProps> = ({
  isOpen,
  onClose,
  projectId,
  parentDecisionId,
  onSubmit,
  onSuccess,
  loading = false
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    impact: 'medium' as 'low' | 'medium' | 'high',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'strategic' as 'strategic' | 'tactical' | 'operational'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      impact: 'medium',
      urgency: 'medium',
      type: 'strategic'
    });
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const decisionData: CreateProjectDecisionData = {
      title: formData.title,
      description: formData.description,
      decision_type: formData.type,
      urgency: formData.urgency,
      parent_decision_id: parentDecisionId || undefined,
      expected_impact: getImpactDescription(formData.impact),
      tags: [formData.type, formData.impact, 'quick-decision'],
      success_metrics: {
        'implementation_progress': {
          target: 100,
          actual: 0,
          unit: 'percentage',
          description: 'Progreso de implementación'
        }
      }
    };

    try {
      await onSubmit(decisionData);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error creating decision:', error);
    }
  };

  const getImpactDescription = (impact: string) => {
    switch (impact) {
      case 'low': return 'Cambio gradual en el rumbo del proyecto';
      case 'medium': return 'Ajuste significativo en la estrategia del proyecto';
      case 'high': return 'Transformación fundamental del enfoque del proyecto';
      default: return 'Impacto en la dirección del proyecto';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiZap className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {parentDecisionId ? 'Decisión Derivada' : 'Nueva Decisión'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FiTarget className="w-5 h-5 text-blue-600" />
                  ¿Qué decisión tomarás?
                </h3>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Cambiar el enfoque del producto hacia X"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Tipo de decisión:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'strategic', label: '🎯 Estratégica', desc: 'Cambia el rumbo' },
                    { value: 'tactical', label: '⚡ Táctica', desc: 'Ajusta el enfoque' },
                    { value: 'operational', label: '🔧 Operativa', desc: 'Mejora procesos' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: option.value as any }))}
                      className={`p-2 rounded-lg text-sm border transition-all ${
                        formData.type === option.value
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FiTrendingUp className="w-5 h-5 text-purple-600" />
                  ¿Cuál será el impacto?
                </h3>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe brevemente por qué esta decisión cambiará el proyecto..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Nivel de impacto:</h4>
                <div className="space-y-2">
                  {[
                    { value: 'low', label: 'Bajo', desc: 'Ajuste menor', icon: '📈' },
                    { value: 'medium', label: 'Medio', desc: 'Cambio notable', icon: '🚀' },
                    { value: 'high', label: 'Alto', desc: 'Transformación', icon: '💫' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, impact: option.value as any }))}
                      className={`w-full p-3 rounded-lg text-left border transition-all ${
                        formData.impact === option.value
                          ? 'bg-purple-50 border-purple-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FiAlertTriangle className="w-5 h-5 text-orange-600" />
                  ¿Qué tan urgente es?
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'low', label: 'Puedo esperar', desc: 'Próximas semanas', icon: '⏳' },
                    { value: 'medium', label: 'Importante', desc: 'Esta semana', icon: '⏰' },
                    { value: 'high', label: 'Urgente', desc: 'En días', icon: '🔥' },
                    { value: 'critical', label: 'Crítico', desc: 'Ahora mismo', icon: '🚨' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, urgency: option.value as any }))}
                      className={`w-full p-3 rounded-lg text-left border transition-all ${
                        formData.urgency === option.value
                          ? 'bg-orange-50 border-orange-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium mb-2">Resumen de tu decisión:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Qué:</strong> {formData.title || 'Sin título'}</div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs border ${getImpactColor(formData.impact)}`}>
                      Impacto {formData.impact}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs border ${getUrgencyColor(formData.urgency)}`}>
                      {formData.urgency}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>

          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !formData.title.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Crear Decisión
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 