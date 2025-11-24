
import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Share2, Copy, Bookmark, Heart, ChevronRight, Sparkles, ChevronLeft, Send, Loader2, RefreshCw } from 'lucide-react';
import { DUA_DATA } from '../duas';
import { Dua } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleGenAI, Type } from "@google/genai";

// --- HELPER: Gradient Generator ---
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
  onBack?: () => void; 
  onHelp?: () => void; 
}

export const DuaPage: React.FC<DuaPageProps> = ({ onBack, onHelp }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  
  // AI State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<(Dua & { advice?: string }) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { t, dir } = useLanguage();
  
  const BackIcon = dir === 'rtl' ? ChevronRight : ArrowLeft; 
  const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

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
  };

  const handleHelpClick = () => {
    setActiveCategory(null);
    setSearchQuery('');
    setTimeout(() => {
       if (onHelp) onHelp();
    }, 50);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setAiResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a comforting Islamic spiritual companion. A user comes to you with this situation/feeling: "${aiPrompt}". 
        Please provide:
        1. A highly relevant, authentic Dua (Supplication) from the Quran or Sunnah in Arabic.
        2. The Transliteration.
        3. The English Translation.
        4. The Source (e.g. Surah Name: Verse, or Hadith Book).
        5. A brief, comforting spiritual advice or reflection specific to their situation (max 25 words).
        
        Return ONLY JSON in this format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              arabic: { type: Type.STRING },
              transliteration: { type: Type.STRING },
              translation: { type: Type.STRING },
              source: { type: Type.STRING },
              advice: { type: Type.STRING },
              title: { type: Type.STRING, description: "A short title for the Dua" },
              category: { type: Type.STRING, description: "The general category of this Dua" }
            }
          }
        }
      });

      if (response.text) {
        setAiResult(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Sorry, I couldn't generate a Dua right now. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-neutral-body pb-24 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 border-b border-neutral-line px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {activeCategory && !isSearching && !isAiMode ? (
               <button onClick={() => setActiveCategory(null)} className="p-2 -ml-2 rtl:ml-0 rtl:-mr-2 rounded-full hover:bg-neutral-100">
                  <BackIcon size={20} className="text-neutral-600" />
               </button>
            ) : (
               onBack && <button onClick={onBack} className="p-2 -ml-2 rtl:ml-0 rtl:-mr-2 rounded-full hover:bg-neutral-100"><BackIcon size={20} /></button>
            )}
            <h2 className="text-xl font-bold text-neutral-primary truncate">
              {isAiMode ? 'AI Companion' : (isSearching ? t('dua_search_results') : (activeCategory || 'Hisnul Muslim'))}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
             <button 
               onClick={() => {
                 setIsAiMode(!isAiMode);
                 setActiveCategory(null);
                 setSearchQuery('');
               }} 
               className={`flex items-center justify-center w-9 h-9 rounded-full shadow-sm transition-all active:scale-95 ${isAiMode ? 'bg-brand-forest text-white' : 'bg-white text-brand-forest border border-neutral-200'}`}
             >
                <Sparkles size={16} className={isAiMode ? "fill-current" : ""} />
             </button>
             {onHelp && !isAiMode && (
               <button onClick={handleHelpClick} className="p-2 rounded-full bg-neutral-100 text-neutral-600">
                  <span className="sr-only">{t('dua_guide')}</span>
                  <span className="text-xs font-bold">?</span>
               </button>
             )}
          </div>
        </div>

        {/* Search Bar (Hidden in AI Mode) */}
        {!isAiMode && (
          <div className="relative" id="dua-search">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('dua_search_placeholder')}
              className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-xl bg-neutral-100 border-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all text-sm"
            />
            {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-500 bg-white px-2 py-0.5 rounded-md shadow-sm">
                 {t('dua_clear')}
               </button>
            )}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="p-4">
        
        {/* VIEW 0: AI COMPANION MODE */}
        {isAiMode && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
             <Card className="bg-gradient-to-br from-brand-forest to-brand-teal text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                   <h3 className="font-bold text-lg mb-2 flex items-center"><Sparkles size={18} className="me-2 fill-current" /> Spiritual Guide</h3>
                   <p className="text-brand-mint text-sm mb-4 opacity-90">
                      Describe how you are feeling or what you are facing, and I will find a Dua from the Quran or Sunnah specifically for you.
                   </p>
                   
                   <div className="relative">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., I am feeling anxious about my exam..." 
                        className="w-full rounded-xl bg-white/10 border border-white/20 placeholder:text-white/50 text-white p-4 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all resize-none h-24"
                      />
                      <button 
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || isGenerating}
                        className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 bg-white text-brand-forest p-2 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all hover:bg-brand-mint"
                      >
                         {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                   </div>
                </div>
             </Card>

             {aiResult && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="font-bold text-neutral-primary text-sm uppercase tracking-wider">Recommended Dua</h4>
                      <button onClick={() => setAiResult(null)} className="text-xs text-neutral-400 flex items-center hover:text-brand-forest">
                         <RefreshCw size={12} className="me-1" /> Clear
                      </button>
                   </div>
                   <Card className="overflow-hidden border border-brand-mint shadow-md">
                      <div className="bg-brand-mint/30 px-4 py-3 border-b border-brand-mint/50 flex justify-between items-center">
                         <span className="text-xs font-bold text-brand-forest uppercase tracking-wide">
                            {aiResult.title || "Supplication"}
                         </span>
                         <div className="flex space-x-1 rtl:space-x-reverse">
                            <button onClick={() => copyToClipboard(`${aiResult.arabic}\n\n${aiResult.translation}`)} className="p-1.5 text-brand-forest/70 hover:text-brand-forest transition-colors bg-white rounded-md shadow-sm">
                               <Copy size={14} />
                            </button>
                         </div>
                      </div>

                      <div className="p-5">
                         <p className="text-2xl sm:text-3xl font-arabic text-right leading-loose text-neutral-primary mb-6" dir="rtl">
                            {aiResult.arabic}
                         </p>
                         <p className="text-sm text-brand-teal font-medium italic mb-3 font-serif leading-relaxed">
                            {aiResult.transliteration}
                         </p>
                         <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                            {aiResult.translation}
                         </p>
                         
                         {/* Advice Section */}
                         {aiResult.advice && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                               <p className="text-xs text-amber-800 italic">
                                  <span className="font-bold not-italic text-amber-600 block text-[10px] uppercase mb-1">Reflection</span>
                                  "{aiResult.advice}"
                               </p>
                            </div>
                         )}

                         <div className="pt-4 border-t border-neutral-line border-dashed">
                            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
                               Source: <span className="text-neutral-500">{aiResult.source}</span>
                            </p>
                         </div>
                      </div>
                   </Card>
                </div>
             )}
          </div>
        )}

        {/* VIEW 1: CATEGORY GRID */}
        {!activeCategory && !isSearching && !isAiMode && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, idx) => (
              <button
                key={category}
                id={idx === 0 ? 'dua-category-first' : undefined} // Target only the first for the tour
                onClick={() => setActiveCategory(category)}
                className="group relative h-32 rounded-2xl overflow-hidden text-start p-4 shadow-sm hover:shadow-md transition-all active:scale-95"
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
                         {t('dua_view_duas')} <ForwardIcon size={10} className="ms-0.5 rtl:rotate-180" />
                      </p>
                   </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* VIEW 2: DUA LIST (Category or Search) */}
        {(activeCategory || isSearching) && !isAiMode && (
          <div className="space-y-4">
             {filteredDuas.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                   <p>{t('dua_no_results')}</p>
                </div>
             ) : (
               filteredDuas.map((dua, idx) => (
                 <Card key={idx} className="overflow-hidden border border-neutral-line/50 shadow-sm">
                    {/* Card Header */}
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-line flex justify-between items-center">
                       <span className="text-[10px] font-bold text-brand-forest bg-brand-mint px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {isSearching ? dua.category : `#${idx + 1}`}
                       </span>
                       <div className="flex space-x-1 rtl:space-x-reverse">
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
                             {t('dua_source')}: <span className="text-neutral-500">{dua.source}</span>
                          </p>
                       </div>
                    </div>
                 </Card>
               ))
             )}
             
             {!isSearching && (
                <div className="text-center pt-6 pb-4">
                   <p className="text-xs text-neutral-400">{t('dua_end')}</p>
                   <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
                      {t('dua_back_top')}
                   </Button>
                </div>
             )}
          </div>
        )}
      </div>

    </div>
  );
};
