
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
        return <div className="p-8 text-center text-brand-muted">Please sign in to view family groups.</div>;
    }

    if (loading) return (
        <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full"></div>
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
            <div className="flex flex-wrap justify-between items-center gap-3 px-1">
                <div>
                    <h2 className="text-2xl font-bold font-outfit text-brand-forest">My Family</h2>
                    <p className="text-sm text-brand-muted">Manage your household and challenges in one place</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-surface text-brand-primary border border-black/5 px-4 py-2 rounded-3xl hover:bg-brand-subtle font-medium transition-all"
                    >
                        <LogIn size={18} />
                        <span className="hidden sm:inline">Join</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-3xl hover:bg-brand-primary/90 shadow-md shadow-brand-primary/20 font-medium transition-all"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
            </div>

            {families.length === 0 ? (
                <div className="text-center py-16 bg-brand-surface rounded-3xl border border-dashed border-black/5">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-brand-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-forest mb-1">No Family Yet</h3>
                    <p className="text-brand-muted max-w-xs mx-auto mb-6 text-sm">Create a group for your household to track prayers and set challenges together.</p>
                    <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => setShowCreateModal(true)} className="text-brand-primary font-bold hover:underline">
                            Create your family group
                        </button>
                        <span className="text-brand-muted text-sm">or</span>
                        <button onClick={() => setShowJoinModal(true)} className="text-brand-muted font-medium hover:text-brand-forest hover:underline">
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
                            className="bg-brand-surface p-6 rounded-3xl text-brand-forest shadow-sm border border-black/5 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-brand-subtle rounded-bl-full -mr-8 -mt-8 opacity-60"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-brand-forest group-hover:text-brand-primary transition-colors">{family.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase tracking-wide">
                                            {family.plan}
                                        </span>
                                        <span className="text-xs text-brand-muted">• <Users size={12} className="inline mr-0.5" /> {family.members.length} members</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-brand-subtle rounded-full text-brand-muted group-hover:bg-brand-primary group-hover:text-white transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-black/5 pt-4 relative z-10">
                                <div className="flex -space-x-2">
                                    {family.members.slice(0, 4).map((m, i) => (
                                        <div key={m} className="w-8 h-8 rounded-full bg-brand-primary/10 border-2 border-brand-surface flex items-center justify-center text-[10px] font-bold text-brand-primary">
                                            U{i + 1}
                                        </div>
                                    ))}
                                    {family.members.length > 4 && (
                                        <div className="w-8 h-8 rounded-full bg-brand-subtle border-2 border-brand-surface flex items-center justify-center text-[10px] font-bold text-brand-muted">
                                            +{family.members.length - 4}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-brand-primary font-bold uppercase tracking-wider mb-0.5">Manage</p>
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
