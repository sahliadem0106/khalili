import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, ChevronRight, Bookmark, PlayCircle, Book, PenTool, List, Share2, Save, X, Menu, BookOpen, RotateCcw, Brain, Pause, Trash2, Plus } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { MOCK_SURAHS } from '../constants';
import { MUSHAF_DATA } from '../data/quran-data';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { useQuranAudio } from '../hooks/useQuranAudio';
import { useTafsir } from '../hooks/useTafsir';
import { useReflections } from '../hooks/useReflections';

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
   <div className="w-full my-10 relative py-6 border-y-2 border-double border-amber-400/40 bg-[#fdf6e3] dark:bg-brand-surface dark:border-white/10 rounded-xl shadow-sm select-none" dir="ltr">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
      <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
         {/* Decorative frame */}
         <div className="flex items-center space-x-3 text-amber-600/60">
            <span className="h-px w-12 bg-current"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase">Surah {number}</span>
            <span className="h-px w-12 bg-current"></span>
         </div>
         <h1 className="text-4xl text-brand-forest dark:text-white font-bold drop-shadow-md font-quran mb-1">{nameArabic}</h1>
         <span className="text-sm text-neutral-500 dark:text-neutral-300 font-medium tracking-wide">{nameEnglish}</span>
      </div>
   </div>
);

// Bismillah Component
const Bismillah = () => (
   <div className="my-8 text-2xl md:text-3xl text-slate-700 dark:text-white font-quran text-center select-none w-full drop-shadow-sm" dir="rtl">
      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
   </div>
);

