
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ArrowLeft, ChevronRight, ChevronLeft, Bookmark, PlayCircle, Book, PenTool, List, Share2, Settings, X, Menu, Copy, Check, RotateCcw, Sparkles } from 'lucide-react';
import { MOCK_SURAHS } from '../constants';
import { MUSHAF_DATA } from '../data/quran-data';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';

// Standard Madani Mushaf Juz Start Pages (1-30)
const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

// Styled Number Marker Component
const AyahMarker = ({ number }: { number: number }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 mx-1 align-middle relative select-none font-sans">
    <svg viewBox="0 0 40 40" className="w-full h-full text-brand-forest/30 fill-current absolute inset-0">
       <path d="M20,5 A15,15 0 1,0 20,35 A15,15 0 1,0 20,5 Z M20,1 A19,19 0 1,1 20,39 A19,19 0 1,1 20,1 Z" fillRule="evenodd" />
    </svg>
    <span className="text-[10px] font-bold text-brand-forest relative z-10 mt-1">{number}</span>
  </span>
);

// Surah Header Component
const SurahHeader = ({ nameArabic, nameEnglish, number }: { nameArabic: string, nameEnglish: string, number: number }) => (
  <div 
    id={`surah-header-${number}`}
    className="w-full my-10 relative py-6 border-y-2 border-double border-amber-400/40 bg-[#fdf6e3] rounded-xl shadow-sm select-none scroll-mt-24" 
    dir="ltr"
  >
     <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
     <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
        {/* Decorative frame */}
        <div className="flex items-center space-x-3 text-amber-600/60">
           <span className="h-px w-12 bg-current"></span>
           <span className="text-[10px] font-bold tracking-widest uppercase">Surah {number}</span>
           <span className="h-px w-12 bg-current"></span>
        </div>
        <h1 className="text-4xl text-brand-forest font-bold drop-shadow-sm font-quran mb-1">{nameArabic}</h1>
        <span className="text-sm text-neutral-500 font-medium tracking-wide">{nameEnglish}</span>
     </div>
  </div>
);

// Bismillah Component
const Bismillah = () => (
  <div className="my-8 text-2xl md:text-3xl text-neutral-600 font-quran text-center select-none w-full" dir="rtl">
     بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
  </div>
);

interface QuranReaderProps {
  onHelp?: () => void;
}

