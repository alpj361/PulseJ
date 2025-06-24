import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from './card';
import { FiBox, FiAlertTriangle, FiWatch, FiTrash2, FiX, FiMapPin, FiEdit, FiSave, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { EXTRACTORW_API_URL } from '../../services/api';
import { deleteCapturadoCard, updateCapturadoCard, deleteAllCapturadoCards, CapturadoUpdatePayload } from '../../services/capturados';
import { createCoverageFromCard, hasValidGeographicInfo } from '../../services/coverages';
import { DisplayCards } from '@/components/ui/display-cards';

interface CapturadoCard {
  id: string;
  entity: string | null;
  amount: number | null;
  currency: string | null;
  city: string | null;
  department: string | null;
  discovery: string | null;
  source: string | null;
  start_date: string | null;
  duration_days: number | null;
  description: string | null;
  created_at: string;
  topic?: string | null;
}

interface Props {
  projectId: string;
  reloadKey?: number;
}

export default function CapturedCards({ projectId, reloadKey }: Props) {
  const { session } = useAuth();
  const [cards, setCards] = useState<CapturadoCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [addingToCoverage, setAddingToCoverage] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CapturadoCard | null>(null);
  const [editData, setEditData] = useState<CapturadoUpdatePayload>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadKey]);

  async function fetchCards() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${EXTRACTORW_API_URL}/capturados?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = await response.json();
      setCards(data.cards || []);
    } catch (err: any) {
      console.error('Error fetching capturado cards:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este hallazgo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingCard(cardId);
      await deleteCapturadoCard(cardId, session?.access_token || '');
      
      // Actualizar la lista local removiendo la tarjeta eliminada
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
    } catch (err: any) {
      console.error('Error deleting card:', err);
      alert(`Error eliminando hallazgo: ${err.message || 'Error desconocido'}`);
    } finally {
      setDeletingCard(null);
    }
  }

  async function handleAddToCoverage(card: CapturadoCard) {
    if (!hasValidGeographicInfo(card)) {
      alert('Esta card no contiene información geográfica válida (ciudad o departamento).');
      return;
    }

    // Validación adicional: verificar que la card tenga un ID válido
    if (!card.id || card.id.trim() === '') {
      alert('Error: La card no tiene un ID válido.');
      return;
    }

    try {
      setAddingToCoverage(card.id);
      console.log(`🔄 Intentando crear cobertura para card ID: ${card.id}`);
      
      const result = await createCoverageFromCard(card.id, projectId);
      
      if (result.created_count > 0) {
        alert(`✅ Se crearon ${result.created_count} coberturas geográficas desde esta card.`);
      } else {
        alert('⚠️ No se pudieron crear coberturas. Es posible que ya existan o la información no sea válida.');
      }
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Errores al crear coberturas:', result.errors);
      }
      
    } catch (err: any) {
      console.error('Error adding to coverage:', err);
      
      // Mejorar el mensaje de error basado en el tipo de error
      let errorMessage = 'Error desconocido';
      
      if (err.message.includes('Card no encontrada')) {
        errorMessage = 'La información capturada ya no está disponible. Intenta recargar la página o capturar nuevamente.';
      } else if (err.message.includes('información geográfica válida')) {
        errorMessage = 'Esta información no contiene datos de ubicación válidos (ciudad o departamento).';
      } else if (err.message.includes('No tienes permisos')) {
        errorMessage = 'No tienes permisos para agregar coberturas a este proyecto.';
      } else {
        errorMessage = err.message || 'Error al crear cobertura';
      }
      
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setAddingToCoverage(null);
    }
  }

  function openEditModal(card: CapturadoCard) {
    setEditingCard(card);
    setEditData({
      entity: card.entity || '',
      city: card.city || '',
      department: card.department || '',
      description: card.description || '',
      discovery: card.discovery || ''
    });
  }

  async function handleSaveEdit() {
    if (!editingCard) return;
    try {
      setSavingEdit(true);
      const updated = await updateCapturadoCard(editingCard.id, editData, session?.access_token || '');
      // actualizar lista local
      setCards(prev => prev.map(c => c.id === updated.card.id ? updated.card : c));
      setEditingCard(null);
    } catch (err: any) {
      alert(`Error guardando cambios: ${err.message || 'Desconocido'}`);
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <FiWatch className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-6">
        <FiAlertTriangle className="inline mr-2" />
        {error}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <FiBox className="inline mr-2" />
        No se han registrado hallazgos capturados para este proyecto.
      </div>
    );
  }

  // Agrupar por topic
  const groupedByTopic: Record<string, CapturadoCard[]> = cards.reduce((acc, card) => {
    const key = card.topic || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {} as Record<string, CapturadoCard[]>);

  const topics = Object.keys(groupedByTopic);

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const expandAll = () => setExpandedTopics(topics);
  const collapseAll = () => setExpandedTopics([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Hallazgos Capturados</h2>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-sm text-blue-600 hover:underline">Expandir todo</button>
          <button onClick={collapseAll} className="text-sm text-blue-600 hover:underline">Contraer todo</button>
          <button
            onClick={async () => {
              if (!confirm('¿Eliminar TODOS los hallazgos del proyecto?')) return;
              await deleteAllCapturadoCards(projectId, session?.access_token || '');
              fetchCards();
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Eliminar todo
          </button>
        </div>
      </div>

      {topics.map(topic => {
        const groupCards = groupedByTopic[topic];
        const isExpanded = expandedTopics.includes(topic);
        
        const displayCardsData = groupCards.slice(0,3).map(c => ({
          title: c.entity || c.discovery || 'Hallazgo',
          description: c.description || '',
          date: new Date(c.created_at).toLocaleDateString(),
        }));

        return (
          <div key={topic} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/20">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleTopic(topic)}
            >
              <h3 className="text-lg font-semibold">{topic} ({groupCards.length})</h3>
              <FiChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>

            {isExpanded ? (
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCards.map(card => (
                  <Card key={card.id} className="relative group bg-white dark:bg-gray-800">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                      {hasValidGeographicInfo(card) && (
                        <button onClick={() => handleAddToCoverage(card)} disabled={addingToCoverage === card.id} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full">
                          {addingToCoverage === card.id ? <FiWatch className="animate-spin" /> : <FiMapPin />}
                        </button>
                      )}
                      <button onClick={() => openEditModal(card)} className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-full">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDeleteCard(card.id)} disabled={deletingCard === card.id} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full">
                        {deletingCard === card.id ? <FiWatch className="animate-spin" /> : <FiTrash2 />}
                      </button>
                    </div>
                    <CardHeader>
                      <h3 className="font-semibold text-sm pr-12">{card.entity || 'Entidad desconocida'}</h3>
                      <p className="text-xs text-gray-500">{new Date(card.created_at).toLocaleDateString()}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {card.amount && <p>Monto: <span className="font-medium">{card.currency || 'Q'} {card.amount.toLocaleString()}</span></p>}
                      {card.city && <p>Ciudad: {card.city}</p>}
                      {card.department && <p>Departamento: {card.department}</p>}
                      {card.description && <p className="text-gray-700 dark:text-gray-200 italic">"{card.description}"</p>}
                      {card.source && <blockquote className="text-xs text-gray-500 border-l-2 pl-2 mt-2">{card.source}</blockquote>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-4" onClick={() => toggleTopic(topic)}>
                <DisplayCards cards={displayCardsData as any} />
              </div>
            )}
          </div>
        );
      })}
      
      {editingCard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Editar Hallazgo</h3>
             <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
               {(['entity','city','department','description','discovery'] as const).map(field => (
                 <div key={field}>
                   <label className="text-xs font-medium capitalize">{field}</label>
                   <input
                      type="text"
                      value={(editData as any)[field] || ''}
                      onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                 </div>
               ))}
             </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingCard(null)}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 