export const QuranReader: React.FC = () => {
   // MODE STATE: 'list' | 'mushaf'
   const [mode, setMode] = useState<'list' | 'mushaf'>('list');
   const [listTab, setListTab] = useState<'surah' | 'juz'>('surah');

   // DATA STATE
   const [searchQuery, setSearchQuery] = useState('');
   const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);

   // INTERACTION STATE
   const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
   const [lastReadPage, setLastReadPage] = useState<number | null>(null);

   const [selectedAyahNum, setSelectedAyahNum] = useState<number | null>(null);
   const [selectedAyahPage, setSelectedAyahPage] = useState<number | null>(null);
   const [showAyahMenu, setShowAyahMenu] = useState(false);
   const [activeSheet, setActiveSheet] = useState<'tafsir' | 'notes' | 'reflections' | 'all_reflections' | null>(null);
   const [isNavOpen, setIsNavOpen] = useState(false);

   const { t, dir } = useLanguage();
   const BackIcon = dir === 'rtl' ? ChevronRight : ArrowLeft;
   const virtuosoRef = useRef<VirtuosoHandle>(null);

   // Audio and Tafsir hooks
   const { isPlaying, playVerse, pause: pauseAudio, currentSurah, currentAyah } = useQuranAudio();
   const { tafsir, isLoadingTafsir, loadTafsir, clearTafsir } = useTafsir();
   const { reflections: allReflections, createReflection, updateReflection, deleteReflection, loadReflectionsForVerse } = useReflections();

   // Reflection form state
   const [reflectionText, setReflectionText] = useState('');
   const [editingReflectionId, setEditingReflectionId] = useState<string | null>(null);
   const [currentVerseReflections, setCurrentVerseReflections] = useState<any[]>([]);

   // Load reflections when ayah is selected and reflections sheet is opened
   useEffect(() => {
      if (selectedAyahNum && selectedAyahPage && activeSheet === 'reflections') {
         const ayahData = getActiveAyahData();
         if (ayahData) {
            const verseReflections = allReflections.filter(
               r => r.surahNumber === ayahData.surah && r.ayahNumber === ayahData.numberInSurah
            );
            setCurrentVerseReflections(verseReflections);
         }
      }
   }, [selectedAyahNum, selectedAyahPage, activeSheet]);

   // Load Saved State
   useEffect(() => {
      const savedPage = localStorage.getItem('muslimDaily_lastRead');
      if (savedPage) setLastReadPage(parseInt(savedPage));

      const savedBookmarks = localStorage.getItem('muslimDaily_bookmarks');
      if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)));
   }, []);

   // --- Scroll & View Logic ---

   const scrollToPage = (pageNum: number) => {
      setIsNavOpen(false);
      setMode('mushaf');

      // Small timeout to ensure Virtuoso is mounted before scrolling
      requestAnimationFrame(() => {
         virtuosoRef.current?.scrollToIndex({
            index: pageNum - 1, // Arrays are 0-indexed, pages are 1-indexed
            align: 'start',
            behavior: 'auto' // Instant jump for navigation
         });

         // Update state immediately
         setCurrentVisiblePage(pageNum);
         localStorage.setItem('muslimDaily_lastRead', pageNum.toString());
         setLastReadPage(pageNum);
      });
   };

   const goToSurah = (surahNumber: number | string) => {
      const targetSurah = Number(surahNumber);

      console.log(`[QuranReader] Navigating to Surah ${targetSurah}`);

      const pages = Object.values(MUSHAF_DATA).sort((a, b) => a.pageNumber - b.pageNumber);

      // Strategy 1: Find page containing strict Verse 1
      let targetPage = pages.find(page =>
         page.ayahs.some(a => Number(a.surah) === targetSurah && Number(a.numberInSurah) === 1)
      );

      // Strategy 2: Fallback to the first page containing ANY verse of this Surah
      if (!targetPage) {
         targetPage = pages.find(page =>
            page.ayahs.some(a => Number(a.surah) === targetSurah)
         );
      }

      if (targetPage) {
         console.log(`[QuranReader] Found Surah ${targetSurah} on page ${targetPage.pageNumber}`);

         // Critical fix: Set navigation drawer closed FIRST to prevent state conflicts
         setIsNavOpen(false);

         // Then scroll to the target page
         scrollToPage(targetPage.pageNumber);
      } else {
         console.warn(`[QuranReader] Could not find Surah ${targetSurah}`);
      }
   };

   const goToJuz = (juzNumber: number) => {
      let targetPage = 1;
      const pages = Object.values(MUSHAF_DATA);
      for (const page of pages) {
         if (page.ayahs.some(a => a.juz === juzNumber)) {
            targetPage = page.pageNumber;
            break;
         }
      }
      scrollToPage(targetPage);
   }

   // Track visible items to update current page number
   const handleItemsRendered = (items: any) => {
      // Virtuoso provides visible range. We can use the first item as "current page"
      // But simpler is using the `rangeChanged` callback providing `startIndex`
   };

   // --- Actions ---
   const handleVerseClick = (page: number, ayahNum: number) => {
      setSelectedAyahNum(ayahNum);
      setSelectedAyahPage(page);
      setShowAyahMenu(true);
   };

   const toggleBookmark = (page: number, ayah?: number) => {
      const key = ayah ? `ayah:${page}:${ayah}` : `page:${page}`;
      const next = new Set(bookmarks);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setBookmarks(next);
      localStorage.setItem('muslimDaily_bookmarks', JSON.stringify(Array.from(next)));
   };

   const getActiveAyahData = () => {
      if (!selectedAyahNum || !selectedAyahPage) return null;
      const pageData = MUSHAF_DATA[selectedAyahPage];
      return pageData?.ayahs.find(a => a.numberInSurah === selectedAyahNum) || null;
   };

   // Handle play audio for selected ayah
   const handlePlayAudio = () => {
      const ayahData = getActiveAyahData();
      if (!ayahData) return;

      const isCurrentlyPlaying = isPlaying && currentSurah === ayahData.surah && currentAyah === ayahData.numberInSurah;

      if (isCurrentlyPlaying) {
         pauseAudio();
      } else {
         playVerse(ayahData.surah, ayahData.numberInSurah);
      }
   };

   // Handle loading tafsir
   const handleLoadTafsir = () => {
      const ayahData = getActiveAyahData();
      if (!ayahData) return;

      loadTafsir(ayahData.surah, ayahData.numberInSurah);
      setActiveSheet('tafsir');
   };

   // Close ayah menu and reset states
   const closeAyahMenu = () => {
      setShowAyahMenu(false);
      setActiveSheet(null);
      clearTafsir();
      setReflectionText('');
      setEditingReflectionId(null);
   };

   // Handle saving reflection
   const handleSaveReflection = async () => {
      const ayahData = getActiveAyahData();
      if (!ayahData || !reflectionText.trim()) return;

      try {
         if (editingReflectionId) {
            // Update existing reflection
            await updateReflection(editingReflectionId, { reflection: reflectionText });
         } else {
            // Create new reflection
            await createReflection({
               surahNumber: ayahData.surah,
               ayahNumber: ayahData.numberInSurah,
               verseKey: `${ayahData.surah}:${ayahData.numberInSurah}`,
               reflection: reflectionText,
               tags: [],
            });
         }

         // Reset form
         setReflectionText('');
         setEditingReflectionId(null);

         // Refresh reflections list after a short delay to allow state to update
         setTimeout(() => {
            const verseReflections = allReflections.filter(
               r => r.surahNumber === ayahData.surah && r.ayahNumber === ayahData.numberInSurah
            );
            setCurrentVerseReflections(verseReflections);
         }, 100);
      } catch (error) {
         console.error('Failed to save reflection:', error);
      }
   };

   // Handle editing reflection
   const handleEditReflection = (reflection: any) => {
      setReflectionText(reflection.reflection);
      setEditingReflectionId(reflection.id);
   };

   // Handle deleting reflection
   const handleDeleteReflection = async (id: string) => {
      if (confirm('Are you sure you want to delete this reflection?')) {
         await deleteReflection(id);
         if (editingReflectionId === id) {
            setReflectionText('');
            setEditingReflectionId(null);
         }
      }
   };

   // --- VIEW 1: INDEX (List) ---
   if (mode === 'list') {
      return (
         <div className="space-y-4 animate-in fade-in duration-300 pb-24 bg-neutral-body dark:bg-brand-app min-h-screen px-5 md:px-8 pt-4 mx-auto w-full">
            <div className="flex items-center justify-between pt-2">
               <h2 className="text-2xl font-bold text-neutral-primary dark:text-white">{t('quran')}</h2>

               {/* Resume Button */}
               {lastReadPage && (
                  <button
                     onClick={() => scrollToPage(lastReadPage)}
                     className="bg-brand-primary text-white px-4 py-2 rounded-full text-xs font-bold flex items-center shadow-lg shadow-brand-primary/30 hover:scale-105 transition-transform"
                  >
                     <RotateCcw size={14} className="me-2" /> Resume Page {lastReadPage}
                  </button>
               )}
            </div>

            {/* Search */}
            <div className="relative mt-2">
               <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
               <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Surah Name or Number..."
                  className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3.5 rounded-xl bg-white dark:bg-brand-surface border-none shadow-sm focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm text-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
               />
            </div>

            {/* Tabs */}
            <div>
               <div className="flex p-1 bg-white dark:bg-brand-surface rounded-xl shadow-sm border border-neutral-100 dark:border-white/10">
                  <button
                     onClick={() => setListTab('surah')}
                     className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${listTab === 'surah' ? 'bg-brand-primary text-white shadow' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5'}`}
                  >
                     Surah Index
                  </button>
                  <button
                     onClick={() => setListTab('juz')}
                     className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${listTab === 'juz' ? 'bg-brand-primary text-white shadow' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5'}`}
                  >
                     Juz Index
                  </button>
               </div>
            </div>

            {/* List Content */}
            <div className="space-y-2 pb-8">
               {listTab === 'surah' ? (
                  MOCK_SURAHS.filter(s =>
                     s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     s.name.includes(searchQuery) ||
                     s.number.toString() === searchQuery
                  ).map((surah) => (
                     <div
                        key={surah.number}
                        onClick={() => goToSurah(surah.number)}
                        className="bg-white dark:bg-brand-surface p-4 rounded-2xl border border-neutral-100 dark:border-white/10 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-mint active:scale-[0.99] transition-all group"
                     >
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                           <div className="w-10 h-10 bg-neutral-50 dark:bg-white/5 rounded-lg flex items-center justify-center relative rotate-45 border border-neutral-200 dark:border-white/10 group-hover:border-brand-forest group-hover:bg-brand-forest group-hover:text-white transition-colors">
                              <span className="font-bold text-sm -rotate-45 dark:text-white group-hover:text-white">{surah.number}</span>
                           </div>
                           <div>
                              <h3 className="font-bold text-neutral-primary dark:text-white text-sm">{surah.englishName}</h3>
                              <p className="text-xs text-neutral-muted dark:text-neutral-400">{surah.englishNameTranslation}</p>
                           </div>
                        </div>
                        <div className="text-end">
                           <p className="font-quran font-bold text-xl text-neutral-700 dark:text-emerald-200 group-hover:text-brand-forest dark:group-hover:text-white transition-colors">{surah.name}</p>
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
                  Array.from({ length: 30 }).map((_, i) => {
                     const juzNum = i + 1;
                     if (searchQuery && !`juz ${juzNum}`.includes(searchQuery.toLowerCase())) return null;
                     return (
                        <div
                           key={juzNum}
                           onClick={() => goToJuz(juzNum)}
                           className="bg-white dark:bg-brand-surface p-4 rounded-2xl border border-neutral-100 dark:border-white/10 shadow-sm flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5 group"
                        >
                           <div className="flex items-center space-x-4 rtl:space-x-reverse">
                              <div className="w-10 h-10 rounded-full bg-brand-mint text-brand-forest flex items-center justify-center font-bold text-sm border-2 border-white dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                                 {juzNum}
                              </div>
                              <div>
                                 <span className="font-bold text-neutral-primary dark:text-white block">Juz {juzNum}</span>
                                 <span className="text-xs text-neutral-400">Part {juzNum} of 30</span>
                              </div>
                           </div>
                           <div className="w-8 h-8 flex items-center justify-center bg-neutral-50 dark:bg-white/5 rounded-full text-neutral-400 group-hover:bg-brand-forest group-hover:text-white transition-colors">
                              <ChevronRight size={16} className="rtl:rotate-180" />
                           </div>
                        </div>
                     );
                  })
               )}
            </div>
         </div>
      );
   }

   // --- VIEW 2: INFINITE SCROLL MUSHAF ---
   const activeAyahData = getActiveAyahData();
   // MUSHAF_DATA keys are 1-based, but currentVisiblePage handles that naturally
   const currentPageData = MUSHAF_DATA[currentVisiblePage];
   const currentSurahName = currentPageData?.ayahs.find(a => a.numberInSurah > 0)?.surahName || "Quran";

   // Pages array for Virtuoso
   const allPages = Object.values(MUSHAF_DATA).sort((a, b) => a.pageNumber - b.pageNumber);
   // Helper Component for Scroll Tracking
   const PageObserver = ({ page, onVisible }: { page: number, onVisible: (p: number) => void }) => {
      const ref = useRef<HTMLDivElement>(null);
      useEffect(() => {
         const observer = new IntersectionObserver(([entry]) => {
            // Update when page occupies significant portion of screen
            if (entry.isIntersecting) {
               onVisible(page);
            }
         }, {
            root: null, // viewport
            rootMargin: '-45% 0px -45% 0px', // Only trigger when element is in the middle 10% of screen
            threshold: 0
         });

         if (ref.current) observer.observe(ref.current);
         return () => observer.disconnect();
      }, [page, onVisible]);

      return <div ref={ref} className="absolute inset-y-0 left-0 w-1 pointer-events-none" />;
   };

   // ... inside QuranReader ... (no changes to components above)

   return (
      <div className="fixed inset-0 z-50 bg-[#fffcf5] dark:bg-neutral-950 flex flex-col animate-in slide-in-from-right duration-300">

         {/* 1. HEADER */}
         <div className="bg-[#fffcf5]/95 dark:bg-neutral-950/95 backdrop-blur-sm z-30 border-b border-amber-100/50 dark:border-white/10 px-4 py-2 shadow-sm flex justify-between items-center">
            <div className="flex items-center">
               <button onClick={() => setMode('list')} className="p-2 -ml-2 rtl:ml-0 rtl:-mr-2 rounded-full hover:bg-amber-100 dark:hover:bg-white/10 text-neutral-600 dark:text-white">
                  <BackIcon size={24} />
               </button>
               <button onClick={() => setIsNavOpen(true)} className="p-2 rounded-full hover:bg-amber-100 dark:hover:bg-white/10 text-neutral-600 dark:text-white ms-1">
                  <Menu size={24} />
               </button>
            </div>

            <div className="text-center cursor-pointer" onClick={() => setIsNavOpen(true)}>
               <span className="font-sans font-bold text-sm text-slate-800 dark:text-white block drop-shadow-sm">
                  {currentSurahName}
               </span>
               <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-medium">
                  Page {currentVisiblePage}
               </span>
            </div>

            <div className="flex space-x-1 rtl:space-x-reverse w-[80px] justify-end">
            </div>
         </div>

         {/* 2. VIRTUALIZED CONTAINER */}
         <div className="flex-1 w-full bg-[#fffcf5] dark:bg-neutral-950 transition-colors duration-300">
            <Virtuoso
               ref={virtuosoRef}
               totalCount={allPages.length}
               data={allPages}
               className="h-full w-full no-scrollbar"
               increaseViewportBy={500} // Render ahead for smoother scrolling
               initialTopMostItemIndex={lastReadPage ? lastReadPage - 1 : 0}
               itemContent={(index, page) => (
                  <div
                     key={page.pageNumber}
                     className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-8 pt-4 min-h-[60vh] bg-[#fffcf5] dark:bg-neutral-950 relative transition-colors duration-300"
                  >
                     {/* Intersection Observer for Page Tracking */}
                     <PageObserver
                        page={page.pageNumber}
                        onVisible={(p) => {
                           // Only update if changed prevents verify-loop
                           setCurrentVisiblePage(prev => prev !== p ? p : prev);
                           localStorage.setItem('muslimDaily_lastRead', p.toString());
                           setLastReadPage(p);
                        }}
                     />

                     {/* Page Marker (Top) */}
                     <div className="flex items-center justify-center my-6 opacity-30 select-none">
                        <div className="h-px bg-neutral-400 w-16"></div>
                        <span className="text-[10px] font-mono text-neutral-500 mx-3">PAGE {page.pageNumber}</span>
                        <div className="h-px bg-neutral-400 w-16"></div>
                     </div>

                     <div className="text-center font-quran">

                        {/* Verses Container */}
                        <div
                           className="text-right leading-[4rem] md:leading-[5rem] text-3xl md:text-4xl text-slate-900 dark:text-white dark:drop-shadow-md quran-justify transition-colors duration-300"
                           dir="rtl"
                        >
                           {page.ayahs.map((ayah) => {
                              const isSurahStart = Number(ayah.numberInSurah) === 1;

                              const bismillahPrefixes = [
                                 "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                                 "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"
                              ];

                              let displayText = ayah.text;
                              // Don't strip Bismillah for Fatiha (1) as it's part of the verse
                              // Don't strip for Tawbah (9) as it doesn't have one
                              if (isSurahStart && ayah.surah !== 9 && ayah.surah !== 1) {
                                 for (const prefix of bismillahPrefixes) {
                                    if (displayText.startsWith(prefix)) {
                                       displayText = displayText.replace(prefix, '').trim();
                                       break;
                                    }
                                 }
                              }

                              return (
                                 <React.Fragment key={`${ayah.surah}-${ayah.number}`}>
                                    {isSurahStart && (
                                       <div className="block w-full mt-8 mb-4 clear-both">
                                          <SurahHeader
                                             nameArabic={ayah.surahNameArabic || `Surah ${ayah.surah}`}
                                             nameEnglish={ayah.surahName}
                                             number={ayah.surah}
                                          />
                                          {/* Show decorative Bismillah for all Surahs except Fatiha (1) and Tawbah (9) */}
                                          {ayah.surah !== 9 && ayah.surah !== 1 && <Bismillah />}
                                       </div>
                                    )}

                                    <span
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleVerseClick(page.pageNumber, ayah.numberInSurah);
                                       }}
                                       className={`
                                            inline px-1 rounded-lg cursor-pointer transition-colors duration-200 relative
                                            ${selectedAyahNum === ayah.numberInSurah && selectedAyahPage === page.pageNumber ? 'bg-brand-mint/60 dark:bg-brand-primary/40 text-brand-forest dark:text-white' : 'hover:bg-amber-50 dark:hover:bg-white/5'}
                                         `}
                                    >
                                       {bookmarks.has(`ayah:${page.pageNumber}:${ayah.numberInSurah}`) && (
                                          <Bookmark size={12} className="absolute -top-1 right-0 fill-red-500 text-red-500" />
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
               )}
               components={{
                  Footer: () => (
                     <div className="text-center py-12 text-neutral-400">
                        <div className="w-12 h-12 border-4 border-neutral-200 border-t-brand-forest rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xs">End of loaded content</p>
                     </div>
                  )
               }}
            />
         </div>

         {/* 3. FLOATING ACTION BUTTON (Bookmark Page) */}
         {
            !showAyahMenu && (
               <button
                  onClick={() => toggleBookmark(currentVisiblePage)}
                  className="fixed bottom-8 right-6 z-40 w-14 h-14 bg-neutral-900 text-white rounded-full shadow-xl shadow-black/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform rtl:right-auto rtl:left-6"
               >
                  {bookmarks.has(`page:${currentVisiblePage}`) ? (
                     <Bookmark className="fill-brand-mint text-brand-mint" size={24} />
                  ) : (
                     <Bookmark size={24} />
                  )}
               </button>
            )
         }

         {/* 4. NAVIGATION DRAWER */}
         {
            isNavOpen && (
               <div className="fixed inset-0 z-[60] flex justify-end">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsNavOpen(false)}></div>
                  <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                     <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                        <h3 className="font-bold text-lg text-neutral-primary">Navigation</h3>
                        <button onClick={() => setIsNavOpen(false)}><X size={24} className="text-neutral-400" /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* My Reflections Button */}
                        <button
                           onClick={() => {
                              setIsNavOpen(false);
                              setActiveSheet('all_reflections');
                           }}
                           className="w-full flex items-center p-3 rounded-xl bg-brand-mint/10 text-brand-forest hover:bg-brand-mint/20 transition-colors mb-6"
                        >
                           <Brain className="me-3" size={20} />
                           <span className="font-bold">My Reflections</span>
                        </button>

                        {/* Quick Jump */}
                        <div>
                           <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Jump to Surah</h4>
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
                        </div>
                     </div>
                  </div>
               </div>
            )
         }

         {/* All Reflections Sheet (Full Screen or Large Modal) */}
         {
            activeSheet === 'all_reflections' && (
               <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                     <div className="flex items-center">
                        <Brain className="text-brand-forest me-2" size={20} />
                        <h3 className="font-bold text-lg text-neutral-primary">My Reflections</h3>
                     </div>
                     <button onClick={() => setActiveSheet(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-neutral-body">
                     {allReflections.length > 0 ? (
                        <div className="space-y-4 max-w-2xl mx-auto">
                           {allReflections.map((ref) => {
                              // Find surah name
                              const surah = MOCK_SURAHS.find(s => s.number === ref.surahNumber);
                              return (
                                 <div
                                    key={ref.id}
                                    onClick={() => {
                                       setActiveSheet(null);
                                       goToSurah(ref.surahNumber);
                                    }}
                                    className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:border-brand-forest/50 hover:shadow-md transition-all group"
                                 >
                                    <div className="flex justify-between items-start mb-2">
                                       <div>
                                          <span className="text-xs font-bold text-brand-forest bg-brand-mint/10 px-2 py-1 rounded-md mb-1 inline-block">
                                             {surah?.englishName} {ref.surahNumber}:{ref.ayahNumber}
                                          </span>
                                          <p className="text-neutral-800 text-sm leading-relaxed line-clamp-3">{ref.reflection}</p>
                                       </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-50">
                                       <span className="text-[10px] text-neutral-400 font-medium">
                                          {new Date(ref.updatedAt).toLocaleDateString()}
                                       </span>
                                       <span className="text-xs text-brand-forest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                          Go to Verse →
                                       </span>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                           <Brain size={48} className="mb-4 opacity-20" />
                           <p className="font-bold text-neutral-600">No reflections yet</p>
                           <p className="text-sm">Tap on any verse and select "Reflect" to start writing.</p>
                        </div>
                     )}
                  </div>
               </div>
            )
         }

         {/* 5. MENU: SELECTED AYAH ACTIONS */}
         {
            showAyahMenu && activeAyahData && (
               <div
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
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
                                 <span className="bg-brand-forest text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono shadow-md shadow-brand-forest/30">
                                    {activeAyahData.numberInSurah}
                                 </span>
                                 <div>
                                    <h3 className="font-bold text-neutral-primary text-base">{activeAyahData.surahName}</h3>
                                    <p className="text-xs text-neutral-400 font-medium">Ayah {activeAyahData.numberInSurah} • Page {selectedAyahPage}</p>
                                 </div>
                              </div>
                              <div className="flex space-x-2">
                                 <button
                                    onClick={() => toggleBookmark(selectedAyahPage!, activeAyahData.numberInSurah)}
                                    className={`p-2 rounded-full transition-colors ${bookmarks.has(`ayah:${selectedAyahPage}:${activeAyahData.numberInSurah}`) ? "bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400" : "bg-neutral-50 dark:bg-white/10 text-neutral-400"}`}
                                 >
                                    <Bookmark size={20} className={bookmarks.has(`ayah:${selectedAyahPage}:${activeAyahData.numberInSurah}`) ? "fill-current" : ""} />
                                 </button>
                                 <button className="p-2 rounded-full bg-neutral-50 text-neutral-400 hover:bg-neutral-100">
                                    <Share2 size={20} />
                                 </button>
                              </div>
                           </div>

                           {/* Quick Actions Grid */}
                           <div className="grid grid-cols-4 gap-4 mb-6">
                              <ActionButton
                                 icon={isPlaying && currentSurah === activeAyahData.surah && currentAyah === activeAyahData.numberInSurah ? Pause : PlayCircle}
                                 label={isPlaying && currentSurah === activeAyahData.surah && currentAyah === activeAyahData.numberInSurah ? "Pause" : "Play"}
                                 onClick={handlePlayAudio}
                              />
                              <ActionButton icon={Book} label="Tafsir" onClick={handleLoadTafsir} />
                              <ActionButton icon={Brain} label="Reflect" onClick={() => {
                                 const ayahData = getActiveAyahData();
                                 if (ayahData) {
                                    const verseReflections = allReflections.filter(
                                       r => r.surahNumber === ayahData.surah && r.ayahNumber === ayahData.numberInSurah
                                    );
                                    setCurrentVerseReflections(verseReflections);
                                 }
                                 setActiveSheet('reflections');
                              }} />
                              <ActionButton icon={List} label="Details" onClick={() => { }} />
                           </div>

                           {/* Ayah Text Preview */}
                           <div className="bg-[#fffcf5] dark:bg-brand-surface p-5 rounded-2xl border border-amber-100/50 dark:border-white/10 max-h-48 overflow-y-auto shadow-inner">
                              <p className="font-quran text-2xl text-right mb-3 leading-loose text-neutral-800 dark:text-white drop-shadow-sm" dir="rtl">{activeAyahData.text}</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{activeAyahData.translation}</p>
                           </div>
                        </>
                     ) : (
                        /* Sub-Sheet: Tafsir or Notes */
                        <div className="h-[50vh] flex flex-col">
                           <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                              <button onClick={() => setActiveSheet(null)} className="flex items-center text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-brand-forest dark:hover:text-white">
                                 <BackIcon size={18} className="me-1" /> {t('back')}
                              </button>
                              <span className="font-bold text-neutral-800 dark:text-white text-sm uppercase tracking-wide">{activeSheet === 'tafsir' ? 'Tafsir Ibn Kathir' : 'Reflections'}</span>
                              <div className="w-10"></div>
                           </div>

                           <div className="flex-1 overflow-y-auto no-scrollbar">
                              {activeSheet === 'tafsir' ? (
                                 <div className="space-y-4 p-1">
                                    <h4 className="font-bold text-neutral-800 dark:text-white">Tafsir for Ayah {activeAyahData.numberInSurah}</h4>
                                    {isLoadingTafsir ? (
                                       <div className="space-y-2 opacity-50">
                                          <div className="h-2 bg-neutral-200 rounded w-full animate-pulse"></div>
                                          <div className="h-2 bg-neutral-200 rounded w-5/6 animate-pulse"></div>
                                          <div className="h-2 bg-neutral-200 rounded w-4/6 animate-pulse"></div>
                                       </div>
                                    ) : tafsir ? (
                                       <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                          {tafsir.text}
                                       </p>
                                    ) : (
                                       <p className="text-sm text-neutral-400 italic">No tafsir available for this verse.</p>
                                    )}
                                 </div>
                              ) : activeSheet === 'reflections' ? (
                                 <div className="h-full flex flex-col space-y-4">
                                    {/* Header */}
                                    <div className="p-4 bg-brand-mint/10 rounded-xl border border-brand-mint/30">
                                       <div className="flex items-center gap-2 mb-2">
                                          <Brain className="text-brand-forest" size={20} />
                                          <h4 className="font-bold text-brand-forest">Your Reflections</h4>
                                       </div>
                                       <p className="text-xs text-neutral-600">Save your thoughts and insights about this ayah</p>
                                    </div>

                                    {/* Existing Reflections List */}
                                    {currentVerseReflections.length > 0 && (
                                       <div className="space-y-3 max-h-48 overflow-y-auto">
                                          <h5 className="text-xs font-bold text-neutral-400 uppercase">Previous Reflections</h5>
                                          {currentVerseReflections.map((reflection) => (
                                             <div
                                                key={reflection.id}
                                                className={`p-3 rounded-xl border ${editingReflectionId === reflection.id ? 'border-brand-forest bg-brand-mint/10' : 'border-neutral-200 bg-white'} transition-all`}
                                             >
                                                <p className="text-sm text-neutral-700 mb-2">{reflection.reflection}</p>
                                                <div className="flex items-center justify-between">
                                                   <span className="text-[10px] text-neutral-400">
                                                      {new Date(reflection.updatedAt).toLocaleDateString()}
                                                   </span>
                                                   <div className="flex gap-1">
                                                      <button
                                                         onClick={() => handleEditReflection(reflection)}
                                                         className="p-1.5 rounded-lg bg-neutral-100 hover:bg-brand-mint text-neutral-600 hover:text-brand-forest transition-colors"
                                                      >
                                                         <PenTool size={14} />
                                                      </button>
                                                      <button
                                                         onClick={() => handleDeleteReflection(reflection.id)}
                                                         className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-500 transition-colors"
                                                      >
                                                         <Trash2 size={14} />
                                                      </button>
                                                   </div>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    )}

                                    {/* Reflection Form */}
                                    <div className="flex-1 flex flex-col min-h-0">
                                       <label className="text-xs font-bold text-neutral-600 mb-2">
                                          {editingReflectionId ? 'Edit Reflection' : 'New Reflection'}
                                       </label>
                                       <textarea
                                          value={reflectionText}
                                          onChange={(e) => setReflectionText(e.target.value)}
                                          className="flex-1 w-full p-4 rounded-xl bg-neutral-50 border border-neutral-200 resize-none text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none mb-2"
                                          placeholder="What does this ayah mean to you? What lessons can you apply in your life?"
                                          autoFocus
                                       />
                                       <div className="flex gap-2 pt-2 border-t border-neutral-100 bg-white sticky bottom-0 z-10">
                                          {editingReflectionId && (
                                             <Button
                                                fullWidth
                                                variant="outline"
                                                onClick={() => {
                                                   setReflectionText('');
                                                   setEditingReflectionId(null);
                                                }}
                                             >
                                                Cancel
                                             </Button>
                                          )}
                                          <Button
                                             fullWidth
                                             onClick={handleSaveReflection}
                                             disabled={!reflectionText.trim()}
                                             className="bg-brand-forest hover:bg-brand-forest/90 text-white shadow-lg shadow-brand-forest/20"
                                          >
                                             {editingReflectionId ? 'Update' : 'Save'}
                                          </Button>
                                       </div>
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
            )
         }

      </div >
   );
};

// Helper Component
const ActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-2 group w-full">
      <div className="w-14 h-14 rounded-2xl bg-neutral-50 text-neutral-600 flex items-center justify-center group-hover:bg-brand-mint group-hover:text-brand-forest transition-all shadow-sm group-active:scale-95">
         <Icon size={22} strokeWidth={1.5} />
      </div>
      <span className="text-[10px] font-bold text-neutral-500 group-hover:text-brand-forest tracking-wide">{label}</span>
   </button>
);
