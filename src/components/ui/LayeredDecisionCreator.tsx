import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateProjectDecisionData } from '../../types/projects';
import { canCreateNewLayer } from '../../services/userLimits';
import { 
  FiTarget,
  FiLayers,
  FiSettings,
  FiArrowRight,
  FiArrowLeft,
  FiX,
  FiSend,
  FiCalendar,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';

interface LayeredDecisionCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parentDecisionId?: string | null;
  onSubmit: (decisionData: CreateProjectDecisionData) => Promise<void>;
  onSuccess?: () => void;
  loading?: boolean;
}

interface DecisionTypeOption {
  type: 'enfoque' | 'alcance' | 'configuracion';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  examples: string[];
}

const DECISION_TYPES: DecisionTypeOption[] = [
  {
    type: 'enfoque',
    title: 'Enfoque',
    description: 'Define la dirección estratégica y el marco conceptual del análisis',
    icon: <FiTarget className="w-6 h-6" />,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    examples: [
      'Auditoría de contratación pública',
      'Análisis de transparencia gubernamental',
      'Investigación de proveedores frecuentes'
    ]
  },
  {
    type: 'alcance',
    title: 'Alcance',
    description: 'Establece los límites temporales, geográficos y temáticos del proyecto',
    icon: <FiLayers className="w-6 h-6" />,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    examples: [
      'Período: Enero 2020 - Diciembre 2023',
      'Municipalidades de la región central',
      'Contratos superiores a Q100,000'
    ]
  },
  {
    type: 'configuracion',
    title: 'Configuración',
    description: 'Define herramientas, formatos y metodologías específicas de análisis',
    icon: <FiSettings className="w-6 h-6" />,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    examples: [
      'Reporte en formato PDF detallado',  
      'Dashboard interactivo con métricas',
      'Análisis de redes de proveedores'
    ]
  }
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Baja', color: 'green', description: 'Puede esperar, no hay prisa' },
  { value: 'medium', label: 'Media', color: 'yellow', description: 'Importante, pero no urgente' },
  { value: 'high', label: 'Alta', color: 'orange', description: 'Necesita atención pronta' },
  { value: 'critical', label: 'Crítica', color: 'red', description: 'Requiere acción inmediata' }
];

