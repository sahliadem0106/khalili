import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Bell, Plus } from 'lucide-react';
import { notificationService } from '../../services/NotificationService';
import { socialNotificationPolicyService } from '../../services/SocialNotificationPolicyService';
import { authService } from '../../services/AuthService';
import { SocialNotificationPolicy } from '../../types/socialNotificationPolicy';
import { socialNotificationScheduler } from '../../services/SocialNotificationScheduler';

interface NotificationSettingsProps {
    onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
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
        quickRuleScope: 'partner' as 'partner' | 'family' | 'suhba',
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
        }));
        refreshDebugInfo().catch(console.error);
        refreshPolicies().catch(console.error);
    }, []);

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
            const policies = await socialNotificationPolicyService.fetchOwnedPolicies(currentUser.uid);
            setMyPolicies(policies);
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
        if (!me || !settings.quickRuleMessage.trim()) return;

        if (settings.quickRuleType === 'hourly') {
            await socialNotificationPolicyService.createPolicy({
                scope: settings.quickRuleScope,
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
                scope: settings.quickRuleScope,
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
                settings.quickRuleScope,
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
        <div className="flex flex-col h-full bg-brand-surface">
            <div className="flex items-center p-4 border-b border-brand-primary/10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-colors"
                >
                    <ArrowLeft size={24} className="text-brand-primary" />
                </button>
                <h2 className="text-xl font-bold ml-4 text-brand-forest">
                    {t('settings_notifications')}
                </h2>
            </div>

            <div className="p-5 overflow-y-auto space-y-8">

                {/* Adhan Settings */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('profile_adhan_alerts')}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {PRAYERS.map((prayer) => (
                            <div key={prayer} className="flex items-center justify-between p-4">
                                <div className="capitalize font-medium text-brand-forest">{t(prayer as any)}</div>
                                <button
                                    onClick={() => toggle(prayer as any)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${settings[prayer as keyof typeof settings] ? 'bg-brand-primary' : 'bg-neutral-200'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings[prayer as keyof typeof settings]
                                        ? 'left-6' // Basic flip for LTR, RTL needs CSS dir handling or specific start/end
                                        : 'left-1'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Global Settings */}
                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        {t('profile_global_settings')}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Bell size={16} />
                                </div>
                                <span className="font-medium text-brand-forest">{t('settings_pre_prayer')}</span>
                            </div>
                            <select
                                className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-brand-forest font-medium outline-none focus:ring-2 focus:ring-brand-primary/20"
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

                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        Social Reminder Rules
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-brand-forest">Auto-sync social reminder rules</span>
                            <button onClick={() => toggle('socialRuleSyncEnabled')} className={`relative w-12 h-7 rounded-full transition-colors ${settings.socialRuleSyncEnabled ? 'bg-brand-primary' : 'bg-neutral-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.socialRuleSyncEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => toggle('mutePartner')} className={`p-2 rounded-lg text-sm ${settings.mutePartner ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>Mute Partner</button>
                            <button onClick={() => toggle('muteFamily')} className={`p-2 rounded-lg text-sm ${settings.muteFamily ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>Mute Family</button>
                            <button onClick={() => toggle('muteSuhba')} className={`p-2 rounded-lg text-sm ${settings.muteSuhba ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>Mute Suhba</button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-brand-forest">Quiet hours</span>
                            <button onClick={() => toggle('quietHoursEnabled')} className={`relative w-12 h-7 rounded-full transition-colors ${settings.quietHoursEnabled ? 'bg-brand-primary' : 'bg-neutral-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.quietHoursEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        {settings.quietHoursEnabled && (
                            <div className="grid grid-cols-2 gap-3">
                                <input type="time" value={settings.quietHoursStart} onChange={(e) => setSettings(prev => { const next = { ...prev, quietHoursStart: e.target.value }; persistSettings(next); return next; })} className="border border-gray-200 rounded-lg p-2 text-sm" />
                                <input type="time" value={settings.quietHoursEnd} onChange={(e) => setSettings(prev => { const next = { ...prev, quietHoursEnd: e.target.value }; persistSettings(next); return next; })} className="border border-gray-200 rounded-lg p-2 text-sm" />
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        Quick Admin Rule
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <input
                            value={settings.quickRuleMessage}
                            onChange={(e) => setSettings(prev => ({ ...prev, quickRuleMessage: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            placeholder="Example: Remember to make istighfar"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <select value={settings.quickRuleScope} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleScope: e.target.value as any }))} className="border border-gray-200 rounded-lg p-2 text-sm">
                                <option value="partner">Partner</option>
                                <option value="family">Family</option>
                                <option value="suhba">Suhba</option>
                            </select>
                            <select value={settings.quickRuleType} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleType: e.target.value as any }))} className="border border-gray-200 rounded-lg p-2 text-sm">
                                <option value="dailyTime">Daily</option>
                                <option value="hourly">Hourly</option>
                                <option value="oneTime">One-time</option>
                            </select>
                            {settings.quickRuleType === 'hourly' ? (
                                <input type="number" min={15} value={settings.quickRuleInterval} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleInterval: Number(e.target.value) || 60 }))} className="border border-gray-200 rounded-lg p-2 text-sm" />
                            ) : (
                                <input type="time" value={settings.quickRuleTime} onChange={(e) => setSettings(prev => ({ ...prev, quickRuleTime: e.target.value }))} className="border border-gray-200 rounded-lg p-2 text-sm" />
                            )}
                        </div>
                        <button
                            onClick={createQuickRule}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold"
                        >
                            <Plus size={16} /> Create Rule
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        My Social Policies
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-brand-forest/70">Owned policies: {myPolicies.length}</span>
                            <button
                                onClick={() => refreshPolicies()}
                                className="text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                Refresh
                            </button>
                        </div>
                        {loadingPolicies && <p className="text-sm text-gray-500">Loading policies...</p>}
                        {!loadingPolicies && myPolicies.length === 0 && (
                            <p className="text-sm text-gray-500">No policies yet. Create one using Quick Admin Rule above.</p>
                        )}
                        {!loadingPolicies && myPolicies.map((policy) => (
                            <div key={policy.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-sm text-brand-forest">{policy.title}</p>
                                        <p className="text-xs text-gray-500">{policy.ruleType} - {policy.scope}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => togglePolicy(policy)}
                                            disabled={savingPolicyId === policy.id}
                                            className={`text-xs px-2 py-1 rounded ${policy.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {policy.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                        <button
                                            onClick={() => startEditPolicy(policy)}
                                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deletePolicy(policy.id)}
                                            disabled={savingPolicyId === policy.id}
                                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700">{policy.message}</p>
                                {editingPolicyId === policy.id && (
                                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100">
                                        <input
                                            value={policyDraft.title}
                                            onChange={(e) => setPolicyDraft((prev) => ({ ...prev, title: e.target.value }))}
                                            className="border border-gray-200 rounded-lg p-2 text-sm"
                                            placeholder="Title"
                                        />
                                        <textarea
                                            value={policyDraft.message}
                                            onChange={(e) => setPolicyDraft((prev) => ({ ...prev, message: e.target.value }))}
                                            className="border border-gray-200 rounded-lg p-2 text-sm"
                                            placeholder="Message"
                                            rows={2}
                                        />
                                        {policy.ruleType === 'dailyTime' && (
                                            <input
                                                type="time"
                                                value={policyDraft.dailyTime}
                                                onChange={(e) => setPolicyDraft((prev) => ({ ...prev, dailyTime: e.target.value }))}
                                                className="border border-gray-200 rounded-lg p-2 text-sm"
                                            />
                                        )}
                                        {policy.ruleType === 'hourly' && (
                                            <input
                                                type="number"
                                                min={15}
                                                value={policyDraft.hourlyIntervalMinutes}
                                                onChange={(e) => setPolicyDraft((prev) => ({ ...prev, hourlyIntervalMinutes: Number(e.target.value) || 60 }))}
                                                className="border border-gray-200 rounded-lg p-2 text-sm"
                                            />
                                        )}
                                        {policy.ruleType === 'oneTime' && (
                                            <input
                                                type="datetime-local"
                                                value={policyDraft.oneTimeAt}
                                                onChange={(e) => setPolicyDraft((prev) => ({ ...prev, oneTimeAt: e.target.value }))}
                                                className="border border-gray-200 rounded-lg p-2 text-sm"
                                            />
                                        )}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => savePolicyEdits(policy)}
                                                disabled={savingPolicyId === policy.id}
                                                className="text-xs px-3 py-1.5 rounded bg-brand-primary text-white"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingPolicyId(null)}
                                                className="text-xs px-3 py-1.5 rounded bg-gray-100"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-brand-forest/60 uppercase tracking-wider mb-4 px-1">
                        Notification Debug
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2 text-sm">
                        <p><span className="font-medium">Supported:</span> {String(debugInfo.supported)}</p>
                        <p><span className="font-medium">Permission:</span> {debugInfo.permission}</p>
                        <p><span className="font-medium">Scheduler Running:</span> {String(debugInfo.schedulerRunning)}</p>
                        <p><span className="font-medium">Scheduler Last Sync:</span> {debugInfo.schedulerLastSyncedAt || 'Never'}</p>
                        <p><span className="font-medium">Active Policies (for me):</span> {debugInfo.activePolicyCount}</p>
                        <div>
                            <p className="font-medium">Scheduled IDs:</p>
                            {debugInfo.schedulerScheduledIds.length === 0 ? (
                                <p className="text-gray-500">No scheduled IDs</p>
                            ) : (
                                <ul className="list-disc ml-5 text-xs text-gray-700">
                                    {debugInfo.schedulerScheduledIds.slice(0, 10).map((id) => (
                                        <li key={id}>{id}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => refreshDebugInfo()}
                                className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Refresh Debug
                            </button>
                            <button
                                onClick={forceResync}
                                className="text-xs px-3 py-1.5 rounded bg-brand-primary text-white"
                            >
                                Force Resync
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
