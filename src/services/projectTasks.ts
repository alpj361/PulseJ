import { Project, TasksResponse, ProjectTask } from '../types/projects';
import { updateProject } from './projects';

/**
 * Guarda las tareas en la base de datos
 */
export async function saveTasksToDatabase(projectId: string, tasks: TasksResponse): Promise<void> {
  try {
    console.log('💾 Guardando tareas en base de datos para proyecto:', projectId);
    
    await updateProject(projectId, {
      tasks: tasks
    });
    
    console.log('✅ Tareas guardadas exitosamente en la base de datos');
  } catch (error) {
    console.error('❌ Error guardando tareas en base de datos:', error);
    throw error;
  }
}

/**
 * Obtiene tareas desde la base de datos del proyecto
 */
export function getTasksFromDatabase(project: Project): TasksResponse | null {
  try {
    console.log('🔍 [getTasksFromDatabase] Verificando proyecto:', {
      id: project.id,
      title: project.title,
      hasTasks: !!project.tasks,
      tasksType: typeof project.tasks,
      tasksValue: project.tasks
    });

    if (project.tasks && project.tasks.tasks && project.tasks.tasks.length > 0) {
      console.log('✅ [getTasksFromDatabase] Usando tareas desde base de datos');
      return project.tasks;
    } else {
      console.log('❌ [getTasksFromDatabase] No hay tareas en el proyecto');
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ [getTasksFromDatabase] Error:', error);
    return null;
  }
}

/**
 * Crea una nueva tarea
 */
export function createNewTask(title: string, projectId: string): ProjectTask {
  return {
    id: Date.now().toString(),
    title: title.trim(),
    completed: false,
    created_at: new Date().toISOString(),
    project_id: projectId
  };
}

/**
 * Actualiza una tarea existente
 */
export function updateTask(tasks: ProjectTask[], taskId: string, updates: Partial<ProjectTask>): ProjectTask[] {
  return tasks.map(task => 
    task.id === taskId ? { ...task, ...updates } : task
  );
}

/**
 * Elimina una tarea
 */
export function deleteTask(tasks: ProjectTask[], taskId: string): ProjectTask[] {
  return tasks.filter(task => task.id !== taskId);
}

/**
 * Genera tareas de ejemplo para un proyecto
 */
export function generateExampleTasks(projectId: string): TasksResponse {
  const exampleTasks: ProjectTask[] = [
    {
      id: '1',
      title: 'Definir objetivos del proyecto',
      completed: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      project_id: projectId
    },
    {
      id: '2',
      title: 'Recopilar documentación inicial',
      completed: true,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      project_id: projectId
    },
    {
      id: '3',
      title: 'Revisar decisiones estratégicas',
      completed: false,
      created_at: new Date().toISOString(),
      project_id: projectId
    },
    {
      id: '4',
      title: 'Preparar presentación de resultados',
      completed: false,
      created_at: new Date().toISOString(),
      project_id: projectId
    }
  ];

  return {
    tasks: exampleTasks,
    updatedAt: new Date().toISOString()
  };
} 