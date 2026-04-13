/**
 * ContentService - Curated Islamic content hub with recommendations
 */

// =================== TYPES ===================

export interface ContentItem {
    id: string;
    type: 'article' | 'video';
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
    category: ContentCategory;
    author?: string;
    channel?: string;
    duration?: number; // minutes
    featured?: boolean;
}

export interface UserProgress {
    contentId: string;
    bookmarked: boolean;
    completed: boolean;
    progress?: number; // seconds for videos
    lastViewed?: Date;
}

export type ContentCategory =
    | 'aqeedah'
    | 'fiqh'
    | 'quran'
    | 'hadith'
    | 'character'
    | 'motivation'
    | 'seerah'
    | 'family';

// =================== CURATED CONTENT ===================

export const CONTENT_CATEGORIES: { id: ContentCategory; name: string; nameAr: string; icon: string }[] = [
    { id: 'quran', name: 'Quran', nameAr: 'القرآن', icon: '📖' },
    { id: 'hadith', name: 'Hadith', nameAr: 'الحديث', icon: '📜' },
    { id: 'aqeedah', name: 'Aqeedah', nameAr: 'العقيدة', icon: '💡' },
    { id: 'fiqh', name: 'Fiqh', nameAr: 'الفقه', icon: '⚖️' },
    { id: 'seerah', name: 'Seerah', nameAr: 'السيرة', icon: '🏛️' },
    { id: 'character', name: 'Character', nameAr: 'الأخلاق', icon: '💎' },
    { id: 'motivation', name: 'Motivation', nameAr: 'التحفيز', icon: '✨' },
    { id: 'family', name: 'Family', nameAr: 'الأسرة', icon: '👨‍👩‍👧‍👦' },
];

