import React, { useState } from 'react';
import { 
  FiPlus, 
  FiActivity, 
  FiArrowUpRight, 
  FiTarget, 
  FiCheckCircle 
} from 'react-icons/fi';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';

// ===================================================================
// INTERFACES
// ===================================================================

interface Metric {
  label: string;
  value: string;
  trend: number;
  unit?: string;
}

interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface ProjectActivityCardProps {
  category?: string;
  title?: string;
  metrics?: Metric[];
  dailyGoals?: Goal[];
  onAddGoal?: () => void;
  onToggleGoal?: (goalId: string) => void;
  onViewDetails?: () => void;
  onCreateProject?: () => void;
  className?: string;
}

// ===================================================================
// CONSTANTS
// ===================================================================

const METRIC_COLORS = {
  Active: "#FF2D55",
  Pending: "#F59E0B", 
  Completed: "#22C55E",
  Critical: "#EF4444",
} as const;

// ===================================================================
// COMPONENT
// ===================================================================

export function ProjectActivityCard({
  category = "Project Activity",
  title = "Current Progress",
  metrics = [],
  dailyGoals = [],
  onAddGoal,
  onToggleGoal,
  onViewDetails,
  onCreateProject,
  className
}: ProjectActivityCardProps) {
  const [isHovering, setIsHovering] = useState<string | null>(null);

  const handleGoalToggle = (goalId: string) => {
    onToggleGoal?.(goalId);
  };

  return (
    <Card
      className={cn(
        "relative h-full",
        "bg-white dark:bg-gray-950",
        "border border-gray-200 dark:border-gray-800",
        "hover:border-gray-300 dark:hover:border-gray-700",
        "transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <FiActivity className="w-5 h-5 text-[#FF2D55]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {category}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setIsHovering(metric.label)}
              onMouseLeave={() => setIsHovering(null)}
            >
              {/* Circular Progress */}
              <div className="relative w-20 h-20">
                {/* Background circle */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                
                {/* Progress circle */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 transition-all duration-500",
                    isHovering === metric.label && "scale-105"
                  )}
                  style={{
                    borderColor: METRIC_COLORS[metric.label as keyof typeof METRIC_COLORS] || "#6B7280",
                    transform: `rotate(-90deg)`,
                    strokeDasharray: `${metric.trend * 3.14}, 314`,
                    borderRadius: '50%',
                    clipPath: `polygon(0 0, 100% 0, 100% ${metric.trend}%, 0 ${metric.trend}%)`,
                  }}
                />
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {metric.unit}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {metric.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {metric.trend}%
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-6" />

        {/* Quick Actions Section */}
                  <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onAddGoal}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-6 space-y-3">
          <button
            onClick={onCreateProject}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Create Project
          </button>
          
          <button
            onClick={onViewDetails}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium
              text-gray-600 hover:text-gray-900 
              dark:text-gray-400 dark:hover:text-white
              transition-colors duration-200 py-2"
          >
            View Project Details
            <FiArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </CardContent>
    </Card>
  );
} 