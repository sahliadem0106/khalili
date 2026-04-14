
import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, BookOpen } from 'lucide-react';

interface Dua {
    id: string;
    arabic: string;
    english: string;
    transliteration: string;
    category: string;
    source?: string;
}

const DAILY_DUAS: Dua[] = [
    {
        id: '1',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ',
        english: 'O Allah, I ask You for forgiveness and well-being in this world and the Hereafter.',
        transliteration: "Allahumma inni as'aluka al-'afwa wal-'afiyah fid-dunya wal-akhirah",
        category: 'General',
        source: 'Ibn Majah'
    },
    {
        id: '2',
        arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
        english: 'My Lord, expand for me my chest and ease for me my task.',
        transliteration: 'Rabbi-shrah li sadri wa yassir li amri',
        category: 'Guidance',
        source: 'Quran 20:25-26'
    },
    {
        id: '3',
        arabic: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
        english: 'O Allah, protect me from the Fire.',
        transliteration: 'Allahumma ajirni min an-nar',
        category: 'Protection',
        source: 'Abu Dawud'
    },
    {
        id: '4',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the torment of the Fire.',
        transliteration: 'Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah waqina adhab an-nar',
        category: 'Comprehensive',
        source: 'Quran 2:201'
    },
    {
        id: '5',
        arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ',
        english: 'O Allah, forgive all my sins.',
        transliteration: 'Allahumma-ghfir li dhanbi kullahu',
        category: 'Forgiveness',
        source: 'Muslim'
    },
    {
        id: '6',
        arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
        english: 'O Turner of hearts, keep my heart firm on Your religion.',
        transliteration: 'Ya muqallib al-qulub thabbit qalbi ala dinik',
        category: 'Faith',
        source: 'Tirmidhi'
    },
    {
        id: '7',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
        english: 'O Allah, I seek refuge in You from anxiety and grief.',
        transliteration: "Allahumma inni a'udhu bika min al-hammi wal-hazan",
        category: 'Relief',
        source: 'Bukhari'
    }
];

export const DailyDuaWidget: React.FC = () => {
    const [currentDua, setCurrentDua] = useState<Dua | null>(null);
    const [fadeIn, setFadeIn] = useState(true);

    useEffect(() => {
        // Get today's dua based on day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const duaIndex = dayOfYear % DAILY_DUAS.length;
        setCurrentDua(DAILY_DUAS[duaIndex]);
    }, []);

    const handleRefresh = () => {
        setFadeIn(false);
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * DAILY_DUAS.length);
            setCurrentDua(DAILY_DUAS[randomIndex]);
            setFadeIn(true);
        }, 200);
    };

    if (!currentDua) return null;

    return (
        <div className="bg-white dark:bg-brand-surface rounded-2xl p-5 border border-emerald-100/50 dark:border-white/10 shadow-sm mb-6 card-3d">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center">
                        <Heart size={16} className="text-rose-500 fill-rose-500 drop-shadow-sm" />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-900 dark:text-white text-sm drop-shadow-sm">Daily Dua</h3>
                        <span className="text-[10px] text-emerald-600/60 dark:text-emerald-200/80 uppercase tracking-wide font-medium">{currentDua.category}</span>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-emerald-50 dark:hover:bg-white/5 rounded-lg transition-colors group"
                    title="Get another dua"
                >
                    <RefreshCw size={16} className="text-emerald-400 group-hover:text-emerald-600 dark:text-emerald-200 transition-colors" />
                </button>
            </div>

            {/* Dua Content */}
            <div className={`transition-opacity duration-200 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                {/* Arabic */}
                <p className="text-xl font-arabic text-emerald-900 dark:text-white text-right leading-loose mb-3 drop-shadow-md">
                    {currentDua.arabic}
                </p>

                {/* Transliteration */}
                <p className="text-sm text-emerald-600/70 dark:text-emerald-200/90 italic mb-2">
                    {currentDua.transliteration}
                </p>

                {/* English */}
                <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed font-medium">
                    {currentDua.english}
                </p>

                {/* Source */}
                {currentDua.source && (
                    <div className="mt-3 pt-3 border-t border-emerald-50 dark:border-white/10 flex items-center gap-1.5">
                        <BookOpen size={12} className="text-emerald-300 dark:text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 dark:text-emerald-300 font-medium">{currentDua.source}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