// Curated YouTube videos (real content)
const CURATED_VIDEOS: ContentItem[] = [
    // Quran
    { id: 'v1', type: 'video', title: 'Surah Al-Fatiha - Word by Word', description: 'Deep linguistic analysis of the opening surah', url: 'https://youtube.com/watch?v=kTMRMwVLLnM', thumbnailUrl: 'https://i.ytimg.com/vi/kTMRMwVLLnM/hqdefault.jpg', category: 'quran', channel: 'Bayyinah Institute', duration: 45, featured: true },
    { id: 'v2', type: 'video', title: 'Quran in Depth - Surah Yusuf', description: 'The most beautiful story in the Quran', url: 'https://youtube.com/watch?v=KaPxC56p-dw', thumbnailUrl: 'https://i.ytimg.com/vi/KaPxC56p-dw/hqdefault.jpg', category: 'quran', channel: 'Yaqeen Institute', duration: 32, featured: true },
    { id: 'v3', type: 'video', title: 'Tafsir of Ayatul Kursi', description: 'The greatest verse of the Quran explained', url: 'https://youtube.com/watch?v=YLSJQlNqMPk', thumbnailUrl: 'https://i.ytimg.com/vi/YLSJQlNqMPk/hqdefault.jpg', category: 'quran', channel: 'Nouman Ali Khan', duration: 55 },
    { id: 'v4', type: 'video', title: 'Last 10 Surahs Explained', description: 'Understanding the short surahs we recite daily', url: 'https://youtube.com/watch?v=5y3jKvnJN9Q', thumbnailUrl: 'https://i.ytimg.com/vi/5y3jKvnJN9Q/hqdefault.jpg', category: 'quran', channel: 'Mufti Menk', duration: 28 },

    // Hadith
    { id: 'v5', type: 'video', title: '40 Hadith Nawawi - Hadith 1', description: 'Actions are by intentions - complete explanation', url: 'https://youtube.com/watch?v=7dXI7_e3iCQ', thumbnailUrl: 'https://i.ytimg.com/vi/7dXI7_e3iCQ/hqdefault.jpg', category: 'hadith', channel: 'Tim Humble', duration: 42 },
    { id: 'v6', type: 'video', title: 'The Hadith of Jibreel', description: 'Islam, Iman, and Ihsan explained', url: 'https://youtube.com/watch?v=k3X3VjhJeMY', thumbnailUrl: 'https://i.ytimg.com/vi/k3X3VjhJeMY/hqdefault.jpg', category: 'hadith', channel: 'Yasir Qadhi', duration: 65 },
    { id: 'v7', type: 'video', title: 'Prophetic Guidance on Anger', description: 'How the Prophet dealt with anger', url: 'https://youtube.com/watch?v=Fl3ZYplMb4k', thumbnailUrl: 'https://i.ytimg.com/vi/Fl3ZYplMb4k/hqdefault.jpg', category: 'hadith', channel: 'Omar Suleiman', duration: 18 },

    // Aqeedah
    { id: 'v8', type: 'video', title: 'Names of Allah - Ar-Rahman', description: 'Understanding the Most Merciful', url: 'https://youtube.com/watch?v=8fhCXNVbH8w', thumbnailUrl: 'https://i.ytimg.com/vi/8fhCXNVbH8w/hqdefault.jpg', category: 'aqeedah', channel: 'Yaqeen Institute', duration: 22, featured: true },
    { id: 'v9', type: 'video', title: 'Pillars of Iman', description: 'The six articles of faith explained', url: 'https://youtube.com/watch?v=PqGdDmKvHvY', thumbnailUrl: 'https://i.ytimg.com/vi/PqGdDmKvHvY/hqdefault.jpg', category: 'aqeedah', channel: 'Yasir Qadhi', duration: 48 },
    { id: 'v10', type: 'video', title: 'What Happens After Death?', description: 'Journey of the soul in Islam', url: 'https://youtube.com/watch?v=kSB8tA7HHwY', thumbnailUrl: 'https://i.ytimg.com/vi/kSB8tA7HHwY/hqdefault.jpg', category: 'aqeedah', channel: 'Mufti Menk', duration: 35 },

    // Fiqh
    { id: 'v11', type: 'video', title: 'How to Perfect Your Salah', description: 'Step by step prayer guide', url: 'https://youtube.com/watch?v=zalLv-TUhT0', thumbnailUrl: 'https://i.ytimg.com/vi/zalLv-TUhT0/hqdefault.jpg', category: 'fiqh', channel: 'One Islam', duration: 25, featured: true },
    { id: 'v12', type: 'video', title: 'Fiqh of Fasting', description: 'Complete guide to Ramadan fasting', url: 'https://youtube.com/watch?v=QS1gJPWL8aI', thumbnailUrl: 'https://i.ytimg.com/vi/QS1gJPWL8aI/hqdefault.jpg', category: 'fiqh', channel: 'Assim Al-Hakeem', duration: 40 },
    { id: 'v13', type: 'video', title: 'Zakat Explained Simply', description: 'How to calculate and give zakat', url: 'https://youtube.com/watch?v=gNlF7eJMX-s', thumbnailUrl: 'https://i.ytimg.com/vi/gNlF7eJMX-s/hqdefault.jpg', category: 'fiqh', channel: 'Islamic Relief', duration: 15 },

    // Seerah
    { id: 'v14', type: 'video', title: 'Life of Prophet Muhammad ﷺ', description: 'Comprehensive seerah series intro', url: 'https://youtube.com/watch?v=VOUp3ZZ9t3A', thumbnailUrl: 'https://i.ytimg.com/vi/VOUp3ZZ9t3A/hqdefault.jpg', category: 'seerah', channel: 'Yasir Qadhi', duration: 75, featured: true },
    { id: 'v15', type: 'video', title: 'The Night Journey - Isra & Miraj', description: 'The miraculous journey explained', url: 'https://youtube.com/watch?v=jY8Jt08LSes', thumbnailUrl: 'https://i.ytimg.com/vi/jY8Jt08LSes/hqdefault.jpg', category: 'seerah', channel: 'Omar Suleiman', duration: 45 },
    { id: 'v16', type: 'video', title: 'Story of Khadijah RA', description: 'The first believer and greatest supporter', url: 'https://youtube.com/watch?v=Bp8Z1R8cS0U', thumbnailUrl: 'https://i.ytimg.com/vi/Bp8Z1R8cS0U/hqdefault.jpg', category: 'seerah', channel: 'Yaqeen Institute', duration: 28 },

    // Character
    { id: 'v17', type: 'video', title: 'The Power of Patience', description: 'Sabr in times of difficulty', url: 'https://youtube.com/watch?v=a5pIxIqVmDQ', thumbnailUrl: 'https://i.ytimg.com/vi/a5pIxIqVmDQ/hqdefault.jpg', category: 'character', channel: 'Mufti Menk', duration: 20, featured: true },
    { id: 'v18', type: 'video', title: 'Gratitude in Islam', description: 'Being thankful to Allah', url: 'https://youtube.com/watch?v=hTMZ7K0Tb4Q', thumbnailUrl: 'https://i.ytimg.com/vi/hTMZ7K0Tb4Q/hqdefault.jpg', category: 'character', channel: 'Nouman Ali Khan', duration: 25 },
    { id: 'v19', type: 'video', title: 'Overcoming Envy', description: 'How to purify the heart from hasad', url: 'https://youtube.com/watch?v=BqGhG4hG9-A', thumbnailUrl: 'https://i.ytimg.com/vi/BqGhG4hG9-A/hqdefault.jpg', category: 'character', channel: 'Omar Suleiman', duration: 22 },

    // Motivation
    { id: 'v20', type: 'video', title: 'Never Lose Hope', description: 'Allahs mercy is greater than your sins', url: 'https://youtube.com/watch?v=TJ7EF6qMDAo', thumbnailUrl: 'https://i.ytimg.com/vi/TJ7EF6qMDAo/hqdefault.jpg', category: 'motivation', channel: 'Mufti Menk', duration: 15, featured: true },
    { id: 'v21', type: 'video', title: 'Ramadan Motivation', description: 'Make this Ramadan the best', url: 'https://youtube.com/watch?v=vXhbSj8gT7g', thumbnailUrl: 'https://i.ytimg.com/vi/vXhbSj8gT7g/hqdefault.jpg', category: 'motivation', channel: 'Yaqeen Institute', duration: 12 },
    { id: 'v22', type: 'video', title: 'Dealing with Depression', description: 'Islamic perspective on mental health', url: 'https://youtube.com/watch?v=4t3RYqqBFhA', thumbnailUrl: 'https://i.ytimg.com/vi/4t3RYqqBFhA/hqdefault.jpg', category: 'motivation', channel: 'Omar Suleiman', duration: 35 },

    // Family
    { id: 'v23', type: 'video', title: 'Marriage in Islam', description: 'Rights and responsibilities', url: 'https://youtube.com/watch?v=6JfopDEGfJc', thumbnailUrl: 'https://i.ytimg.com/vi/6JfopDEGfJc/hqdefault.jpg', category: 'family', channel: 'Yasir Qadhi', duration: 55 },
    { id: 'v24', type: 'video', title: 'Raising Muslim Children', description: 'Parenting tips from Quran and Sunnah', url: 'https://youtube.com/watch?v=p5RqeL2xFGM', thumbnailUrl: 'https://i.ytimg.com/vi/p5RqeL2xFGM/hqdefault.jpg', category: 'family', channel: 'Mufti Menk', duration: 30 },
    { id: 'v25', type: 'video', title: 'Respecting Parents', description: 'The status of parents in Islam', url: 'https://youtube.com/watch?v=AiXMplvJ8Rk', thumbnailUrl: 'https://i.ytimg.com/vi/AiXMplvJ8Rk/hqdefault.jpg', category: 'family', channel: 'Nouman Ali Khan', duration: 28 },
];

