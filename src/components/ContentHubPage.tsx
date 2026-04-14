/**
 * ContentHubPage - Islamic articles and videos with recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    Search,
    X,
    Play,
    ExternalLink,
    Clock,
    Filter,
    Sparkles,
    CheckCircle2,
    ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    contentService,
    ContentItem,
    ContentCategory,
    CONTENT_CATEGORIES,
} from '../services/ContentService';

type Tab = 'forYou' | 'videos' | 'articles' | 'bookmarks';
type FilterType = 'all' | ContentCategory;

interface ContentHubPageProps {
    onBack: () => void;
}

export const ContentHubPage: React.FC<ContentHubPageProps> = ({ onBack }) => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('forYou');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<FilterType>('all');
    const [selectedVideo, setSelectedVideo] = useState<ContentItem | null>(null);
    const [, forceUpdate] = useState(0);

    const refresh = () => forceUpdate(n => n + 1);

    const tabs: { id: Tab; label: string; labelAr: string }[] = [
        { id: 'forYou', label: 'For You', labelAr: 'لك' },
        { id: 'videos', label: 'Videos', labelAr: 'فيديوهات' },
        { id: 'articles', label: 'Articles', labelAr: 'مقالات' },
        { id: 'bookmarks', label: 'Saved', labelAr: 'المحفوظة' },
    ];

    const getTabContent = (): ContentItem[] => {
        let items: ContentItem[];

        switch (activeTab) {
            case 'forYou':
                items = contentService.getForYou();
                break;
            case 'videos':
                items = contentService.getVideos();
                break;
            case 'articles':
                items = contentService.getArticles();
                break;
            case 'bookmarks':
                items = contentService.getBookmarked();
                break;
            default:
                items = [];
        }

        // Apply search
        if (searchQuery) {
            items = contentService.search(searchQuery).filter(c =>
                activeTab === 'videos' ? c.type === 'video' :
                    activeTab === 'articles' ? c.type === 'article' :
                        true
            );
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            items = items.filter(c => c.category === categoryFilter);
        }

        return items;
    };

    const content = useMemo(getTabContent, [activeTab, searchQuery, categoryFilter]);

    if (selectedVideo) {
        return (
            <VideoPlayer
                video={selectedVideo}
                onBack={() => {
                    setSelectedVideo(null);
                    refresh();
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="bg-brand-surface/80 backdrop-blur-xl border-b border-white/5 text-neutral-900 px-4 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-900 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold">
                        {language === 'ar' ? 'مركز المحتوى' : 'Content Hub'}
                    </h1>
                    <div className="w-8" />
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search size={18} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث...' : 'Search content...'}
                        className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-10 py-2 bg-brand-surface/40 border border-white/10 rounded-xl text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 rtl:space-x-reverse">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-brand-surface text-brand-secondary shadow-sm'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            {language === 'ar' ? tab.labelAr : tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div className="px-4 py-3 overflow-x-auto flex space-x-2 rtl:space-x-reverse border-b border-white/5 bg-brand-surface/20 backdrop-blur-sm">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === 'all'
                        ? 'bg-brand-secondary/20 text-brand-secondary'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                >
                    {language === 'ar' ? 'الكل' : 'All'}
                </button>
                {CONTENT_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat.id
                            ? 'bg-brand-secondary/20 text-brand-secondary'
                            : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                            }`}
                    >
                        {cat.icon} {language === 'ar' ? cat.nameAr : cat.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* For You - Featured Section */}
                {activeTab === 'forYou' && !searchQuery && categoryFilter === 'all' && (
                    <FeaturedSection onSelectVideo={setSelectedVideo} />
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {content.map(item => (
                        <ContentCard
                            key={item.id}
                            item={item}
                            onSelect={() => {
                                if (item.type === 'video') {
                                    setSelectedVideo(item);
                                } else {
                                    window.open(item.url, '_blank');
                                    contentService.markCompleted(item.id);
                                    refresh();
                                }
                            }}
                            onBookmark={() => {
                                contentService.toggleBookmark(item.id);
                                refresh();
                            }}
                        />
                    ))}
                </div>

                {content.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
                        <Search size={40} className="mx-auto mb-2 opacity-50" />
                        <p>{language === 'ar' ? 'لا توجد نتائج' : 'No content found'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// =================== FEATURED SECTION ===================

const FeaturedSection: React.FC<{ onSelectVideo: (v: ContentItem) => void }> = ({ onSelectVideo }) => {
    const { language } = useLanguage();
    const featured = contentService.getFeatured().slice(0, 5);
    const recentlyViewed = contentService.getRecentlyViewed().slice(0, 5);

    return (
        <div className="mb-6 space-y-4">
            {/* Featured */}
            <div>
                <h3 className="flex items-center text-sm font-bold text-neutral-400 mb-2">
                    <Sparkles size={14} className="me-1 text-brand-secondary" />
                    {language === 'ar' ? 'مميز' : 'Featured'}
                </h3>
                <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto pb-2 -mx-4 px-4">
                    {featured.map(item => (
                        <FeaturedCard key={item.id} item={item} onSelect={() => {
                            if (item.type === 'video') {
                                onSelectVideo(item);
                            } else {
                                window.open(item.url, '_blank');
                                contentService.markCompleted(item.id);
                            }
                        }} />
                    ))}
                </div>
            </div>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <div>
                    <h3 className="flex items-center text-sm font-bold text-neutral-400 mb-2">
                        <Clock size={14} className="me-1 text-neutral-500" />
                        {language === 'ar' ? 'شاهدت مؤخراً' : 'Continue Watching'}
                    </h3>
                    <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto pb-2 -mx-4 px-4">
                        {recentlyViewed.map(item => (
                            <FeaturedCard key={item.id} item={item} onSelect={() => {
                                if (item.type === 'video') {
                                    onSelectVideo(item);
                                } else {
                                    window.open(item.url, '_blank');
                                }
                            }} small />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// =================== FEATURED CARD ===================

const FeaturedCard: React.FC<{
    item: ContentItem;
    onSelect: () => void;
    small?: boolean;
}> = ({ item, onSelect, small }) => {
    const isCompleted = contentService.isCompleted(item.id);
    const category = CONTENT_CATEGORIES.find(c => c.id === item.category);

    return (
        <button
            onClick={onSelect}
            className={`flex-shrink-0 rounded-xl overflow-hidden bg-brand-surface/40 backdrop-blur-md border border-white/5 shadow-sm ${small ? 'w-36' : 'w-56'
                }`}
        >
            <div className={`relative ${small ? 'h-20' : 'h-28'} bg-black/20`}>
                <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Content'; }}
                />
                {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={small ? 20 : 28} fill="white" className="text-white" />
                    </div>
                )}
                {isCompleted && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                        <CheckCircle2 size={12} className="text-white" />
                    </div>
                )}
            </div>
            <div className="p-2">
                <p className={`font-medium text-start line-clamp-2 text-neutral-900 ${small ? 'text-xs' : 'text-sm'}`}>
                    {item.title}
                </p>
                <div className="flex items-center mt-1 text-xs text-neutral-400">
                    <span>{category?.icon}</span>
                    {item.duration && (
                        <span className="ms-1">{item.duration}m</span>
                    )}
                </div>
            </div>
        </button>
    );
};

// =================== CONTENT CARD ===================

const ContentCard: React.FC<{
    item: ContentItem;
    onSelect: () => void;
    onBookmark: () => void;
}> = ({ item, onSelect, onBookmark }) => {
    const { language } = useLanguage();
    const isBookmarked = contentService.isBookmarked(item.id);
    const isCompleted = contentService.isCompleted(item.id);
    const category = CONTENT_CATEGORIES.find(c => c.id === item.category);

    return (
        <div className="bg-brand-surface/40 backdrop-blur-md rounded-xl overflow-hidden shadow-sm flex border border-white/5">
            {/* Thumbnail */}
            <button onClick={onSelect} className="relative w-28 h-24 flex-shrink-0 bg-black/20">
                <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Content'; }}
                />
                {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={24} fill="white" className="text-white" />
                    </div>
                )}
                {item.type === 'article' && (
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded p-0.5 text-white/80">
                        <ExternalLink size={12} className="text-white" />
                    </div>
                )}
                {isCompleted && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                        <CheckCircle2 size={12} className="text-white" />
                    </div>
                )}
            </button>

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <button onClick={onSelect} className="text-start">
                    <h4 className="font-medium text-sm line-clamp-2 text-neutral-900">{item.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{item.description}</p>
                </button>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-neutral-500">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded">
                            {category?.icon} {language === 'ar' ? category?.nameAr : category?.name}
                        </span>
                        {item.duration && (
                            <span className="flex items-center">
                                <Clock size={10} className="me-0.5" />
                                {item.duration}m
                            </span>
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onBookmark(); }}
                        className={`p-1.5 rounded-full transition-colors ${isBookmarked
                            ? 'bg-brand-secondary/20 text-brand-secondary'
                            : 'text-neutral-400 hover:bg-white/5'
                            }`}
                    >
                        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =================== VIDEO PLAYER ===================

const VideoPlayer: React.FC<{
    video: ContentItem;
    onBack: () => void;
}> = ({ video, onBack }) => {
    const { language } = useLanguage();
    const [isBookmarked, setIsBookmarked] = useState(contentService.isBookmarked(video.id));

    // Extract YouTube video ID
    const videoId = video.url.match(/(?:v=|\/)([\w-]{11})/)?.[1];

    useEffect(() => {
        // Start tracking video progress
        const interval = setInterval(() => {
            // YouTube iframe API would track actual progress here
            // For simplicity, we'll just mark as viewed after 30 seconds
        }, 30000);

        // Mark as started viewing
        contentService.updateVideoProgress(video.id, 10);

        return () => clearInterval(interval);
    }, [video.id]);

    const handleBookmark = () => {
        const newState = contentService.toggleBookmark(video.id);
        setIsBookmarked(newState);
    };

    const handleMarkComplete = () => {
        contentService.markCompleted(video.id);
        onBack();
    };

    const category = CONTENT_CATEGORIES.find(c => c.id === video.category);
    const relatedVideos = contentService.getByCategory(video.category)
        .filter(v => v.id !== video.id && v.type === 'video')
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-black">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
                {videoId ? (
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-white">
                        <p>Video unavailable</p>
                    </div>
                )}

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 bg-black/50 rounded-full text-white z-10"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* Video Info */}
            <div className="bg-neutral-900 px-4 py-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-white">{video.title}</h1>
                        <p className="text-sm text-neutral-400 mt-1">{video.channel}</p>
                    </div>
                    <button
                        onClick={handleBookmark}
                        className={`p-2 rounded-full ${isBookmarked ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'
                            }`}
                    >
                        {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                    </button>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse mt-3">
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300">
                        {category?.icon} {language === 'ar' ? category?.nameAr : category?.name}
                    </span>
                    {video.duration && (
                        <span className="text-xs text-neutral-400">
                            {video.duration} {language === 'ar' ? 'دقيقة' : 'min'}
                        </span>
                    )}
                </div>

                <p className="text-sm text-neutral-400 mt-3">{video.description}</p>

                {/* Mark Complete Button */}
                <button
                    onClick={handleMarkComplete}
                    className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                    <CheckCircle2 size={18} />
                    <span>{language === 'ar' ? 'تم المشاهدة' : 'Mark as Watched'}</span>
                </button>
            </div>

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
                <div className="bg-neutral-950 px-4 py-4">
                    <h3 className="text-sm font-bold text-white mb-3">
                        {language === 'ar' ? 'فيديوهات مشابهة' : 'Related Videos'}
                    </h3>
                    <div className="space-y-3">
                        {relatedVideos.map(v => (
                            <button
                                key={v.id}
                                onClick={() => {
                                    onBack();
                                    // Would navigate to this video
                                }}
                                className="flex w-full bg-neutral-900 rounded-lg overflow-hidden"
                            >
                                <div className="relative w-28 h-20 flex-shrink-0 bg-neutral-800">
                                    <img
                                        src={v.thumbnailUrl}
                                        alt={v.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200x150'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <Play size={20} fill="white" className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 p-2 text-start">
                                    <h4 className="text-xs font-medium text-white line-clamp-2">{v.title}</h4>
                                    <p className="text-xs text-neutral-500 mt-1">{v.channel}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
