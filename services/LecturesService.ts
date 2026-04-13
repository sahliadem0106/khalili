/**
 * LecturesService - Islamic lectures and content platform
 */

// =================== TYPES ===================

export type LectureCategory =
    | 'quran_tafsir'
    | 'hadith'
    | 'fiqh'
    | 'seerah'
    | 'aqidah'
    | 'spirituality'
    | 'current_affairs'
    | 'family';

export interface Lecture {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    speaker: Speaker;
    category: LectureCategory;
    duration: number; // in minutes
    thumbnailUrl: string;
    videoUrl: string;
    audioUrl: string | null;
    views: number;
    likes: number;
    isFeatured: boolean;
    tags: string[];
    publishedAt: Date;
    createdAt: Date;
}

export interface Speaker {
    id: string;
    name: string;
    nameAr: string;
    title: string;
    titleAr: string;
    photoUrl: string;
    bio: string;
    bioAr: string;
}

export interface LectureProgress {
    lectureId: string;
    watchedSeconds: number;
    totalSeconds: number;
    completed: boolean;
    lastWatched: Date;
}

// =================== CONSTANTS ===================

export const LECTURE_CATEGORIES: { id: LectureCategory; name: string; nameAr: string; icon: string }[] = [
    { id: 'quran_tafsir', name: 'Quran & Tafsir', nameAr: 'القرآن والتفسير', icon: '📖' },
    { id: 'hadith', name: 'Hadith', nameAr: 'الحديث', icon: '📜' },
    { id: 'fiqh', name: 'Fiqh', nameAr: 'الفقه', icon: '⚖️' },
    { id: 'seerah', name: 'Seerah', nameAr: 'السيرة', icon: '🏛️' },
    { id: 'aqidah', name: 'Aqidah', nameAr: 'العقيدة', icon: '💡' },
    { id: 'spirituality', name: 'Spirituality', nameAr: 'التزكية', icon: '✨' },
    { id: 'current_affairs', name: 'Current Affairs', nameAr: 'قضايا معاصرة', icon: '🌍' },
    { id: 'family', name: 'Family', nameAr: 'الأسرة', icon: '👨‍👩‍👧‍👦' },
];

// Sample speakers (would come from API)
const SAMPLE_SPEAKERS: Speaker[] = [
    {
        id: 'mufti_menk',
        name: 'Mufti Menk',
        nameAr: 'مفتي منك',
        title: 'Grand Mufti of Zimbabwe',
        titleAr: 'مفتي زيمبابوي',
        photoUrl: 'https://via.placeholder.com/150',
        bio: 'Ismail ibn Musa Menk is a Zimbabwean Islamic scholar.',
        bioAr: 'إسماعيل بن موسى منك عالم إسلامي زيمبابوي.',
    },
    {
        id: 'omar_suleiman',
        name: 'Omar Suleiman',
        nameAr: 'عمر سليمان',
        title: 'Founder of Yaqeen Institute',
        titleAr: 'مؤسس معهد يقين',
        photoUrl: 'https://via.placeholder.com/150',
        bio: 'Omar Suleiman is an American Islamic scholar and civil rights activist.',
        bioAr: 'عمر سليمان عالم إسلامي أمريكي وناشط في مجال الحقوق المدنية.',
    },
    {
        id: 'nouman_ali_khan',
        name: 'Nouman Ali Khan',
        nameAr: 'نعمان علي خان',
        title: 'Founder of Bayyinah Institute',
        titleAr: 'مؤسس معهد بينة',
        photoUrl: 'https://via.placeholder.com/150',
        bio: 'Nouman Ali Khan is an American Muslim speaker and Arabic instructor.',
        bioAr: 'نعمان علي خان متحدث إسلامي أمريكي ومعلم للغة العربية.',
    },
    {
        id: 'yasir_qadhi',
        name: 'Yasir Qadhi',
        nameAr: 'ياسر قاضي',
        title: 'Dean of AlMaghrib Institute',
        titleAr: 'عميد معهد المغرب',
        photoUrl: 'https://via.placeholder.com/150',
        bio: 'Yasir Qadhi is an American Islamic scholar and theologian.',
        bioAr: 'ياسر قاضي عالم إسلامي ولاهوتي أمريكي.',
    },
];