// Curated articles (real content)
const CURATED_ARTICLES: ContentItem[] = [
    // Quran
    { id: 'a1', type: 'article', title: 'How to Develop Khushu in Salah', description: 'Practical tips for concentration in prayer', url: 'https://yaqeeninstitute.org/read/paper/how-to-develop-khushu-in-salah', thumbnailUrl: 'https://yaqeeninstitute.org/wp-content/uploads/2020/02/khushu-salah.jpg', category: 'quran', author: 'Yaqeen Institute', featured: true },
    { id: 'a2', type: 'article', title: 'Benefits of Reciting Surah Al-Kahf', description: 'Why we recite it every Friday', url: 'https://islamqa.info/en/answers/10700/the-virtues-of-soorat-al-kahf', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'quran', author: 'IslamQA' },
    { id: 'a3', type: 'article', title: 'Understanding Tajweed', description: 'Basics of Quran recitation rules', url: 'https://quran.com/tajweed-guide', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'quran', author: 'Quran.com' },

    // Hadith
    { id: 'a4', type: 'article', title: 'Introduction to Hadith Sciences', description: 'How scholars verify prophetic traditions', url: 'https://yaqeeninstitute.org/read/paper/hadith-authentication', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'hadith', author: 'Yaqeen Institute' },
    { id: 'a5', type: 'article', title: 'Daily Adhkar from Sunnah', description: 'Morning and evening supplications', url: 'https://sunnah.com/riyadussalihin/16', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'hadith', author: 'Sunnah.com', featured: true },

    // Aqeedah
    { id: 'a6', type: 'article', title: 'The 99 Names of Allah', description: 'Understanding Allahs beautiful names', url: 'https://99namesofallah.name/', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'aqeedah', author: '99 Names', featured: true },
    { id: 'a7', type: 'article', title: 'Belief in the Last Day', description: 'What happens on the Day of Judgment', url: 'https://yaqeeninstitute.org/read/paper/the-day-of-judgment', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'aqeedah', author: 'Yaqeen Institute' },

    // Fiqh
    { id: 'a8', type: 'article', title: 'Complete Wudu Guide', description: 'Step by step ablution guide', url: 'https://islamqa.info/en/answers/11497/description-of-wudoo', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'fiqh', author: 'IslamQA' },
    { id: 'a9', type: 'article', title: 'Fasting Rules Made Easy', description: 'What breaks and doesnt break the fast', url: 'https://islamqa.info/en/answers/38023/things-that-break-the-fast', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'fiqh', author: 'IslamQA', featured: true },

    // Seerah
    { id: 'a10', type: 'article', title: 'Timeline of the Prophets Life', description: 'Key events from birth to death', url: 'https://www.islamicity.org/7149/the-life-of-prophet-muhammad/', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'seerah', author: 'IslamiCity' },

    // Character
    { id: 'a11', type: 'article', title: 'The Disease of the Heart', description: 'Spiritual diseases and their cures', url: 'https://yaqeeninstitute.org/read/paper/diseases-of-the-heart', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'character', author: 'Yaqeen Institute', featured: true },
    { id: 'a12', type: 'article', title: 'How to Control Anger', description: 'Prophetic advice on managing anger', url: 'https://islamqa.info/en/answers/658/how-to-deal-with-anger', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'character', author: 'IslamQA' },

    // Motivation
    { id: 'a13', type: 'article', title: 'Trusting Allahs Plan', description: 'Finding peace through tawakkul', url: 'https://yaqeeninstitute.org/read/paper/trusting-allahs-plan', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'motivation', author: 'Yaqeen Institute', featured: true },
    { id: 'a14', type: 'article', title: 'Overcoming Laziness', description: 'Islamic tips for productivity', url: 'https://productivemuslim.com/overcome-laziness/', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'motivation', author: 'Productive Muslim' },

    // Family
    { id: 'a15', type: 'article', title: 'Rights of Parents in Islam', description: 'What Islam says about honoring parents', url: 'https://islamqa.info/en/answers/5326/rights-of-parents', thumbnailUrl: 'https://via.placeholder.com/400x200', category: 'family', author: 'IslamQA' },
];

