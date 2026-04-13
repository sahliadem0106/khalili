import React, { useState, useEffect } from 'react';
import {
   Users, ChevronRight, Plus, QrCode, Search, Camera, X,
   Bell, Shield, Activity, CheckCircle2, Clock, AlertCircle,
   Flame, MoreVertical, MessageCircle, ArrowLeft, Crown, Star, Loader2
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { STATUS_COLORS } from '../constants';
import { PrayerPartner, RakibGroup, ShareLevel, PrayerStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { partnerService, Partner } from '../services/PartnerService';

// ---------------------------------------------------------------------------
// SUB-COMPONENTS (For Cleanliness)
// ---------------------------------------------------------------------------

// 1. Remind Button Component
const RemindButton = ({ name, onRemind, disabled }: { name: string, onRemind: () => void, disabled?: boolean }) => {
   const [status, setStatus] = useState<'idle' | 'sent' | 'limit'>('idle');
   const { t } = useLanguage();

   const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (status !== 'idle' || disabled) return;

      const confirmed = window.confirm(`Send a gentle reminder to ${name}?`);
      if (confirmed) {
         onRemind();
         setStatus('sent');
         setTimeout(() => setStatus('idle'), 5000); // Reset after 5s or keep as 'limit' based on real logic
      }
   };

   if (status === 'sent') {
      return (
         <button className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded-full flex items-center cursor-default animate-in fade-in border border-brand-primary/20">
            <CheckCircle2 size={14} className="me-1" /> {t('partners_remind_sent')}
         </button>
      );
   }

   return (
      <button
         onClick={handleClick}
         disabled={disabled}
         className={`
        px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all border
        ${disabled
               ? 'bg-white/5 text-neutral-500 border-white/5 cursor-not-allowed'
               : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 hover:bg-brand-primary hover:text-white active:scale-95'}
      `}
      >
         <Bell size={14} className="me-1.5" />
         {t('partners_remind')}
      </button>
   );
};

// 3. Partner Card
interface PartnerCardProps {
   partner: PrayerPartner;
   onClick: () => void;
   onRemind: () => void;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick, onRemind }) => {
   const { t } = useLanguage();
   return (
      <div onClick={onClick} className="glass-panel p-4 mb-3 active:scale-[0.99] transition-transform cursor-pointer hover:bg-brand-surface/70">
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <img src={partner.avatar} alt={partner.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
               <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{partner.name}</h4>
                  <div className="flex items-center text-xs text-brand-secondary">
                     <Flame size={12} className="text-brand-accent me-1" />
                     <span className="font-medium text-brand-accent me-2">{partner.streak} {t('partners_streak')}</span>
                  </div>
               </div>
            </div>
            <RemindButton name={partner.name} onRemind={onRemind} disabled={!partner.canRemind} />
         </div>

         {/* Status Row */}
         <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => {
               const key = p.toLowerCase();
               // @ts-ignore
               const status = partner.today[key] as PrayerStatus;
               return (
                  <div key={p} className="flex flex-col items-center space-y-1">
                     <span className="text-[10px] text-neutral-500 uppercase">{p.charAt(0)}</span>
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === PrayerStatus.Upcoming ? 'bg-white/10' : STATUS_COLORS[status]}`}>
                        {status === PrayerStatus.Jamaah && <Users size={10} className="text-white" />}
                        {status === PrayerStatus.Home && <div className="w-2 h-2 bg-neutral-900 rounded-full" />}
                        {status === PrayerStatus.Missed && <X size={10} className="text-white" />}
                        {status === PrayerStatus.Late && <Clock size={10} className="text-white" />}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};

// 4. Privacy Badge
const PrivacyBadge = ({ level }: { level: ShareLevel }) => {
   const { t } = useLanguage();
   const config = {
      minimal: { label: t('partners_level_minimal'), color: 'text-neutral-400 bg-white/5 border border-white/5' },
      standard: { label: t('partners_level_standard'), color: 'text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20' },
      full: { label: t('partners_level_full'), color: 'text-brand-primary bg-brand-primary/10 border border-brand-primary/20' },
   };
   return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border ${config[level].color}`}>
         {config[level].label}
      </span>
   );
};

// ---------------------------------------------------------------------------
// MAIN PAGES
// ---------------------------------------------------------------------------

// A. ADD PARTNER PAGE
const AddPartnerFlow = ({ onBack }: { onBack: () => void }) => {
   const [mode, setMode] = useState<'search' | 'qr'>('search');
   const [searchId, setSearchId] = useState('');
   const [isScanning, setIsScanning] = useState(false);
   const { t, dir } = useLanguage();
   const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowLeft; // Always back arrow

   return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
         <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
               <ArrowIcon size={20} className="text-neutral-400 rtl:rotate-180" />
            </button>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{t('partners_add_title')}</h2>
         </div>

         {/* Toggle */}
         <div className="flex bg-black/20 p-1 rounded-xl mb-6 border border-white/5">
            <button
               onClick={() => setMode('search')}
               className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'search' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-neutral-500 hover:text-white'}`}
            >
               {t('partners_by_id')}
            </button>
            <button
               onClick={() => setMode('qr')}
               className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'qr' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-neutral-500 hover:text-white'}`}
            >
               {t('partners_scan_qr')}
            </button>
         </div>

         {mode === 'search' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-neutral-300 mb-2">{t('partners_search_label')}</label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                           type="text"
                           value={searchId}
                           onChange={(e) => setSearchId(e.target.value)}
                           placeholder={t('partners_search_placeholder')}
                           className="w-full glass-input pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-3"
                        />
                     </div>
                     <Button disabled={!searchId} className="bg-brand-primary text-white hover:bg-brand-primary/90">{t('partners_search_btn')}</Button>
                  </div>
               </div>

               {/* Mock Result */}
               {searchId.length > 3 && (
                  <div className="glass-panel p-4 animate-in fade-in slide-in-from-bottom-2">
                     <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                        <div>
                           <p className="font-bold text-neutral-900">Ahmed R.</p>
                           <p className="text-xs text-neutral-400">London, UK</p>
                        </div>
                     </div>
                     <Button fullWidth className="bg-brand-primary text-white hover:bg-brand-primary/90">{t('partners_send_request')}</Button>
                  </div>
               )}
            </div>
         )}

         {mode === 'qr' && (
            <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 rounded-3xl aspect-[3/4] relative overflow-hidden text-white p-6 text-center">
               {!isScanning ? (
                  <>
                     <QrCode size={64} className="text-white/20 mb-4" />
                     <p className="mb-6 text-white/80">{t('partners_scan_desc')}</p>
                     <Button onClick={() => setIsScanning(true)} className="bg-white text-black hover:bg-neutral-200">
                        <Camera size={18} className="me-2" /> {t('partners_open_camera')}
                     </Button>
                  </>
               ) : (
                  <div className="absolute inset-0 bg-black">
                     <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop')] bg-cover"></div>
                     <div className="absolute inset-12 border-4 border-brand-primary/50 rounded-2xl animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-brand-primary shadow-[0_0_10px_#10B981]"></div>
                     </div>
                     <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 bg-black/50 p-2 rounded-full text-white">
                        <X size={20} />
                     </button>
                     <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium text-white">{t('partners_align_qr')}</p>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

// B. PARTNER DETAIL PAGE
const PartnerDetail = ({ partner, onBack }: { partner: PrayerPartner, onBack: () => void }) => {
   const [showSettings, setShowSettings] = useState(false);
   const { t, dir } = useLanguage();

   if (showSettings) {
      return <SharingSettings partner={partner} onBack={() => setShowSettings(false)} />;
   }

   return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
         {/* Header */}
         <div className="relative glass-panel p-6 text-center">
            <button onClick={onBack} className="absolute left-4 rtl:left-auto rtl:right-4 top-4 p-2 hover:bg-white/10 rounded-full">
               <ArrowLeft size={20} className="text-neutral-400 rtl:rotate-180" />
            </button>
            <button onClick={() => setShowSettings(true)} className="absolute right-4 rtl:right-auto rtl:left-4 top-4 p-2 hover:bg-white/10 rounded-full">
               <Shield size={20} className="text-neutral-400" />
            </button>

            <div className="w-20 h-20 rounded-full mx-auto mb-3 p-1 bg-brand-gradient relative">
               <img src={partner.avatar} alt={partner.name} className="w-full h-full rounded-full object-cover border-2 border-brand-surface" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{partner.name}</h2>
            <div className="flex justify-center items-center space-x-2 rtl:space-x-reverse mt-2">
               <PrivacyBadge level={partner.shareLevel} />
               {partner.streak > 3 && (
                  <span className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold flex items-center border border-brand-accent/20">
                     <Flame size={10} className="me-1" /> {partner.streak} {t('partners_streak')}
                  </span>
               )}
            </div>

            <div className="mt-6 flex justify-center space-x-3 rtl:space-x-reverse">
               <RemindButton name={partner.name} onRemind={() => alert('Reminder sent!')} disabled={!partner.canRemind} />
               <button className="px-4 py-1.5 rounded-full border border-white/10 text-xs font-medium flex items-center hover:bg-white/5 text-neutral-300">
                  <MessageCircle size={14} className="me-1.5" /> {t('partners_message')}
               </button>
            </div>
         </div>

         {/* Today's Status Grid */}
         <Card className="glass-panel !bg-brand-surface/40">
            <h3 className="font-bold text-neutral-900 mb-4">{t('partners_today')}</h3>
            <div className="grid grid-cols-5 gap-2 text-center">
               {Object.entries(partner.today).map(([name, status]) => (
                  <div key={name} className="flex flex-col items-center">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-sm transition-all ${status === 'upcoming' ? 'bg-white/5 text-neutral-500' : STATUS_COLORS[status as PrayerStatus]}`}>
                        {status === 'jamaah' && <Users size={16} />}
                        {status === 'home' && <div className="w-3 h-3 bg-neutral-900 rounded-full" />}
                        {status === 'late' && <Clock size={16} />}
                        {status === 'missed' && <X size={16} />}
                        {status === 'upcoming' && <div className="w-2 h-2 bg-neutral-600 rounded-full" />}
                     </div>
                     <span className="text-[10px] font-medium text-neutral-400 capitalize">{name}</span>
                  </div>
               ))}
            </div>
         </Card>

         {/* Heart State (If shared) */}
         {partner.shareLevel === 'full' && partner.heartState && (
            <div className="bg-gradient-to-br from-rose-500/10 to-brand-surface p-5 rounded-2xl border border-rose-500/20 flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-rose-400 flex items-center">
                     <Activity size={16} className="me-2" /> {t('heartState')}
                  </h3>
                  <p className="text-xs text-rose-300/70 mt-1">Shared with you via Full Access</p>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-bold text-rose-400">{partner.heartState}%</span>
               </div>
            </div>
         )}
      </div>
   );
};

// C. GROUP DASHBOARD
const GroupDashboard = ({ group, onBack }: { group: RakibGroup, onBack: () => void }) => {
   const { t } = useLanguage();
   return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
         {/* Group Header */}
         <div className="bg-gradient-to-br from-brand-forest to-brand-primary text-white rounded-2xl p-6 relative overflow-hidden shadow-lg border border-white/10">
            <div className="absolute -right-10 rtl:right-auto rtl:-left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <button onClick={onBack} className="absolute left-4 rtl:left-auto rtl:right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full">
               <ArrowLeft size={20} className="text-white rtl:rotate-180" />
            </button>

            <div className="relative z-10 mt-6">
               <h2 className="text-2xl font-bold mb-1">{group.name}</h2>
               <div className="flex items-center space-x-4 rtl:space-x-reverse text-brand-mint text-sm">
                  <span className="flex items-center"><Users size={14} className="me-1" /> {group.members.length} {t('partners_members')}</span>
                  <span className="flex items-center"><Flame size={14} className="me-1" /> {group.streak} {t('partners_streak')}</span>
               </div>
            </div>

            <div className="mt-6 bg-black/20 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm border border-white/10">
               <div>
                  <p className="text-xs text-brand-mint font-medium uppercase tracking-wider">{t('partners_consistency')}</p>
                  <p className="text-xl font-bold">{group.consistency}%</p>
               </div>
               <div className="h-8 w-px bg-white/20"></div>
               <div className="text-right">
                  <p className="text-xs text-brand-mint font-medium uppercase tracking-wider">{t('partners_today')}</p>
                  <p className="text-xl font-bold">{group.members.filter(m => m.todayCompleted === 5).length} / {group.members.length}</p>
               </div>
            </div>
         </div>

         {/* Members List */}
         <div>
            <div className="flex justify-between items-center mb-3 px-1">
               <h3 className="font-bold text-neutral-300">{t('partners_members')}</h3>
               {group.currentUserRole !== 'member' && <button className="text-xs text-brand-secondary font-medium hover:text-white">{t('partners_manage')}</button>}
            </div>
            <div className="space-y-3">
               {group.members.map(member => (
                  <div key={member.id} className="glass-panel p-4 flex items-center justify-between">
                     <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="relative">
                           <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                           {member.role === 'creator' && (
                              <div className="absolute -bottom-1 -right-1 rtl:right-auto rtl:-left-1 bg-brand-accent rounded-full p-1 border-2 border-brand-surface">
                                 <Crown size={10} className="text-brand-surface fill-current" />
                              </div>
                           )}
                           {member.role === 'admin' && (
                              <div className="absolute -bottom-1 -right-1 rtl:right-auto rtl:-left-1 bg-blue-500 rounded-full p-1 border-2 border-brand-surface">
                                 <Shield size={10} className="text-white fill-current" />
                              </div>
                           )}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="font-bold text-neutral-900 text-sm">{member.name} {member.isMe && '(You)'}</p>
                              {/* Role Badge */}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center ${member.role === 'creator' ? 'bg-brand-accent/10 text-brand-accent text-amber-400' :
                                 member.role === 'admin' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-white/5 text-neutral-500'
                                 }`}>
                                 {member.role}
                              </span>
                           </div>
                           <div className="flex space-x-1 rtl:space-x-reverse mt-1.5">
                              {[...Array(5)].map((_, i) => (
                                 <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < member.todayCompleted ? 'bg-brand-primary' : 'bg-white/10'}`}></div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="block text-sm font-bold text-neutral-400">{member.todayCompleted}/5</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Group Action */}
         {group.currentUserRole !== 'member' && (
            <Button fullWidth className="bg-brand-surface hover:bg-brand-surface/80 border border-white/10">{t('partners_remind_all')}</Button>
         )}
      </div>
   );
};

// D. SHARING SETTINGS
const SharingSettings = ({ partner, onBack }: { partner: PrayerPartner, onBack: () => void }) => {
   const [level, setLevel] = useState<ShareLevel>(partner.myShareLevel);
   const { t } = useLanguage();

   return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
         <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
               <ArrowLeft size={20} className="text-neutral-400 rtl:rotate-180" />
            </button>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{t('partners_sharing_settings')}</h2>
         </div>

         <p className="text-sm text-neutral-500">{t('partners_sharing_desc').replace('{name}', partner.name)}</p>

         <div className="space-y-3">
            {[
               { id: 'minimal', label: t('partners_level_minimal'), desc: t('partners_level_minimal_desc') },
               { id: 'standard', label: t('partners_level_standard'), desc: t('partners_level_standard_desc') },
               { id: 'full', label: t('partners_level_full'), desc: t('partners_level_full_desc') },
            ].map((opt) => (
               <div
                  key={opt.id}
                  onClick={() => setLevel(opt.id as ShareLevel)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${level === opt.id ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className={`font-bold ${level === opt.id ? 'text-brand-primary' : 'text-neutral-300'}`}>{opt.label}</span>
                     {level === opt.id && <CheckCircle2 size={18} className="text-brand-primary" />}
                  </div>
                  <p className="text-xs text-neutral-500">{opt.desc}</p>
               </div>
            ))}
         </div>

         <div className="pt-4">
            <Button fullWidth onClick={onBack}>{t('partners_save')}</Button>
         </div>

         <div className="text-center">
            <button className="text-xs text-red-400 font-medium hover:underline hover:text-red-300">{t('partners_unpair').replace('{name}', partner.name)}</button>
         </div>
      </div>
   );
};

// ---------------------------------------------------------------------------
// ROOT COMPONENT (ROUTER)
// ---------------------------------------------------------------------------

export const RakibSystem = () => {
   const [view, setView] = useState<'home' | 'add' | 'partner_detail' | 'group_detail'>('home');
   const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
   const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
   const [partners, setPartners] = useState<Partner[]>([]);
   const [isLoadingPartners, setIsLoadingPartners] = useState(true);
   const { t } = useLanguage();
   const { isAuthenticated, user } = useAuth();

   // Subscribe to real-time partner updates
   useEffect(() => {
      if (!isAuthenticated) {
         setPartners([]);
         setIsLoadingPartners(false);
         return;
      }

      setIsLoadingPartners(true);
      const unsubscribe = partnerService.subscribeToPartners((realPartners) => {
         setPartners(realPartners);
         setIsLoadingPartners(false);
      });

      return () => unsubscribe();
   }, [isAuthenticated]);

   const selectedPartner = partners.find(p => p.partnershipId === selectedPartnerId);
   // Groups feature not yet implemented
   const selectedGroup = null;

   const navigateToPartner = (id: string) => {
      setSelectedPartnerId(id);
      setView('partner_detail');
   };

   const navigateToGroup = (id: string) => {
      // Groups feature coming soon
      console.log('Groups feature coming soon');
   };

   // RENDER VIEWS
   if (view === 'add') return <AddPartnerFlow onBack={() => setView('home')} />;
   // Partner detail needs adaptation for the new Partner type
   // if (view === 'partner_detail' && selectedPartner) return <PartnerDetail partner={selectedPartner} onBack={() => setView('home')} />;
   // Group feature coming soon

   // HOME VIEW
   return (
      <div className="space-y-6 animate-in fade-in duration-500 px-5 md:px-8 pt-4 mx-auto w-full">
         {/* Header */}
         <div className="flex justify-between items-center mb-2 pt-2">
            <div>
               <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('partners_title')}</h2>
               <p className="text-xs text-neutral-400">{t('partners_subtitle')}</p>
            </div>
            <button id="partner-add-btn" onClick={() => setView('add')} className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-brand-surface shadow-lg shadow-brand-primary/20 active:scale-90 transition-transform hover:bg-brand-secondary">
               <Plus size={20} />
            </button>
         </div>

         {/* Groups Section - Coming Soon */}
         <div id="partner-groups" className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{t('partners_your_circle')}</h3>
            <div className="glass-panel p-6 text-center border-dashed">
               <Users size={32} className="mx-auto text-neutral-500 mb-3" />
               <p className="text-neutral-400 font-medium">Group feature coming soon</p>
               <p className="text-xs text-neutral-500 mt-1">Create prayer groups with family & friends</p>
            </div>
         </div>

         {/* One-on-One Partners */}
         <div className="space-y-3 pb-20">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mt-6">{t('partners_individual')}</h3>

            {/* Not authenticated message */}
            {!isAuthenticated && (
               <div className="text-center py-10 glass-panel border-dashed">
                  <Users size={32} className="mx-auto text-neutral-500 mb-3" />
                  <p className="text-neutral-400 font-medium">Sign in to connect with partners</p>
               </div>
            )}

            {/* Loading state */}
            {isAuthenticated && isLoadingPartners && (
               <div className="text-center py-10 glass-panel">
                  <Loader2 size={32} className="mx-auto text-brand-primary mb-3 animate-spin" />
                  <p className="text-neutral-400 font-medium">Loading partners...</p>
               </div>
            )}

            {/* Real partners from Firebase */}
            {isAuthenticated && !isLoadingPartners && partners.length > 0 && partners.map(partner => (
               <div
                  key={partner.partnershipId}
                  onClick={() => navigateToPartner(partner.partnershipId)}
                  className="glass-panel p-4 mb-3 active:scale-[0.99] transition-transform cursor-pointer hover:bg-brand-surface/70"
               >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {partner.odUserPhoto ? (
                           <img src={partner.odUserPhoto} alt={partner.odUserName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                           <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                              {partner.odUserName?.charAt(0) || '?'}
                           </div>
                        )}
                        <div>
                           <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{partner.odUserName}</h4>
                           <div className="flex items-center text-xs text-brand-secondary">
                              <Flame size={12} className="text-brand-accent me-1" />
                              <span className="font-medium text-brand-accent me-2">{partner.currentStreak} {t('partners_streak')}</span>
                           </div>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-neutral-500" />
                  </div>
               </div>
            ))}

            {/* Empty State Helper */}
            {isAuthenticated && !isLoadingPartners && partners.length === 0 && (
               <div className="text-center py-10 glass-panel border-dashed">
                  <Users size={32} className="mx-auto text-neutral-500 mb-3" />
                  <p className="text-neutral-400 font-medium">{t('partners_empty')}</p>
                  <Button variant="ghost" onClick={() => setView('add')} className="text-brand-secondary hover:text-brand-primary">{t('partners_find')}</Button>
               </div>
            )}
         </div>
      </div>
   );
};
