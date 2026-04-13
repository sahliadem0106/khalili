import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, id }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-brand-surface/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-soft p-5 ${className}`}
    >
      {children}
    </div>
  );
};