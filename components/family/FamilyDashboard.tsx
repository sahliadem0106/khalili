
import React, { useEffect, useState } from 'react';
import { FamilyService } from '../../services/FamilyService';
import { FamilyGroup, Challenge } from '../../types/partner';
import { Plus, Users, Shield, Crown, Trophy, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FamilyDetails } from './FamilyDetails';
import { CreateGroupModal } from '../shared/CreateGroupModal';
import { JoinGroupModal } from '../shared/JoinGroupModal';

export const FamilyDashboard: React.FC = () => {
    const { user: authUser } = useAuth();
    const [families, setFamilies] = useState<FamilyGroup[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<FamilyGroup | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        if (authUser) {
            loadFamilies(authUser.uid);
        } else {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => {
        if (selectedFamily) {
            loadChallenges(selectedFamily.id);
        }
    }, [selectedFamily]);

    const loadFamilies = async (userId: string) => {
        setLoading(true);
        try {
            const data = await FamilyService.getMyFamilies(userId);
            setFamilies(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadChallenges = async (familyId: string) => {
        try {
            const data = await FamilyService.getActiveChallenges(familyId);
            setChallenges(data);
        } catch (error) {
            console.error("Failed to load challenges", error);
        }
    };

    const handleCreateFamily = async (name: string) => {
        if (!authUser) return;
        await FamilyService.createFamily(authUser.uid, name);
        loadFamilies(authUser.uid);
    };

    const handleJoinFamily = async (inviteCode: string) => {
        if (!authUser) return;
        await FamilyService.joinViaInviteCode(inviteCode, authUser.uid);
        loadFamilies(authUser.uid);
    };

    if (!authUser) {
        return <div className="p-8 text-center text-gray-500">Please sign in to view family groups.</div>;
    }

    if (loading) return (
        <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
    );

    // Detailed View
    if (selectedFamily) {
        return (
            <FamilyDetails
                family={selectedFamily}
                challenges={challenges}
                onBack={() => {
                    setSelectedFamily(null);
                    loadFamilies(authUser.uid); // Refresh list on return
                }}
                onRefresh={() => {
                    loadFamilies(authUser.uid);
                    loadChallenges(selectedFamily.id);
                }}
            />
        );
    }

    // List View
    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-2xl font-bold font-outfit text-emerald-950">My Families</h2>
                    <p className="text-sm text-emerald-700/60">Manage your household & challenges</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-2 bg-white text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-50 font-medium transition-all"
                    >
                        <LogIn size={18} />
                        <span className="hidden sm:inline">Join</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 font-medium transition-all"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
            </div>

            {families.length === 0 ? (
                <div className="text-center py-16 bg-transparent rounded-3xl border border-dashed border-white/20">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No Families Yet</h3>
                    <p className="text-white/60 max-w-xs mx-auto mb-6 text-sm">Create a group for your household to track prayers and set challenges together.</p>
                    <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => setShowCreateModal(true)} className="text-emerald-400 font-bold hover:underline">
                            Create your first family group
                        </button>
                        <span className="text-white/40 text-sm">or</span>
                        <button onClick={() => setShowJoinModal(true)} className="text-white/60 font-medium hover:text-white hover:underline">
                            Join an existing family with invite code
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {families.map(family => (
                        <motion.div
                            key={family.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedFamily(family)}
                            className="bg-white p-6 rounded-2xl text-black shadow-sm border border-emerald-100 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">{family.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                                            {family.plan}
                                        </span>
                                        <span className="text-xs text-gray-400">• <Users size={12} className="inline mr-0.5" /> {family.members.length} members</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-full text-gray-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 relative z-10">
                                <div className="flex -space-x-2">
                                    {family.members.slice(0, 4).map((m, i) => (
                                        <div key={m} className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                            U{i + 1}
                                        </div>
                                    ))}
                                    {family.members.length > 4 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            +{family.members.length - 4}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Manage</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateFamily}
                type="family"
            />

            <JoinGroupModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onSubmit={handleJoinFamily}
                type="family"
            />
        </div>
    );
};
