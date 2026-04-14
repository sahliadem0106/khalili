
import React, { useState } from 'react';
import { FamilyGroup, Challenge, FamilyMember } from '../../types/partner';
import { FamilyService } from '../../services/FamilyService';
import { User, Shield, Trash2, Crown, Plus, ArrowLeft, Trophy, Share2 } from 'lucide-react';
import { ChallengeCreator } from './ChallengeCreator';
import { TeenChallengeView } from './TeenChallengeView';
import { PartnerConnect } from '../partners/PartnerConnect';
import { ShareInviteModal } from '../shared/ShareInviteModal';
import { useAuth } from '../../hooks/useAuth';

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

    const isAdmin = user && family.adminId === user.uid;
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

    return (
        <div className="bg-white rounded-3xl min-h-[500px] shadow-sm border border-emerald-100/50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 text-white relative">
                <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="mt-8">
                    <h2 className="text-3xl font-bold font-outfit">{family.name}</h2>
                    <p className="text-emerald-200/80 text-sm mt-1">
                        {family.members.length} Members • {family.plan} Plan
                    </p>
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
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowShareLink(true)}
                                        className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200"
                                    >
                                        <Share2 size={14} /> Share Link
                                    </button>
                                    <button
                                        onClick={() => setShowInvite(true)}
                                        className="text-xs flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200"
                                    >
                                        <Plus size={14} /> Add Member
                                    </button>
                                </div>
                            )}
                        </div>

                        {family.members.map((memberId) => {
                            const details = family.memberDetails?.[memberId] || { role: 'child' };
                            const isMe = memberId === user?.uid;

                            return (
                                <div key={memberId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
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
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                    className="text-xs flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200"
                                >
                                    <Trophy size={14} /> New Challenge
                                </button>
                            )}
                        </div>

                        {challenges.length > 0 ? (
                            <TeenChallengeView challenges={challenges} onRefresh={onRefresh} />
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
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
                    onClose={() => setShowChallengeCreator(false)}
                    onCreated={onRefresh}
                />
            )}

            {showInvite && (
                <PartnerConnect onClose={() => setShowInvite(false)} />
            )}

            {showShareLink && (
                <ShareInviteModal
                    isOpen={showShareLink}
                    onClose={() => setShowShareLink(false)}
                    type="family"
                    groupId={family.id}
                    groupName={family.name}
                />
            )}
        </div>
    );
};
