
import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Share2, Copy, Bookmark, Heart, ChevronRight } from 'lucide-react';
import { DUA_DATA } from '../duas';
import { Dua } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

// --- HELPER: Gradient Generator ---
// Deterministically assigns a gradient based on the category name length/char codes
const getCategoryGradient = (category: string) => {
  const gradients = [
    'from-orange-400 to-rose-500',      // Morning/Warm
    'from-blue-500 to-indigo-600',      // Evening/Cool
    'from-emerald-400 to-teal-600',     // Nature/General
    'from-violet-500 to-purple-600',    // Spiritual
    'from-amber-400 to-orange-500',     // Warning/Protection
    'from-pink-500 to-rose-500',        // Family
    'from-cyan-400 to-blue-500',        // Water/Wudu
    'from-slate-500 to-slate-700',      // Sadness/Death
  ];
  
  // Simple hash to pick a gradient
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const getCategoryIcon = (category: string) => {
   const lower = category.toLowerCase();
   if (lower.includes('morning') || lower.includes('waking')) return '☀️';
   if (lower.includes('evening') || lower.includes('sleeping') || lower.includes('night')) return '🌙';
   if (lower.includes('prayer') || lower.includes('mosque') || lower.includes('wudu')) return '🕌';
   if (lower.includes('food') || lower.includes('meal') || lower.includes('fast')) return '🥘';
   if (lower.includes('travel')) return '✈️';
   if (lower.includes('protection') || lower.includes('distress')) return '🛡️';
   if (lower.includes('hajj') || lower.includes('umrah')) return '🕋';
   if (lower.includes('forgiveness')) return '🤲';
   return '✨';
}

interface DuaPageProps {
  onBack?: () => void; // Optional if we want to go back to home
}

export const DuaPage: React.FC<DuaPageProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(DUA_DATA.map(d => d.category));
    return Array.from(cats).sort();
  }, []);

  // Filter logic
  const filteredDuas = useMemo(() => {
    if (!searchQuery) {
      if (activeCategory) {
        return DUA_DATA.filter(d => d.category === activeCategory);
      }
      return [];
    }
    const lowerQuery = searchQuery.toLowerCase();
    return DUA_DATA.filter(d => 
      d.category.toLowerCase().includes(lowerQuery) ||
      d.translation.toLowerCase().includes(lowerQuery) ||
      d.title.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, activeCategory]);

  const isSearching = searchQuery.length > 0;

  // --- HANDLERS ---

  const toggleBookmark = (duaTitle: string) => {
    const newSet = new Set(bookmarkedIds);
    if (newSet.has(duaTitle)) {
      newSet.delete(duaTitle);
    } else {
      newSet.add(duaTitle);
    }
    setBookmarkedIds(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-neutral-body pb-24 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 border-b border-neutral-line px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-3 mb-3">
          {activeCategory && !isSearching ? (
             <button onClick={() => setActiveCategory(null)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100">
                <ArrowLeft size={20} className="text-neutral-600" />
             </button>
          ) : (
             // If onBack provided (main app navigation), show it, otherwise just title icon
             onBack && <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-neutral-100"><ArrowLeft size={20} /></button>
          )}
          <h2 className="text-xl font-bold text-neutral-primary truncate">
            {isSearching ? 'Search Results' : (activeCategory || 'Hisnul Muslim')}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by feeling, topic, or text..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 border-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all text-sm"
          />
          {searchQuery && (
             <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-500 bg-white px-2 py-0.5 rounded-md shadow-sm">
               Clear
             </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="p-4">
        
        {/* VIEW 1: CATEGORY GRID */}
        {!activeCategory && !isSearching && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="group relative h-32 rounded-2xl overflow-hidden text-left p-4 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {/* Dynamic Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(category)} opacity-90 group-hover:opacity-100 transition-opacity`} />
                
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                   <span className="text-3xl filter drop-shadow-sm">{getCategoryIcon(category)}</span>
                   <div>
                      <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 shadow-black/10 drop-shadow-md">
                        {category}
                      </h3>
                      <p className="text-white/80 text-[10px] font-medium mt-1 flex items-center">
                         View Duas <ChevronRight size={10} className="ml-0.5" />
                      </p>
                   </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: DUA LIST (Category or Search) */}
        {(activeCategory || isSearching) && (
          <div className="space-y-4">
             {filteredDuas.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                   <p>No Duas found matching your criteria.</p>
                </div>
             ) : (
               filteredDuas.map((dua, idx) => (
                 <Card key={idx} className="overflow-hidden border border-neutral-line/50 shadow-sm">
                    {/* Card Header */}
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-line flex justify-between items-center">
                       <span className="text-[10px] font-bold text-brand-forest bg-brand-mint px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {isSearching ? dua.category : `#${idx + 1}`}
                       </span>
                       <div className="flex space-x-1">
                          <button onClick={() => copyToClipboard(`${dua.arabic}\n\n${dua.translation}`)} className="p-1.5 text-neutral-400 hover:text-brand-teal transition-colors rounded-md hover:bg-white">
                             <Copy size={14} />
                          </button>
                          <button onClick={() => toggleBookmark(dua.title + idx)} className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors rounded-md hover:bg-white">
                             <Heart size={14} className={bookmarkedIds.has(dua.title + idx) ? "fill-rose-500 text-rose-500" : ""} />
                          </button>
                       </div>
                    </div>

                    <div className="p-5">
                       {/* Arabic */}
                       <p className="text-2xl sm:text-3xl font-arabic text-right leading-loose text-neutral-primary mb-6" dir="rtl">
                          {dua.arabic}
                       </p>

                       {/* Transliteration */}
                       <p className="text-sm text-brand-teal font-medium italic mb-3 font-serif leading-relaxed">
                          {dua.transliteration}
                       </p>

                       {/* Translation */}
                       <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                          {dua.translation}
                       </p>

                       {/* Source */}
                       <div className="pt-4 border-t border-neutral-line border-dashed">
                          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
                             Source: <span className="text-neutral-500">{dua.source}</span>
                          </p>
                       </div>
                    </div>
                 </Card>
               ))
             )}
             
             {!isSearching && (
                <div className="text-center pt-6 pb-4">
                   <p className="text-xs text-neutral-400">End of category</p>
                   <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
                      Back to Top
                   </Button>
                </div>
             )}
          </div>
        )}
      </div>

    </div>
  );
};
