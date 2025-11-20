import React from 'react';
import { MapPin } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="flex justify-between items-start pt-2 pb-4">
      <div>
        <div className="flex items-center space-x-1.5 text-brand-forest font-medium mb-0.5">
          <MapPin size={16} className="fill-current opacity-20" />
          <span className="text-sm tracking-tight">{user.location}</span>
        </div>
        <p className="text-xs text-neutral-muted font-medium">{user.hijriDate}</p>
      </div>
      <div className="relative">
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
        />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
    </header>
  );
};