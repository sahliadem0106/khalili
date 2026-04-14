import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Bell, Plus, Moon, Clock, Shield, BellRing, Settings2, Trash2, Edit2, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { notificationService } from '../../services/NotificationService';
import { socialNotificationPolicyService } from '../../services/SocialNotificationPolicyService';
import { authService } from '../../services/AuthService';
import { SocialNotificationPolicy } from '../../types/socialNotificationPolicy';
import { socialNotificationScheduler } from '../../services/SocialNotificationScheduler';

export interface NotificationSettingsProps {
    onBack: () => void;
    title?: string;
    defaultScope?: string;
    canManagePolicies?: boolean;
}

const CustomDropdown = ({ value, options, onChange }: { value: string, options: { value: string, label: string }[], onChange: (val: string) => void }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full bg-white/10 border-none outline-none rounded-2xl p-4 text-sm font-bold flex items-center justify-between focus:bg-white/20 backdrop-blur-sm shadow-sm"
            >
                {selected?.label}
                <ChevronDown size={18} className={`transition-transform text-white/70 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                        {options.map(o => (
                            <button
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors border-b last:border-b-0 border-black/5 ${value === o.value ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-700 hover:bg-neutral-50'}`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    onBack,
    defaultScope,
    canManagePolicies = true,
    title,
}) => {
    const { language, t } = useLanguage();

    const [settings, setSettings] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
        reminderTiming: 'before15' as 'atTime' | 'before5' | 'before10' | 'before15' | 'before30',
        socialRuleSyncEnabled: true,
        mutePartner: false,
        muteFamily: false,
        muteSuhba: false,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
        quickRuleMessage: '',
        quickRuleScope: (defaultScope || 'partner') as 'partner' | 'family' | 'suhba',
        quickRuleType: 'dailyTime' as 'dailyTime' | 'hourly' | 'oneTime',
        quickRuleTime: '09:00',
        quickRuleInterval: 60,
    });
    const [myPolicies, setMyPolicies] = useState<SocialNotificationPolicy[]>([]);
    const [loadingPolicies, setLoadingPolicies] = useState(false);
    const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
    const [savingPolicyId, setSavingPolicyId] = useState<string | null>(null);
    const [policyDraft, setPolicyDraft] = useState({
        title: '',
        message: '',
        dailyTime: '09:00',
        hourlyIntervalMinutes: 60,
        oneTimeAt: '',
    });
    const [debugInfo, setDebugInfo] = useState({
        supported: false,
        permission: 'default',
        schedulerRunning: false,
        schedulerLastSyncedAt: null as string | null,
        schedulerScheduledIds: [] as string[],
        activePolicyCount: 0,
    });
    const [policyError, setPolicyError] = useState<string | null>(null);

    useEffect(() => {
        const loaded = notificationService.getSettings();
        setSettings((prev) => ({
            ...prev,
            fajr: loaded.prayerNotifications.fajr.enabled,
            dhuhr: loaded.prayerNotifications.dhuhr.enabled,
            asr: loaded.prayerNotifications.asr.enabled,
            maghrib: loaded.prayerNotifications.maghrib.enabled,
            isha: loaded.prayerNotifications.isha.enabled,
            reminderTiming: loaded.prayerNotifications.fajr.timing,
            socialRuleSyncEnabled: loaded.socialNotificationDelivery.socialRuleSyncEnabled,
            mutePartner: loaded.socialNotificationDelivery.mutedScopes.includes('partner'),
            muteFamily: loaded.socialNotificationDelivery.mutedScopes.includes('family'),
            muteSuhba: loaded.socialNotificationDelivery.mutedScopes.includes('suhba'),
            quietHoursEnabled: loaded.socialNotificationDelivery.quietHoursEnabled,
            quietHoursStart: loaded.socialNotificationDelivery.quietHoursStart,
            quietHoursEnd: loaded.socialNotificationDelivery.quietHoursEnd,
            quickRuleScope: (defaultScope || prev.quickRuleScope),
        }));
        refreshDebugInfo().catch(console.error);
        refreshPolicies().catch(console.error);
    }, [defaultScope]);

    const me = useMemo(() => authService.getCurrentUser(), []);

    const persistSettings = (next: typeof settings) => {
        const mutedScopes: Array<'partner' | 'family' | 'suhba'> = [];
        if (next.mutePartner) mutedScopes.push('partner');
        if (next.muteFamily) mutedScopes.push('family');
        if (next.muteSuhba) mutedScopes.push('suhba');

        notificationService.saveSettings({
            ...notificationService.getSettings(),
            prayerNotifications: {
                fajr: { enabled: next.fajr, timing: next.reminderTiming },
                dhuhr: { enabled: next.dhuhr, timing: next.reminderTiming },
                asr: { enabled: next.asr, timing: next.reminderTiming },
                maghrib: { enabled: next.maghrib, timing: next.reminderTiming },
                isha: { enabled: next.isha, timing: next.reminderTiming },
            },
            socialNotificationDelivery: {
                socialRuleSyncEnabled: next.socialRuleSyncEnabled,
                mutedScopes,
                quietHoursEnabled: next.quietHoursEnabled,
                quietHoursStart: next.quietHoursStart,
                quietHoursEnd: next.quietHoursEnd,
            },
        });
    };

    const refreshDebugInfo = async (): Promise<void> => {
        const currentUser = authService.getCurrentUser();
        const scheduler = socialNotificationScheduler.getDebugState();
        let activePolicyCount = 0;
        if (currentUser) {
            const policies = await socialNotificationPolicyService.fetchPoliciesForUser(currentUser.uid);
            activePolicyCount = policies.filter((p) => p.enabled).length;
        }
        setDebugInfo({
            supported: notificationService.isSupported(),
            permission: notificationService.getPermissionStatus(),
            schedulerRunning: scheduler.isAutoRefreshRunning,
            schedulerLastSyncedAt: scheduler.lastSyncedAt,
            schedulerScheduledIds: scheduler.scheduledIds,
            activePolicyCount,
        });
    };

    const refreshPolicies = async (): Promise<void> => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            setMyPolicies([]);
            return;
        }
        setLoadingPolicies(true);
        try {
            const policies = canManagePolicies
                ? await socialNotificationPolicyService.fetchOwnedPolicies(currentUser.uid)
                : await socialNotificationPolicyService.fetchPoliciesForUser(currentUser.uid);
            const filteredPolicies = defaultScope
                ? policies.filter((p) => p.scope === defaultScope)
                : policies;
            setMyPolicies(filteredPolicies);
        } finally {
            setLoadingPolicies(false);
        }
    };

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const next = { ...prev, [key]: !prev[key] };
            persistSettings(next);
            return next;
        });
    };

    const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    const createQuickRule = async () => {
        const me = authService.getCurrentUser();
        if (!me || !settings.quickRuleMessage.trim() || !canManagePolicies) return;
        const scope = defaultScope || settings.quickRuleScope;
        setPolicyError(null);
        try {
            if (settings.quickRuleType === 'hourly') {
                await socialNotificationPolicyService.createPolicy({
                    scope,
                    ownerId: me.uid,
                    audience: { type: 'user', userIds: [me.uid] },
                    ruleType: 'hourly',
                    title: 'Dhikr Reminder',
                    message: settings.quickRuleMessage.trim(),
                    enabled: true,
                    hourlyIntervalMinutes: settings.quickRuleInterval,
                });
            } else if (settings.quickRuleType === 'dailyTime') {
                await socialNotificationPolicyService.createPolicy({
                    scope,
                    ownerId: me.uid,
                    audience: { type: 'user', userIds: [me.uid] },
                    ruleType: 'dailyTime',
                    title: 'Dhikr Reminder',
                    message: settings.quickRuleMessage.trim(),
                    enabled: true,
                    dailyTime: settings.quickRuleTime,
                });
            } else {
                const at = new Date();
                const [h, m] = settings.quickRuleTime.split(':').map(Number);
                at.setHours(h, m, 0, 0);
                if (at <= new Date()) at.setDate(at.getDate() + 1);
                await socialNotificationPolicyService.createOneTimePolicy(
                    me.uid,
                    scope,
                    { type: 'user', userIds: [me.uid] },
                    'Reminder',
                    settings.quickRuleMessage.trim(),
                    at
                );
            }

            setSettings(prev => ({ ...prev, quickRuleMessage: '' }));
            await refreshPolicies();
            await socialNotificationScheduler.reconcile(me.uid);
            await refreshDebugInfo();
        } catch (error) {
            console.error('[NotificationSettings] Failed to create policy', error);
            setPolicyError('Failed to create rule. Check permissions and try again.');
        }
    };

    const toIsoForTimeInput = (value?: SocialNotificationPolicy['oneTimeAt']): string => {
        if (!value || typeof value !== 'string') return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };

    const startEditPolicy = (policy: SocialNotificationPolicy): void => {
        setEditingPolicyId(policy.id);
        setPolicyDraft({
            title: policy.title || '',
            message: policy.message || '',
            dailyTime: policy.dailyTime || '09:00',
            hourlyIntervalMinutes: policy.hourlyIntervalMinutes || 60,
            oneTimeAt: toIsoForTimeInput(policy.oneTimeAt),
        });
    };

    const togglePolicy = async (policy: SocialNotificationPolicy): Promise<void> => {
        if (!me) return;
        setSavingPolicyId(policy.id);
        try {
            await socialNotificationPolicyService.updatePolicy(policy.id, { enabled: !policy.enabled });
            await refreshPolicies();
            await socialNotificationScheduler.reconcile(me.uid);
            await refreshDebugInfo();
        } finally {
            setSavingPolicyId(null);
        }
    };

    const deletePolicy = async (policyId: string): Promise<void> => {
        if (!me) return;
        setSavingPolicyId(policyId);
        try {
            await socialNotificationPolicyService.deletePolicy(policyId);
            await refreshPolicies();
            await socialNotificationScheduler.reconcile(me.uid);
            await refreshDebugInfo();
            if (editingPolicyId === policyId) {
                setEditingPolicyId(null);
            }
        } finally {
            setSavingPolicyId(null);
        }
    };

    const savePolicyEdits = async (policy: SocialNotificationPolicy): Promise<void> => {
        if (!me) return;
        setSavingPolicyId(policy.id);
        try {
            const updates: Partial<SocialNotificationPolicy> = {
                title: policyDraft.title.trim() || policy.title,
                message: policyDraft.message.trim() || policy.message,
            };
            if (policy.ruleType === 'dailyTime') {
                updates.dailyTime = policyDraft.dailyTime;
            } else if (policy.ruleType === 'hourly') {
                updates.hourlyIntervalMinutes = Math.max(15, policyDraft.hourlyIntervalMinutes || 60);
            } else if (policy.ruleType === 'oneTime') {
                updates.oneTimeAt = policyDraft.oneTimeAt ? new Date(policyDraft.oneTimeAt).toISOString() : policy.oneTimeAt;
            }

            await socialNotificationPolicyService.updatePolicy(policy.id, updates);
            await refreshPolicies();
            setEditingPolicyId(null);
            await socialNotificationScheduler.reconcile(me.uid);
            await refreshDebugInfo();
        } finally {
            setSavingPolicyId(null);
        }
    };

    const forceResync = async (): Promise<void> => {
        if (!me) return;
        await socialNotificationScheduler.reconcile(me.uid);
        await refreshDebugInfo();
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col h-[100dvh] bg-brand-surface dark:bg-neutral-950 overflow-hidden">
            {/* Premium Sticky Header */}
            <div className="flex items-center px-4 py-5 sm:px-6 sticky top-0 z-20 bg-brand-surface/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shadow-sm">
                <button
                    onClick={onBack}
                    className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-black/5 dark:border-white/10 hover:scale-105 active:scale-95 transition-all text-neutral-600 dark:text-neutral-300"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="ml-4">
                    <h2 className="text-xl sm:text-2xl font-black text-brand-forest dark:text-white tracking-tight">
                        {title || t('settings_notifications')}
                    </h2>
                    <p className="text-xs font-medium text-brand-muted hidden sm:block">Manage your alerts, rules, and quiet hours directly.</p>
                </div>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto space-y-8 max-w-[85rem] mx-auto w-full pb-32">

                {/* Adhan Settings */}
                {!defaultScope && (
                    <section className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <BellRing size={18} className="text-brand-primary" />
                            <h3 className="text-base font-bold text-brand-forest dark:text-white tracking-wide">
                                {t('profile_adhan_alerts')}
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-soft-xl border border-black/5 dark:border-white/5 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
                            {PRAYERS.map((prayer) => (
                                <div key={prayer} className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-subtle dark:bg-neutral-800 flex items-center justify-center text-brand-forest dark:text-gray-300 font-bold font-arabic capitalize text-sm">
                                            {prayer.charAt(0)}
                                        </div>
                                        <div className="capitalize font-bold text-base text-neutral-800 dark:text-neutral-200">{t(prayer as any)}</div>
                                    </div>
                                    <button
                                        onClick={() => toggle(prayer as any)}
                                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${settings[prayer as keyof typeof settings] ? 'bg-brand-primary' : 'bg-neutral-200 dark:bg-neutral-700'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${settings[prayer as keyof typeof settings]
                                                ? 'translate-x-7 rtl:-translate-x-7'
                                                : 'translate-x-1 rtl:-translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Global Settings */}
                {!defaultScope && (
                    <section className="animate-in slide-in-from-bottom-3 duration-500">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Settings2 size={18} className="text-orange-500" />
                            <h3 className="text-base font-bold text-brand-forest dark:text-white tracking-wide">
                                {t('profile_global_settings')}
                            </h3>
                        </div>
                        <div className="bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-900 dark:to-neutral-900 rounded-3xl shadow-soft-xl border border-orange-100/50 dark:border-white/5 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-100/80 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-sm">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-base text-neutral-800 dark:text-neutral-200 block">{t('settings_pre_prayer')}</span>
                                        <span className="text-xs text-brand-muted hidden sm:block">When should we warn you before Adhan?</span>
                                    </div>
                                </div>
                                <select
                                    className="bg-brand-surface dark:bg-neutral-800 border-none shadow-inner-soft dark:shadow-none rounded-2xl px-4 py-2.5 text-sm md:text-base font-bold text-brand-forest dark:text-white outline-none cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-orange-400/30 transition-shadow appearance-none"
                                    value={settings.reminderTiming}
                                    onChange={(e) => setSettings(prev => {
                                        const next = { ...prev, reminderTiming: e.target.value as any };
                                        persistSettings(next);
                                        return next;
                                    })}
                                >
                                    <option value="atTime">{t('settings_at_time')}</option>
                                    <option value="before5">{t('settings_before_5')}</option>
                                    <option value="before10">{t('settings_before_10')}</option>
                                    <option value="before15">{t('settings_before_15')}</option>
                                    <option value="before30">{t('settings_before_30')}</option>
                                </select>
                            </div>
                        </div>
                    </section>
                )}

                {/* Social Reminder Rules */}
                {!defaultScope && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Shield size={18} className="text-brand-mint" />
                            <h3 className="text-base font-bold text-brand-forest dark:text-white tracking-wide">
                                Social Delivery Rules
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-soft-xl border border-black/5 dark:border-white/5 p-6 space-y-6">
                            
                            <div className="flex items-center justify-between p-4 bg-brand-surface dark:bg-neutral-800 rounded-2xl border border-black/5 dark:border-white/5">
                                <div>
                                    <span className="font-bold text-base text-neutral-800 dark:text-neutral-200 block">Sync Social Rules</span>
                                    <span className="text-xs text-brand-muted mt-0.5 block">Apply your group's notification policies to your device</span>
                                </div>
                                <button onClick={() => toggle('socialRuleSyncEnabled')} className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${settings.socialRuleSyncEnabled ? 'bg-brand-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${settings.socialRuleSyncEnabled ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <span className="font-bold text-sm text-neutral-800 dark:text-neutral-300 block px-1">Mute Specific Scopes</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button onClick={() => toggle('mutePartner')} className={`p-4 rounded-2xl font-bold text-sm transition-all shadow-sm border ${settings.mutePartner ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-brand-surface border-black/5 dark:bg-neutral-800 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>Partners</button>
                                    <button onClick={() => toggle('muteFamily')} className={`p-4 rounded-2xl font-bold text-sm transition-all shadow-sm border ${settings.muteFamily ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-brand-surface border-black/5 dark:bg-neutral-800 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>Family</button>
                                    <button onClick={() => toggle('muteSuhba')} className={`p-4 rounded-2xl font-bold text-sm transition-all shadow-sm border ${settings.muteSuhba ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-brand-surface border-black/5 dark:bg-neutral-800 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>Suhba</button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
                                            <Moon size={20} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-base text-neutral-800 dark:text-neutral-200 block">Quiet Hours</span>
                                            <span className="text-xs text-brand-muted">Block social alerts during sleep times</span>
                                        </div>
                                    </div>
                                    <button onClick={() => toggle('quietHoursEnabled')} className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${settings.quietHoursEnabled ? 'bg-brand-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${settings.quietHoursEnabled ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'}`} />
                                    </button>
                                </div>
                                {settings.quietHoursEnabled && (
                                    <div className="grid grid-cols-2 gap-4 bg-brand-surface dark:bg-neutral-800 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                                        <div>
                                            <label className="text-xs font-bold text-brand-muted block mb-1">Start Time</label>
                                            <input type="time" value={settings.quietHoursStart} onChange={(e) => setSettings(prev => { const next = { ...prev, quietHoursStart: e.target.value }; persistSettings(next); return next; })} className="w-full border-none shadow-inner-soft dark:shadow-none bg-white dark:bg-neutral-700 rounded-xl p-3 text-sm font-bold text-brand-forest dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-brand-muted block mb-1">End Time</label>
                                            <input type="time" value={settings.quietHoursEnd} onChange={(e) => setSettings(prev => { const next = { ...prev, quietHoursEnd: e.target.value }; persistSettings(next); return next; })} className="w-full border-none shadow-inner-soft dark:shadow-none bg-white dark:bg-neutral-700 rounded-xl p-3 text-sm font-bold text-brand-forest dark:text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Scope-specific Quick Rules & My Policies */}
                {canManagePolicies && (
                    <section className="animate-in slide-in-from-bottom-5 duration-700">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Plus size={18} className="text-emerald-500" />
                            <h3 className="text-base font-bold text-brand-forest dark:text-white tracking-wide">
                                {defaultScope ? `${defaultScope[0].toUpperCase()}${defaultScope.slice(1)} Admin Rules` : 'Quick Admin Rule'}
                            </h3>
                        </div>
                        
                        <div className="bg-gradient-to-br from-brand-forest to-emerald-800 rounded-3xl shadow-premium p-6 sm:p-8 space-y-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-10 -translate-y-10">
                                <Plus size={200} />
                            </div>

                            <div className="relative z-10">
                                <label className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-2">Notification Message</label>
                                <input
                                    value={settings.quickRuleMessage}
                                    onChange={(e) => setSettings(prev => ({ ...prev, quickRuleMessage: e.target.value }))}
                                    className="w-full border-none bg-white/10 placeholder:text-white/40 focus:bg-white/20 rounded-2xl p-4 text-base font-bold text-white outline-none transition-colors backdrop-blur-sm"
                                    placeholder="Example: Remember to make istighfar right now"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                <div>
                                    <label className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-2">Target Scope</label>
                                    {!defaultScope ? (
                                        <CustomDropdown 
                                            value={settings.quickRuleScope} 
                                            onChange={(val) => setSettings(prev => ({ ...prev, quickRuleScope: val as any }))}
                                            options={[
                                                { value: 'partner', label: 'Partner' },
                                                { value: 'family', label: 'Family' },
                                                { value: 'suhba', label: 'Suhba' }
                                            ]}
                                        />
                                    ) : (
                                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold capitalize backdrop-blur-sm text-center">
                                            {defaultScope}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-2">Frequency</label>
                                    <CustomDropdown 
                                        value={settings.quickRuleType} 
                                        onChange={(val) => setSettings(prev => ({ ...prev, quickRuleType: val as any }))}
                                        options={[
                                            { value: 'dailyTime', label: 'Daily Specific Time' },
                                            { value: 'hourly', label: 'Repeating Interval' },
                                            { value: 'oneTime', label: 'One-time Trigger' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-200 uppercase tracking-widest block mb-2">Timing Configuration</label>
                                    {settings.quickRuleType === 'hourly' ? (
                                        <div className="relative">
                                            <input type="number" min={15} value={settings.quickRuleInterval} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleInterval: Number(e.target.value) || 60 }))} className="w-full bg-white/10 border-none outline-none rounded-2xl p-4 text-sm font-bold placeholder:text-white/40 focus:bg-white/20 backdrop-blur-sm pr-12" placeholder="Minutes" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">MINS</span>
                                        </div>
                                    ) : (
                                        <input type="time" value={settings.quickRuleTime} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleTime: e.target.value }))} className="w-full bg-white/10 border-none outline-none rounded-2xl p-4 text-sm font-bold focus:bg-white/20 backdrop-blur-sm" />
                                    )}
                                </div>
                            </div>
                            <div className="pt-2 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <p className="text-xs text-brand-mint font-medium animate-in fade-in max-w-sm">{policyError}</p>
                                <button
                                    onClick={createQuickRule}
                                    className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-brand-forest hover:bg-brand-mint active:scale-95 transition-all outline-none font-black text-sm flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <CheckCircle2 size={18} /> Launch Global Rule
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Policies List View */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-emerald-600" />
                            <h3 className="text-base font-bold text-brand-forest dark:text-white tracking-wide">
                                {canManagePolicies ? 'My Deployed Policies' : 'Active Group Policies'}
                            </h3>
                        </div>
                        <button
                            onClick={() => refreshPolicies()}
                            className="bg-brand-surface dark:bg-neutral-800 text-brand-forest dark:text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm border border-black/5 dark:border-white/5 active:scale-95 transition-transform"
                        >
                            Refresh Log
                        </button>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-soft-xl border border-black/5 dark:border-white/5 p-4 sm:p-6 space-y-4 min-h-[150px]">
                        {loadingPolicies ? (
                            <div className="flex items-center justify-center h-24 text-sm font-bold text-brand-muted animate-pulse">Loading policies from network...</div>
                        ) : myPolicies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-24 text-center">
                                <p className="text-sm font-bold text-neutral-400 dark:text-neutral-500">
                                    {canManagePolicies ? 'No policies deployed. The network is quiet.' : 'No active policies affecting this group.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {myPolicies.map((policy) => (
                                    <div key={policy.id} className="bg-brand-surface/50 dark:bg-neutral-800/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-2 h-2 rounded-full ${policy.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                                                    <h4 className="font-bold text-sm sm:text-base text-brand-forest dark:text-white">{policy.title}</h4>
                                                </div>
                                                <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">{policy.ruleType} • scope: {policy.scope}</p>
                                            </div>
                                            {!canManagePolicies && (
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${policy.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                    {policy.enabled ? 'ON' : 'OFF'}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                            "{policy.message}"
                                        </p>

                                        {canManagePolicies && (
                                            <div className="flex items-center justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => togglePolicy(policy)}
                                                    disabled={savingPolicyId === policy.id}
                                                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${policy.enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-neutral-700'}`}
                                                >
                                                    {policy.enabled ? 'OFF' : 'ON'}
                                                </button>
                                                <button
                                                    onClick={() => startEditPolicy(policy)}
                                                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-100"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deletePolicy(policy.id)}
                                                    disabled={savingPolicyId === policy.id}
                                                    className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Edit Form */}
                                        {canManagePolicies && editingPolicyId === policy.id && (
                                            <div className="mt-2 bg-brand-primary/5 rounded-2xl p-4 border border-brand-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    value={policyDraft.title}
                                                    onChange={(e) => setPolicyDraft((prev) => ({ ...prev, title: e.target.value }))}
                                                    className="w-full bg-white dark:bg-neutral-800 border border-black/5 rounded-xl p-3 text-sm font-bold text-brand-forest dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/20"
                                                    placeholder="Policy Title"
                                                />
                                                <textarea
                                                    value={policyDraft.message}
                                                    onChange={(e) => setPolicyDraft((prev) => ({ ...prev, message: e.target.value }))}
                                                    className="w-full bg-white dark:bg-neutral-800 border border-black/5 rounded-xl p-3 text-sm font-bold text-brand-forest dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/20"
                                                    placeholder="Message Payload"
                                                    rows={2}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => savePolicyEdits(policy)}
                                                        disabled={savingPolicyId === policy.id}
                                                        className="flex-1 bg-brand-primary text-white text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-all shadow-primary disabled:opacity-50"
                                                    >
                                                        Save Patch
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingPolicyId(null)}
                                                        className="flex-1 bg-white dark:bg-neutral-800 text-brand-forest dark:text-white border border-black/5 dark:border-white/5 text-sm font-bold py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                                                    >
                                                        Discard
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Debug Layer */}
                <section>
                    <div className="bg-brand-surface dark:bg-neutral-900 border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-brand-muted tracking-wide uppercase">Core System Debug</h3>
                            <div className="flex gap-2">
                                <button onClick={() => refreshDebugInfo()} className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors">Poll</button>
                                <button onClick={forceResync} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Force Sync</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-brand-muted block mb-0.5">Device Support</span>
                                <span className={debugInfo.supported ? 'text-emerald-600' : 'text-red-600'}>{String(debugInfo.supported).toUpperCase()}</span>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-brand-muted block mb-0.5">OS Permission</span>
                                <span className="text-brand-forest dark:text-white uppercase">{debugInfo.permission}</span>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-brand-muted block mb-0.5">Scheduler State</span>
                                <span className="text-brand-forest dark:text-white uppercase">{String(debugInfo.schedulerRunning)}</span>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-brand-muted block mb-0.5">Active Rules</span>
                                <span className="text-brand-forest dark:text-white uppercase text-base">{debugInfo.activePolicyCount}</span>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
