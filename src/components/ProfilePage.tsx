
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { User } from '../types'; // Verify types, might need to use AuthService UserProfile types or sync them
import {
  Settings, Bell, Moon, Globe, Shield, ChevronRight, LogOut,
  User as UserIcon, Lock, Clock, MapPin, Volume2, Calendar,
  Smartphone, HelpCircle, FileText, Palette, Radio, ChevronLeft,
  X, Check, Cloud, Sparkles, Users, Mail, Key, Trophy, Hash, Tag,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncManager } from '../hooks/useSyncManager';
import { AuthModal } from './AuthModal';
import { SyncIndicator } from './SyncIndicator';
import { DEFAULT_USER_SETTINGS } from '../services/AuthService';
import { LocalisationSettings } from './settings/LocalisationSettings';
import { BadgesSection } from './profile/BadgesSection';
import { useToast, Toast } from './shared/Toast';

interface ProfilePageProps {
  user: User;
  onTestAdhan?: () => void;
  onRequestOnboarding?: () => void;
}

type ViewState = 'main' | 'account' | 'security' | 'privacy' | 'notifications' | 'app' | 'support' | 'localisation' | 'achievements';

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onTestAdhan, onRequestOnboarding }) => {

  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user: firebaseUser, signOut, updateProfile, updateSettings, uploadAvatar } = useAuth();
  const { syncState, forceSync } = useSyncManager();

  const [activeView, setActiveView] = useState<ViewState>('main');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const formFullName = `${(firebaseUser as any)?.firstName || ''} ${(firebaseUser as any)?.lastName || ''}`.trim();
  const resolvedDisplayName = formFullName || user.name || firebaseUser?.displayName || 'User';
  const genderAvatar =
    firebaseUser?.gender === 'female'
      ? '/womenicon.png'
      : firebaseUser?.gender === 'male'
        ? '/manicon.png'
        : '';
  const resolvedAvatar = user.avatar || genderAvatar || firebaseUser?.photoURL || '';

  // --- SUB-COMPONENTS ---

  // 1. ACCOUNT SETTINGS - Enhanced with nickname, age, about, hobbies
  const AccountView = () => {
    const [name, setName] = useState(firebaseUser?.displayName || user.name || '');
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [about, setAbout] = useState('');
    const [hobbies, setHobbies] = useState<string[]>([]);
    const [newHobby, setNewHobby] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);


    // Load existing profile data
    useEffect(() => {
      const loadProfile = async () => {
        if (!firebaseUser?.uid) {
          setIsLoading(false);
          return;
        }
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setNickname(data.nickname || '');
            setAge(data.age || '');
            setAbout(data.bio || data.about || '');
            setHobbies(data.hobbies || []);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadProfile();
    }, [firebaseUser?.uid]);

    const handleAddHobby = () => {
      if (newHobby.trim() && hobbies.length < 5) {
        setHobbies([...hobbies, newHobby.trim()]);
        setNewHobby('');
      }
    };

    const handleRemoveHobby = (index: number) => {
      setHobbies(hobbies.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
      setIsSaving(true);
      try {
        // Update Firebase Auth profile
        await updateProfile({ displayName: name });

        // Update Firestore with extended fields
        if (firebaseUser?.uid) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            displayName: name,
            nickname,
            age: age || null,
            bio: about,
            about,
            hobbies,
            updatedAt: new Date().toISOString()
          });
        }
        setActiveView('main');
      } catch (error) {
        console.error(error);
        showToast('Failed to update profile', 'error');
      } finally {
        setIsSaving(false);
      }
    };



    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-300 px-1">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft size={24} className="rtl:rotate-180 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Edit Profile</h2>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full p-1 bg-gradient-to-br from-brand-primary to-brand-teal shadow-xl shadow-brand-primary/20 ${isLoading ? 'animate-pulse' : ''}`}>
              <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 overflow-hidden relative">
                {resolvedAvatar ? (
                  <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-primary transition-colors">
                <UserIcon size={20} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Nickname & Age Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Nickname</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-primary transition-colors">
                  <Hash size={18} />
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  placeholder="Ali"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Age</label>
              <div className="relative group">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-4 text-center bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  placeholder="25"
                />
              </div>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative opacity-70">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Mail size={20} />
              </div>
              <input
                type="text"
                value={firebaseUser?.email || ''}
                readOnly
                className="w-full pl-12 pr-4 py-4 bg-neutral-100 dark:bg-white/5 border border-transparent rounded-2xl text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* About Me */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">About Me</label>
            <div className="relative group">
              <div className="absolute left-4 top-5 text-neutral-400 group-focus-within:text-brand-primary transition-colors">
                <FileText size={20} />
              </div>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, 200))}
                rows={4}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 outline-none transition-all resize-none font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 leading-relaxed"
                placeholder="Share a bit about yourself..."
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-medium text-neutral-400">
                {about.length}/200
              </div>
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">
              Hobbies ({hobbies.length}/5)
            </label>
            <div className="p-4 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 rounded-2xl space-y-3">
              <div className="flex flex-wrap gap-2">
                {hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-brand-surface shadow-sm text-brand-primary rounded-xl text-sm font-medium animate-in zoom-in duration-200"
                  >
                    <Tag size={12} />
                    {hobby}
                    <button
                      onClick={() => handleRemoveHobby(index)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {hobbies.length === 0 && (
                  <span className="text-sm text-neutral-400 italic py-1">No hobbies added yet</span>
                )}
              </div>

              {hobbies.length < 5 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
                    className="flex-1 bg-transparent border-b-2 border-neutral-200 dark:border-neutral-700 focus:border-brand-primary py-2 px-1 outline-none transition-colors text-sm"
                    placeholder="Type a hobby and press Enter..."
                  />
                  <button
                    onClick={handleAddHobby}
                    disabled={!newHobby.trim()}
                    className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-white via-white to-transparent dark:from-brand-surface dark:via-brand-surface">
          <Button
            fullWidth
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary text-white h-14 text-lg font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all active:scale-95"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div >
    );
  };

  // 2. SECURITY SETTINGS
  const SecurityView = () => {
    const [resetSent, setResetSent] = useState(false);

    const handleReset = async () => {
      // Password reset not supported in Google-only auth
      showToast('Password reset is managed by Google.', 'info');
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10">
            <ChevronLeft size={24} className="rtl:rotate-180 text-neutral-600" />
          </button>
          <h2 className="text-xl font-bold text-neutral-900">Password & Security</h2>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
          <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
            <Key size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">Password Management</h3>
            <p className="text-sm text-indigo-700/80 mt-1">We don't store your password directly. You can request a secure reset link.</p>
          </div>
        </div>

        <div className="pt-4">
          <Button fullWidth variant="outline" onClick={handleReset} disabled={resetSent} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-14">
            {resetSent ? 'Reset Link Sent to Email' : 'Send Password Reset Email'}
          </Button>
        </div>
      </div>
    );
  };

  // 3. NOTIFICATIONS
  const NotificationView = () => {
    // We assume settings structure from AuthService DEFAULT_USER_SETTINGS
    // If user.settings is missing, fallback to default
    const userSettings = firebaseUser?.settings || DEFAULT_USER_SETTINGS;
    const [enabled, setEnabled] = useState(userSettings.notificationsEnabled);
    const [reminders, setReminders] = useState(userSettings.prayerReminders);

    const toggleMain = async () => {
      const newVal = !enabled;
      setEnabled(newVal);
      await updateSettings({ notificationsEnabled: newVal });
    };

    const togglePrayer = async (key: keyof typeof reminders) => {
      const newReminders = { ...reminders, [key]: !reminders[key] };
      setReminders(newReminders);
      await updateSettings({ prayerReminders: newReminders });
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10">
            <ChevronLeft size={24} className="rtl:rotate-180 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Notifications</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-white dark:bg-brand-surface rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-neutral-800 dark:text-white">Push Notifications</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Master switch for all alerts</p>
            </div>
          </div>
          <div
            onClick={toggleMain}
            className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${enabled ? 'bg-brand-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${enabled ? 'left-6' : 'left-1'}`}></div>
          </div>
        </div>

        {/* Prayer Alerts - Always show but grey out when disabled */}
        <div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : 'animate-in fade-in slide-in-from-top-2'}`}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-2">Prayer Alerts</h3>
          {Object.entries(reminders).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white dark:bg-brand-surface rounded-xl border border-neutral-100 dark:border-white/5">
              <span className="capitalize font-medium text-neutral-700 dark:text-neutral-200">{key}</span>
              <div
                onClick={() => enabled && togglePrayer(key as keyof typeof reminders)}
                className={`w-10 h-6 rounded-full transition-colors relative ${enabled ? 'cursor-pointer' : 'cursor-not-allowed'} ${val ? 'bg-brand-forest' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${val ? 'left-5' : 'left-1'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 4. ACHIEVEMENTS VIEW
  const AchievementsView = () => {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10">
            <ChevronLeft size={24} className="rtl:rotate-180 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {t('my_achievements')}
          </h2>
        </div>

        <div className="glass-panel p-6 min-h-[60vh]">
          <BadgesSection />
        </div>
      </div>
    );
  };


  // MAIN LIST VIEW (Existing Logic)
  const MainView = () => {
    // Helper to render theme switcher
    const ThemeSwitcher = () => (
      <div className="flex bg-neutral-100 dark:bg-black/20 p-1 rounded-xl">
        <button
          onClick={(e) => { e.stopPropagation(); setTheme('light'); }}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-brand-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
        >
          {t('theme_light')}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setTheme('dark'); }}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-brand-surface dark:bg-white/10 text-brand-primary dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
        >
          {t('theme_dark')}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setTheme('auto'); }}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'auto' ? 'bg-white dark:bg-white/10 text-brand-primary dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
        >
          {t('theme_auto')}
        </button>
      </div>
    );

    interface SettingsItem {
      icon: React.ElementType;
      label: string;
      sub?: string;
      color: string;
      view?: ViewState;
      action?: () => void;
      customRight?: React.ReactNode;
    }

    const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
      {
        title: t('section_account'),
        items: [
          { icon: UserIcon, label: "Personal Information", sub: "Name, Email, Avatar", color: "text-blue-600 bg-blue-50", view: 'account' },
        ]
      },
      {
        title: "Achievements",
        items: [
          { icon: Trophy, label: "My Badges & Stats", sub: "View your progress", color: "text-amber-600 bg-amber-50", view: 'achievements' },
        ]
      },
      {
        title: t('section_prayer'),
        items: [
          { icon: MapPin, label: "Location Settings", sub: "View coordinates, refresh GPS", color: "text-red-600 bg-red-50", view: 'localisation' },
        ]
      },
      {
        title: t('section_notifications'),
        items: [
          { icon: Bell, label: "Push Notifications", sub: "Prayers, Reminders, Updates", color: "text-amber-600 bg-amber-50", view: 'notifications' },
        ]
      },
      {
        title: t('section_app'),
        items: [
          {
            icon: Palette,
            label: "Appearance",
            customRight: <div className="w-48"><ThemeSwitcher /></div>,
            color: "text-purple-600 bg-purple-50",
            action: () => { } // No-op, controlled by switcher
          },
          {
            icon: Globe,
            label: t('pref_language'),
            sub: language === 'ar' ? 'العربية' : 'English',
            color: "text-cyan-600 bg-cyan-50",
            action: () => setIsLangModalOpen(true)
          }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        {/* Authenticated User Profile Header */}
        {isAuthenticated && (
          <div id="profile-user-card" className="flex items-center space-x-4 rtl:space-x-reverse p-5 glass-panel mt-4">
            <div className="w-16 h-16 rounded-full relative flex-shrink-0">
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={resolvedDisplayName}
                  className="w-full h-full rounded-full object-cover border-2 border-brand-primary/20"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xl font-bold">
                  {resolvedDisplayName.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 bg-brand-primary w-4 h-4 rounded-full border-2 border-brand-surface shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate">{resolvedDisplayName}</h2>
              <p className="text-sm text-neutral-400 truncate">{firebaseUser?.email}</p>
              <div className="mt-1">
                <SyncIndicator
                  status={syncState.status}
                  isOnline={syncState.isOnline}
                  pendingChanges={syncState.pendingChanges}
                  onPress={forceSync}
                />
              </div>
            </div>
          </div>
        )}

        {/* Guest Banner - Solid Clean */}
        {!isAuthenticated && (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-neutral-700 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <UserIcon size={24} />
              </div>
              <div className="text-center sm:text-start">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {t('guest_mode')}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                  {t('guest_mode_desc')}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 shadow-md border-0 min-w-[120px]"
            >
              {t('sign_in_btn')}
            </Button>
          </div>
        )}



        {/* Settings List */}
        <div className="space-y-6">
          {SETTINGS_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-bold text-brand-secondary uppercase tracking-wider ms-3 mb-2">{section.title}</h3>
              <div className="glass-panel overflow-hidden">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.view) setActiveView(item.view);
                    }}
                    className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className={`p-2.5 rounded-xl bg-opacity-10 ${item.color.replace('bg-', 'bg-').replace('50', '500/10')}`}>
                        <item.icon size={18} className={item.color.split(' ')[0]} />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white text-sm group-hover:text-brand-primary transition-colors">
                          {item.label}
                        </p>
                        {item.sub && <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.sub}</p>}
                      </div>
                    </div>
                    {item.customRight ? item.customRight : (
                      <ChevronRight size={18} className="text-neutral-500 dark:text-neutral-500 group-hover:text-brand-primary rtl:rotate-180" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isAuthenticated && (
          <div className="pt-4 space-y-2">
            <Button variant="outline" fullWidth onClick={() => signOut()} className="text-red-400 border-red-500/20 hover:bg-red-500/10">
              <LogOut size={18} className="me-2" /> {t('signOut')}
            </Button>

            {/* Test Button: Reset Onboarding (for development) */}
            <button
              onClick={() => {
                localStorage.removeItem('khalil_onboarding');
                showToast('Onboarding reset! Refreshing...', 'info');
                window.location.reload();
              }}
                    className="w-full py-2 text-xs text-brand-muted hover:text-brand-forest underline"
            >
              🧪 Reset Onboarding (Test)
            </button>

            {/* Test Button: Adhan Alert (for development) */}
            <button
              onClick={() => {
                console.log('[ProfilePage] Test Adhan button clicked');
                onTestAdhan?.();
              }}
                    className="w-full py-2 text-xs text-brand-muted hover:text-brand-forest underline"
            >
              🔔 Test Adhan Alert
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-5 md:px-8 pt-4">
      <AnimatePresence mode="wait">
        {activeView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <MainView />
          </motion.div>
        )}

        {activeView === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <AccountView />
          </motion.div>
        )}

        {activeView === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SecurityView />
          </motion.div>
        )}

        {activeView === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <NotificationView />
          </motion.div>
        )}

        {activeView === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <AchievementsView />
          </motion.div>
        )}

        {activeView === 'localisation' && (
          <motion.div
            key="localisation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <LocalisationSettings onBack={() => setActiveView('main')} />
          </motion.div>
        )}

        {/* Placeholder for others */}
        {['privacy', 'app', 'support'].includes(activeView) && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="text-center py-20"
          >
            <p className="text-neutral-400">Section under construction</p>
            <Button variant="ghost" onClick={() => setActiveView('main')} className="mt-4">Go Back</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-xs m-4 relative animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{t('pref_language')}</h3>
            <div className="space-y-2">
              {/* English */}
              <button onClick={() => { setLanguage('en'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center">
                <div>
                  <span className="font-medium">English</span>
                  <span className="text-xs text-neutral-400 ml-2">🇬🇧</span>
                </div>
                {language === 'en' && <Check size={18} className="text-brand-primary" />}
              </button>

              {/* Arabic */}
              <button onClick={() => { setLanguage('ar'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center dark:bg-brand-surface dark:border-brand-border/10 dark:hover:bg-white/5">
                <div>
                  <span className="font-medium dark:text-white">العربية</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">🇸🇦</span>
                </div>
                {language === 'ar' && <Check size={18} className="text-brand-primary" />}
              </button>

              {/* French */}
              <button onClick={() => { setLanguage('fr'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center dark:bg-brand-surface dark:border-brand-border/10 dark:hover:bg-white/5">
                <div>
                  <span className="font-medium dark:text-white">Français</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">🇫🇷</span>
                </div>
                {language === 'fr' && <Check size={18} className="text-brand-primary" />}
              </button>

              {/* Turkish */}
              <button onClick={() => { setLanguage('tr'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center dark:bg-brand-surface dark:border-brand-border/10 dark:hover:bg-white/5">
                <div>
                  <span className="font-medium dark:text-white">Türkçe</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">🇹🇷</span>
                </div>
                {language === 'tr' && <Check size={18} className="text-brand-primary" />}
              </button>

              {/* Urdu */}
              <button onClick={() => { setLanguage('ur'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center dark:bg-brand-surface dark:border-brand-border/10 dark:hover:bg-white/5">
                <div>
                  <span className="font-medium dark:text-white">اردو</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">🇵🇰</span>
                </div>
                {language === 'ur' && <Check size={18} className="text-brand-primary" />}
              </button>

              {/* Indonesian */}
              <button onClick={() => { setLanguage('id'); setIsLangModalOpen(false); }} className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 flex justify-between items-center dark:bg-brand-surface dark:border-brand-border/10 dark:hover:bg-white/5">
                <div>
                  <span className="font-medium dark:text-white">Bahasa Indonesia</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2">🇮🇩</span>
                </div>
                {language === 'id' && <Check size={18} className="text-brand-primary" />}
              </button>
            </div>
            <button onClick={() => setIsLangModalOpen(false)} className="absolute top-4 right-4 p-2 text-neutral-400"><X size={20} /></button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Trigger onboarding redirect for newly signed-up users
          if (onRequestOnboarding) {
            onRequestOnboarding();
          }
        }}
      />

      <AnimatePresence>
        {toast && <Toast {...toast} onDismiss={clearToast} />}
      </AnimatePresence>
    </div>
  );
};
