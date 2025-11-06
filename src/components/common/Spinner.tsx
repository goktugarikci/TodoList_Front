import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label = 'Yükleniyor...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  // Renk 'border-blue-600' -> 'border-amber-400' (Sarı)
  const colorClasses = 'border-amber-400 border-t-transparent';

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses} ${className}`}
      role="status"
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;