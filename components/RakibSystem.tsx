
import React, { useState, useEffect } from 'react';
import { 
  Users, ChevronRight, Plus, QrCode, Search, Camera, X, 
  Bell, Shield, Activity, CheckCircle2, Clock, AlertCircle, 
  Flame, MoreVertical, MessageCircle, ArrowLeft, Crown, Star
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { MOCK_PARTNERS, MOCK_GROUPS, STATUS_COLORS } from '../constants';
import { PrayerPartner, RakibGroup, ShareLevel, PrayerStatus } from '../types';

// ---------------------------------------------------------------------------
// SUB-COMPONENTS (For Cleanliness)
// ---------------------------------------------------------------------------

// 1. Remind Button Component
const RemindButton = ({ name, onRemind, disabled }: { name: string, onRemind: () => void, disabled?: boolean }) => {
  const [status, setStatus] = useState<'idle' | 'sent' | 'limit'>('idle');

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
      <button className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-full flex items-center cursor-default animate-in fade-in">
        <CheckCircle2 size={14} className="mr-1" /> Sent
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all
        ${disabled 
          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
          : 'bg-brand-mint text-brand-forest hover:bg-brand-forest hover:text-white active:scale-95'}
      `}
    >
      <Bell size={14} className="mr-1.5" />
      Remind
    </button>
  );
};

// 2. Status Icon Component
const MiniStatusIcon = ({ status }: { status: PrayerStatus }) => {
  const colors = {
    [PrayerStatus.Jamaah]: 'bg-status-jamaah',
    [PrayerStatus.Home]: 'bg-status-home',
    [PrayerStatus.Late]: 'bg-status-late',
    [PrayerStatus.Missed]: 'bg-status-missed',
    [PrayerStatus.QadaDone]: 'bg-status-qada',
    [PrayerStatus.Upcoming]: 'bg-neutral-200',
  };

  return (
    <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-neutral-200'}`} />
  );
};

