import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  size = 'md',
  className = '',
  children 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
}; 