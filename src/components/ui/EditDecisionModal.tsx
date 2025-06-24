import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiEdit, 
  FiX, 
  FiSave, 
  FiArrowLeft,
  FiTarget,
  FiLayers,
  FiSettings
} from 'react-icons/fi';
import { ProjectDecision } from '../../types/projects';

interface EditDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: ProjectDecision | null;
  onSubmit: (decisionId: string, updates: Partial<ProjectDecision>) => Promise<void>;
  loading?: boolean;
}

export const EditDecisionModal: React.FC<EditDecisionModalProps> = ({
  isOpen,
  onClose,
  decision,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    change_description: '',
    objective: '',
    next_steps: '',
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
  const [customFormat, setCustomFormat] = useState('');

  // Cargar datos de la decisión cuando se abre el modal
  useEffect(() => {
    if (isOpen && decision) {
      setFormData({
        title: decision.title || '',
        description: decision.description || '',
        change_description: decision.change_description || '',
        objective: decision.objective || '',
        next_steps: decision.next_steps || '',
        deadline: decision.deadline || '',
        // Campos específicos para Enfoque
        focus_area: decision.focus_area || '',
        focus_context: decision.focus_context || '',
        // Campos específicos para Alcance
        geographic_scope: decision.geographic_scope || '',
        monetary_scope: decision.monetary_scope || '',
        time_period_start: decision.time_period_start || '',
        time_period_end: decision.time_period_end || '',
        target_entities: decision.target_entities || '',
        scope_limitations: decision.scope_limitations || '',
        // Campos específicos para Configuración
        output_format: decision.output_format || [],
        data_sources: decision.data_sources || '',
        search_locations: decision.search_locations || '',
        methodology: decision.methodology || '',
        references: decision.references || [],
        tools_required: decision.tools_required || ''
      });
      setErrors([]);
      setCurrentReference('');
      setCustomFormat('');
    }
  }, [isOpen, decision]);

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  const getDecisionTypeIcon = (type: string) => {
    switch (type) {
      case 'enfoque': return <FiTarget className="w-5 h-5" />;
      case 'alcance': return <FiLayers className="w-5 h-5" />;
      case 'configuracion': return <FiSettings className="w-5 h-5" />;
      default: return <FiEdit className="w-5 h-5" />;
    }
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'enfoque': return 'from-blue-500 to-blue-600';
      case 'alcance': return 'from-green-500 to-green-600';
      case 'configuracion': return 'from-purple-500 to-purple-600';
      default: return 'from-indigo-500 to-indigo-600';
    }
  };

  const getDecisionTypeLabel = (type: string) => {
    switch (type) {
      case 'enfoque': return 'Enfoque';
      case 'alcance': return 'Alcance';
      case 'configuracion': return 'Configuración';
      default: return type;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.title.trim()) {
      newErrors.push('El título es requerido');
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

  const addCustomFormat = () => {
    if (customFormat.trim() && !formData.output_format.includes(customFormat.trim())) {
      setFormData(prev => ({
        ...prev,
        output_format: [...prev.output_format, customFormat.trim()]
      }));
      setCustomFormat('');
    }
  };

  const removeFormat = (formatToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      output_format: prev.output_format.filter(format => format !== formatToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!decision || !validateForm()) {
      return;
    }

    try {
      // Construir datos específicos según el tipo
      let specificData: { description?: string; change_description?: string } = {};
      
      if (decision.decision_type === 'enfoque') {
        const parts: string[] = [];
        if (formData.focus_area) parts.push(`Enfoque: ${formData.focus_area}`);
        if (formData.focus_context) parts.push(`Contexto: ${formData.focus_context}`);
        
        specificData = {
          change_description: formData.focus_area ? `Enfoque en: ${formData.focus_area}` : `Decisión de enfoque`,
          description: parts.length > 0 ? parts.join('. ') : formData.description,
        };
      } else if (decision.decision_type === 'alcance') {
        const parts: string[] = [];
        if (formData.geographic_scope) parts.push(`Geográfico: ${formData.geographic_scope}`);
        if (formData.time_period_start && formData.time_period_end) parts.push(`Período: ${formData.time_period_start} - ${formData.time_period_end}`);
        if (formData.monetary_scope) parts.push(`Monetario: ${formData.monetary_scope}`);
        if (formData.target_entities) parts.push(`Entidades: ${formData.target_entities}`);
        if (formData.scope_limitations) parts.push(`Limitaciones: ${formData.scope_limitations}`);
        
        specificData = {
          change_description: parts.length > 0 ? `Alcance: ${parts[0]}` : `Decisión de alcance`,
          description: parts.join('. ') || formData.description,
        };
      } else if (decision.decision_type === 'configuracion') {
        const parts: string[] = [];
        if (formData.output_format.length > 0) parts.push(`Formatos: ${formData.output_format.join(', ')}`);
        if (formData.methodology) parts.push(`Metodología: ${formData.methodology}`);
        if (formData.data_sources) parts.push(`Fuentes: ${formData.data_sources}`);
        if (formData.search_locations) parts.push(`Búsqueda: ${formData.search_locations}`);
        if (formData.tools_required) parts.push(`Herramientas: ${formData.tools_required}`);
        if (formData.references.length > 0) parts.push(`Referencias: ${formData.references.length} enlaces`);
        
        specificData = {
          change_description: parts.length > 0 ? `Configuración: ${parts[0]}` : `Decisión de configuración`,
          description: parts.join('. ') || formData.description,
        };
      }

      const updates: Partial<ProjectDecision> = {
        title: formData.title,
        description: specificData.description || formData.description,
        change_description: specificData.change_description || formData.change_description,
        objective: formData.objective || null,
        next_steps: formData.next_steps || null,
        deadline: formData.deadline || null,
        // Campos específicos para enfoque
        focus_area: formData.focus_area || null,
        focus_context: formData.focus_context || null,
        // Campos específicos para alcance
        geographic_scope: formData.geographic_scope || null,
        monetary_scope: formData.monetary_scope || null,
        time_period_start: formData.time_period_start || null,
        time_period_end: formData.time_period_end || null,
        target_entities: formData.target_entities || null,
        scope_limitations: formData.scope_limitations || null,
        // Campos específicos para configuración
        output_format: formData.output_format.length > 0 ? formData.output_format : null,
        methodology: formData.methodology || null,
        data_sources: formData.data_sources || null,
        search_locations: formData.search_locations || null,
        tools_required: formData.tools_required || null,
        references: formData.references.length > 0 ? formData.references : null,
      };

      await onSubmit(decision.id, updates);
      handleClose();
    } catch (error) {
      console.error('Error updating decision:', error);
      setErrors(['Error al actualizar la decisión. Inténtalo de nuevo.']);
    }
  };

  if (!isOpen || !decision) return null;

  const decisionTypeGradient = getDecisionTypeColor(decision.decision_type);
  const decisionTypeLabel = getDecisionTypeLabel(decision.decision_type);
  const decisionTypeIcon = getDecisionTypeIcon(decision.decision_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${decisionTypeGradient} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {decisionTypeIcon}
              <div>
                <h2 className="text-xl font-bold">
                  Editar Decisión de {decisionTypeLabel}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Modifica los campos que desees actualizar
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-red-800 font-medium mb-2">Errores de validación:</h4>
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
                placeholder={`Título para esta decisión de ${decisionTypeLabel.toLowerCase()}`}
              />
            </div>

            {/* Campos específicos por tipo */}
            {decision.decision_type === 'enfoque' && (
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

            {decision.decision_type === 'alcance' && (
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

            {decision.decision_type === 'configuracion' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Formato Esperado (Múltiples)
                    </label>
                    <div className="space-y-2 mb-3">
                      {[
                        { value: 'Investigación Completa', label: 'Investigación Completa', icon: '🔬' },
                        { value: 'Reel/TikTok Informativo', label: 'Reel/TikTok Informativo', icon: '📱' },
                        { value: 'Artículo', label: 'Artículo', icon: '📰' },
                        { value: 'Académico', label: 'Académico', icon: '🎓' },
                        { value: 'Cobertura', label: 'Cobertura', icon: '📺' },
                        { value: 'Informe Ejecutivo', label: 'Informe Ejecutivo', icon: '📊' },
                        { value: 'Dashboard Interactivo', label: 'Dashboard Interactivo', icon: '💻' }
                      ].map((format) => (
                        <label key={format.value} className="flex items-center gap-3 cursor-pointer group">
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
                          <span className="text-sm">{format.icon}</span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                            {format.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Campo para agregar formato personalizado */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFormat}
                        onChange={(e) => setCustomFormat(e.target.value)}
                        placeholder="Formato personalizado..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomFormat();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomFormat}
                        className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Agregar
                      </button>
                    </div>

                    {formData.output_format.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-medium text-purple-700 mb-2">Formatos seleccionados:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.output_format.map((format, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white text-purple-700 text-xs rounded-full border border-purple-300"
                            >
                              {format}
                              <button
                                type="button"
                                onClick={() => removeFormat(format)}
                                className="hover:text-purple-900 ml-1"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                    🔗 Referencias/Links (Opcional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentReference}
                      onChange={(e) => setCurrentReference(e.target.value)}
                      placeholder="https://ejemplo.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addReference();
                        }
                      }}
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
                placeholder="¿Cuáles son las acciones concretas a seguir?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Fecha Límite (Opcional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiX className="w-4 h-4" />
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 