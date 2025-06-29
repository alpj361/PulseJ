import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  FiPlus, 
  FiDatabase, 
  FiSearch, 
  FiFilter, 
  FiCalendar,
  FiBarChart,
  FiFileText,
  FiClock,
  FiTrash2,
  FiX,
  FiEdit,
  FiEye,
  FiTarget,
  FiUser,
  FiSave,
  FiXCircle,
  FiFile,
  FiMusic,
  FiVideo,
  FiLink,
  FiImage,
  FiCheck,
  FiSquare,
  FiCheckSquare,
  FiAlertTriangle,
  FiDownload,
  FiLayers
} from 'react-icons/fi';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ProjectActivityCard } from './ProjectActivityCard';
import { DecisionTimeline } from './DecisionTimeline';
import { LatestDecisions } from './LatestDecisions';
import { DecisionChronology } from './DecisionChronology';

import ProjectSuggestions from './ProjectSuggestions';
import { cn } from '../../lib/utils';
import { 
  useProjects, 
  useRecentProjects,
  useProjectsStats 
} from '../../hooks';
import { Project } from '../../types/projects';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectAssets,
  unassignCodexItemFromProject,
  getProjectDecisions
} from '../../services/supabase.ts';
import {
  getTasksFromDatabase,
  saveTasksToDatabase,
  createNewTask,
  updateTask,
  deleteTask,
  generateExampleTasks
} from '../../services/projectTasks';
import { TasksResponse, ProjectTask } from '../../types/projects';
import AddAssetsModal from './AddAssetsModal';
import CapturedCards from './CapturedCards';
import { extractCapturados } from '../../services/capturados';
import ProjectCoverages from '../coverages/ProjectCoverages';
import { supabase } from '../../services/supabase.ts';

// ===================================================================
// INTERFACES
// ===================================================================

interface ProjectDashboardProps {
  onCreateProject?: () => void;
  onCreateDecision?: (projectId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onSelectDecision?: (decisionId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  projects?: Project[];
  projectsLoading?: boolean;
  refreshProjects?: () => Promise<void>;
  updateProject?: (id: string, data: Partial<Project>) => Promise<Project>;
}

interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Metric {
  label: string;
  value: string;
  trend: number;
  unit?: string;
}

// ===================================================================
// CONSTANTS
// ===================================================================

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  completed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
};

const priorityColors = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-green-600 dark:text-green-400',
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

const getAssetTypeIcon = (tipo: string, isDrive?: boolean) => {
  if (isDrive) {
    return <FiDatabase className="w-5 h-5 text-blue-600" />;
  }
  
  switch (tipo?.toLowerCase()) {
    case 'documento':
    case 'document':
      return <FiFileText className="w-5 h-5 text-blue-600" />;
    case 'audio':
      return <FiMusic className="w-5 h-5 text-purple-600" />;
    case 'video':
      return <FiVideo className="w-5 h-5 text-red-600" />;
    case 'enlace':
    case 'link':
      return <FiLink className="w-5 h-5 text-green-600" />;
    case 'imagen':
    case 'image':
      return <FiImage className="w-5 h-5 text-orange-600" />;
    default:
      return <FiFile className="w-5 h-5 text-gray-600" />;
  }
};

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export function ProjectDashboard({
  onCreateProject,
  onCreateDecision,
  onSelectProject,
  onSelectDecision,
  onDeleteProject,
  projects,
  projectsLoading,
  refreshProjects,
  updateProject,
}: ProjectDashboardProps) {
  const { t, getPriorityText, getStatusText, getVisibilityText } = useTranslations();
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'decisions' | 'timeline' | 'details' | 'captured' | 'coverages'>('overview');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'decisions' | 'timeline' | 'assets' | 'insights'>('decisions');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectForDetails, setProjectForDetails] = useState<Project | null>(null);
  
