
import React from 'react';
import { Home, BookOpen, BarChart2, User, Users } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'lectures', label: 'Lectures', icon: BookOpen },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'profile', label: 'Profile', icon: User },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-line shadow-nav pb-safe-area z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center w-16 py-1
              transition-colors duration-200 cursor-pointer
              ${activeTab === item.id ? 'text-brand-forest' : 'text-neutral-400 hover:text-neutral-600'}
            `}
          >
            <item.icon 
              size={24} 
              strokeWidth={activeTab === item.id ? 2.5 : 2} 
              className={activeTab === item.id ? 'mb-1' : 'mb-1'}
            />
            <span className={`text-[10px] font-medium ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {/* Safe Area Spacer for iOS home indicator */}
      <div className="h-5 w-full bg-white"></div>
    </div>
  );
};
