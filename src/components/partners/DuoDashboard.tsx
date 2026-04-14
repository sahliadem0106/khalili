
import React, { useState, useEffect } from 'react';
import { Partnership, PartnerProfile } from '../../types/partner';
import { PartnerService } from '../../services/PartnerService';
import { Bell, Flame, User, UserX, ExternalLink, Phone, AtSign, Star, Check, Clock, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface PrayerLog {
    prayerName: string;
    status: string;
    khushuLevel: number | null;
}

interface DuoDashboardProps {
    partnership: Partnership;
    onPartnershipEnded?: () => void;
}

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_DISPLAY = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
};

export const DuoDashboard: React.FC<DuoDashboardProps> = ({ partnership, onPartnershipEnded }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [poking, setPoking] = useState(false);
    const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [ending, setEnding] = useState(false);
    const [myTodayPrayers, setMyTodayPrayers] = useState<PrayerLog[]>([]);
    const [partnerTodayPrayers, setPartnerTodayPrayers] = useState<PrayerLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { toast, showToast, clearToast } = useToast();

    // Get partner ID (the other user in the partnership)
    const partnerId = partnership.users.find(uid => uid !== user?.uid);
    const myStats = user?.uid ? partnership.stats?.[user.uid] : null;
    const partnerStats = partnerId ? partnership.stats?.[partnerId] : null;

    // Fetch partner's profile
    useEffect(() => {
        const fetchPartnerProfile = async () => {
            if (partnerId) {
                const profile = await PartnerService.getProfile(partnerId);
                setPartnerProfile(profile);
            }
        };
        fetchPartnerProfile();
    }, [partnerId]);

    // Fetch today's prayer logs for both users
    useEffect(() => {
        const fetchTodayPrayers = async () => {
            const today = new Date().toISOString().split('T')[0];

            // Fetch my prayers
            if (user?.uid) {
                try {
                    const myLogsRef = collection(db, 'users', user.uid, 'prayerLogs');
                    const myQ = query(myLogsRef, where('date', '==', today));
                    const mySnapshot = await getDocs(myQ);
                    const myLogs = mySnapshot.docs.map(d => d.data() as PrayerLog);
                    setMyTodayPrayers(myLogs);
                } catch (e) {
                    console.error('Failed to fetch my prayers:', e);
                }
            }

            // Fetch partner's prayers
            if (partnerId) {
                try {
                    const partnerLogsRef = collection(db, 'users', partnerId, 'prayerLogs');
                    const partnerQ = query(partnerLogsRef, where('date', '==', today));
                    const partnerSnapshot = await getDocs(partnerQ);
                    const partnerLogs = partnerSnapshot.docs.map(d => d.data() as PrayerLog);
                    setPartnerTodayPrayers(partnerLogs);
                } catch (e) {
                    console.error('Failed to fetch partner prayers:', e);
                }
            }
        };

        fetchTodayPrayers();
        // Refresh every 3 minutes (optimized from 30s to reduce Firebase reads)
        const interval = setInterval(fetchTodayPrayers, 180000);
        return () => clearInterval(interval);
    }, [user?.uid, partnerId]);

    const handlePoke = async () => {
        if (!user?.uid || !partnerId) return;
        setPoking(true);
        try {
            await PartnerService.sendCustomReminder(
                partnership.id,
                user.uid,
                partnerId,
                "Time to pray! Your partner is checking on you."
            );
            showToast(t('duo_reminder_sent') as string, 'success');
        } catch (e) {
            console.error("Failed to send reminder:", e);
        } finally {
            setPoking(false);
        }
    };

    const handleEndPartnership = async () => {
        if (!user?.uid) return;
        setEnding(true);
        try {
            await PartnerService.disconnectPartner(partnership.id, user.uid);
            showToast(t('duo_partnership_ended') as string, 'info');
            onPartnershipEnded?.();
        } catch (e) {
            console.error("Failed to end partnership:", e);
            showToast(t('duo_end_failed') as string, 'error');
        } finally {
            setEnding(false);
            setShowEndConfirm(false);
        }
    };

    // Get prayer status for display
    const getPrayerStatus = (logs: PrayerLog[], prayerName: string) => {
        const log = logs.find(l => l.prayerName === prayerName);
        return log || null;
    };

    // Render status icon
    const renderStatusIcon = (status: string | undefined) => {
        switch (status) {
            case 'jamaah':
            case 'home':
                return <Check size={14} className="text-emerald-500" />;
            case 'late':
                return <Clock size={14} className="text-amber-500" />;
            case 'missed':
                return <X size={14} className="text-red-400" />;
            default:
                return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />;
        }
    };

    // Render khushu stars
    const renderKhushu = (level: number | null) => {
        if (!level) return null;
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        size={10}
                        className={i <= level ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    // Social link icon helper
    const getSocialIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('whatsapp') || p.includes('phone')) return <Phone size={16} />;
        if (p.includes('instagram') || p.includes('twitter') || p.includes('x')) return <AtSign size={16} />;
        return <ExternalLink size={16} />;
    };

    // Count today's completed prayers
    const myTodayCount = myTodayPrayers.filter(p => ['jamaah', 'home', 'late'].includes(p.status)).length;
    const partnerTodayCount = partnerTodayPrayers.filter(p => ['jamaah', 'home', 'late'].includes(p.status)).length;

    return (
        <div className="space-y-6">
            {/* Friendly Greeting Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold font-outfit mb-2">{t('duo_title')}</h2>
                    <p className="text-emerald-100 max-w-md">
                        {t('duo_subtitle')}
                    </p>
                </div>
            </div>

            {/* Today's Prayers Comparison */}
            <div className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-brand-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-brand-forest">{t('duo_todays_prayers')}</h3>
                    <button
                        onClick={async () => {
                            setRefreshing(true);
                            // Trigger manual refresh
                            const today = new Date().toISOString().split('T')[0];
                            try {
                                if (user?.uid) {
                                    const myLogsRef = collection(db, 'users', user.uid, 'prayerLogs');
                                    const myQ = query(myLogsRef, where('date', '==', today));
                                    const mySnapshot = await getDocs(myQ);
                                    setMyTodayPrayers(mySnapshot.docs.map(d => d.data() as PrayerLog));
                                }
                                if (partnerId) {
                                    const partnerLogsRef = collection(db, 'users', partnerId, 'prayerLogs');
                                    const partnerQ = query(partnerLogsRef, where('date', '==', today));
                                    const partnerSnapshot = await getDocs(partnerQ);
                                    setPartnerTodayPrayers(partnerSnapshot.docs.map(d => d.data() as PrayerLog));
                                }
                            } catch (e) {
                                console.error('Refresh failed:', e);
                            } finally {
                                setRefreshing(false);
                            }
                        }}
                        disabled={refreshing}
                        className="p-2 text-brand-muted hover:text-brand-primary transition-colors"
                        title={t('duo_refresh') as string}
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-xs overflow-x-auto min-w-[520px] sm:min-w-0">
                    {/* Header Row */}
                    <div className="font-medium text-brand-muted">{t('duo_prayer')}</div>
                    <div className="col-span-3 font-medium text-brand-primary">{t('duo_you')} ({myTodayCount}/5)</div>
                    <div className="col-span-3 font-medium text-brand-secondary">{partnerProfile?.nickname || t('duo_partner')} ({partnerTodayCount}/5)</div>

                    {/* Prayer Rows */}
                    {PRAYER_ORDER.map(prayer => {
                        const myLog = getPrayerStatus(myTodayPrayers, prayer);
                        const partnerLog = getPrayerStatus(partnerTodayPrayers, prayer);

                        return (
                            <React.Fragment key={prayer}>
                                <div className="py-2 font-medium text-brand-forest text-left">
                                    {PRAYER_DISPLAY[prayer as keyof typeof PRAYER_DISPLAY]}
                                </div>
                                <div className="col-span-3 py-2 flex items-center justify-center gap-2">
                                    {renderStatusIcon(myLog?.status)}
                                    {renderKhushu(myLog?.khushuLevel || null)}
                                </div>
                                <div className="col-span-3 py-2 flex items-center justify-center gap-2">
                                    {renderStatusIcon(partnerLog?.status)}
                                    {renderKhushu(partnerLog?.khushuLevel || null)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Stats Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My Stats */}
                <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold">{t('duo_you')}</div>
                        <h3 className="font-bold text-brand-forest">{t('duo_my_progress')}</h3>
                    </div>
                    <div className="flex justify-between items-center text-center">
                        <div>
                            <p className="text-3xl font-bold text-brand-forest">{myStats?.totalPrayersLogged ?? 0}</p>
                            <p className="text-xs text-brand-muted tracking-wide">{t('duo_total_prayers')}</p>
                        </div>
                        <div className="h-8 w-px bg-brand-border"></div>
                        <div>
                            <p className="text-3xl font-bold text-brand-forest flex items-center gap-1">
                                {myStats?.currentStreak ?? 0} <Flame size={16} className="text-amber-500" />
                            </p>
                            <p className="text-xs text-brand-muted tracking-wide">{t('duo_streak')}</p>
                        </div>
                    </div>
                </div>

                {/* Partner Stats */}
                <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-brand-secondary/10 rounded-full flex items-center justify-center text-brand-secondary font-bold">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-forest">{partnerProfile?.nickname || t('duo_partner')}</h3>
                            {partnerProfile?.bio && (
                                <p className="text-xs text-brand-muted truncate max-w-[150px]">{partnerProfile.bio}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-center">
                        <div>
                            <p className="text-3xl font-bold text-brand-forest">{partnerStats?.totalPrayersLogged ?? 0}</p>
                            <p className="text-xs text-brand-muted tracking-wide">{t('duo_total_prayers')}</p>
                        </div>
                        <div className="h-8 w-px bg-brand-border"></div>
                        <div>
                            <p className="text-3xl font-bold text-brand-forest flex items-center gap-1">
                                {partnerStats?.currentStreak ?? 0} <Flame size={16} className="text-amber-500" />
                            </p>
                            <p className="text-xs text-brand-muted tracking-wide">{t('duo_streak')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Partner's Social Links (if any) */}
            {partnerProfile?.socialLinks && partnerProfile.socialLinks.length > 0 && (
                <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border">
                    <h4 className="font-bold text-brand-forest mb-3">{t('duo_contact_info')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {partnerProfile.socialLinks.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.handle.startsWith('http') ? link.handle : `https://${link.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-brand-subtle rounded-lg text-sm text-brand-forest hover:bg-brand-primary/10 transition-colors"
                            >
                                {getSocialIcon(link.platform)}
                                <span>{link.platform}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handlePoke}
                    disabled={poking}
                    className="bg-brand-surface border-2 border-brand-border hover:border-brand-primary/40 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all"
                >
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                        <Bell size={24} />
                    </div>
                    <span className="font-bold text-brand-forest">{t('duo_send_reminder')}</span>
                </button>

                <button
                    onClick={() => setShowEndConfirm(true)}
                    className="bg-brand-surface border-2 border-red-200 hover:border-red-300 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all"
                >
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                        <UserX size={24} />
                    </div>
                    <span className="font-bold text-red-700">{t('duo_end_partnership')}</span>
                </button>
            </div>

            {/* End Partnership Confirmation Modal */}
            {showEndConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-xl font-bold text-brand-forest mb-2">{t('duo_end_confirm_title')}</h3>
                        <p className="text-brand-muted mb-6">
                            {t('duo_end_confirm_desc')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="flex-1 px-4 py-3 bg-brand-subtle text-brand-forest rounded-xl font-bold hover:bg-brand-primary/10 transition-colors"
                            >
                                {t('cancel' as any)}
                            </button>
                            <button
                                onClick={handleEndPartnership}
                                disabled={ending}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {ending ? t('duo_ending') : t('duo_yes_end')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div>
    );
};