const ALL_CONTENT: ContentItem[] = [...CURATED_VIDEOS, ...CURATED_ARTICLES];

// =================== STORAGE KEYS ===================

const STORAGE_KEYS = {
    PROGRESS: 'khalil_content_progress',
    PREFERENCES: 'khalil_content_preferences',
};

// =================== SERVICE CLASS ===================

class ContentService {
    private progressMap: Map<string, UserProgress> = new Map();
    private categoryEngagement: Map<ContentCategory, number> = new Map();
    private channelEngagement: Map<string, number> = new Map();

    constructor() {
        this.loadProgress();
        this.loadPreferences();
    }

    // ========== CONTENT ACCESS ==========

    getAllContent(): ContentItem[] {
        return ALL_CONTENT;
    }

    getVideos(): ContentItem[] {
        return CURATED_VIDEOS;
    }

    getArticles(): ContentItem[] {
        return CURATED_ARTICLES;
    }

    getByCategory(category: ContentCategory): ContentItem[] {
        return ALL_CONTENT.filter(c => c.category === category);
    }

    getFeatured(): ContentItem[] {
        return ALL_CONTENT.filter(c => c.featured);
    }

    getById(id: string): ContentItem | undefined {
        return ALL_CONTENT.find(c => c.id === id);
    }

