
import React from 'react';
import { Button } from './ui/Button';
import { User } from '../types';
import { 
  Settings, Bell, Moon, Globe, Shield, ChevronRight, LogOut, 
  User as UserIcon, Lock, Clock, MapPin, Volume2, Calendar, 
  Smartphone, HelpCircle, FileText, Database, Palette, Radio
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
}

const SETTINGS_SECTIONS = [
  {
    title: "Account & Security",
    items: [
      { icon: UserIcon, label: "Personal Information", sub: "Name, Email, Avatar", color: "text-blue-600 bg-blue-50" },
      { icon: Lock, label: "Password & Security", sub: "Change password, 2FA", color: "text-indigo-600 bg-indigo-50" },
      { icon: Shield, label: "Rakib Privacy", sub: "Manage who can see your data", color: "text-emerald-600 bg-emerald-50" },
    ]
  },
  {
    title: "Prayer Configuration",
    items: [
      { icon: Clock, label: "Calculation Method", sub: "Muslim World League", color: "text-purple-600 bg-purple-50" },
      { icon: Settings, label: "Asr Juristic Method", sub: "Standard (Shafi, Maliki, Hanbali)", color: "text-purple-600 bg-purple-50" },
      { icon: Calendar, label: "Hijri Date Adjustment", sub: "Auto (+0 days)", color: "text-orange-600 bg-orange-50" },
      { icon: MapPin, label: "Location Settings", sub: "Sampang (GPS)", color: "text-red-600 bg-red-50" },
    ]
  },
  {
    title: "Notifications & Sounds",
    items: [
      { icon: Bell, label: "Push Notifications", sub: "Prayers, Reminders, Updates", color: "text-amber-600 bg-amber-50" },
      { icon: Volume2, label: "Adhan Voice", sub: "Makkah (Sheikh Al-Muaiqly)", color: "text-amber-600 bg-amber-50" },
      { icon: Radio, label: "Pre-Prayer Alert", sub: "15 minutes before", color: "text-amber-600 bg-amber-50" },
    ]
  },
  {
    title: "App Preferences",
    items: [
      { icon: Globe, label: "Language", sub: "English", color: "text-cyan-600 bg-cyan-50" },
      { icon: Moon, label: "Theme", sub: "Light Mode", color: "text-slate-600 bg-slate-50" },
      { icon: Palette, label: "Accent Color", sub: "Forest Green", color: "text-emerald-600 bg-emerald-50" },
      { icon: Smartphone, label: "Haptics & Vibration", sub: "Enabled for Tasbih", color: "text-pink-600 bg-pink-50" },
      { icon: Database, label: "Data & Storage", sub: "Backup, Clear Cache", color: "text-gray-600 bg-gray-50" },
    ]
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", sub: "FAQ, Contact Support", color: "text-teal-600 bg-teal-50" },
      { icon: FileText, label: "Terms & Privacy Policy", sub: "", color: "text-teal-600 bg-teal-50" },
    ]
  }
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Simplified User Profile Header */}
      <div id="profile-user-card" className="flex items-center space-x-4 p-5 bg-white rounded-2xl border border-neutral-line shadow-sm mt-4">
         <div className="w-16 h-16 rounded-full relative flex-shrink-0">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover border-2 border-neutral-100"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm"></div>
         </div>
         <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-neutral-primary truncate">{user.name}</h2>
            <p className="text-sm text-neutral-muted flex items-center truncate">
              <MapPin size={12} className="mr-1 flex-shrink-0" /> {user.location}
            </p>
         </div>
         <Button size="sm" variant="outline" className="text-xs px-4 h-8 rounded-full border-neutral-200">
           Edit
         </Button>
      </div>

      {/* Comprehensive Settings List */}
      <div id="profile-settings" className="space-y-6">
        {SETTINGS_SECTIONS.map((section, idx) => (
          <div key={idx} id={idx === 0 ? "profile-settings-first" : undefined}>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-3 mb-2">{section.title}</h3>
            <div className="bg-white rounded-2xl border border-neutral-line overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 border-b border-neutral-line last:border-0 cursor-pointer hover:bg-neutral-50 active:bg-neutral-100 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-primary text-sm group-hover:text-brand-forest transition-colors">
                        {item.label}
                      </p>
                      {item.sub && <p className="text-xs text-neutral-muted">{item.sub}</p>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-neutral-300 group-hover:text-brand-forest group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sign Out Area */}
      <div className="pt-4 px-2">
         <Button variant="outline" fullWidth className="text-red-600 border-red-100 hover:bg-red-50 bg-white h-12 font-semibold shadow-sm">
            <LogOut size={18} className="mr-2" /> Sign Out
         </Button>
         <div className="text-center mt-6 space-y-1">
            <p className="text-xs font-medium text-neutral-400">Muslim Daily</p>
            <p className="text-[10px] text-neutral-300">Version 2.4.0 • Build 2024.05.12</p>
         </div>
      </div>

    </div>
  );
};