export const LayeredDecisionCreator: React.FC<LayeredDecisionCreatorProps> = ({
  isOpen,
  onClose,
  projectId,
  parentDecisionId,
  onSubmit,
  onSuccess,
  loading = false
}) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'enfoque' | 'alcance' | 'configuracion' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    change_description: '',
    objective: '',
    next_steps: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    deadline: '',
    // Campos específicos para Enfoque
    focus_area: '',
    focus_context: '',
    // Campos específicos para Alcance
    geographic_scope: '',
    monetary_scope: '',
    time_period_start: '',
    time_period_end: '',
    target_entities: '',
    scope_limitations: '',
    // Campos específicos para Configuración
    output_format: [] as string[],
    data_sources: '',
    search_locations: '',
    methodology: '',
    references: [] as string[],
    tools_required: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [currentReference, setCurrentReference] = useState('');
  const [layerLimits, setLayerLimits] = useState<Record<string, { canCreate: boolean; currentCount: number; limit: number; remaining: number }>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedType(null);
      setFormData({
        title: '',
        description: '',
        change_description: '',
        objective: '',
        next_steps: '',
        urgency: 'medium',
        deadline: '',
        // Campos específicos para Enfoque
        focus_area: '',
        focus_context: '',
        // Campos específicos para Alcance
        geographic_scope: '',
        monetary_scope: '',
        time_period_start: '',
        time_period_end: '',
        target_entities: '',
        scope_limitations: '',
        // Campos específicos para Configuración
        output_format: [],
        data_sources: '',
        search_locations: '',
        methodology: '',
        references: [],
        tools_required: ''
      });
      setErrors([]);
      // Cargar límites de capas cuando se abre el modal
      loadLayerLimits();
    }
  }, [isOpen, projectId]);

  // Cargar límites de capas para cada tipo
  const loadLayerLimits = async () => {
    if (!projectId) return;
    
    try {
      const types: Array<'enfoque' | 'alcance' | 'configuracion'> = ['enfoque', 'alcance', 'configuracion'];
      const limitsPromises = types.map(async (type) => {
        const result = await canCreateNewLayer(projectId, type);
        return [type, result];
      });
      
      const results = await Promise.all(limitsPromises);
      const newLimits = Object.fromEntries(results);
      setLayerLimits(newLimits);
    } catch (error) {
      console.error('Error loading layer limits:', error);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setErrors([]);
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedType) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const validateStep2 = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.title.trim()) {
      newErrors.push('El título es requerido');
    }
    
    // Verificar que al menos un campo adicional esté lleno
    const hasContent = [
      formData.description.trim(),
      formData.objective.trim(),
      formData.next_steps.trim(),
      // Campos específicos para Enfoque
      formData.focus_area.trim(),
      formData.focus_context.trim(),
      // Campos específicos para Alcance
      formData.geographic_scope.trim(),
      formData.monetary_scope.trim(),
      formData.time_period_start.trim(),
      formData.time_period_end.trim(),
      formData.target_entities.trim(),
      formData.scope_limitations.trim(),
      // Campos específicos para Configuración
      formData.output_format.length > 0 ? 'has_formats' : '',
      formData.data_sources.trim(),
      formData.search_locations.trim(),
      formData.methodology.trim(),
      formData.tools_required.trim(),
      formData.deadline.trim()
    ].some(field => field.length > 0) || formData.references.length > 0;

    if (!hasContent) {
      newErrors.push('Debes completar al menos un campo adicional además del título');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addReference = () => {
    if (currentReference.trim() && !formData.references.includes(currentReference.trim())) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, currentReference.trim()]
      }));
      setCurrentReference('');
    }
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedType || !validateStep2()) {
      return;
    }

    // Verificar límite de capas solo si no es una decisión derivada
    if (!parentDecisionId) {
      const limitInfo = layerLimits[selectedType];
      if (limitInfo && !limitInfo.canCreate) {
        setErrors([`Has alcanzado el límite de ${limitInfo.limit} capas para decisiones de tipo "${selectedType}". Tienes ${limitInfo.currentCount} capas creadas.`]);
        return;
      }
    }

    try {
      // Construir datos específicos según el tipo
      let specificData: { description?: string; change_description?: string } = {};
      if (selectedType === 'enfoque') {
        const parts: string[] = [];
        if (formData.focus_area) parts.push(`Enfoque: ${formData.focus_area}`);
        if (formData.focus_context) parts.push(`Contexto: ${formData.focus_context}`);
        
        specificData = {
          change_description: formData.focus_area ? `Enfoque en: ${formData.focus_area}` : `Decisión de enfoque`,
          description: parts.length > 0 ? parts.join('. ') : '',
        };
      } else if (selectedType === 'alcance') {
        const parts: string[] = [];
        if (formData.geographic_scope) parts.push(`Geográfico: ${formData.geographic_scope}`);
        if (formData.time_period_start && formData.time_period_end) parts.push(`Período: ${formData.time_period_start} - ${formData.time_period_end}`);
        if (formData.monetary_scope) parts.push(`Monetario: ${formData.monetary_scope}`);
        if (formData.target_entities) parts.push(`Entidades: ${formData.target_entities}`);
        if (formData.scope_limitations) parts.push(`Limitaciones: ${formData.scope_limitations}`);
        
        specificData = {
          change_description: parts.length > 0 ? `Alcance: ${parts[0]}` : `Decisión de alcance`,
          description: parts.join('. '),
        };
      } else if (selectedType === 'configuracion') {
        const parts: string[] = [];
        if (formData.output_format.length > 0) parts.push(`Formatos: ${formData.output_format.join(', ')}`);
        if (formData.methodology) parts.push(`Metodología: ${formData.methodology}`);
        if (formData.data_sources) parts.push(`Fuentes: ${formData.data_sources}`);
        if (formData.search_locations) parts.push(`Búsqueda: ${formData.search_locations}`);
        if (formData.tools_required) parts.push(`Herramientas: ${formData.tools_required}`);
        if (formData.references.length > 0) parts.push(`Referencias: ${formData.references.length} enlaces`);
        
        specificData = {
          change_description: parts.length > 0 ? `Configuración: ${parts[0]}` : `Decisión de configuración`,
          description: parts.join('. '),
        };
      }

      const decisionData: CreateProjectDecisionData = {
        title: formData.title,
        description: specificData.description || formData.description,
        decision_type: selectedType,
        change_description: specificData.change_description,
        objective: formData.objective,
        next_steps: formData.next_steps,
        urgency: formData.urgency,
        deadline: formData.deadline || undefined,
        parent_decision_id: parentDecisionId || undefined,
        tags: [
          selectedType, 
          'decision-layer',
          ...(selectedType === 'alcance' ? ['geographic-scope'] : []),
          ...(selectedType === 'configuracion' ? ['output-format'] : []),
          ...(formData.references.length > 0 ? ['has-references'] : [])
        ],
      };

      await onSubmit(decisionData);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error creating layered decision:', error);
    }
  };

  const selectedTypeData = selectedType ? DECISION_TYPES.find(t => t.type === selectedType) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiLayers className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {parentDecisionId ? 'Nueva Capa de Decisión' : 'Decisión por Capas'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6 flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'bg-white text-indigo-600 border-white' : 'border-white/50'
              }`}>
                1
              </div>
              <span className="font-medium">Tipo de Decisión</span>
            </div>
            <FiArrowRight className="text-white/50" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'bg-white text-indigo-600 border-white' : 'border-white/50'
              }`}>
                2
              </div>
              <span className="font-medium">Configuración</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Selecciona el Tipo de Decisión
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Las decisiones por capas se acumulan progresivamente, permitiendo un enfoque estructurado 
                    y refinado del análisis. Cada capa aporta contexto específico al proyecto.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {DECISION_TYPES.map((option) => {
                    const limitInfo = layerLimits[option.type];
                    const isDisabled = !parentDecisionId && limitInfo && !limitInfo.canCreate;
                    
                    return (
                      <motion.div
                        key={option.type}
                        whileHover={!isDisabled ? { scale: 1.02 } : {}}
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                        className={`rounded-xl border-2 transition-all duration-200 ${
                          isDisabled 
                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                            : selectedType === option.type
                              ? `border-${option.color}-500 shadow-lg shadow-${option.color}-500/20 cursor-pointer`
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && setSelectedType(option.type)}
                      >
                      <div className={`p-6 bg-gradient-to-br ${option.gradient} text-white rounded-t-lg`}>
                        <div className="flex items-center gap-3 mb-3">
                          {option.icon}
                          <h4 className="text-xl font-bold">{option.title}</h4>
                        </div>
                        <p className="text-white/90 text-sm">{option.description}</p>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Ejemplos:</h5>
                          {limitInfo && !parentDecisionId && (
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              limitInfo.canCreate 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {limitInfo.currentCount}/{limitInfo.limit} capas
                            </div>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {option.examples.map((example, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {example}
                            </li>
                          ))}
                        </ul>
                        {isDisabled && (
                          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <FiAlertTriangle className="w-4 h-4 inline mr-1" />
                            Límite alcanzado ({limitInfo?.currentCount}/{limitInfo?.limit})
                          </div>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    {selectedTypeData?.icon}
                    <h3 className="text-2xl font-bold text-gray-900">
                      Configurar {selectedTypeData?.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{selectedTypeData?.description}</p>
                </div>

                {/* Form Errors */}
                {errors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                      <FiAlertTriangle className="w-4 h-4" />
                      Errores en el formulario:
                    </div>
                    <ul className="text-red-700 text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Título común */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Decisión *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Título para esta decisión de ${selectedTypeData?.title.toLowerCase()}`}
                    />
                  </div>

                  {/* Nota informativa */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Solo necesitas completar el título y al menos un campo adicional. 
                      {!parentDecisionId && (
                        <>
                          <br />
                          🔗 <strong>Sistema de Capas:</strong> Si ya existe una decisión del mismo tipo, esta se agregará automáticamente como una nueva capa.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Campos específicos por tipo */}
                  {selectedType === 'enfoque' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🎯 ¿En qué te deseas enfocar?
                        </label>
                        <input
                          type="text"
                          value={formData.focus_area}
                          onChange={(e) => setFormData(prev => ({ ...prev, focus_area: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ej: Auditoría de contratación pública, Análisis de transparencia gubernamental..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📝 Contexto adicional (Opcional)
                        </label>
                        <textarea
                          value={formData.focus_context}
                          onChange={(e) => setFormData(prev => ({ ...prev, focus_context: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Proporciona más contexto sobre por qué este enfoque es importante..."
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'alcance' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🌍 Alcance Geográfico
                          </label>
                          <input
                            type="text"
                            value={formData.geographic_scope}
                            onChange={(e) => setFormData(prev => ({ ...prev, geographic_scope: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: Municipalidades de la región central, Todo Guatemala..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            💰 Alcance Monetario (Opcional)
                          </label>
                          <input
                            type="text"
                            value={formData.monetary_scope}
                            onChange={(e) => setFormData(prev => ({ ...prev, monetary_scope: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: Contratos superiores a Q100,000..."
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📅 Fecha de Inicio
                          </label>
                          <input
                            type="date"
                            value={formData.time_period_start}
                            onChange={(e) => setFormData(prev => ({ ...prev, time_period_start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📅 Fecha de Fin
                          </label>
                          <input
                            type="date"
                            value={formData.time_period_end}
                            onChange={(e) => setFormData(prev => ({ ...prev, time_period_end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏢 Entidades Objetivo (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.target_entities}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_entities: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ej: Municipalidades, Ministerios, Instituciones autónomas..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ⚠️ Limitaciones del Alcance (Opcional)
                        </label>
                        <textarea
                          value={formData.scope_limitations}
                          onChange={(e) => setFormData(prev => ({ ...prev, scope_limitations: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Describe qué queda excluido del análisis..."
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'configuracion' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📄 Formatos de Salida (Múltiples)
                          </label>
                          <div className="space-y-2">
                            {[
                              { value: 'pdf-report', label: 'Reporte PDF detallado' },
                              { value: 'dashboard-interactive', label: 'Dashboard interactivo' },
                              { value: 'excel-analysis', label: 'Análisis en Excel' },
                              { value: 'web-report', label: 'Reporte web publicable' },
                              { value: 'presentation', label: 'Presentación ejecutiva' }
                            ].map((format) => (
                              <label key={format.value} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.output_format.includes(format.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        output_format: [...prev.output_format, format.value]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        output_format: prev.output_format.filter(f => f !== format.value)
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700">{format.label}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Puedes seleccionar múltiples formatos de salida
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔬 Metodología
                          </label>
                          <input
                            type="text"
                            value={formData.methodology}
                            onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ej: Análisis de redes, Auditoría documental..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📊 Fuentes de Datos (Opcional)
                        </label>
                        <textarea
                          value={formData.data_sources}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_sources: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ej: Portal de transparencia, Guatecompras, Registros municipales..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🔍 Dónde Buscarás (Opcional)
                        </label>
                        <textarea
                          value={formData.search_locations}
                          onChange={(e) => setFormData(prev => ({ ...prev, search_locations: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ej: Sitios web oficiales, Bases de datos públicas, Archivos físicos..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🛠️ Herramientas Requeridas (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.tools_required}
                          onChange={(e) => setFormData(prev => ({ ...prev, tools_required: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ej: Python, Tableau, Power BI, Excel avanzado..."
                        />
                      </div>

                      {/* Referencias/Links */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🔗 Referencias y Links
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={currentReference}
                            onChange={(e) => setCurrentReference(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Agregar URL o referencia..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                          />
                          <button
                            type="button"
                            onClick={addReference}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Agregar
                          </button>
                        </div>
                        {formData.references.length > 0 && (
                          <div className="space-y-2">
                            {formData.references.map((ref, index) => (
                              <div key={index} className="flex items-center justify-between bg-purple-50 p-2 rounded border">
                                <span className="text-sm text-purple-800 break-all">{ref}</span>
                                <button
                                  type="button"
                                  onClick={() => removeReference(index)}
                                  className="text-purple-600 hover:text-purple-800 ml-2"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Campos comunes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Objetivo
                    </label>
                    <textarea
                      value={formData.objective}
                      onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="¿Qué se busca lograr con esta decisión?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👣 Siguientes Pasos
                    </label>
                    <textarea
                      value={formData.next_steps}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Define las acciones concretas que seguirán a esta decisión..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Urgencia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⚡ Urgencia
                      </label>
                      <div className="space-y-2">
                        {URGENCY_OPTIONS.map((option) => (
                          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="urgency"
                              value={option.value}
                              checked={formData.urgency === option.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full bg-${option.color}-500`}></span>
                              <span className="font-medium">{option.label}</span>
                              <span className="text-sm text-gray-500">- {option.description}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Fecha límite */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Fecha Límite (Opcional)
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <FiCalendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Deja vacío si no hay una fecha específica
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-t border-gray-200">
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {step === 1 ? (
              <>
                <FiX className="w-4 h-4" />
                Cancelar
              </>
            ) : (
              <>
                <FiArrowLeft className="w-4 h-4" />
                Atrás
              </>
            )}
          </button>

          <div className="flex gap-3">
            {step === 1 ? (
              <button
                onClick={handleNext}
                disabled={!selectedType}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continuar
                <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
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