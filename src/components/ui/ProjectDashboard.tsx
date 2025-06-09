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
  FiX
} from 'react-icons/fi';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ProjectActivityCard } from './ProjectActivityCard';
import { DecisionTimeline } from './DecisionTimeline';
import { cn } from '../../lib/utils';
import { 
  useProjects, 
  useRecentProjects,
  useProjectsStats 
} from '../../hooks';
import { Project } from '../../types/projects';

// ===================================================================
// INTERFACES
// ===================================================================

interface ProjectDashboardProps {
  onCreateProject?: () => void;
  onCreateDecision?: (projectId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onSelectDecision?: (decisionId: string) => void;
  onDeleteProject?: (projectId: string) => void;
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
// MAIN COMPONENT
// ===================================================================

export function ProjectDashboard({
  onCreateProject,
  onCreateDecision,
  onSelectProject,
  onSelectDecision,
  onDeleteProject,
}: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'decisions' | 'timeline'>('overview');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Hooks para datos
  const { projects, loading: projectsLoading } = useProjects();
  const { recentProjects } = useRecentProjects(5);

  // Estados locales
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Review trending topics for new projects", isCompleted: false },
    { id: "2", title: "Update project contexts", isCompleted: false },
    { id: "3", title: "Process pending decisions", isCompleted: true },
  ]);

  // Métricas calculadas
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const pausedProjects = projects.filter(p => p.status === 'paused');
  
  const metrics: Metric[] = [
    { 
      label: "Active", 
      value: activeProjects.length.toString(), 
      trend: activeProjects.length > 0 ? Math.min(85, activeProjects.length * 20) : 0 
    },
    { 
      label: "Paused", 
      value: pausedProjects.length.toString(), 
      trend: pausedProjects.length > 0 ? Math.min(70, pausedProjects.length * 15) : 0 
    },
    { 
      label: "Completed", 
      value: completedProjects.length.toString(), 
      trend: completedProjects.length > 0 ? Math.min(100, completedProjects.length * 25) : 0 
    },
  ];

  // Handlers
  const handleToggleGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
    ));
  }, []);

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

  const handleSelectProjectForDecisions = useCallback((project: Project) => {
    setSelectedProject(project);
    onSelectProject?.(project.id);
  }, [onSelectProject]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FiDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
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
          {/* Sidebar */}
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

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg w-fit border border-gray-200 dark:border-gray-700">
                {(['overview', 'projects', 'decisions', 'timeline'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                      activeTab === tab
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    {tab}
                  </button>
                ))}
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
                            <h3 className="font-semibold">Total Projects</h3>
                            <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeProjects.length} active, {completedProjects.length} completed
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
                            <h3 className="font-semibold">Recent Activity</h3>
                            <p className="text-2xl font-bold text-purple-600">{recentProjects.length}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Projects updated recently
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentProjects.length > 0 ? recentProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                              onClick={() => onSelectProject?.(project.id)}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{project.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn("px-2 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                    {project.status}
                                  </span>
                                  <span className={cn("text-xs", priorityColors[project.priority as keyof typeof priorityColors])}>
                                    {project.priority} Priority
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
                                  title="Eliminar proyecto"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No projects yet</p>
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
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                      <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <FiFilter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {projects.length > 0 ? (
                    <div className="grid gap-4">
                      {projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{project.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.description}</p>
                                <div className="flex items-center gap-3 mb-3">
                                  <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[project.status as keyof typeof statusColors])}>
                                    {project.status}
                                  </span>
                                  <span className={cn("text-sm font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                    {project.priority} Priority
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <FiClock className="w-4 h-4" />
                                    Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FiFileText className="w-4 h-4" />
                                    {project.category}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                title="Eliminar proyecto"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {project.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Start by creating your first project to track decisions and context
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
                        <h2 className="text-xl font-semibold">Select a Project</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Choose a project to view its decision timeline
                        </p>
                      </div>
                      
                      {projects.length > 0 ? (
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
                                        {project.status}
                                      </span>
                                      <span className={cn("text-sm font-medium", priorityColors[project.priority as keyof typeof priorityColors])}>
                                        {project.priority} Priority
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FiDatabase className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Create a project first to start tracking decisions
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
                            title="Back to project selection"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                          <div>
                            <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Decision Timeline</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-3 py-1 rounded-full text-xs border", statusColors[selectedProject.status as keyof typeof statusColors])}>
                            {selectedProject.status}
                          </span>
                        </div>
                      </div>
                      
                      <DecisionTimeline projectId={selectedProject.id} />
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
                  <div className="text-center py-12">
                    <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Project Timeline</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Interactive timeline view coming soon
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
    </div>
  );
} 