  const [projectAssets, setProjectAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [showAddAssetsModal, setShowAddAssetsModal] = useState(false);
  
  const [projectDecisions, setProjectDecisions] = useState<any[]>([]);
  
  // Estado para las tareas del proyecto
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Project['priority'],
    status: 'active' as Project['status'],
    category: '',
    start_date: '',
    target_date: '',
    completed_date: '',
    visibility: 'private' as Project['visibility'],
    tags: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  const { recentProjects } = useRecentProjects(5);

  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Review trending topics for new projects", isCompleted: false },
    { id: "2", title: "Update project contexts", isCompleted: false },
    { id: "3", title: "Process pending decisions", isCompleted: true },
  ]);

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];
  const pausedProjects = projects?.filter(p => p.status === 'paused') || [];
  
  const metrics: Metric[] = [
    { label: "Active", value: activeProjects.length.toString(), trend: activeProjects.length > 0 ? Math.min(85, activeProjects.length * 20) : 0 },
    { label: "Paused", value: pausedProjects.length.toString(), trend: pausedProjects.length > 0 ? Math.min(70, pausedProjects.length * 15) : 0 },
    { label: "Completed", value: completedProjects.length.toString(), trend: completedProjects.length > 0 ? Math.min(100, completedProjects.length * 25) : 0 },
  ];

  const handleToggleGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
    ));
  }, []);

  // Funciones para manejar las tareas del proyecto
  const handleAddTask = useCallback(async () => {
    if (newTaskTitle.trim() && projectForDetails) {
      try {
        const newTask = createNewTask(newTaskTitle, projectForDetails.id);
        const updatedTasks = [...projectTasks, newTask];
        
        // Actualizar estado local inmediatamente
        setProjectTasks(updatedTasks);
        setNewTaskTitle('');
        setShowAddTask(false);
        
        // Guardar en base de datos
        const tasksResponse: TasksResponse = {
          tasks: updatedTasks,
          updatedAt: new Date().toISOString()
        };
        await saveTasksToDatabase(projectForDetails.id, tasksResponse);
        
        console.log('✅ Tarea agregada y guardada exitosamente');
      } catch (error) {
        console.error('❌ Error agregando tarea:', error);
        // Revertir cambio local si hay error
        setProjectTasks(prev => prev.filter(task => task.title !== newTaskTitle));
      }
    }
  }, [newTaskTitle, projectForDetails, projectTasks]);

  const handleToggleTask = useCallback(async (taskId: string) => {
    if (!projectForDetails) return;
    
    try {
      const updatedTasks = updateTask(projectTasks, taskId, { 
        completed: !projectTasks.find(t => t.id === taskId)?.completed 
      });
      
      // Actualizar estado local inmediatamente
      setProjectTasks(updatedTasks);
      
      // Guardar en base de datos
      const tasksResponse: TasksResponse = {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };
      await saveTasksToDatabase(projectForDetails.id, tasksResponse);
      
      console.log('✅ Estado de tarea actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando tarea:', error);
      // Revertir cambio local si hay error
      setProjectTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    }
  }, [projectTasks, projectForDetails]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!projectForDetails) return;
    
    try {
      const updatedTasks = deleteTask(projectTasks, taskId);
      
      // Actualizar estado local inmediatamente
      setProjectTasks(updatedTasks);
      
      // Guardar en base de datos
      const tasksResponse: TasksResponse = {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };
      await saveTasksToDatabase(projectForDetails.id, tasksResponse);
      
      console.log('✅ Tarea eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando tarea:', error);
      // Revertir cambio local si hay error
      const deletedTask = projectTasks.find(t => t.id === taskId);
      if (deletedTask) {
        setProjectTasks(prev => [...prev, deletedTask]);
      }
    }
  }, [projectTasks, projectForDetails]);

  const handleCreateProject = useCallback(async () => {
    try {
      onCreateProject?.();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }, [onCreateProject]);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjectToDelete(projectId);
  }, []);

  const loadProjectAssets = useCallback(async (projectId: string) => {
    setLoadingAssets(true);
    try {
      const assets = await getProjectAssets(projectId);
      setProjectAssets(assets);
    } catch (error) {
      console.error('Error loading project assets:', error);
      setProjectAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  const loadProjectDecisions = useCallback(async (projectId: string) => {
    try {
      const decisions = await getProjectDecisions(projectId);
      setProjectDecisions(decisions);
    } catch (error) {
      console.error('Error loading project decisions:', error);
      setProjectDecisions([]);
    }
  }, []);

  const loadProjectTasks = useCallback(async (project: Project) => {
    try {
      console.log('🔄 Cargando tareas para proyecto:', project.id);
      
      // Intentar cargar desde la base de datos
      const dbTasks = getTasksFromDatabase(project);
      
      if (dbTasks && dbTasks.tasks.length > 0) {
        console.log('✅ Tareas cargadas desde base de datos:', dbTasks.tasks.length);
        setProjectTasks(dbTasks.tasks);
      } else {
        console.log('🔄 No hay tareas en base de datos, generando tareas de ejemplo...');
        // Si no hay tareas, generar ejemplos y guardarlas
        const exampleTasks = generateExampleTasks(project.id);
        setProjectTasks(exampleTasks.tasks);
        
        // Guardar las tareas de ejemplo en la base de datos
        try {
          await saveTasksToDatabase(project.id, exampleTasks);
          console.log('💾 Tareas de ejemplo guardadas en base de datos');
        } catch (error) {
          console.warn('⚠️ Error guardando tareas de ejemplo:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando tareas:', error);
      setProjectTasks([]);
    }
  }, []);

  const handleSelectProjectForDecisions = useCallback((project: Project) => {
    setSelectedProject(project);
    onSelectProject?.(project.id);
  }, [onSelectProject]);

  const handleViewProjectDetails = useCallback((project: Project) => {
    setProjectForDetails(project);
    setSelectedProject(project);
    setActiveTab('details');
    setIsEditing(false);
    setEditingData({
      title: project.title,
      description: project.description || '',
      priority: project.priority,
      status: project.status,
      category: project.category || '',
      start_date: project.start_date || '',
      target_date: project.target_date || '',
      completed_date: project.completed_date || '',
      visibility: project.visibility,
      tags: project.tags || []
    });
    setNewTag('');
    loadProjectAssets(project.id);
    loadProjectDecisions(project.id);
    loadProjectTasks(project);
  }, [loadProjectAssets, loadProjectDecisions, loadProjectTasks]);

  const handleAssetsAdded = useCallback((addedAssets: any[]) => {
    setProjectAssets(prev => [...addedAssets, ...prev]);
  }, []);

  const handleRemoveAsset = useCallback(async (assetId: string) => {
    try {
      await unassignCodexItemFromProject(assetId);
      setProjectAssets(prev => prev.filter(asset => asset.id !== assetId));
    } catch (error) {
      console.error('Error removing asset:', error);
    }
  }, []);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    setNewTag('');
    if (projectForDetails) {
      setEditingData({
        title: projectForDetails.title,
        description: projectForDetails.description || '',
        priority: projectForDetails.priority,
        status: projectForDetails.status,
        category: projectForDetails.category || '',
        start_date: projectForDetails.start_date || '',
        target_date: projectForDetails.target_date || '',
        completed_date: projectForDetails.completed_date || '',
        visibility: projectForDetails.visibility,
        tags: projectForDetails.tags || []
      });
    }
  }, [projectForDetails]);

  const handleSaveProject = useCallback(async () => {
    if (!projectForDetails || !updateProject) return;
    try {
      setIsSaving(true);
      const updatedProject = await updateProject(projectForDetails.id, {
        title: editingData.title.trim(),
        description: editingData.description.trim() || undefined,
        priority: editingData.priority,
        status: editingData.status,
        category: editingData.category.trim() || undefined,
        start_date: editingData.start_date || undefined,
        target_date: editingData.target_date || undefined,
        completed_date: editingData.completed_date || undefined,
        visibility: editingData.visibility,
        tags: editingData.tags.length > 0 ? editingData.tags : undefined
      });
      setProjectForDetails(updatedProject);
      setIsEditing(false);
      setNewTag('');
    } catch (error) {
      console.error('Error updating project:', error);
      alert(`❌ Error updating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [projectForDetails, editingData, updateProject]);

  const handleEditingChange = useCallback((field: keyof typeof editingData, value: string | string[]) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !editingData.tags.includes(newTag.trim())) {
      setEditingData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag, editingData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditingData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (projectToDelete && onDeleteProject) {
      try {
        await onDeleteProject(projectToDelete);
        setProjectToDelete(null);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }, [projectToDelete, onDeleteProject]);

  const cancelDeleteProject = useCallback(() => {
    setProjectToDelete(null);
  }, []);

  const [capturedReloadKey, setCapturedReloadKey] = useState<number>(0);

  const handleExtractCapturados = useCallback(async (codexId: string) => {
    if (!projectForDetails) return;
    try {
      const res = await extractCapturados(codexId, projectForDetails.id, session?.access_token || '');
      alert(`✅ Hallazgos capturados: ${res.count}`);
      setCapturedReloadKey(Date.now());
      setActiveTab('captured');
    } catch (error: any) {
      alert(`❌ Error extrayendo capturados: ${error.message || 'Error'}`);
    }
  }, [projectForDetails, session, setActiveTab]);

  const [isExtractingCaptures, setIsExtractingCaptures] = useState(false);
  
  // Estados para el modal de selección de documentos
  const [showDocumentSelectionModal, setShowDocumentSelectionModal] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Función para cargar documentos disponibles del proyecto
  const loadProjectDocuments = useCallback(async () => {
    if (!projectForDetails) return;
    
    setLoadingDocuments(true);
    try {
      // Obtener todos los elementos del codex del proyecto
      const { data, error } = await supabase
        .from('codex_items')
        .select('id, titulo, tipo, nombre_archivo, storage_path, audio_transcription, document_analysis, created_at')
        .eq('project_id', projectForDetails.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar solo elementos que pueden generar hallazgos (tienen transcripción, análisis o son documentos analizables)
      const analyzableItems = (data || []).filter((item: any) => {
        const hasTranscription = item.audio_transcription && item.audio_transcription.trim();
        const hasDocumentAnalysis = item.document_analysis && item.document_analysis.trim();
        const isAnalyzableDocument = item.tipo === 'documento' && item.storage_path;
        
        return hasTranscription || hasDocumentAnalysis || isAnalyzableDocument;
      });

      setAvailableDocuments(analyzableItems);
      
      // Por defecto, seleccionar todos los documentos
      setSelectedDocuments(analyzableItems.map((item: any) => item.id));
      
    } catch (error: any) {
      console.error('Error loading project documents:', error);
      alert(`❌ Error cargando documentos: ${error.message || 'desconocido'}`);
    } finally {
      setLoadingDocuments(false);
    }
  }, [projectForDetails]);

  // Función modificada para mostrar el modal de selección
  const handleShowDocumentSelection = useCallback(() => {
    if (!projectForDetails) return;
    setShowDocumentSelectionModal(true);
    loadProjectDocuments();
  }, [projectForDetails, loadProjectDocuments]);

  // Función para extraer hallazgos de documentos seleccionados
  const handleBulkExtractCapturados = useCallback(async (selectedOnly: boolean = false) => {
    if (!projectForDetails || isExtractingCaptures) return;
    
    const idsToProcess = selectedOnly ? selectedDocuments : undefined;
    
    setIsExtractingCaptures(true);
    try {
      const { bulkExtractCapturados } = await import('../../services/capturados');
      
      const summary = await bulkExtractCapturados(projectForDetails.id, session?.access_token || '', idsToProcess);
      
      alert(`✅ Proceso completado. Nuevas tarjetas: ${summary.total_cards}`);
      setCapturedReloadKey(Date.now());
      setShowDocumentSelectionModal(false);
      
    } catch (error: any) {
      console.error('Error bulk extract:', error);
      alert(`❌ Error extrayendo hallazgos: ${error.message || 'desconocido'}`);
    } finally {
      setIsExtractingCaptures(false);
    }
  }, [projectForDetails, session, isExtractingCaptures, selectedDocuments]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FiDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.projects}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este es el espacio donde puedes crear campañas, investigaciones o cualquier proyecto relacionado. Cada proyecto se conectará y podrá contextualizarse con toda la aplicación a partir de su creación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          <div className="w-80 space-y-6">
            <ProjectActivityCard
              category="Project Metrics"
              title="Current Status"
              metrics={metrics}
              dailyGoals={goals}
              onAddGoal={() => console.log('Add goal')}
              onToggleGoal={handleToggleGoal}
              onViewDetails={() => setActiveTab('overview')}
              onCreateProject={handleCreateProject}
            />
          </div>

          <div className={cn("flex-1 min-w-0")}>
            <div className="mb-6">
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg w-fit border border-gray-200 dark:border-gray-700">
                {(['overview', 'projects'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      activeTab === tab
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    {t[tab]}
                  </button>
                ))}
                {projectForDetails && (
                  <button
                    onClick={() => setActiveTab('details')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      activeTab === 'details'
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    <FiEye className="w-4 h-4" />
                    {t.details}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectForDetails(null);
                        setActiveTab('projects');
                      }}
                      className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <FiBarChart className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{t.totalProjects}</h3>
                            <p className="text-2xl font-bold text-blue-600">{projects?.length || 0}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeProjects.length} {t.active}, {completedProjects.length} {t.completed}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                            <FiFileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{t.recentActivity}</h3>
                            <p className="text-2xl font-bold text-purple-600">{recentProjects.length}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t.projectsUpdatedRecently}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t.recentProjects}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentProjects.length > 0 ? recentProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                              onClick={() => handleViewProjectDetails(project)}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{project.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn("px-2 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                    {getStatusText(project.status)}
                                  </span>
                                  <span className={cn("text-xs font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                    {getPriorityText(project.priority)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(project.created_at), 'MMM dd')}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                  title={t.deleteTooltip}
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">{t.noProjectsYet}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{t.projects}</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t.searchProjects}
                          className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                      <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <FiFilter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(projects && projects.length > 0) ? (
                    <div className="grid gap-4">
                      {projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent 
                            className="p-6"
                            onClick={() => handleViewProjectDetails(project)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">{project.title}</h3>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.description}</p>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                    {getStatusText(project.status)}
                                  </span>
                                  <span className={cn("text-sm font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                    {getPriorityText(project.priority)}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                title={t.deleteTooltip}
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      )) || []}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">{t.noProjectsYet}</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {t.noProjectsDescription}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'decisions' && (
                <motion.div
                  key="decisions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {!selectedProject ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{t.selectProject}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t.selectProjectDescription}
                        </p>
                      </div>
                      
                      {(projects && projects.length > 0) ? (
                        <div className="grid gap-4">
                          {projects.map((project) => (
                            <Card 
                              key={project.id} 
                              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              onClick={() => handleSelectProjectForDecisions(project)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{project.description}</p>
                                    <div className="flex items-center gap-3">
                                      <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                        {getStatusText(project.status)}
                                      </span>
                                      <span className={cn("text-sm font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                        {getPriorityText(project.priority)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )) || []}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">{t.createProjectFirst}</h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Back to project selection"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                          <div>
                            <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Decisiones</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[selectedProject.status as keyof typeof statusColors])}>
                            {selectedProject.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <LatestDecisions projectId={selectedProject.id} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {!selectedProject ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Selecciona un Proyecto</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Elige un proyecto para ver sus capas de decisiones
                        </p>
                      </div>
                      
                      {(projects && projects.length > 0) ? (
                        <div className="grid gap-4">
                          {projects.map((project) => (
                            <Card 
                              key={project.id} 
                              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              onClick={() => setSelectedProject(project)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{project.description}</p>
                                    <div className="flex items-center gap-3">
                                      <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                        {getStatusText(project.status)}
                                      </span>
                                      <span className={cn("text-sm font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                        {getPriorityText(project.priority)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )) || []}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No hay proyectos aún</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Crea tu primer proyecto para ver las capas de decisiones
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedProject(null)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Volver a selección de proyectos"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                          <div>
                            <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Capas de decisiones</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[selectedProject.status as keyof typeof statusColors])}>
                            {selectedProject.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <DecisionChronology projectId={selectedProject.id} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'captured' && (
                <motion.div
                  key="captured"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {projectForDetails ? (
                    <>
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={handleShowDocumentSelection}
                          disabled={isExtractingCaptures}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50">
                          <FiDownload className="w-4 h-4" />
                          {isExtractingCaptures ? 'Extrayendo...' : 'Extraer hallazgos'}
                        </button>
                      </div>
                      <CapturedCards projectId={projectForDetails.id} reloadKey={capturedReloadKey} />
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Selecciona un proyecto para ver hallazgos capturados.
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'coverages' && (
                <motion.div
                  key="coverages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {projectForDetails ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coberturas del Proyecto</h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Gestiona las coberturas mediáticas y análisis de cobertura para este proyecto.
                          </p>
                        </div>
                        {/* Botón "Nueva Cobertura" removido según nueva lógica: las coberturas se generan automáticamente */}
                      </div>
                      
                      {/* Componente real de coberturas */}
                      <ProjectCoverages projectId={projectForDetails.id} />
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Selecciona un proyecto para ver las coberturas.
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'details' && projectForDetails && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Project Header */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{projectForDetails.title}</h2>
                          <p className="text-gray-500 dark:text-gray-400 mt-1">{projectForDetails.description}</p>
                        </div>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {isEditing ? <FiXCircle className="w-5 h-5 text-red-500" /> : <FiEdit className="w-5 h-5 text-gray-500" />}
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botones de guardar/cancelar cuando está editando */}
                  {isEditing && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <button
                        onClick={handleSaveProject}
                        disabled={!editingData.title.trim() || isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        disabled={isSaving}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Contenido principal del proyecto en una sola vista */}
                  <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FiFileText className="w-5 h-5" />
                            Información General
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Proyecto</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingData.title}
                                onChange={(e) => handleEditingChange('title', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ingresa el nombre del proyecto"
                                maxLength={100}
                              />
                            ) : (
                              <p className="text-lg font-semibold mt-1">{projectForDetails.title}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                            {isEditing ? (
                              <textarea
                                value={editingData.description}
                                onChange={(e) => handleEditingChange('description', e.target.value)}
                                rows={4}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                placeholder="Describe los objetivos y alcance del proyecto"
                                maxLength={500}
                              />
                            ) : (
                              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm leading-relaxed">
                                {projectForDetails.description || 'Sin descripción disponible'}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                              {isEditing ? (
                                <select
                                  value={editingData.status}
                                  onChange={(e) => handleEditingChange('status', e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="active">Activo</option>
                                  <option value="paused">Pausado</option>
                                  <option value="completed">Completado</option>
                                  <option value="archived">Archivado</option>
                                </select>
                              ) : (
                                <span className={cn("inline-block px-3 py-1 rounded-full text-sm font-medium mt-1", statusColors[projectForDetails.status as keyof typeof statusColors])}>
                                  {getStatusText(projectForDetails.status)}
                                </span>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label>
                              {isEditing ? (
                                <select
                                  value={editingData.priority}
                                  onChange={(e) => handleEditingChange('priority', e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="low">Baja</option>
                                  <option value="medium">Media</option>
                                  <option value="high">Alta</option>
                                  <option value="urgent">Urgente</option>
                                </select>
                              ) : (
                                <span className={cn("inline-block px-3 py-1 rounded-full text-sm font-medium mt-1", 
                                  projectForDetails.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  projectForDetails.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                  projectForDetails.priority === 'urgent' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                )}>
                                  {getPriorityText(projectForDetails.priority)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                              {isEditing ? (
                                <select
                                  value={editingData.category}
                                  onChange={(e) => handleEditingChange('category', e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Sin categoría</option>
                                  <option value="investigacion">Investigación</option>
                                  <option value="campana">Campaña</option>
                                  <option value="fiscalizacion">Fiscalización</option>
                                  <option value="auditoria">Auditoría</option>
                                  <option value="monitoreo">Monitoreo</option>
                                  <option value="marketing">Marketing</option>
                                </select>
                              ) : (
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{projectForDetails.category || 'Sin categoría'}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibilidad</label>
                              {isEditing ? (
                                <select
                                  value={editingData.visibility}
                                  onChange={(e) => handleEditingChange('visibility', e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="private">Privado</option>
                                  <option value="team">Equipo</option>
                                  <option value="public">Público</option>
                                </select>
                              ) : (
                                <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
                                  {getVisibilityText(projectForDetails.visibility)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Sección de Tags */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                            {isEditing ? (
                              <div className="mt-1 space-y-3">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Agregar tag..."
                                    maxLength={30}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddTag}
                                    disabled={!newTag.trim() || editingData.tags.includes(newTag.trim())}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <FiPlus className="w-4 h-4" />
                                  </button>
                                </div>
                                {editingData.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {editingData.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-xs font-medium"
                                      >
                                        {tag}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTag(tag)}
                                          className="hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-full p-0.5 transition-colors"
                                        >
                                          <FiX className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {projectForDetails.tags && projectForDetails.tags.length > 0 ? (
                                  projectForDetails.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-xs font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">Sin tags</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Métricas del Proyecto */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Estadísticas del Proyecto</label>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {projectDecisions.length}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Decisiones</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {projectTasks.filter(task => task.completed).length}/{projectTasks.length}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tareas</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  {projectAssets.length}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Activos</div>
                              </div>
                            </div>
                          </div>

                          {/* Progreso del Proyecto */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Progreso General</label>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <span>Tareas Completadas</span>
                                  <span>{projectTasks.length > 0 ? Math.round((projectTasks.filter(task => task.completed).length / projectTasks.length) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                    style={{ 
                                      width: `${projectTasks.length > 0 ? (projectTasks.filter(task => task.completed).length / projectTasks.length) * 100 : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <span>Tiempo Transcurrido</span>
                                  <span>
                                    {projectForDetails.start_date && projectForDetails.target_date ? 
                                      Math.round(((new Date().getTime() - new Date(projectForDetails.start_date).getTime()) / 
                                      (new Date(projectForDetails.target_date).getTime() - new Date(projectForDetails.start_date).getTime())) * 100) : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                    style={{ 
                                      width: `${projectForDetails.start_date && projectForDetails.target_date ? 
                                        Math.min(100, Math.max(0, ((new Date().getTime() - new Date(projectForDetails.start_date).getTime()) / 
                                        (new Date(projectForDetails.target_date).getTime() - new Date(projectForDetails.start_date).getTime())) * 100)) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sugerencias Inteligentes */}
                      <ProjectSuggestions 
                        project={projectForDetails} 
                        decisions={projectDecisions}
                      />

                      {/* Tareas del Proyecto */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiCheckSquare className="w-5 h-5" />
                              Tareas del Proyecto
                              {projectTasks.length > 0 && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                  {projectTasks.filter(task => task.completed).length}/{projectTasks.length}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setShowAddTask(true)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="Agregar nueva tarea"
                            >
                              <FiPlus className="w-4 h-4" />
                              Agregar
                            </button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Formulario para agregar nueva tarea */}
                            {showAddTask && (
                              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Descripción de la tarea..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleAddTask}
                                    disabled={!newTaskTitle.trim()}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowAddTask(false);
                                      setNewTaskTitle('');
                                    }}
                                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Lista de tareas */}
                            {projectTasks.length > 0 ? (
                              <div className="space-y-2">
                                {projectTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                                  >
                                    <button
                                      onClick={() => handleToggleTask(task.id)}
                                      className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                        task.completed
                                          ? "bg-green-600 border-green-600 text-white"
                                          : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                                      )}
                                    >
                                      {task.completed && <FiCheck className="w-3 h-3" />}
                                    </button>
                                    
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "text-sm",
                                        task.completed
                                          ? "text-gray-500 dark:text-gray-400 line-through"
                                          : "text-gray-900 dark:text-white"
                                      )}>
                                        {task.title}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {format(new Date(task.created_at), 'dd MMM yyyy')}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => handleExtractCapturados(task.id)}
                                      className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors text-orange-600 dark:text-orange-400"
                                      title="Extraer Capturados"
                                    >
                                      <FiAlertTriangle className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                      title="Eliminar tarea"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <FiCheckSquare className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  No hay tareas creadas
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                  Organiza el trabajo del proyecto con tareas específicas
                                </p>
                                <button
                                  onClick={() => setShowAddTask(true)}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Crear primera tarea
                                </button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Activos del Proyecto */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiDatabase className="w-5 h-5" />
                              Activos del Proyecto
                              {projectAssets.length > 0 && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                  {projectAssets.length}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setShowAddAssetsModal(true)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="Agregar activos desde el Codex"
                            >
                              <FiPlus className="w-4 h-4" />
                              Agregar
                            </button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {loadingAssets ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            ) : projectAssets.length > 0 ? (
                              <div className="space-y-3">
                                {projectAssets.map((asset) => (
                                  <div key={asset.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                          {getAssetTypeIcon(asset.tipo, asset.is_drive)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {asset.titulo}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {new Date(asset.fecha).toLocaleDateString()}
                                            </p>
                                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full capitalize">
                                              {asset.tipo}
                                            </span>
                                            {asset.is_drive && (
                                              <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                Drive
                                              </span>
                                            )}
                                          </div>
                                          {asset.descripcion && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                              {asset.descripcion}
                                            </p>
                                          )}
                                          {asset.etiquetas && asset.etiquetas.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                              {asset.etiquetas.slice(0, 3).map((tag: string, idx: number) => (
                                                <span key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                  {tag}
                                                </span>
                                              ))}
                                              {asset.etiquetas.length > 3 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  +{asset.etiquetas.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 ml-3">
                                        {asset.url && (
                                          <a
                                            href={asset.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            title="Ver archivo"
                                          >
                                            <FiEye className="w-4 h-4" />
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleExtractCapturados(asset.id)}
                                          className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors text-orange-600 dark:text-orange-400"
                                          title="Extraer Capturados"
                                        >
                                          <FiAlertTriangle className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveAsset(asset.id)}
                                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                          title="Remover del proyecto"
                                        >
                                          <FiX className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <FiDatabase className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  No hay activos agregados
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                  Conecta documentos, audios, videos y enlaces desde tu Codex
                                </p>
                                <button
                                  onClick={() => setShowAddAssetsModal(true)}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Agregar primer activo
                                </button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Panel lateral con información adicional */}
          {projectForDetails && (
          <div className="w-80 space-y-4 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FiCalendar className="w-4 h-4" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Creado</label>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      {format(new Date(projectForDetails.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Actualizado</label>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      {format(new Date(projectForDetails.updated_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editingData.start_date}
                          onChange={(e) => handleEditingChange('start_date', e.target.value)}
                          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {projectForDetails.start_date ? 
                            format(new Date(projectForDetails.start_date), 'dd MMM yyyy') : 
                            'No definida'
                          }
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Fecha Objetivo</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editingData.target_date}
                          onChange={(e) => handleEditingChange('target_date', e.target.value)}
                          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {projectForDetails.target_date ? 
                            format(new Date(projectForDetails.target_date), 'dd MMM yyyy') : 
                            'No definida'
                          }
                        </p>
                      )}
                    </div>

                    {(projectForDetails.completed_date || isEditing) && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Completado</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editingData.completed_date}
                            onChange={(e) => handleEditingChange('completed_date', e.target.value)}
                            className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {projectForDetails.completed_date ? 
                              format(new Date(projectForDetails.completed_date), 'dd MMM yyyy') : 
                              'No completado'
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">ID del Proyecto</label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                      {projectForDetails.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Opciones del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleSelectProjectForDecisions(projectForDetails);
                      setActiveTab('decisions');
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                      activeTab === 'decisions'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <FiBarChart className="w-4 h-4" />
                    Decisiones
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProject(projectForDetails);
                      setActiveTab('timeline');
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                      activeTab === 'timeline'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <FiLayers className="w-4 h-4" />
                    Capas
                  </button>

                  <button
                    onClick={() => setActiveTab('captured')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                      activeTab === 'captured'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <FiFileText className="w-4 h-4" />
                    Capturado
                  </button>

                  <button
                    onClick={() => setActiveTab('coverages')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                      activeTab === 'coverages'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <FiTarget className="w-4 h-4" />
                    Coberturas
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                    <button
                      onClick={() => onCreateDecision?.(projectForDetails.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Nueva Decisión
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <FiTrash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eliminar Proyecto
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteProject}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar activos */}
      {projectForDetails && (
        <AddAssetsModal
          open={showAddAssetsModal}
          onClose={() => setShowAddAssetsModal(false)}
          projectId={projectForDetails.id}
          projectTitle={projectForDetails.title}
          onAssetsAdded={handleAssetsAdded}
        />
      )}

      {/* Modal de selección de documentos */}
      {showDocumentSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Seleccionar Documentos para Analizar
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Elige qué documentos quieres procesar para extraer hallazgos
                  </p>
                </div>
                <button
                  onClick={() => setShowDocumentSelectionModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando documentos...</span>
                </div>
              ) : availableDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay documentos analizables
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Este proyecto no tiene documentos con transcripciones, análisis previos o archivos analizables.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Botones de selección rápida */}
                  <div className="flex gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <button
                      onClick={() => setSelectedDocuments(availableDocuments.map((item: any) => item.id))}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      onClick={() => setSelectedDocuments([])}
                      className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Deseleccionar todos
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto self-center">
                      {selectedDocuments.length} de {availableDocuments.length} seleccionados
                    </span>
                  </div>

                  {/* Lista de documentos */}
                  {availableDocuments.map((item: any) => {
                    const isSelected = selectedDocuments.includes(item.id);
                    const hasTranscription = item.audio_transcription && item.audio_transcription.trim();
                    const hasDocumentAnalysis = item.document_analysis && item.document_analysis.trim();
                    const isAnalyzableDocument = item.tipo === 'documento' && item.storage_path;
                    
                    let statusText = '';
                    let statusColor = '';
                    
                    if (hasTranscription) {
                      statusText = 'Con transcripción';
                      statusColor = 'text-green-600 bg-green-50';
                    } else if (hasDocumentAnalysis) {
                      statusText = 'Con análisis';
                      statusColor = 'text-blue-600 bg-blue-50';
                    } else if (isAnalyzableDocument) {
                      statusText = 'Pendiente análisis';
                      statusColor = 'text-orange-600 bg-orange-50';
                    }

                    return (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDocuments(prev => prev.filter(id => id !== item.id));
                          } else {
                            setSelectedDocuments(prev => [...prev, item.id]);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isSelected ? (
                              <FiCheckSquare className="w-5 h-5 text-orange-600" />
                            ) : (
                              <FiSquare className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.titulo}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {item.nombre_archivo || 'Sin archivo'} • {item.tipo}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDocuments.length > 0 
                    ? `${selectedDocuments.length} documento(s) seleccionado(s)`
                    : 'Selecciona al menos un documento'
                  }
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDocumentSelectionModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={() => handleBulkExtractCapturados(true)}
                    disabled={selectedDocuments.length === 0 || isExtractingCaptures}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isExtractingCaptures ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Extrayendo...
                      </>
                    ) : (
                      <>
                        <FiDownload className="w-4 h-4" />
                        Extraer Hallazgos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 