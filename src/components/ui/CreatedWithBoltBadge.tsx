import React from 'react';
import { Zap } from 'lucide-react';

interface CreatedWithBoltBadgeProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const CreatedWithBoltBadge: React.FC<CreatedWithBoltBadgeProps> = ({
  className = '',
  position = 'bottom-right'
}) => {
  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${positionClasses[position]} z-50 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-all hover:bg-black/70 hover:scale-105 ${className}`}
    >
      <Zap className="h-3.5 w-3.5 text-yellow-300" />
      <span>Created with Bolt</span>
    </a>
  );
};

export default CreatedWithBoltBadge;