import React, { useState } from 'react';
import { Button } from './ui/Button';
import { User, PrayerSettings } from '../types';
import { 
  Settings, Bell, Moon, Globe, ChevronRight, LogOut, 
  User as UserIcon, Clock, MapPin, Volume2, HelpCircle, 
  FileText, Sliders, Sun, Monitor, ChevronLeft, Check, X, Speaker, LogIn, UserPlus, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

interface ProfilePageProps {
  user: User;
  settings?: PrayerSettings;
  onUpdateSettings?: (newSettings: PrayerSettings) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, settings, onUpdateSettings }) => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setThemeMode } = useTheme();
  const { signInWithGoogle, signInAnonymously, signOut, session, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  
  // UI Modals State
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ar', label: 'Arabic', native: 'العربية' },
  ];

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false); 
    } else {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
    }
  };

  const handleTestNotification = () => {
    if (notificationsEnabled) {
      notificationService.sendNotification(
        "Test Adhan",
        "Hayya 'alas-Salah (Come to Prayer)"
      );
      alert(t('notification_sent'));
    } else {
      alert("Please enable notifications first.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* 1. User Identity Card */}
      <div id="profile-user-card" className="bg-neutral-card rounded-3xl p-6 shadow-sm border border-neutral-line text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-mint to-transparent opacity-50"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto bg-neutral-card p-1.5 rounded-full shadow-md mb-3">
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          </div>
          
          {/* Logged In State */}
          {session ? (
             <>
                <h2 className="text-2xl font-bold text-neutral-primary mb-1">{user.name}</h2>
                <div className="flex items-center justify-center text-sm text-neutral-muted mb-4">
                  <MapPin size={14} className="me-1" /> {user.location}
                </div>
                <div className="flex justify-center space-x-3 rtl:space-x-reverse">
                   <Button size="sm" variant="outline" className="h-9 text-xs">
                      {t('edit')}
                   </Button>
                   <Button size="sm" variant="ghost" onClick={signOut} className="h-9 text-xs text-red-500 hover:bg-red-50 hover:text-red-600">
                      <LogOut size={14} className="me-1" /> {t('signOut')}
                   </Button>
                </div>
             </>
          ) : (
             /* Guest / Logged Out State */
             <div className="mt-4 animate-in slide-in-from-bottom-2">
                <h2 className="text-xl font-bold text-neutral-primary mb-1">Welcome, Guest</h2>
                <p className="text-xs text-neutral-500 mb-6 max-w-[200px] mx-auto">Sign in to sync your progress, prayers, and habits across devices.</p>
                
                <div className="flex flex-col gap-3 justify-center px-2">
                   {/* Professional Google Button */}
                   <button 
                      onClick={signInWithGoogle}
                      disabled={loading}
                      className="w-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                   >
                      <svg className="w-5 h-5 me-3" viewBox="0 0 24 24">
                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Sign in with Google
                   </button>

                   <button 
                      onClick={signInAnonymously}
                      className="w-full text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 py-2"
                   >
                      Continue as Guest
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-2 mt-6 border-t border-neutral-line pt-4">
           <div className="text-center">
              <span className="block text-lg font-bold text-brand-forest">84%</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">{t('profile_commitment')}</span>
           </div>
           <div className="text-center border-x border-neutral-line">
              <span className="block text-lg font-bold text-brand-forest">12</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">{t('streakDesc')}</span>
           </div>
           <div className="text-center">
              <span className="block text-lg font-bold text-brand-forest">3.8</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">{t('profile_avg_khushu')}</span>
           </div>
        </div>
      </div>

      {/* 2. Settings Sections */}
      <div className="space-y-4" id="profile-settings-first">
        
        {/* Appearance */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('pref_theme')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden p-1">
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                 <button 
                    onClick={() => setThemeMode('light')}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all ${theme.mode === 'light' ? 'bg-white dark:bg-neutral-700 shadow text-brand-forest' : 'text-neutral-500 dark:text-neutral-400'}`}
                 >
                    <Sun size={16} className="me-2" /> Light
                 </button>
                 <button 
                    onClick={() => setThemeMode('dark')}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all ${theme.mode === 'dark' ? 'bg-white dark:bg-neutral-700 shadow text-brand-forest' : 'text-neutral-500 dark:text-neutral-400'}`}
                 >
                    <Moon size={16} className="me-2" /> Dark
                 </button>
                 <button 
                    onClick={() => setThemeMode('system')}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all ${theme.mode === 'system' ? 'bg-white dark:bg-neutral-700 shadow text-brand-forest' : 'text-neutral-500 dark:text-neutral-400'}`}
                 >
                    <Monitor size={16} className="me-2" /> System
                 </button>
              </div>
           </div>
        </div>

        {/* App Preferences */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('section_app')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden">
              <SettingItem 
                icon={Globe} 
                label={t('pref_language')} 
                value={LANGUAGES.find(l => l.code === language)?.native} 
                onClick={() => setIsLangModalOpen(true)}
                hasArrow
              />
           </div>
        </div>

        {/* Notifications */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('section_notifications')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden">
              <SettingItem 
                icon={Bell} 
                label={t('adhan_notifications')} 
                value={notificationsEnabled ? "On" : "Off"}
                onClick={handleNotificationToggle}
                hasArrow
              />
              <div className="h-px bg-neutral-line mx-14"></div>
              <button onClick={handleTestNotification} className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-start">
                 <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 me-3">
                       <Speaker size={16} />
                    </div>
                    <span className="text-sm font-medium text-neutral-primary">{t('test_notification')}</span>
                 </div>
                 <div className="flex items-center">
                    <span className="text-xs text-brand-forest font-bold">Test</span>
                 </div>
              </button>
           </div>
        </div>

        {/* Account & Support */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('section_support')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden">
              <SettingItem 
                icon={HelpCircle} 
                label={t('help_guide')} 
                onClick={() => {}}
                hasArrow
              />
              <div className="h-px bg-neutral-line mx-14"></div>
              <SettingItem 
                icon={FileText} 
                label={t('privacy_policy')} 
                onClick={() => {}}
                hasArrow
              />
           </div>
        </div>

      </div>

      {/* --- MODALS --- */}

      {/* Language Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-neutral-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom border-t border-neutral-line">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-neutral-primary">{t('pref_language')}</h3>
                 <button onClick={() => setIsLangModalOpen(false)}><X size={20} className="text-neutral-400" /></button>
              </div>
              <div className="space-y-2">
                 {LANGUAGES.map(lang => (
                    <button 
                      key={lang.code}
                      onClick={() => {
                         setLanguage(lang.code as any);
                         setIsLangModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${language === lang.code ? 'border-brand-forest bg-brand-mint/20 text-brand-forest' : 'border-neutral-line hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-primary'}`}
                    >
                       <span className="font-bold">{lang.label}</span>
                       <span className="text-sm opacity-70">{lang.native}</span>
                       {language === lang.code && <Check size={18} />}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

const SettingItem = ({ icon: Icon, label, value, onClick, hasArrow }: { icon: any, label: string, value?: string, onClick: () => void, hasArrow?: boolean }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-start">
     <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 me-3">
           <Icon size={16} />
        </div>
        <span className="text-sm font-medium text-neutral-primary">{label}</span>
     </div>
     <div className="flex items-center">
        {value && <span className="text-xs text-neutral-400 me-2">{value}</span>}
        {hasArrow && <div className="ltr:rotate-0 rtl:rotate-180"><ChevronLeft size={16} className="text-neutral-300 rtl:rotate-180" /></div>} 
     </div>
  </button>
);