    search(query: string): ContentItem[] {
        const lower = query.toLowerCase();
        return ALL_CONTENT.filter(c =>
            c.title.toLowerCase().includes(lower) ||
            c.description.toLowerCase().includes(lower) ||
            c.author?.toLowerCase().includes(lower) ||
            c.channel?.toLowerCase().includes(lower)
        );
    }

    getCategories(): typeof CONTENT_CATEGORIES {
        return CONTENT_CATEGORIES;
    }

    // ========== USER PROGRESS ==========

    getProgress(contentId: string): UserProgress | undefined {
        return this.progressMap.get(contentId);
    }

    isBookmarked(contentId: string): boolean {
        return this.progressMap.get(contentId)?.bookmarked ?? false;
    }

    isCompleted(contentId: string): boolean {
        return this.progressMap.get(contentId)?.completed ?? false;
    }

    toggleBookmark(contentId: string): boolean {
        const existing = this.progressMap.get(contentId) || {
            contentId,
            bookmarked: false,
            completed: false,
        };
        existing.bookmarked = !existing.bookmarked;
        this.progressMap.set(contentId, existing);
        this.saveProgress();

        // Track engagement
        const content = this.getById(contentId);
        if (content && existing.bookmarked) {
            this.trackEngagement(content);
        }

        return existing.bookmarked;
    }

    markCompleted(contentId: string): void {
        const existing = this.progressMap.get(contentId) || {
            contentId,
            bookmarked: false,
            completed: false,
        };
        existing.completed = true;
        existing.lastViewed = new Date();
        this.progressMap.set(contentId, existing);
        this.saveProgress();

        // Track engagement
        const content = this.getById(contentId);
        if (content) {
            this.trackEngagement(content, 2); // Higher weight for completion
        }
    }

    updateVideoProgress(contentId: string, seconds: number): void {
        const content = this.getById(contentId);
        if (!content || content.type !== 'video') return;

        const existing = this.progressMap.get(contentId) || {
            contentId,
            bookmarked: false,
            completed: false,
        };
        existing.progress = seconds;
        existing.lastViewed = new Date();

        // Mark as completed if watched >90%
        const totalSeconds = (content.duration || 10) * 60;
        if (seconds >= totalSeconds * 0.9) {
            existing.completed = true;
        }

        this.progressMap.set(contentId, existing);
        this.saveProgress();
    }

    getBookmarked(): ContentItem[] {
        const bookmarkedIds = Array.from(this.progressMap.entries())
            .filter(([_, p]) => p.bookmarked)
            .map(([id]) => id);
        return ALL_CONTENT.filter(c => bookmarkedIds.includes(c.id));
    }

    getCompleted(): ContentItem[] {
        const completedIds = Array.from(this.progressMap.entries())
            .filter(([_, p]) => p.completed)
            .map(([id]) => id);
        return ALL_CONTENT.filter(c => completedIds.includes(c.id));
    }