// 3. Partner Card
interface PartnerCardProps {
  partner: PrayerPartner;
  onClick: () => void;
  onRemind: () => void;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick, onRemind }) => (
  <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-neutral-line shadow-sm mb-3 active:scale-[0.99] transition-transform cursor-pointer">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <img src={partner.avatar} alt={partner.name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h4 className="font-bold text-neutral-primary text-sm">{partner.name}</h4>
          <div className="flex items-center text-xs text-neutral-muted">
            <Flame size={12} className="text-orange-500 mr-1" />
            <span className="font-medium text-orange-500 mr-2">{partner.streak} Day Streak</span>
          </div>
        </div>
      </div>
      <RemindButton name={partner.name} onRemind={onRemind} disabled={!partner.canRemind} />
    </div>
    
    {/* Status Row */}
    <div className="flex justify-between items-center bg-neutral-50 p-2 rounded-xl">
      {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => {
        const key = p.toLowerCase();
        // @ts-ignore
        const status = partner.today[key] as PrayerStatus;
        return (
          <div key={p} className="flex flex-col items-center space-y-1">
             <span className="text-[10px] text-neutral-400 uppercase">{p.charAt(0)}</span>
             <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === PrayerStatus.Upcoming ? 'bg-neutral-200' : STATUS_COLORS[status]}`}>
               {status === PrayerStatus.Jamaah && <Users size={10} className="text-white" />}
               {status === PrayerStatus.Home && <div className="w-2 h-2 bg-neutral-primary rounded-full" />}
               {status === PrayerStatus.Missed && <X size={10} className="text-white" />}
               {status === PrayerStatus.Late && <Clock size={10} className="text-white" />}
             </div>
          </div>
        );
      })}
    </div>
  </div>
);

// 4. Privacy Badge
const PrivacyBadge = ({ level }: { level: ShareLevel }) => {
  const config = {
    minimal: { label: 'Minimal', color: 'text-neutral-500 bg-neutral-100' },
    standard: { label: 'Standard', color: 'text-blue-600 bg-blue-50' },
    full: { label: 'Full', color: 'text-brand-forest bg-brand-mint' },
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${config[level].color}`}>
      {config[level].label} Shared
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

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full">
           <ArrowLeft size={20} className="text-neutral-600" />
        </button>
        <h2 className="text-xl font-bold text-neutral-primary">Add Partner</h2>
      </div>

      {/* Toggle */}
      <div className="flex bg-neutral-200 p-1 rounded-xl mb-6">
         <button 
           onClick={() => setMode('search')} 
           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'search' ? 'bg-white shadow-sm text-neutral-primary' : 'text-neutral-500'}`}
         >
           By ID
         </button>
         <button 
           onClick={() => setMode('qr')} 
           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'qr' ? 'bg-white shadow-sm text-neutral-primary' : 'text-neutral-500'}`}
         >
           Scan QR
         </button>
      </div>

      {mode === 'search' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-primary mb-2">Partner Profile ID</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="text" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. AHMED-92"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-line focus:ring-2 focus:ring-brand-teal focus:outline-none bg-white"
                />
              </div>
              <Button disabled={!searchId}>Search</Button>
            </div>
            <p className="text-xs text-neutral-muted mt-2 ml-1">Ask your partner for their ID from their profile.</p>
          </div>
          
          {/* Mock Result */}
          {searchId.length > 3 && (
             <div className="bg-white p-4 rounded-2xl border border-neutral-line shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center space-x-3 mb-4">
                   <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                   <div>
                      <p className="font-bold text-neutral-primary">Ahmed R.</p>
                      <p className="text-xs text-neutral-muted">London, UK</p>
                   </div>
                </div>
                <Button fullWidth>Send Request</Button>
             </div>
          )}
        </div>
      )}

      {mode === 'qr' && (
        <div className="flex flex-col items-center justify-center bg-black/90 rounded-3xl aspect-[3/4] relative overflow-hidden text-white p-6 text-center">
          {!isScanning ? (
             <>
                <QrCode size={64} className="text-white/20 mb-4" />
                <p className="mb-6 text-white/80">Allow camera access to scan your partner's QR code.</p>
                <Button onClick={() => setIsScanning(true)} className="bg-white text-black hover:bg-neutral-200">
                   <Camera size={18} className="mr-2" /> Open Camera
                </Button>
             </>
          ) : (
             <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop')] bg-cover"></div>
                <div className="absolute inset-12 border-4 border-brand-mint/50 rounded-2xl animate-pulse flex items-center justify-center">
                   <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_red]"></div>
                </div>
                <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full">
                   <X size={20} />
                </button>
                <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium">Align QR code within frame</p>
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

  if (showSettings) {
     return <SharingSettings partner={partner} onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
       {/* Header */}
       <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-neutral-line text-center">
          <button onClick={onBack} className="absolute left-4 top-4 p-2 hover:bg-neutral-50 rounded-full">
             <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <button onClick={() => setShowSettings(true)} className="absolute right-4 top-4 p-2 hover:bg-neutral-50 rounded-full">
             <Shield size={20} className="text-neutral-400" />
          </button>
          
          <div className="w-20 h-20 rounded-full mx-auto mb-3 p-1 bg-brand-forest relative">
             <img src={partner.avatar} alt={partner.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
          </div>
          <h2 className="text-xl font-bold text-neutral-primary">{partner.name}</h2>
          <div className="flex justify-center items-center space-x-2 mt-2">
             <PrivacyBadge level={partner.shareLevel} />
             {partner.streak > 3 && (
                <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold flex items-center">
                   <Flame size={10} className="mr-1" /> {partner.streak} Day Streak
                </span>
             )}
          </div>

          <div className="mt-6 flex justify-center space-x-3">
             <RemindButton name={partner.name} onRemind={() => alert('Reminder sent!')} disabled={!partner.canRemind} />
             <button className="px-4 py-1.5 rounded-full border border-neutral-200 text-xs font-medium flex items-center hover:bg-neutral-50">
                <MessageCircle size={14} className="mr-1.5" /> Message
             </button>
          </div>
       </div>

       {/* Today's Status Grid */}
       <Card>
          <h3 className="font-bold text-neutral-primary mb-4">Today's Prayers</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
             {Object.entries(partner.today).map(([name, status]) => (
                <div key={name} className="flex flex-col items-center">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-sm transition-all ${status === 'upcoming' ? 'bg-neutral-100 text-neutral-400' : STATUS_COLORS[status as PrayerStatus]}`}>
                      {status === 'jamaah' && <Users size={16} />}
                      {status === 'home' && <div className="w-3 h-3 bg-neutral-primary rounded-full" />}
                      {status === 'late' && <Clock size={16} />}
                      {status === 'missed' && <X size={16} />}
                      {status === 'upcoming' && <div className="w-2 h-2 bg-neutral-300 rounded-full" />}
                   </div>
                   <span className="text-[10px] font-medium text-neutral-600 capitalize">{name}</span>
                </div>
             ))}
          </div>
       </Card>

       {/* Heart State (If shared) */}
       {partner.shareLevel === 'full' && partner.heartState && (
          <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 flex items-center justify-between">
             <div>
                <h3 className="font-bold text-rose-900 flex items-center">
                   <Activity size={16} className="mr-2" /> Spiritual State
                </h3>
                <p className="text-xs text-rose-700 mt-1">Shared with you via Full Access</p>
             </div>
             <div className="text-right">
                <span className="text-2xl font-bold text-rose-500">{partner.heartState}%</span>
             </div>
          </div>
       )}
    </div>
  );
};

// C. GROUP DASHBOARD
const GroupDashboard = ({ group, onBack }: { group: RakibGroup, onBack: () => void }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
       {/* Group Header */}
       <div className="bg-brand-forest text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <button onClick={onBack} className="absolute left-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full">
             <ArrowLeft size={20} className="text-white" />
          </button>
          
          <div className="relative z-10 mt-6">
             <h2 className="text-2xl font-bold mb-1">{group.name}</h2>
             <div className="flex items-center space-x-4 text-brand-mint text-sm">
                <span className="flex items-center"><Users size={14} className="mr-1" /> {group.members.length} Members</span>
                <span className="flex items-center"><Flame size={14} className="mr-1" /> {group.streak} Day Streak</span>
             </div>
          </div>

          <div className="mt-6 bg-white/10 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
             <div>
                <p className="text-xs text-brand-mint font-medium uppercase tracking-wider">Group Consistency</p>
                <p className="text-xl font-bold">{group.consistency}%</p>
             </div>
             <div className="h-8 w-px bg-white/20"></div>
             <div className="text-right">
                <p className="text-xs text-brand-mint font-medium uppercase tracking-wider">Today</p>
                <p className="text-xl font-bold">{group.members.filter(m => m.todayCompleted === 5).length} / {group.members.length} Done</p>
             </div>
          </div>
       </div>

       {/* Members List */}
       <div>
          <div className="flex justify-between items-center mb-3 px-1">
             <h3 className="font-bold text-neutral-primary">Family Members</h3>
             {group.currentUserRole !== 'member' && <button className="text-xs text-brand-forest font-medium">Manage</button>}
          </div>
          <div className="space-y-3">
             {group.members.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-line flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="relative">
                         <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                         {member.role === 'creator' && (
                            <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white">
                               <Crown size={10} className="text-white fill-current" />
                            </div>
                         )}
                         {member.role === 'admin' && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
                               <Shield size={10} className="text-white fill-current" />
                            </div>
                         )}
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                            <p className="font-bold text-neutral-primary text-sm">{member.name} {member.isMe && '(You)'}</p>
                            {/* Role Badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center ${
                                member.role === 'creator' ? 'bg-amber-100 text-amber-700' :
                                member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                'bg-neutral-100 text-neutral-500'
                            }`}>
                                {member.role}
                            </span>
                         </div>
                         <div className="flex space-x-1 mt-1.5">
                            {[...Array(5)].map((_, i) => (
                               <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < member.todayCompleted ? 'bg-brand-forest' : 'bg-neutral-200'}`}></div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="block text-sm font-bold text-neutral-500">{member.todayCompleted}/5</span>
                      <span className="text-[10px] text-neutral-400">Prayers</span>
                   </div>
                </div>
             ))}
          </div>
       </div>
       
       {/* Group Action */}
       {group.currentUserRole !== 'member' && (
         <Button fullWidth className="bg-neutral-primary">Remind All Members</Button>
       )}
    </div>
  );
};

// D. SHARING SETTINGS
const SharingSettings = ({ partner, onBack }: { partner: PrayerPartner, onBack: () => void }) => {
   const [level, setLevel] = useState<ShareLevel>(partner.myShareLevel);

   return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
         <div className="flex items-center space-x-3 mb-4">
            <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full">
               <ArrowLeft size={20} className="text-neutral-600" />
            </button>
            <h2 className="text-xl font-bold text-neutral-primary">Sharing Settings</h2>
         </div>

         <p className="text-sm text-neutral-muted">Control exactly what <strong>{partner.name}</strong> can see about your activity.</p>

         <div className="space-y-3">
            {[
               { id: 'minimal', label: 'Minimal', desc: 'Only checks (✓) or X. No specific times or details.' },
               { id: 'standard', label: 'Standard', desc: 'Prayer status (Late/On-time), Streaks, Charts.' },
               { id: 'full', label: 'Full Access', desc: 'Includes Heart State and Badges. Full transparency.' },
            ].map((opt) => (
               <div 
                  key={opt.id}
                  onClick={() => setLevel(opt.id as ShareLevel)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${level === opt.id ? 'border-brand-forest bg-brand-mint/20' : 'border-neutral-200 bg-white'}`}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className={`font-bold ${level === opt.id ? 'text-brand-forest' : 'text-neutral-700'}`}>{opt.label}</span>
                     {level === opt.id && <CheckCircle2 size={18} className="text-brand-forest" />}
                  </div>
                  <p className="text-xs text-neutral-500">{opt.desc}</p>
               </div>
            ))}
         </div>

         <div className="pt-4">
            <Button fullWidth onClick={onBack}>Save Changes</Button>
         </div>
         
         <div className="text-center">
            <button className="text-xs text-red-500 font-medium hover:underline">Unpair from {partner.name}</button>
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

  const selectedPartner = MOCK_PARTNERS.find(p => p.id === selectedPartnerId);
  const selectedGroup = MOCK_GROUPS.find(g => g.id === selectedGroupId);

  const navigateToPartner = (id: string) => {
    setSelectedPartnerId(id);
    setView('partner_detail');
  };

  const navigateToGroup = (id: string) => {
    setSelectedGroupId(id);
    setView('group_detail');
  };

  // RENDER VIEWS
  if (view === 'add') return <AddPartnerFlow onBack={() => setView('home')} />;
  if (view === 'partner_detail' && selectedPartner) return <PartnerDetail partner={selectedPartner} onBack={() => setView('home')} />;
  if (view === 'group_detail' && selectedGroup) return <GroupDashboard group={selectedGroup} onBack={() => setView('home')} />;

  // HOME VIEW
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* Header */}
       <div className="flex justify-between items-center mb-2 pt-2">
          <div>
             <h2 className="text-2xl font-bold text-neutral-primary">Prayer Partners</h2>
             <p className="text-xs text-neutral-muted">Accountability & Support (Rakib)</p>
          </div>
          <button id="partner-add-btn" onClick={() => setView('add')} className="w-10 h-10 bg-brand-forest rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-forest/30 active:scale-90 transition-transform">
             <Plus size={20} />
          </button>
       </div>

       {/* Groups Section */}
       <div id="partner-groups" className="space-y-3">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Your Circle</h3>
          {MOCK_GROUPS.map(group => (
             <div key={group.id} onClick={() => navigateToGroup(group.id)} className="bg-gradient-to-r from-brand-forest to-brand-teal rounded-2xl p-5 text-white shadow-md cursor-pointer active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-bold text-lg">{group.name}</h4>
                      <p className="text-xs text-brand-mint opacity-80">{group.members.length} Members • {group.currentUserRole}</p>
                   </div>
                   <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Users size={20} />
                   </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                   <div className="flex -space-x-2">
                      {group.members.slice(0, 3).map(m => (
                         <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-brand-teal object-cover" />
                      ))}
                      {group.members.length > 3 && (
                         <div className="w-8 h-8 rounded-full border-2 border-brand-teal bg-brand-mint text-brand-forest flex items-center justify-center text-[10px] font-bold">
                            +{group.members.length - 3}
                         </div>
                      )}
                   </div>
                   <div className="text-right">
                      <span className="text-2xl font-bold">{group.consistency}%</span>
                      <span className="block text-[10px] opacity-80 uppercase tracking-wide">Consistency</span>
                   </div>
                </div>
             </div>
          ))}
       </div>

       {/* One-on-One Partners */}
       <div className="space-y-3 pb-20">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mt-6">Individual Partners</h3>
          {MOCK_PARTNERS.map(partner => (
             <PartnerCard 
               key={partner.id} 
               partner={partner} 
               onClick={() => navigateToPartner(partner.id)} 
               onRemind={() => alert('Reminder sent')}
             />
          ))}
          
          {/* Empty State Helper */}
          {MOCK_PARTNERS.length === 0 && (
             <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-neutral-200">
                <Users size={32} className="mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-500 font-medium">No partners yet.</p>
                <Button variant="ghost" onClick={() => setView('add')}>Find a Friend</Button>
             </div>
          )}
       </div>
    </div>
  );
};
