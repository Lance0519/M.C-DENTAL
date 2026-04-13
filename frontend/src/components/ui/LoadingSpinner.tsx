import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
}

export function LoadingSpinner({ className = '', size = 'md', message = 'Loading data...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
    xl: 'w-20 h-20 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full border-gray-200 dark:border-gray-700 border-t-gold-500 animate-spin`}
      />
      {message && (
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
