import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FamilyGroup, Challenge, FamilyMember } from '../../types/partner';
import { FamilyService } from '../../services/FamilyService';
import { User, Shield, Trash2, Crown, Plus, ArrowLeft, Trophy, Share2, Bell, Settings, UserPlus, Link as LinkIcon, Zap } from 'lucide-react';
import { ChallengeCreator } from './ChallengeCreator';
import { TeenChallengeView } from './TeenChallengeView';
import { PartnerConnect } from '../partners/PartnerConnect';
import { ShareInviteModal } from '../shared/ShareInviteModal';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationSettings } from '../profile/NotificationSettings';

interface FamilyDetailsProps {
    family: FamilyGroup;
    challenges: Challenge[];
    onBack: () => void;
    onRefresh: () => void;
}

export const FamilyDetails: React.FC<FamilyDetailsProps> = ({ family, challenges, onBack, onRefresh }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'members' | 'challenges'>('members');
    const [showChallengeCreator, setShowChallengeCreator] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showShareLink, setShowShareLink] = useState(false);
    const [showNotificationRules, setShowNotificationRules] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [newAdminId, setNewAdminId] = useState('');

    const isAdmin = user && family.adminId === user.uid;
    const canManageNotificationRules = !!user && (family.adminId === user.uid || family.coAdmins.includes(user.uid));
    const myRole = user && family.memberDetails?.[user.uid]?.role;
    const canCreateChallenge = isAdmin || myRole === 'parent';

    const handleKick = async (memberId: string) => {
        if (confirm("Are you sure you want to remove this member?") && user) {
            await FamilyService.removeMember(family.id, user.uid, memberId);
            onRefresh();
        }
    };

    const handlePromote = async (memberId: string) => {
        if (!user) return;
        await FamilyService.updateMemberRole(family.id, user.uid, memberId, 'parent');
        onRefresh();
    };

    const handleDemote = async (memberId: string) => {
        if (!user) return;
        await FamilyService.updateMemberRole(family.id, user.uid, memberId, 'child');
        onRefresh();
    };

    const handleAddAdmin = async () => {
        if (!user || !newAdminId.trim()) return;
        try {
            await FamilyService.addCoAdmin(family.id, user.uid, newAdminId.trim());
            setShowAddAdminModal(false);
            setNewAdminId('');
            onRefresh();
        } catch (error: any) {
            alert(error?.message || 'Failed to add admin');
        }
    };

    const [showManageGroup, setShowManageGroup] = useState(false);

    return (
        <div className="bg-white rounded-3xl min-h-[500px] shadow-sm border border-emerald-100/50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 text-white relative">
                <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="mt-8">
                    <h2 className="text-3xl font-bold font-outfit">{family.name}</h2>
                    <p className="text-emerald-200/80 text-sm mt-1 mb-4">
                        {family.members.length} Members • {family.plan} Plan
                    </p>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdminMenu(true)}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-emerald-900 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Settings size={18} />
                            Manage Group Settings
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-8">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'members' ? 'border-white text-white' : 'border-transparent text-emerald-300 hover:text-emerald-100'}`}
                    >
                        Members
                    </button>
                    <button
                        onClick={() => setActiveTab('challenges')}
                        className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'challenges' ? 'border-white text-white' : 'border-transparent text-emerald-300 hover:text-emerald-100'}`}
                    >
                        Challenges
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 bg-gray-50/50">
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-900">Family Members</h3>
                        </div>

                        {family.members.map((memberId) => {
                            const details = family.memberDetails?.[memberId] || { role: 'child' };
                            const isMe = memberId === user?.uid;

                            return (
                                <div key={memberId} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                                            {memberId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                {isMe ? "You" : `User ${memberId.slice(0, 4)}`}
                                                {details.role === 'admin' && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                                                {details.role === 'parent' && <Shield size={12} className="text-blue-500 fill-blue-500" />}
                                                {details.role === 'child' && <User size={12} className="text-gray-400" />}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">{details.role}</p>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    {isAdmin && !isMe && (
                                        <div className="flex items-center gap-2">
                                            {details.role === 'child' ? (
                                                <button
                                                    onClick={() => handlePromote(memberId)}
                                                    className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold"
                                                >
                                                    Make Parent
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDemote(memberId)}
                                                    className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 font-bold"
                                                >
                                                    Demote
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleKick(memberId)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-3xl transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'challenges' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-900">Active Challenges</h3>
                            {canCreateChallenge && (
                                <button
                                    onClick={() => setShowChallengeCreator(true)}
                                    className="text-xs flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-3xl font-bold hover:bg-emerald-200"
                                >
                                    <Trophy size={14} /> New Challenge
                                </button>
                            )}
                        </div>

                        {challenges.length > 0 ? (
                            <TeenChallengeView challenges={challenges} onRefresh={onRefresh} />
                        ) : (
                            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">No active challenges.</p>
                                {canCreateChallenge && <p className="text-gray-500 text-xs mt-1">Start a competition for your family!</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showChallengeCreator && (
                <ChallengeCreator
                    familyId={family.id}
                    familyMembers={family.members}
                    onClose={() => setShowChallengeCreator(false)}
                    onCreated={onRefresh}
                />
            )}

            {showInvite && createPortal(
                <PartnerConnect onClose={() => setShowInvite(false)} />,
                document.body
            )}

            {showShareLink && createPortal(
                <ShareInviteModal
                    isOpen={showShareLink}
                    onClose={() => setShowShareLink(false)}
                    type="family"
                    groupId={family.id}
                    groupName={family.name}
                />,
                document.body
            )}
            {createPortal(
                <AnimatePresence>
                    {showAddAdminModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                                className="w-full max-w-md bg-brand-surface rounded-3xl border border-brand-border shadow-2xl p-6"
                            >
                                <h3 className="text-lg font-bold text-brand-forest mb-2">Add Family Admin</h3>
                                <p className="text-sm text-brand-muted mb-4">
                                    Enter a family member user ID. They will be promoted to admin permissions.
                                </p>
                                <input
                                    value={newAdminId}
                                    onChange={(e) => setNewAdminId(e.target.value)}
                                    className="w-full border border-brand-border rounded-2xl p-3 text-sm mb-4"
                                    placeholder="User ID"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowAddAdminModal(false); setNewAdminId(''); }}
                                        className="flex-1 py-3 rounded-2xl border border-brand-border text-brand-muted font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddAdmin}
                                        className="flex-1 py-3 rounded-2xl bg-brand-primary text-white font-semibold"
                                    >
                                        Add Admin
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
            
            {createPortal(
                <AnimatePresence>
                    {showNotificationRules && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 24, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 overflow-hidden bg-brand-surface shadow-2xl"
                            >
                                <NotificationSettings
                                    onBack={() => setShowNotificationRules(false)}
                                    defaultScope="family"
                                    canManagePolicies={canManageNotificationRules}
                                    title={canManageNotificationRules ? 'Family Notification Rules' : 'Family Notification Rules (Read Only)'}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
            
            {createPortal(
                <AnimatePresence>
                    {showAdminMenu && (
                        <motion.div
                            className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="flex items-center px-4 py-5 sm:px-6 sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
                                <button
                                    onClick={() => setShowAdminMenu(false)}
                                    className="p-2 sm:p-2.5 rounded-full bg-white shadow-sm border border-black/5 hover:scale-105 active:scale-95 transition-all text-neutral-600"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="ml-4">
                                    <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">Family Management</h2>
                                    <p className="text-xs font-medium text-emerald-600">Configure {family.name}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32 max-w-3xl mx-auto w-full space-y-6">
                                
                                <div className="grid gap-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1">General Operations</h3>
                                    <button
                                        onClick={() => { setShowAdminMenu(false); setShowNotificationRules(true); }}
                                        className="flex items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:bg-emerald-50 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                <Bell size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-lg text-emerald-900">Notification Rules</h4>
                                                <p className="text-xs text-gray-500">Setup automatic family reminders.</p>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => { setShowAdminMenu(false); setShowShareLink(true); }}
                                        className="flex items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:bg-blue-50 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                <LinkIcon size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-lg text-emerald-900">Family Invite Link</h4>
                                                <p className="text-xs text-gray-500">Share a QR code or join link.</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="grid gap-3 pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1">Administration</h3>
                                    <button
                                        onClick={() => { setShowAdminMenu(false); setShowInvite(true); }}
                                        className="flex items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:bg-emerald-50 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                <UserPlus size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-lg text-emerald-900">Invite Specific Member</h4>
                                                <p className="text-xs text-gray-500">Send a request to a user ID directly.</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setShowAdminMenu(false); setShowAddAdminModal(true); }}
                                        className="flex items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:bg-amber-50 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                <Crown size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-lg text-emerald-900">Assign Co-Admin</h4>
                                                <p className="text-xs text-gray-500">Grant admin privileges to a member.</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>, 
                document.body
            )}
        </div>
    );
};
