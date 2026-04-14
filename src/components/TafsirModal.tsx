/**
 * TafsirModal - Modal for displaying Quran tafsir (commentary)
 */

import React, { useEffect, useState } from 'react';
import {
    X,
    BookOpen,
    ChevronDown,
    Loader2,
    AlertCircle,
    Volume2,
    Copy,
    Check
} from 'lucide-react';
import { useTafsir } from '../hooks/useTafsir';
import { useQuranAudio } from '../hooks/useQuranAudio';
import { useLanguage } from '../contexts/LanguageContext';

interface TafsirModalProps {
    isOpen: boolean;
    onClose: () => void;
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    surahName: string;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
    isOpen,
    onClose,
    surahNumber,
    ayahNumber,
    arabicText,
    surahName,
}) => {
    const { t, language, dir } = useLanguage();
    const {
        tafsir,
        translation,
        isLoadingTafsir,
        isLoadingTranslation,
        error,
        tafsirSources,
        translationSources,
        selectedTafsirId,
        selectedTranslationId,
        loadTafsir,
        loadTranslation,
        setTafsirSource,
        setTranslationSource,
        clearTafsir,
    } = useTafsir();

    const { playVerse, isPlaying, currentAyah, currentSurah, toggle, stop } = useQuranAudio();

    const [activeTab, setActiveTab] = useState<'translation' | 'tafsir'>('translation');
    const [showSourceMenu, setShowSourceMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load content when modal opens
    useEffect(() => {
        if (isOpen) {
            loadTranslation(surahNumber, ayahNumber);
            loadTafsir(surahNumber, ayahNumber);
        } else {
            clearTafsir();
        }
    }, [isOpen, surahNumber, ayahNumber, loadTranslation, loadTafsir, clearTafsir]);

    // Get current source based on tab
    const currentSource = activeTab === 'tafsir'
        ? tafsirSources.find(s => s.id === selectedTafsirId)
        : translationSources.find(s => s.id === selectedTranslationId);

    const sources = activeTab === 'tafsir' ? tafsirSources : translationSources;
    const selectedId = activeTab === 'tafsir' ? selectedTafsirId : selectedTranslationId;
    const setSource = activeTab === 'tafsir' ? setTafsirSource : setTranslationSource;
    const isLoading = activeTab === 'tafsir' ? isLoadingTafsir : isLoadingTranslation;
    const content = activeTab === 'tafsir' ? tafsir?.text : translation?.text;

    // Handle source change
    const handleSourceChange = (id: number) => {
        setSource(id);
        setShowSourceMenu(false);
        // Reload content with new source
        if (activeTab === 'tafsir') {
            loadTafsir(surahNumber, ayahNumber);
        } else {
            loadTranslation(surahNumber, ayahNumber);
        }
    };

    // Play audio for this verse
    const handlePlayAudio = async () => {
        if (isPlaying && currentSurah === surahNumber && currentAyah === ayahNumber) {
            toggle();
        } else {
            await playVerse(surahNumber, ayahNumber);
        }
    };

    // Copy verse text
    const handleCopy = async () => {
        try {
            const textToCopy = `${arabicText}\n\n${content || ''}`;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    // Strip HTML tags for display
    const stripHtml = (html: string): string => {
        if (typeof document === 'undefined') return html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="bg-brand-surface w-full max-h-[85vh] sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-glass border border-brand-border/50 animate-in slide-in-from-bottom duration-300 relative z-10 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-brand-border/20 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                            <BookOpen size={18} className="text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-forest">{surahName}</h3>
                            <p className="text-xs text-brand-muted">
                                {t('tafsir_verse')} {ayahNumber}
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-brand-subtle rounded-full transition-colors">
                        <X size={20} className="text-brand-muted" />
                    </button>
                </div>

                {/* Arabic Verse */}
                <div className="px-5 py-6 bg-brand-subtle border-b border-brand-border/20">
                    <p className="text-xl text-brand-forest font-quran leading-loose text-center" dir="rtl">
                        {arabicText}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-3 rtl:space-x-reverse mt-6">
                        <button
                            onClick={handlePlayAudio}
                            className="btn btn-primary px-6 rounded-full"
                        >
                            <Volume2 size={16} />
                            <span>{t('tafsir_listen')}</span>
                        </button>
                        <button
                            onClick={handleCopy}
                            className="btn btn-secondary px-6 rounded-full"
                        >
                            {copied ? <Check size={16} className="text-brand-primary" /> : <Copy size={16} />}
                            <span>{copied ? t('tafsir_copied') : t('tafsir_copy')}</span>
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="px-5 py-3 border-b border-brand-border/20">
                    <div className="flex bg-brand-subtle p-1 rounded-xl border border-brand-border/20">
                        <button
                            onClick={() => setActiveTab('translation')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'translation'
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-brand-muted hover:text-brand-primary'
                                }`}
                        >
                            {t('tafsir_translation')}
                        </button>
                        <button
                            onClick={() => setActiveTab('tafsir')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'tafsir'
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-brand-muted hover:text-brand-primary'
                                }`}
                        >
                            {t('tafsir_tafsir')}
                        </button>
                    </div>
                </div>

                {/* Source Selector */}
                <div className="px-5 py-2 border-b border-brand-border/20 bg-brand-surface">
                    <button
                        onClick={() => setShowSourceMenu(!showSourceMenu)}
                        className="flex items-center space-x-2 rtl:space-x-reverse text-sm w-full py-1"
                    >
                        <span className="text-brand-muted text-xs uppercase tracking-wider font-semibold">
                            {activeTab === 'tafsir'
                                ? t('tafsir_source')
                                : t('tafsir_source')}
                        </span>
                        <div className="flex-1" />
                        <span className="font-medium text-brand-primary flex-1 truncate text-end">
                            {currentSource?.name || 'Select'}
                        </span>
                        <ChevronDown size={14} className={`text-brand-muted transition-transform ${showSourceMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Source Dropdown */}
                    {showSourceMenu && (
                        <div className="mt-2 py-2 space-y-1 max-h-40 overflow-y-auto bg-brand-surface border border-brand-border rounded-xl shadow-glass mb-2">
                            {sources.map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => handleSourceChange(source.id)}
                                    className={`w-full text-start px-3 py-2 text-sm transition-colors ${source.id === selectedId
                                        ? 'bg-brand-primary/10 text-brand-primary font-medium'
                                        : 'hover:bg-brand-subtle text-brand-forest'
                                        }`}
                                >
                                    <p className="font-medium">{source.name}</p>
                                    <p className="text-xs text-brand-muted">{source.authorName}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 bg-brand-surface">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="text-brand-primary animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle size={32} className="text-red-500 mb-2" />
                            <p className="text-sm text-brand-muted">{error}</p>
                        </div>
                    ) : content ? (
                        <div className="prose prose-sm prose-emerald max-w-none">
                            <p className={`text-brand-forest leading-relaxed whitespace-pre-wrap ${activeTab === 'tafsir' && selectedTafsirId === 164 ? 'font-arabic text-lg text-right' : ''
                                }`} dir={activeTab === 'tafsir' && selectedTafsirId === 164 ? 'rtl' : 'ltr'}>
                                {stripHtml(content)}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BookOpen size={32} className="text-brand-muted mb-2" />
                            <p className="text-sm text-brand-muted">
                                {t('tafsir_no_content')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
