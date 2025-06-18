import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const translations = {
  es: {
    // Tabs principales
    overview: 'Resumen',
    projects: 'Proyectos',
    decisions: 'Decisiones',
    timeline: 'Capas',
    details: 'Detalles',
    info: 'Información',
    
    // Acciones
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    create: 'Crear',
    view: 'Ver',
    add: 'Agregar',
    
    // Estados de prioridad
    lowPriority: 'Baja',
    mediumPriority: 'Media',
    highPriority: 'Alta',
    urgentPriority: 'Urgente',
    
    // Estados de proyecto
    activeStatus: 'Activo',
    pausedStatus: 'Pausado',
    completedStatus: 'Completado',
    archivedStatus: 'Archivado',
    
    // Visibilidad
    privateVisibility: 'Privado',
    teamVisibility: 'Equipo',
    publicVisibility: 'Público',
    
    // Campos
    projectName: 'Nombre del Proyecto',
    description: 'Descripción',
    state: 'Estado',
    priority: 'Prioridad',
    category: 'Categoría',
    tags: 'Tags',
    
    // Fechas
    creationDate: 'Fecha de Creación',
    lastUpdate: 'Última Actualización',
    startDate: 'Fecha de Inicio',
    targetDate: 'Fecha Objetivo',
    completedDate: 'Fecha de Completado',
    
    // Secciones
    generalInfo: 'Información General',
    projectObjectives: 'Objetivos del Proyecto',
    importantDates: 'Fechas Importantes',
    configuration: 'Configuración',
    quickActions: 'Acciones Rápidas',
    assets: 'Assets',
    insights: 'Insights',
    
    // Mensajes
    noDescription: 'Sin descripción disponible',
    noCategory: 'Sin categoría',
    notDefined: 'No definida',
    notCompleted: 'No completado',
    editMode: 'Modo edición',
    saving: 'Guardando...',
    
    // Placeholders
    enterProjectName: 'Ingresa el nombre del proyecto',
    describeObjectives: 'Describe los objetivos y alcance del proyecto',
    searchProjects: 'Buscar proyectos...',
    
    // Tooltips
    deleteTooltip: 'Eliminar proyecto',
    viewDetailsTooltip: 'Ver detalles',
    created: 'Creado',
    
    // Botones principales
    createProject: 'Crear Proyecto',
    viewProjectDetails: 'Ver Detalles del Proyecto',
    newDecision: 'Nueva Decisión',
    viewDecisions: 'Ver Decisiones',
    
    // Estados de la aplicación
    noProjectsYet: 'Aún no hay proyectos',
    noProjectsDescription: 'Comienza creando tu primer proyecto para rastrear decisiones y contexto',
    createProjectFirst: 'Crea un proyecto primero para comenzar a rastrear decisiones',
    selectProject: 'Seleccionar un Proyecto',
    selectProjectDescription: 'Elige un proyecto para ver su cronología de decisiones',
    
    // Confirmaciones
    deleteProject: 'Eliminar Proyecto',
    deleteConfirmation: '¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.',
    
    // Assets e Insights
    assetsDescription: 'En esta pestaña podrás agregar todos tus activos a partir del codex u otros trabajos.',
    insightsDescription: 'Próximamente la IA podrá darte insights de tu proyecto, así como sugerencias.',
    comingSoon: 'Próximamente disponible',
    inDevelopment: 'En desarrollo',
    
    // Dashboard Overview
    totalProjects: 'Total de Proyectos',
    recentActivity: 'Actividad Reciente',
    projectsUpdatedRecently: 'Proyectos actualizados recientemente',
    recentProjects: 'Proyectos Recientes',
    active: 'activos',
    completed: 'completados'
  },
  en: {
    // Main tabs
    overview: 'Overview',
    projects: 'Projects',
    decisions: 'Decisions',
    timeline: 'Layers',
    details: 'Details',
    info: 'Information',
    
    // Actions
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    create: 'Create',
    view: 'View',
    add: 'Add',
    
    // Priority states
    lowPriority: 'Low',
    mediumPriority: 'Medium',
    highPriority: 'High',
    urgentPriority: 'Urgent',
    
    // Project states
    activeStatus: 'Active',
    pausedStatus: 'Paused',
    completedStatus: 'Completed',
    archivedStatus: 'Archived',
    
    // Visibility
    privateVisibility: 'Private',
    teamVisibility: 'Team',
    publicVisibility: 'Public',
    
    // Fields
    projectName: 'Project Name',
    description: 'Description',
    state: 'State',
    priority: 'Priority',
    category: 'Category',
    tags: 'Tags',
    
    // Dates
    creationDate: 'Creation Date',
    lastUpdate: 'Last Update',
    startDate: 'Start Date',
    targetDate: 'Target Date',
    completedDate: 'Completed Date',
    
    // Sections
    generalInfo: 'General Information',
    projectObjectives: 'Project Objectives',
    importantDates: 'Important Dates',
    configuration: 'Configuration',
    quickActions: 'Quick Actions',
    assets: 'Assets',
    insights: 'Insights',
    
    // Messages
    noDescription: 'No description available',
    noCategory: 'No category',
    notDefined: 'Not defined',
    notCompleted: 'Not completed',
    editMode: 'Edit mode',
    saving: 'Saving...',
    
    // Placeholders
    enterProjectName: 'Enter project name',
    describeObjectives: 'Describe the objectives and scope of the project',
    searchProjects: 'Search projects...',
    
    // Tooltips
    deleteTooltip: 'Delete project',
    viewDetailsTooltip: 'View details',
    created: 'Created',
    
    // Main buttons
    createProject: 'Create Project',
    viewProjectDetails: 'View Project Details',
    newDecision: 'New Decision',
    viewDecisions: 'View Decisions',
    
    // Application states
    noProjectsYet: 'No projects yet',
    noProjectsDescription: 'Start by creating your first project to track decisions and context',
    createProjectFirst: 'Create a project first to start tracking decisions',
    selectProject: 'Select a Project',
    selectProjectDescription: 'Choose a project to view its decision timeline',
    
    // Confirmations
    deleteProject: 'Delete Project',
    deleteConfirmation: 'Are you sure you want to delete this project? This action cannot be undone.',
    
    // Assets and Insights
    assetsDescription: 'In this tab you will be able to add all your assets from the codex or other work.',
    insightsDescription: 'Soon AI will be able to give you insights about your project, as well as suggestions.',
    comingSoon: 'Coming Soon',
    inDevelopment: 'In Development',
    
    // Dashboard Overview
    totalProjects: 'Total Projects',
    recentActivity: 'Recent Activity',
    projectsUpdatedRecently: 'Projects updated recently',
    recentProjects: 'Recent Projects',
    active: 'active',
    completed: 'completed'
  }
};

export const useTranslations = () => {
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return t.lowPriority;
      case 'medium': return t.mediumPriority;
      case 'high': return t.highPriority;
      case 'urgent': return t.urgentPriority;
      default: return priority;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t.activeStatus;
      case 'paused': return t.pausedStatus;
      case 'completed': return t.completedStatus;
      case 'archived': return t.archivedStatus;
      default: return status;
    }
  };
  
  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'private': return t.privateVisibility;
      case 'team': return t.teamVisibility;
      case 'public': return t.publicVisibility;
      default: return visibility;
    }
  };
  
  return {
    t,
    language,
    getPriorityText,
    getStatusText,
    getVisibilityText
  };
}; 