// Sample lectures (would come from API)
const SAMPLE_LECTURES: Lecture[] = [
    {
        id: '1',
        title: 'Understanding Surah Al-Fatiha',
        titleAr: 'فهم سورة الفاتحة',
        description: 'A deep dive into the opening chapter of the Quran',
        descriptionAr: 'دراسة معمقة في السورة الافتتاحية للقرآن',
        speaker: SAMPLE_SPEAKERS[2],
        category: 'quran_tafsir',
        duration: 45,
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        videoUrl: 'https://example.com/video1.mp4',
        audioUrl: null,
        views: 125000,
        likes: 8500,
        isFeatured: true,
        tags: ['quran', 'tafsir', 'fatiha'],
        publishedAt: new Date('2026-01-10'),
        createdAt: new Date('2026-01-10'),
    },
    {
        id: '2',
        title: 'The Power of Dua',
        titleAr: 'قوة الدعاء',
        description: 'Learn how to make effective supplications',
        descriptionAr: 'تعلم كيفية الدعاء الفعال',
        speaker: SAMPLE_SPEAKERS[0],
        category: 'spirituality',
        duration: 32,
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        videoUrl: 'https://example.com/video2.mp4',
        audioUrl: 'https://example.com/audio2.mp3',
        views: 89000,
        likes: 6200,
        isFeatured: true,
        tags: ['dua', 'supplication', 'spirituality'],
        publishedAt: new Date('2026-01-08'),
        createdAt: new Date('2026-01-08'),
    },
    {
        id: '3',
        title: 'Stories of the Prophets: Ibrahim (AS)',
        titleAr: 'قصص الأنبياء: إبراهيم عليه السلام',
        description: 'The inspiring story of Prophet Ibrahim',
        descriptionAr: 'القصة الملهمة للنبي إبراهيم',
        speaker: SAMPLE_SPEAKERS[1],
        category: 'seerah',
        duration: 55,
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        videoUrl: 'https://example.com/video3.mp4',
        audioUrl: null,
        views: 156000,
        likes: 11200,
        isFeatured: false,
        tags: ['prophets', 'ibrahim', 'seerah'],
        publishedAt: new Date('2026-01-05'),
        createdAt: new Date('2026-01-05'),
    },
    {
        id: '4',
        title: 'Marriage in Islam',
        titleAr: 'الزواج في الإسلام',
        description: 'Understanding the Islamic perspective on marriage',
        descriptionAr: 'فهم النظرة الإسلامية للزواج',
        speaker: SAMPLE_SPEAKERS[3],
        category: 'family',
        duration: 40,
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        videoUrl: 'https://example.com/video4.mp4',
        audioUrl: 'https://example.com/audio4.mp3',
        views: 72000,
        likes: 5100,
        isFeatured: false,
        tags: ['marriage', 'family', 'fiqh'],
        publishedAt: new Date('2026-01-03'),
        createdAt: new Date('2026-01-03'),
    },
    {
        id: '5',
        title: 'Ramadan Preparation',
        titleAr: 'الاستعداد لرمضان',
        description: 'How to prepare spiritually for the blessed month',
        descriptionAr: 'كيفية الاستعداد روحياً للشهر المبارك',
        speaker: SAMPLE_SPEAKERS[0],
        category: 'spirituality',
        duration: 28,
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        videoUrl: 'https://example.com/video5.mp4',
        audioUrl: null,
        views: 203000,
        likes: 15800,
        isFeatured: true,
        tags: ['ramadan', 'fasting', 'preparation'],
        publishedAt: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
    },
];

// =================== SERVICE CLASS ===================

class LecturesService {
    private watchHistory: Map<string, LectureProgress> = new Map();

    constructor() {
        this.loadWatchHistory();
    }

    /**
     * Get all lectures
     */
    async getLectures(): Promise<Lecture[]> {
        // In a real app, this would fetch from an API
        return SAMPLE_LECTURES;
    }

    /**
     * Get featured lectures
     */
    async getFeaturedLectures(): Promise<Lecture[]> {
        const lectures = await this.getLectures();
        return lectures.filter(l => l.isFeatured);
    }

    /**
     * Get lectures by category
     */
    async getLecturesByCategory(category: LectureCategory): Promise<Lecture[]> {
        const lectures = await this.getLectures();
        return lectures.filter(l => l.category === category);
    }

    /**
     * Get lectures by speaker
     */
    async getLecturesBySpeaker(speakerId: string): Promise<Lecture[]> {
        const lectures = await this.getLectures();
        return lectures.filter(l => l.speaker.id === speakerId);
    }

    /**
     * Search lectures
     */
    async searchLectures(query: string): Promise<Lecture[]> {
        const lectures = await this.getLectures();
        const lowerQuery = query.toLowerCase();

        return lectures.filter(l =>
            l.title.toLowerCase().includes(lowerQuery) ||
            l.titleAr.includes(query) ||
            l.description.toLowerCase().includes(lowerQuery) ||
            l.speaker.name.toLowerCase().includes(lowerQuery) ||
            l.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Get single lecture
     */
    async getLecture(id: string): Promise<Lecture | null> {
        const lectures = await this.getLectures();
        return lectures.find(l => l.id === id) || null;
    }

    /**
     * Get all speakers
     */
    async getSpeakers(): Promise<Speaker[]> {
        return SAMPLE_SPEAKERS;
    }

    /**
     * Get all categories
     */
    getCategories(): typeof LECTURE_CATEGORIES {
        return LECTURE_CATEGORIES;
    }

    /**
     * Update watch progress
     */
    updateProgress(lectureId: string, watchedSeconds: number, totalSeconds: number): void {
        const progress: LectureProgress = {
            lectureId,
            watchedSeconds,
            totalSeconds,
            completed: watchedSeconds >= totalSeconds * 0.9, // 90% = completed
            lastWatched: new Date(),
        };

        this.watchHistory.set(lectureId, progress);
        this.saveWatchHistory();
    }

    /**
     * Get watch progress for a lecture
     */
    getProgress(lectureId: string): LectureProgress | null {
        return this.watchHistory.get(lectureId) || null;
    }

    /**
     * Get continue watching list
     */
    getContinueWatching(): LectureProgress[] {
        return Array.from(this.watchHistory.values())
            .filter(p => !p.completed && p.watchedSeconds > 0)
            .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime());
    }

    /**
     * Load watch history from localStorage
     */
    private loadWatchHistory(): void {
        try {
            const saved = localStorage.getItem('khalil_watch_history');
            if (saved) {
                const data = JSON.parse(saved);
                this.watchHistory = new Map(
                    data.map((p: any) => [p.lectureId, { ...p, lastWatched: new Date(p.lastWatched) }])
                );
            }
        } catch (e) {
            console.error('Failed to load watch history:', e);
        }
    }

    /**
     * Save watch history to localStorage
     */
    private saveWatchHistory(): void {
        try {
            const data = Array.from(this.watchHistory.values());
            localStorage.setItem('khalil_watch_history', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save watch history:', e);
        }
    }
}

// Export singleton
export const lecturesService = new LecturesService();
