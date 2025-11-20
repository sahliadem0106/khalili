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
      className={`bg-neutral-card rounded-2xl shadow-card p-5 ${className}`}
    >
      {children}
    </div>
  );
};