import React, { useState } from 'react';
import { ProjectDashboard } from '../components/ui/ProjectDashboard';
import { useProjects, useProjectDecisions } from '../hooks';
import { CreateProjectData, CreateProjectDecisionData } from '../types/projects';

export function ProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { createProject } = useProjects();
  const { createDecision } = useProjectDecisions(selectedProjectId || '');

  const handleCreateProject = async () => {
    try {
      const newProjectData: CreateProjectData = {
        title: 'New Investigation Project',
        description: 'A new project for strategic investigation and decision tracking',
        category: 'investigation',
        priority: 'medium',
        status: 'active',
        tags: ['trending', 'investigation']
      };

      const project = await createProject(newProjectData);
      console.log('✅ Project created:', project);
      
      // Optionally select the new project
      setSelectedProjectId(project.id);
    } catch (error) {
      console.error('❌ Error creating project:', error);
    }
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
        decision_type: 'strategic',
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

  return (
    <div className="min-h-screen">
      <ProjectDashboard
        onCreateProject={handleCreateProject}
        onCreateDecision={handleCreateDecision}
        onSelectProject={handleSelectProject}
        onSelectDecision={handleSelectDecision}
      />
    </div>
  );
} 