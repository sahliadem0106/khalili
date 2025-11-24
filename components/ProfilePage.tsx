
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { User, PrayerSettings } from '../types';
import { 
  Settings, Bell, Moon, Globe, ChevronRight, LogOut, 
  User as UserIcon, Clock, MapPin, Volume2, HelpCircle, 
  FileText, Sliders, Sun, Monitor, ChevronLeft, Check, X, Speaker
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';

interface ProfilePageProps {
  user: User;
  settings?: PrayerSettings;
  onUpdateSettings?: (newSettings: PrayerSettings) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, settings, onUpdateSettings }) => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setThemeMode } = useTheme();
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
      // Cannot programmatically revoke permissions in browser, just update state locally
      setNotificationsEnabled(false); 
      // In a real app, we would unsubscribe from push server here
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
          <h2 className="text-2xl font-bold text-neutral-primary mb-1">{user.name}</h2>
          <div className="flex items-center justify-center text-sm text-neutral-muted mb-4">
            <MapPin size={14} className="me-1" /> {user.location}
          </div>
          
          <div className="flex justify-center space-x-3 rtl:space-x-reverse">
             <Button size="sm" variant="outline" className="h-9 text-xs">
                {t('edit')}
             </Button>
             <Button size="sm" variant="ghost" className="h-9 text-xs text-red-500 hover:bg-red-50 hover:text-red-600">
                <LogOut size={14} className="me-1" /> {t('signOut')}
             </Button>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-2 mt-6 border-t border-neutral-line pt-4">
           <div className="text-center">
              <span className="block text-lg font-bold text-brand-forest">84%</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">Commitment</span>
           </div>
           <div className="text-center border-x border-neutral-line">
              <span className="block text-lg font-bold text-brand-forest">12</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">Day Streak</span>
           </div>
           <div className="text-center">
              <span className="block text-lg font-bold text-brand-forest">3.8</span>
              <span className="text-[10px] text-neutral-muted uppercase tracking-wider">Avg Khushu</span>
           </div>
        </div>
      </div>

      {/* 2. Settings Sections */}
      <div className="space-y-4" id="profile-settings-first">
        
        {/* Appearance (New) */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('pref_theme')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden p-1">
              {/* Mode Selection */}
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

        {/* Prayer Config */}
        <div>
           <h3 className="text-xs font-bold text-neutral-muted uppercase tracking-wider mb-3 px-2">{t('section_prayer')}</h3>
           <div className="bg-neutral-card rounded-2xl border border-neutral-line overflow-hidden">
              <SettingItem 
                icon={Clock} 
                label="Calculation Method" 
                value="Muslim World League" 
                onClick={() => {}} // Placeholder
                hasArrow
              />
              <div className="h-px bg-neutral-line mx-14"></div>
              <SettingItem 
                icon={Sliders} 
                label="Manual Adjustments" 
                value="None" 
                onClick={() => {}} // Placeholder
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
                label="Adhan Notifications" 
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
                label="Help & Guide" 
                onClick={() => {}}
                hasArrow
              />
              <div className="h-px bg-neutral-line mx-14"></div>
              <SettingItem 
                icon={FileText} 
                label="Privacy Policy" 
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

// Helper Component for List Items
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