export const QuranReader: React.FC<QuranReaderProps> = ({ onHelp }) => {
  // MODE STATE: 'list' | 'mushaf'
  const [mode, setMode] = useState<'list' | 'mushaf'>('list');
  const [listTab, setListTab] = useState<'surah' | 'juz'>('surah');
  
  // DATA STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // INTERACTION STATE
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [selectedAyahNum, setSelectedAyahNum] = useState<number | null>(null);
  const [selectedPage, setSelectedPage] = useState<number | null>(null); // Lock page context for menu
  const [showAyahMenu, setShowAyahMenu] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'tafsir' | 'notes' | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navTab, setNavTab] = useState<'surah' | 'juz'>('surah'); // New state for drawer tabs
  const [targetSurahScroll, setTargetSurahScroll] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const { t, dir } = useLanguage();
  const BackIcon = dir === 'rtl' ? ChevronRight : ArrowLeft;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- DATA INDEXING ---
  
  // Create a map of where each Surah starts { surahNum: pageNum }
  const surahStartPages = useMemo(() => {
    const map: Record<number, number> = {};
    // Iterate all pages to find start of each Surah
    Object.values(MUSHAF_DATA).forEach(page => {
      page.ayahs.forEach(ayah => {
        // If this is the first ayah of the surah, record the page
        if (Number(ayah.numberInSurah) === 1 && ayah.surah && !map[ayah.surah]) {
          map[ayah.surah] = page.pageNumber;
        }
      });
    });
    // Fallback: Ensure we have at least page 1 for Fatiha if data is partial
    if (!map[1]) map[1] = 1;
    return map;
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('muslimDaily_bookmarks');
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)));
    
    const lastRead = localStorage.getItem('muslimDaily_lastRead');
    if (lastRead) setCurrentPage(parseInt(lastRead));
  }, []);

  // Save last read page whenever it changes
  useEffect(() => {
    if (mode === 'mushaf') {
      localStorage.setItem('muslimDaily_lastRead', currentPage.toString());
    }
  }, [currentPage, mode]);

  // Handle Scrolling on Page Change or Surah Jump
  useEffect(() => {
    if (mode === 'mushaf') {
      // 1. If we have a specific Surah target (e.g. Ali Imran starts mid-page), scroll to it
      if (targetSurahScroll) {
        const timer = setTimeout(() => {
          const element = document.getElementById(`surah-header-${targetSurahScroll}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Fallback if header not found (e.g. very top of page), just scroll top
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setTargetSurahScroll(null); // Reset target
        }, 300); // Delay to ensure render
        return () => clearTimeout(timer);
      } 
      // 2. Scroll to specific page if changed via list/nav
      else {
         setTimeout(() => {
            const el = document.getElementById(`page-${currentPage}`);
            if (el) {
               el.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
         }, 100);
      }
    }
  }, [mode, targetSurahScroll]); 
  // Removed 'currentPage' from dependency to prevent auto-scrolling when user scrolls manually and updates state

  // --- ACTIONS ---

  const goToSurah = (surahNumber: number) => {
    const targetPage = surahStartPages[surahNumber];
    
    if (targetPage) {
      setCurrentPage(targetPage);
      setMode('mushaf');
      setIsNavOpen(false);
      
      // Determine if we need to scroll to a header
      const pageData = MUSHAF_DATA[targetPage];
      const firstAyah = pageData?.ayahs?.[0];
      const isFirstOnPage = firstAyah?.surah === surahNumber && firstAyah?.numberInSurah === 1;
      
      if (!isFirstOnPage) {
         setTargetSurahScroll(surahNumber);
      } else {
         setTargetSurahScroll(null);
      }
    } else {
      alert(`Surah ${surahNumber} data not loaded yet.`);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= 604) {
      setCurrentPage(pageNum);
      setMode('mushaf');
      setIsNavOpen(false);
      
      setTimeout(() => {
         const el = document.getElementById(`page-${pageNum}`);
         if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const goToJuz = (juzNumber: number) => {
    const page = JUZ_START_PAGES[juzNumber - 1];
    if (page) {
      goToPage(page);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const pages = Object.keys(MUSHAF_DATA).map(Number);
    
    // Simple check: which page top is close to viewport top
    for (const pageNum of pages) {
      const el = document.getElementById(`page-${pageNum}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Threshold: Page is considered "active" if its top is within the upper half of screen
        if (rect.top >= -200 && rect.top < window.innerHeight / 2) {
          if (currentPage !== pageNum) {
             setCurrentPage(pageNum); // Update header
          }
          break;
        }
      }
    }
  };

  const handleVerseClick = (pageNumber: number, ayahNum: number) => {
    setSelectedAyahNum(ayahNum);
    setSelectedPage(pageNumber); // Use the specific page of the clicked ayah
    setShowAyahMenu(true);
    setActiveSheet(null); 
  };

  const togglePageBookmark = () => {
    const key = `page:${currentPage}`;
    const next = new Set(bookmarks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setBookmarks(next);
    localStorage.setItem('muslimDaily_bookmarks', JSON.stringify(Array.from(next)));
  };

  const toggleAyahBookmark = (page: number, ayah: number) => {
    const key = `ayah:${page}:${ayah}`;
    const next = new Set(bookmarks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setBookmarks(next);
    localStorage.setItem('muslimDaily_bookmarks', JSON.stringify(Array.from(next)));
  };

  const copyAyah = (text: string, translation: string) => {
    navigator.clipboard.writeText(`${text}\n\n${translation}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- RENDER HELPERS ---
  
  const pageData = MUSHAF_DATA[currentPage];
  const currentSurahName = pageData?.ayahs.find(a => a.surahName)?.surahName || "Quran";
  
  // For the menu, we use the locked `selectedPage` to ensure stability
  const menuPageData = selectedPage ? MUSHAF_DATA[selectedPage] : null;
  const activeAyahData = useMemo(() => {
    if (!menuPageData || !selectedAyahNum) return null;
    return menuPageData.ayahs.find(a => a.numberInSurah === selectedAyahNum);
  }, [menuPageData, selectedAyahNum]);

  const isAyahBookmarked = (page: number | null, ayah: number | null) => {
    if (!page || !ayah) return false;
    return bookmarks.has(`ayah:${page}:${ayah}`);
  };

  // --- VIEW 1: INDEX (List) ---
  if (mode === 'list') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300 pb-24 bg-neutral-body min-h-screen">
        <div className="flex items-center justify-between px-4 pt-6">
           <h2 className="text-2xl font-bold text-neutral-primary">{t('quran')}</h2>
           <div className="flex items-center space-x-2 rtl:space-x-reverse">
             {/* Help Button */}
             {onHelp && (
                <button 
                  onClick={onHelp}
                  className="flex items-center space-x-1.5 rtl:space-x-reverse bg-gradient-to-r from-brand-forest to-brand-teal text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transform transition-all active:scale-95"
                >
                  <Sparkles size={14} className="fill-current" />
                  <span className="text-xs font-bold">{t('guide')}</span>
                </button>
             )}
             {/* Resume Button */}
             {currentPage > 1 && (
               <button 
                 id="quran-resume-btn"
                 onClick={() => goToPage(currentPage)}
                 className="bg-white text-brand-forest border border-brand-forest px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm hover:bg-brand-mint transition-colors"
               >
                  <RotateCcw size={14} className="me-1" /> Pg {currentPage}
               </button>
             )}
           </div>
        </div>

        {/* Search */}
        <div className="relative mx-4 mt-2" id="quran-list-search">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('quran_search')}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3.5 rounded-xl bg-white border-none shadow-sm focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="px-4" id="quran-list-tabs">
           <div className="flex p-1 bg-white rounded-xl shadow-sm border border-neutral-100">
              <button 
                 onClick={() => setListTab('surah')}
                 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${listTab === 'surah' ? 'bg-brand-forest text-white shadow' : 'text-neutral-500 hover:bg-neutral-50'}`}
              >
                 {t('quran')}
              </button>
              <button 
                 onClick={() => setListTab('juz')}
                 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${listTab === 'juz' ? 'bg-brand-forest text-white shadow' : 'text-neutral-500 hover:bg-neutral-50'}`}
              >
                 {t('quran_juz')}
              </button>
           </div>
        </div>

        {/* List Content */}
        <div className="space-y-2 px-4 pb-8">
          {listTab === 'surah' ? (
             MOCK_SURAHS.filter(s => 
                s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.name.includes(searchQuery) ||
                s.number.toString() === searchQuery
             ).map((surah) => (
               <div 
                 key={surah.number}
                 onClick={() => goToSurah(surah.number)}
                 className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-mint active:scale-[0.99] transition-all group"
               >
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                     <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center relative rotate-45 border border-neutral-200 group-hover:border-brand-forest group-hover:bg-brand-forest group-hover:text-white transition-colors">
                        <span className="font-bold text-sm -rotate-45">{surah.number}</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-neutral-primary text-sm">{surah.englishName}</h3>
                        <p className="text-xs text-neutral-muted">{surah.englishNameTranslation}</p>
                     </div>
                  </div>
                  <div className="text-end">
                     <p className="font-quran font-bold text-xl text-neutral-700 group-hover:text-brand-forest transition-colors">{surah.name}</p>
                     <div className="flex items-center justify-end space-x-1 rtl:space-x-reverse mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${surah.revelationType === 'Meccan' ? 'bg-orange-400' : 'bg-brand-teal'}`}></span>
                        <p className="text-[10px] text-neutral-400 font-medium uppercase">
                           {surah.revelationType}
                        </p>
                     </div>
                  </div>
               </div>
             ))
          ) : (
             // Juz List
             JUZ_START_PAGES.map((startPage, index) => {
                const juzNum = index + 1;
                // Basic calculation for Hizb based on Juz
                const startHizb = (juzNum - 1) * 2 + 1;
                const endHizb = startHizb + 1;
                
                if (searchQuery && !`juz ${juzNum}`.includes(searchQuery.toLowerCase())) return null;
                
                return (
                   <div 
                     key={juzNum}
                     onClick={() => goToJuz(juzNum)}
                     className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-mint active:scale-[0.99] transition-all group"
                   >
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                         <div className="w-12 h-12 rounded-full bg-neutral-50 text-brand-forest flex items-center justify-center font-bold font-mono text-sm border-2 border-transparent group-hover:border-brand-forest group-hover:bg-brand-mint transition-all">
                            {juzNum}
                         </div>
                         <div>
                            <span className="font-bold text-neutral-primary block text-sm">{t('quran_juz')} {juzNum}</span>
                            <span className="text-xs text-neutral-400 font-medium">Hizb {startHizb} - {endHizb}</span>
                         </div>
                      </div>
                      <div className="text-end">
                         <span className="text-[10px] text-neutral-400 font-mono bg-neutral-50 px-2 py-1 rounded group-hover:bg-white">Page {startPage}</span>
                      </div>
                   </div>
                );
             })
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: MUSHAF (Page View) ---
  return (
    <div className="fixed inset-0 z-50 bg-[#fffcf5] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* 1. HEADER */}
      <div className="bg-[#fffcf5]/95 backdrop-blur-sm z-30 border-b border-amber-100/50 px-4 py-2 shadow-sm flex justify-between items-center">
         <div className="flex items-center">
            <button onClick={() => setMode('list')} className="p-2 -ml-2 rtl:ml-0 rtl:-mr-2 rounded-full hover:bg-amber-100 text-neutral-600">
               <BackIcon size={24} />
            </button>
            <button onClick={() => setIsNavOpen(true)} className="p-2 rounded-full hover:bg-amber-100 text-neutral-600 ms-1">
               <Menu size={24} />
            </button>
         </div>
         
         <div className="text-center cursor-pointer" onClick={() => setIsNavOpen(true)}>
            <span className="font-sans font-bold text-sm text-neutral-800 block">
               {currentSurahName}
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
               Page {currentPage}
            </span>
         </div>
         
         <div className="flex space-x-1 rtl:space-x-reverse w-[80px] justify-end">
            <button 
               onClick={togglePageBookmark}
               className={`p-2 rounded-full hover:bg-amber-100 transition-colors ${bookmarks.has(`page:${currentPage}`) ? 'text-brand-forest' : 'text-neutral-400'}`}
            >
               <Bookmark size={20} className={bookmarks.has(`page:${currentPage}`) ? 'fill-current' : ''} />
            </button>
         </div>
      </div>

      {/* 2. INFINITE SCROLL CONTENT */}
      <div 
         className="flex-1 overflow-y-auto no-scrollbar relative" 
         ref={scrollContainerRef}
         onScroll={handleScroll}
         onClick={() => {
            setShowAyahMenu(false);
            setSelectedAyahNum(null);
         }}
      >
         <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-32 pt-4">
            
            {/* RENDER ALL PAGES STACKED */}
            {Object.values(MUSHAF_DATA).map((page) => (
               <div 
                  key={page.pageNumber} 
                  id={`page-${page.pageNumber}`}
                  className="mb-8 min-h-[50vh] border-b border-transparent"
                  style={{ contentVisibility: 'auto' }} // Performance opt
               >
                  {/* Page Marker */}
                  <div className="flex items-center justify-center my-6 opacity-20 select-none">
                     <div className="h-px bg-neutral-400 w-16"></div>
                     <span className="text-[10px] font-mono font-bold text-neutral-500 mx-3">PAGE {page.pageNumber}</span>
                     <div className="h-px bg-neutral-400 w-16"></div>
                  </div>

                  <div className="text-center font-quran">
                     <div 
                        className="text-right leading-[4rem] md:leading-[5rem] text-3xl md:text-4xl text-neutral-800 quran-justify" 
                        dir="rtl"
                     >
                        {page.ayahs.map((ayah) => {
                           const isSurahStart = Number(ayah.numberInSurah) === 1;
                           let displayText = ayah.text;
                           
                           // Strip Bismillah if it's a Surah start to avoid dupes with the header
                           if (isSurahStart && ayah.surah && ayah.surah !== 1 && ayah.surah !== 9) {
                              displayText = displayText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '');
                              displayText = displayText.replace(/^بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ\s*/, '');
                           }

                           return (
                              <React.Fragment key={`${ayah.surah || 0}-${ayah.number}`}>
                                 
                                 {/* Surah Header Block */}
                                 {isSurahStart && (
                                    <div className="block w-full mt-8 mb-4 clear-both">
                                       <SurahHeader 
                                          nameArabic={ayah.surahNameArabic || `Surah ${ayah.surah}`} 
                                          nameEnglish={ayah.surahName || `Surah ${ayah.surah}`} 
                                          number={ayah.surah || 0}
                                       />
                                       {ayah.surah !== 1 && ayah.surah !== 9 && <Bismillah />}
                                    </div>
                                 )}

                                 <span 
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleVerseClick(page.pageNumber, ayah.numberInSurah);
                                    }}
                                    className={`
                                       inline px-1 rounded-lg cursor-pointer transition-colors duration-200 relative
                                       ${selectedAyahNum === ayah.numberInSurah && selectedPage === page.pageNumber ? 'bg-brand-mint/60 text-brand-forest' : 'hover:bg-amber-50'}
                                    `}
                                 >
                                    {/* Tiny visual marker if ayah is bookmarked */}
                                    {bookmarks.has(`ayah:${page.pageNumber}:${ayah.numberInSurah}`) && (
                                       <span className="absolute -top-1 right-0 text-red-500">
                                          <Bookmark size={10} className="fill-current" />
                                       </span>
                                    )}
                                    {displayText}
                                    <AyahMarker number={ayah.numberInSurah} />
                                 </span>
                              </React.Fragment>
                           );
                        })}
                     </div>
                  </div>
               </div>
            ))}

            <div className="text-center py-12 text-neutral-400">
               <div className="w-12 h-12 border-4 border-neutral-200 border-t-brand-forest rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-xs">End of Loaded Content</p>
            </div>
         </div>
      </div>

      {/* 4. NAVIGATION DRAWER */}
      {isNavOpen && (
         <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsNavOpen(false)}></div>
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
               <div className="p-5 border-b border-neutral-100 bg-neutral-50">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg text-neutral-primary">Navigation</h3>
                     <button onClick={() => setIsNavOpen(false)}><X size={24} className="text-neutral-400" /></button>
                  </div>
                  {/* Drawer Tabs */}
                  <div className="flex p-1 bg-white rounded-xl shadow-sm border border-neutral-200">
                     <button 
                        onClick={() => setNavTab('surah')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${navTab === 'surah' ? 'bg-brand-forest text-white shadow' : 'text-neutral-500 hover:bg-neutral-50'}`}
                     >
                        Surah
                     </button>
                     <button 
                        onClick={() => setNavTab('juz')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${navTab === 'juz' ? 'bg-brand-forest text-white shadow' : 'text-neutral-500 hover:bg-neutral-50'}`}
                     >
                        Juz
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navTab === 'surah' ? (
                     <div className="space-y-1">
                        {MOCK_SURAHS.map(s => (
                           <button 
                              key={s.number}
                              onClick={() => goToSurah(s.number)}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 text-left transition-colors"
                           >
                              <div className="flex items-center">
                                 <span className="w-6 text-xs font-bold text-neutral-400">{s.number}</span>
                                 <span className="font-bold text-neutral-700">{s.englishName}</span>
                              </div>
                              <span className="font-quran text-brand-forest text-lg">{s.name}</span>
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 gap-2">
                        {JUZ_START_PAGES.map((startPage, index) => {
                           const juzNum = index + 1;
                           const startHizb = (juzNum - 1) * 2 + 1;
                           return (
                              <button
                                 key={juzNum}
                                 onClick={() => goToJuz(juzNum)}
                                 className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 text-left transition-colors group"
                              >
                                 <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <div className="w-8 h-8 rounded-full bg-brand-mint text-brand-forest flex items-center justify-center font-bold text-xs">
                                       {juzNum}
                                    </div>
                                    <div>
                                       <span className="font-bold text-neutral-700 text-sm">Juz {juzNum}</span>
                                       <span className="text-[10px] text-neutral-400 block">Hizb {startHizb}-{startHizb+1}</span>
                                    </div>
                                 </div>
                                 <span className="text-[10px] text-neutral-400 font-mono">Pg {startPage}</span>
                              </button>
                           )
                        })}
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* 5. RICH AYAH MENU (THE BOX) */}
      {showAyahMenu && activeAyahData && selectedPage && (
         <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" 
            onClick={() => setShowAyahMenu(false)}
         >
            <div 
               className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" 
               onClick={e => e.stopPropagation()}
            >
               
               {!activeSheet ? (
                  <>
                     {/* Menu Header */}
                     <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                           <span className="bg-brand-forest text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-mono shadow-lg shadow-brand-forest/30 border-2 border-white">
                              {activeAyahData.numberInSurah}
                           </span>
                           <div>
                              <h3 className="font-bold text-neutral-primary text-lg">{activeAyahData.surahName}</h3>
                              <p className="text-xs text-neutral-400 font-medium">Page {selectedPage} • Juz {activeAyahData.juz}</p>
                           </div>
                        </div>
                        <button onClick={() => setShowAyahMenu(false)} className="p-2 rounded-full bg-neutral-50 text-neutral-400 hover:bg-neutral-100">
                           <X size={20} />
                        </button>
                     </div>

                     {/* Ayah Preview */}
                     <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 mb-6 max-h-40 overflow-y-auto no-scrollbar">
                        <p className="font-quran text-2xl text-right mb-3 leading-loose text-neutral-800" dir="rtl">{activeAyahData.text}</p>
                        <p className="text-sm text-neutral-600 leading-relaxed">{activeAyahData.translation}</p>
                     </div>

                     {/* Rich Quick Actions Grid */}
                     <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Actions</h4>
                     <div className="grid grid-cols-4 gap-4 mb-2">
                        <ActionButton 
                           icon={Bookmark} 
                           label="Bookmark" 
                           active={isAyahBookmarked(selectedPage, activeAyahData.numberInSurah)}
                           onClick={() => toggleAyahBookmark(selectedPage!, activeAyahData.numberInSurah)} 
                           color="rose"
                        />
                        <ActionButton 
                           icon={Book} 
                           label="Tafsir" 
                           onClick={() => setActiveSheet('tafsir')} 
                        />
                        <ActionButton 
                           icon={Copy} 
                           label="Copy" 
                           onClick={() => copyAyah(activeAyahData.text, activeAyahData.translation)} 
                           active={copySuccess}
                        />
                        <ActionButton 
                           icon={Share2} 
                           label="Share" 
                           onClick={() => alert('Share functionality would open native share sheet.')} 
                        />
                     </div>
                     
                     {/* Secondary Row */}
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setActiveSheet('notes')} className="w-full">
                           <PenTool size={16} className="me-2" /> Add Reflection
                        </Button>
                        <Button variant="primary" size="sm" className="w-full">
                           <PlayCircle size={16} className="me-2" /> Play Audio
                        </Button>
                     </div>
                  </>
               ) : (
                  /* Sub-Sheet: Tafsir or Notes */
                  <div className="h-[50vh] flex flex-col">
                     <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                        <button onClick={() => setActiveSheet(null)} className="flex items-center text-sm font-bold text-neutral-500 hover:text-brand-forest">
                           <BackIcon size={18} className="me-1" /> {t('back')}
                        </button>
                        <span className="font-bold text-neutral-800 text-sm uppercase tracking-wide">{activeSheet === 'tafsir' ? 'Tafsir Ibn Kathir' : 'Reflections'}</span>
                        <div className="w-10"></div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        {activeSheet === 'tafsir' ? (
                           <div className="space-y-4 p-1">
                              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                 <h4 className="font-bold text-neutral-800 mb-2">Interpretation of Ayah {activeAyahData.numberInSurah}</h4>
                                 <p className="text-sm text-neutral-600 leading-relaxed">
                                    {t('quran_tafsir_placeholder')}
                                 </p>
                              </div>
                              <div className="space-y-2 opacity-50 px-2">
                                 <div className="h-2 bg-neutral-100 rounded w-full"></div>
                                 <div className="h-2 bg-neutral-100 rounded w-5/6"></div>
                                 <div className="h-2 bg-neutral-100 rounded w-4/6"></div>
                              </div>
                           </div>
                        ) : (
                           <div className="h-full flex flex-col">
                              <textarea 
                                 className="flex-1 w-full p-4 rounded-xl bg-neutral-50 border-none resize-none text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none"
                                 placeholder={t('quran_notes_placeholder')}
                                 autoFocus
                              />
                              <Button fullWidth className="mt-4">Save Note</Button>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
};

// Helper Component
const ActionButton = ({ icon: Icon, label, onClick, active = false, color = "brand" }: { icon: any, label: string, onClick: () => void, active?: boolean, color?: "brand" | "rose" }) => {
   const activeBg = color === "rose" ? "bg-rose-100 text-rose-600" : "bg-brand-mint text-brand-forest";
   const inactiveBg = "bg-neutral-50 text-neutral-600";
   
   return (
      <button onClick={onClick} className="flex flex-col items-center gap-2 group w-full">
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group-active:scale-95 ${active ? activeBg : inactiveBg} ${!active && 'group-hover:bg-neutral-100'}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} className={active ? "fill-current" : ""} />
         </div>
         <span className={`text-[10px] font-bold tracking-wide ${active ? (color === 'rose' ? 'text-rose-600' : 'text-brand-forest') : 'text-neutral-500'}`}>{label}</span>
      </button>
   );
};