    getRecentlyViewed(): ContentItem[] {
        return Array.from(this.progressMap.entries())
            .filter(([_, p]) => p.lastViewed)
            .sort((a, b) => {
                const dateA = a[1].lastViewed ? new Date(a[1].lastViewed).getTime() : 0;
                const dateB = b[1].lastViewed ? new Date(b[1].lastViewed).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 10)
            .map(([id]) => this.getById(id))
            .filter(Boolean) as ContentItem[];
    }

    // ========== RECOMMENDATIONS ==========

    private trackEngagement(content: ContentItem, weight: number = 1): void {
        // Track category
        const categoryCount = this.categoryEngagement.get(content.category) || 0;
        this.categoryEngagement.set(content.category, categoryCount + weight);

        // Track channel
        if (content.channel) {
            const channelCount = this.channelEngagement.get(content.channel) || 0;
            this.channelEngagement.set(content.channel, channelCount + weight);
        }

        this.savePreferences();
    }

    getRecommendations(limit: number = 10): ContentItem[] {
        // Get top categories user engages with
        const topCategories = Array.from(this.categoryEngagement.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);

        // Get top channels
        const topChannels = Array.from(this.channelEngagement.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([ch]) => ch);

        // Get content from preferred categories/channels, excluding already completed
        const completedIds = new Set(
            Array.from(this.progressMap.entries())
                .filter(([_, p]) => p.completed)
                .map(([id]) => id)
        );

        const recommendations: ContentItem[] = [];

        // Add from top categories
        topCategories.forEach(cat => {
            const catContent = this.getByCategory(cat)
                .filter(c => !completedIds.has(c.id))
                .slice(0, 3);
            recommendations.push(...catContent);
        });

        // Add from top channels
        topChannels.forEach(ch => {
            const chContent = ALL_CONTENT
                .filter(c => c.channel === ch && !completedIds.has(c.id))
                .slice(0, 2);
            recommendations.push(...chContent);
        });

        // If not enough, add featured content
        if (recommendations.length < limit) {
            const featured = this.getFeatured()
                .filter(c => !completedIds.has(c.id) && !recommendations.includes(c));
            recommendations.push(...featured);
        }

        // Deduplicate and limit
        const unique = [...new Map(recommendations.map(c => [c.id, c])).values()];
        return unique.slice(0, limit);
    }

    getForYou(): ContentItem[] {
        const recommendations = this.getRecommendations(15);

        // If no engagement yet, return featured + random mix
        if (recommendations.length === 0) {
            return [...this.getFeatured(), ...ALL_CONTENT.slice(0, 10)];
        }

        return recommendations;
    }

    // ========== PERSISTENCE ==========

    private loadProgress(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (saved) {
                const data = JSON.parse(saved);
                this.progressMap = new Map(data.map((p: UserProgress) => [p.contentId, {
                    ...p,
                    lastViewed: p.lastViewed ? new Date(p.lastViewed) : undefined,
                }]));
            }
        } catch (e) {
            console.error('Failed to load content progress:', e);
        }
    }

    private saveProgress(): void {
        try {
            const data = Array.from(this.progressMap.values());
            localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save content progress:', e);
        }
    }

    private loadPreferences(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
            if (saved) {
                const data = JSON.parse(saved);
                // Cast to ContentCategory when loading from storage
                Object.entries(data.categories || {}).forEach(([key, value]) => {
                    this.categoryEngagement.set(key as ContentCategory, value as number);
                });
                this.channelEngagement = new Map(Object.entries(data.channels || {}) as [string, number][]);
            }
        } catch (e) {
            console.error('Failed to load content preferences:', e);
        }
    }

    private savePreferences(): void {
        try {
            const data = {
                categories: Object.fromEntries(this.categoryEngagement),
                channels: Object.fromEntries(this.channelEngagement),
            };
            localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save content preferences:', e);
        }
    }
}

// Export singleton
export const contentService = new ContentService();
