/**
 * QuranAudioPlayer - Floating audio player for Quran recitation
 */

import React, { useState } from 'react';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Repeat,
    X,
    Loader2,
    ChevronDown,
    User,
    Settings2
} from 'lucide-react';
import { useQuranAudio } from '../hooks/useQuranAudio';
import { useLanguage } from '../contexts/LanguageContext';

interface QuranAudioPlayerProps {
    totalAyahsInSurah: number;
    surahName: string;
    onClose?: () => void;
}

export const QuranAudioPlayer: React.FC<QuranAudioPlayerProps> = ({
    totalAyahsInSurah,
    surahName,
    onClose,
}) => {
    const { t, language, dir } = useLanguage();
    const {
        isPlaying,
        isLoading,
        currentSurah,
        currentAyah,
        duration,
        currentTime,
        progress,
        repeatMode,
        reciters,
        currentReciter,
        toggle,
        playNextVerse,
        playPreviousVerse,
        stop,
        seekPercent,
        setReciter,
        setRepeatMode,
        setPlaybackSpeed,
        settings,
    } = useQuranAudio();

    const [showReciterMenu, setShowReciterMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Format time as mm:ss
    const formatTime = (seconds: number): string => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // If nothing is playing, don't show the player
    if (currentSurah === null || currentAyah === null) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-safe-area animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl shadow-black/20 border border-neutral-line overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-forest to-brand-teal px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🎧</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">{surahName}</p>
                            <p className="text-white/80 text-xs">
                                {t('quran_verse_num').replace('{num}', currentAyah.toString())}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            stop();
                            onClose?.();
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Reciter Display */}
                <div className="px-4 py-2 border-b border-neutral-line bg-neutral-50/50">
                    <button
                        onClick={() => setShowReciterMenu(!showReciterMenu)}
                        className="flex items-center space-x-2 rtl:space-x-reverse text-sm"
                    >
                        <User size={14} className="text-neutral-muted" />
                        <span className="text-neutral-primary font-medium">
                            {currentReciter?.englishName || 'Select Reciter'}
                        </span>
                        <ChevronDown size={14} className={`text-neutral-muted transition-transform ${showReciterMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Reciter Dropdown */}
                    {showReciterMenu && (
                        <div className="mt-2 py-2 space-y-1 max-h-40 overflow-y-auto">
                            {reciters.map(reciter => (
                                <button
                                    key={reciter.id}
                                    onClick={() => {
                                        setReciter(reciter.id);
                                        setShowReciterMenu(false);
                                    }}
                                    className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${reciter.id === currentReciter?.id
                                        ? 'bg-brand-mint text-brand-forest font-medium'
                                        : 'hover:bg-neutral-100 text-neutral-primary'
                                        }`}
                                >
                                    <p>{reciter.englishName}</p>
                                    <p className="text-xs text-neutral-muted font-arabic">{reciter.arabicName}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="px-4 pt-3">
                    <div
                        className="h-1.5 bg-neutral-200 rounded-full overflow-hidden cursor-pointer"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const percent = (x / rect.width) * 100;
                            seekPercent(percent);
                        }}
                    >
                        <div
                            className="h-full bg-brand-forest rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-neutral-muted">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-4 py-4 flex items-center justify-between">
                    {/* Speed Control */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="text-xs font-medium text-neutral-muted hover:text-brand-forest transition-colors px-2 py-1 rounded bg-neutral-100"
                        >
                            {settings.playbackSpeed}x
                        </button>

                        {showSpeedMenu && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-neutral-line py-2 min-w-[80px]">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => {
                                            setPlaybackSpeed(speed);
                                            setShowSpeedMenu(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-sm text-start hover:bg-neutral-50 ${settings.playbackSpeed === speed ? 'text-brand-forest font-medium' : 'text-neutral-primary'
                                            }`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <button
                            onClick={playPreviousVerse}
                            disabled={currentAyah <= 1}
                            className="p-2 text-neutral-500 hover:text-brand-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <SkipBack size={22} />
                        </button>

                        <button
                            onClick={toggle}
                            disabled={isLoading}
                            className="w-14 h-14 bg-brand-forest rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-forest/30 hover:bg-brand-teal transition-all active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : isPlaying ? (
                                <Pause size={24} />
                            ) : (
                                <Play size={24} className="ms-1" />
                            )}
                        </button>

                        <button
                            onClick={() => playNextVerse(totalAyahsInSurah)}
                            disabled={currentAyah >= totalAyahsInSurah}
                            className="p-2 text-neutral-500 hover:text-brand-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <SkipForward size={22} />
                        </button>
                    </div>

                    {/* Repeat Control */}
                    <button
                        onClick={() => {
                            const modes: ('none' | 'verse' | 'surah')[] = ['none', 'verse', 'surah'];
                            const currentIndex = modes.indexOf(repeatMode);
                            const nextIndex = (currentIndex + 1) % modes.length;
                            setRepeatMode(modes[nextIndex]);
                        }}
                        className={`p-2 rounded-lg transition-colors ${repeatMode !== 'none'
                            ? 'text-brand-forest bg-brand-mint'
                            : 'text-neutral-400 hover:text-brand-forest'
                            }`}
                    >
                        <Repeat size={18} />
                        {repeatMode === 'verse' && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-brand-forest text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">1</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
