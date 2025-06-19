import React, { useState } from 'react';
import { ProjectDashboard } from '../components/ui/ProjectDashboard';
import { CreateProjectModal } from '../components/ui/CreateProjectModal';
import { useProjects, useProjectDecisions } from '../hooks';
import { CreateProjectData, CreateProjectDecisionData } from '../types/projects';

export default function Projects() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { projects, loading: projectsLoading, createProject, deleteProject, updateProject, refreshProjects } = useProjects();
  const { createDecision } = useProjectDecisions(selectedProjectId || '');

  const handleCreateProject = async (projectData: CreateProjectData) => {
    try {
      setIsCreating(true);
      console.log('🚀 Creating project with data:', projectData);
      
      const project = await createProject(projectData);
      console.log('✅ Project created successfully:', project);
      
      // Optionally select the new project
      setSelectedProjectId(project.id);
      
      // Close the modal
      setIsCreateModalOpen(false);
      
      // Show success message
      alert(`✅ Project "${project.title}" created successfully!`);
    } catch (error) {
      console.error('❌ Error creating project:', error);
      alert(`❌ Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateDecision = async (projectId: string) => {
    if (!projectId) {
      console.warn('No project selected for decision creation');
      return;
    }

    try {
      const newDecisionData: CreateProjectDecisionData = {
        title: 'Strategic Decision from Trending Context',
        description: 'A decision based on current trending topics and project context',
        decision_type: 'enfoque',
        rationale: 'Based on trending analysis and project objectives',
        risks_identified: ['Implementation complexity', 'Resource constraints'],
        urgency: 'medium',
        tags: ['trending', 'strategic'],
        success_metrics: {
          'implementation_success': {
            target: 100,
            actual: 0,
            unit: 'percentage',
            description: 'Implementation Success Rate'
          }
        }
  };

      const decision = await createDecision(newDecisionData);
      console.log('✅ Decision created:', decision);
    } catch (error) {
      console.error('❌ Error creating decision:', error);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    console.log('📋 Selected project:', projectId);
  };

  const handleSelectDecision = (decisionId: string) => {
    console.log('⚖️ Selected decision:', decisionId);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      console.log('✅ Project deleted successfully');
      
      // If the deleted project was selected, clear selection
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert(`❌ Error deleting project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen">
      <ProjectDashboard
        onCreateProject={handleOpenCreateModal}
        onCreateDecision={handleCreateDecision}
        onSelectProject={handleSelectProject}
        onSelectDecision={handleSelectDecision}
        onDeleteProject={handleDeleteProject}
        projects={projects}
        projectsLoading={projectsLoading}
        refreshProjects={refreshProjects}
        updateProject={updateProject}
      />
      
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={isCreating}
      />
    </div>
  );
} 