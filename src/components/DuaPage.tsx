
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, Share2, Copy, Bookmark, Heart, ChevronRight, Sparkles, ChevronLeft, Star } from 'lucide-react';
import { DUA_DATA } from '../duas';
import { Dua } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { duaFavoritesService } from '../services/DuaFavoritesService';

interface DuaPageProps {
  onBack?: () => void;
  onHelp?: () => void;
}

export const DuaPage: React.FC<DuaPageProps> = ({ onBack, onHelp }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { t, dir } = useLanguage();

  // Load favorites from service on mount
  useEffect(() => {
    const loadFavorites = () => {
      const favs = duaFavoritesService.getFavorites();
      setFavorites(new Set(favs.map(f => f.id)));
    };
    loadFavorites();
    const unsub = duaFavoritesService.subscribe(loadFavorites);
    return unsub;
  }, []);

  const ArrowIcon = dir === 'rtl' ? ChevronRight : ArrowLeft; // Back is usually ArrowLeft in LTR, but in app header context arrow directions vary. Let's stick to simple logic: arrow points back. In RTL back is right.
  const BackIcon = dir === 'rtl' ? ChevronRight : ArrowLeft;
  const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  // Extract unique categories - add Favorites first if there are any
  const categories = useMemo(() => {
    const cats = new Set(DUA_DATA.map(d => d.category));
    const catArray = Array.from(cats).sort();
    // Add Favorites as first category if there are favorites
    if (favorites.size > 0) {
      return ['❤️ Favorites', ...catArray];
    }
    return catArray;
  }, [favorites.size]);

  // Filter logic
  const filteredDuas = useMemo(() => {
    if (!searchQuery) {
      if (activeCategory === '❤️ Favorites') {
        // Show favorited duas
        return DUA_DATA.filter(d => favorites.has(`dua_${d.title}`));
      }
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
  }, [searchQuery, activeCategory, favorites]);

  const isSearching = searchQuery.length > 0;

  // --- HANDLERS ---

  const toggleBookmark = (dua: Dua, idx: number) => {
    const duaId = `dua_${dua.title}`;
    duaFavoritesService.toggleFavorite({
      id: duaId,
      arabic: dua.arabic,
      english: dua.translation,
      transliteration: dua.transliteration,
      category: dua.category,
      source: dua.source,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleHelpClick = () => {
    setActiveCategory(null);
    setSearchQuery('');
    setTimeout(() => {
      if (onHelp) onHelp();
    }, 50);
  };

  // --- RENDER ---

  const pageTitle = isSearching ? t('dua_search_results') : (activeCategory || t('dua_title' as any) || 'Hisnul Muslim');

  return (
    <div className="min-h-screen bg-brand-background pb-24 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="bg-brand-surface/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/10 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {activeCategory && !isSearching ? (
              <button onClick={() => setActiveCategory(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-brand-forest transition-colors">
                <BackIcon size={22} />
              </button>
            ) : (
              onBack && (
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-brand-forest transition-colors">
                  <BackIcon size={22} />
                </button>
              )
            )}
            <h2 className="text-xl font-bold text-brand-forest truncate font-outfit">
              {pageTitle}
            </h2>
          </div>

          {onHelp && (
            <button
              onClick={handleHelpClick}
              className="p-2 rounded-full hover:bg-white/10 text-brand-primary"
            >
              <Sparkles size={20} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative" id="dua-search">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dua_search_placeholder')}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 rounded-2xl bg-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white/80 transition-all text-sm text-neutral-800 placeholder-neutral-400 font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary bg-white/80 px-2 py-0.5 rounded-md shadow-sm">
              {t('dua_clear')}
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-4 py-6">

        {/* VIEW 1: CATEGORY GRID */}
        {!activeCategory && !isSearching && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, idx) => (
              <button
                key={category}
                id={idx === 0 ? 'dua-category-first' : undefined}
                onClick={() => setActiveCategory(category)}
                className="group relative h-20 rounded-2xl bg-brand-surface border border-white/20 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all active:scale-95 flex items-center justify-center text-center p-4"
              >
                <h3 className="text-brand-forest font-bold text-sm leading-tight line-clamp-2">
                  {category}
                </h3>
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: DUA LIST (Category or Search) */}
        {(activeCategory || isSearching) && (
          <div className="space-y-4">
            {filteredDuas.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <div className="bg-brand-surface/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="opacity-50" />
                </div>
                <p className="font-medium">{t('dua_no_results')}</p>
              </div>
            ) : (
              filteredDuas.map((dua, idx) => (
                <div key={idx} className="bg-brand-surface/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  {/* Card Header */}
                  <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {isSearching ? dua.category : `#${idx + 1} `}
                    </span>
                    <div className="flex space-x-1 rtl:space-x-reverse opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(`${dua.arabic} \n\n${dua.translation} `)} className="p-1.5 text-neutral-500 hover:text-brand-primary hover:bg-white/20 rounded-lg transition-colors">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => toggleBookmark(dua, idx)} className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-white/20 rounded-lg transition-colors">
                        <Heart size={16} className={favorites.has(`dua_${dua.title}`) ? "fill-rose-500 text-rose-500" : ""} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Arabic */}
                    <p className="text-2xl sm:text-3xl font-arabic text-center leading-loose text-brand-forest mb-6 selection:bg-brand-primary/20" dir="rtl">
                      {dua.arabic}
                    </p>

                    {/* Transliteration */}
                    <p className="text-sm text-brand-primary font-medium italic mb-4 font-serif leading-relaxed text-center opacity-90">
                      {dua.transliteration}
                    </p>

                    {/* Translation */}
                    <p className="text-sm text-neutral-600 leading-relaxed text-center font-medium">
                      {dua.translation}
                    </p>

                    {/* Source */}
                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                        {dua.source}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {!isSearching && (
              <div className="text-center pt-8 pb-4">
                <p className="text-xs text-neutral-400 mb-3">{t('dua_end')}</p>
                <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-brand-primary hover:bg-brand-primary/5">
                  {t('dua_back_top')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div >
  );
};
