
import React from 'react';
import { Card } from './ui/Card';
import { PlayCircle, Clock, BookOpen } from 'lucide-react';
import { Lecture } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const LECTURES: Lecture[] = [
  {
    id: '1',
    title: 'Understanding Surah Al-Fatiha',
    author: 'Ustadh Nouman Ali Khan',
    duration: '45 min',
    category: 'Quran',
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Fiqh of Purification (Wudu)',
    author: 'Sheikh Omar Suleiman',
    duration: '30 min',
    category: 'Fiqh',
    image: 'https://images.unsplash.com/photo-1576098587405-d7868d5d09c8?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Prophetic Habits for Success',
    author: 'Mufti Menk',
    duration: '15 min',
    category: 'General',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '4',
    title: 'History of Mecca',
    author: 'Dr. Yasir Qadhi',
    duration: '60 min',
    category: 'History',
    image: 'https://images.unsplash.com/photo-1565552629483-601eb57f9488?q=80&w=600&auto=format&fit=crop'
  }
];

export const LecturesPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-2xl font-bold text-neutral-primary">{t('knowledge')}</h2>
         <div className="bg-white px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-neutral-line">
            {t('allCategories')}
         </div>
      </div>

      {/* Featured Card */}
      <div id="lectures-featured" className="relative rounded-2xl overflow-hidden h-48 shadow-card group cursor-pointer">
         <img 
           src="https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=800&auto=format&fit=crop" 
           alt="Featured" 
           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
            <span className="bg-brand-forest text-white text-xs px-2 py-1 rounded-md self-start mb-2">{t('featuredSeries')}</span>
            <h3 className="text-white font-bold text-xl mb-1">Tafseer of Juz Amma</h3>
            <p className="text-white/80 text-sm flex items-center">
               <PlayCircle size={14} className="me-1.5" /> 12 Episodes
            </p>
         </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 gap-4">
        {LECTURES.map((lecture, index) => (
          <Card 
            key={lecture.id} 
            id={index === 0 ? "lecture-card-first" : undefined}
            className="p-0 overflow-hidden flex h-28 cursor-pointer active:scale-[0.99] transition-transform"
          >
             <div className="w-28 h-full relative">
                <img src={lecture.image} alt={lecture.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                   <div className="bg-white/30 backdrop-blur-sm p-1.5 rounded-full">
                      <PlayCircle size={20} className="text-white fill-white/20" />
                   </div>
                </div>
             </div>
             <div className="flex-1 p-3 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                   <span className="text-[10px] font-bold text-brand-forest bg-brand-mint px-1.5 py-0.5 rounded uppercase tracking-wider">{lecture.category}</span>
                </div>
                <h4 className="font-bold text-neutral-primary text-sm mb-1 line-clamp-2">{lecture.title}</h4>
                <p className="text-xs text-neutral-muted mb-2">{lecture.author}</p>
                <div className="flex items-center text-[10px] text-neutral-400 mt-auto">
                   <Clock size={10} className="me-1" /> {lecture.duration}
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
