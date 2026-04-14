
import React, { useState, useEffect } from 'react';
import { SuhbaService } from '../../services/SuhbaService';
import { PartnerService } from '../../services/PartnerService';
import { InviteService } from '../../services/InviteService';
import { SuhbaCircle } from '../../types/partner';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Send, Zap, BookOpen, Users, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareInviteModal } from '../shared/ShareInviteModal';
import { CreateGroupModal } from '../shared/CreateGroupModal';
import { useToast, Toast } from '../shared/Toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const SuhbaDashboard: React.FC = () => {
    const { user } = useAuth();
    const [circles, setCircles] = useState<SuhbaCircle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCircle, setSelectedCircle] = useState<SuhbaCircle | null>(null);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType, setBroadcastType] = useState<'pray' | 'adhkar' | 'custom'>('custom');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [shareLinkOpen, setShareLinkOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [inviteUserId, setInviteUserId] = useState('');
    const [memberProfiles, setMemberProfiles] = useState<Record<string, { name: string; avatar?: string }>>({});
    const { toast, showToast, clearToast } = useToast();

    useEffect(() => {
        if (user) {
            loadCircles();
        }
    }, [user]);

    // Fetch member profiles when circle is selected
    useEffect(() => {
        if (selectedCircle) {
            loadMemberProfiles(selectedCircle.members);
        }
    }, [selectedCircle]);

    const loadMemberProfiles = async (memberIds: string[]) => {
        const CACHE_KEY = 'suhba_member_profiles_cache';
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Try to load from cache first
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    // Use cached profiles, only fetch missing ones
                    const missingIds = memberIds.filter(id => !data[id]);
                    if (missingIds.length === 0) {
                        setMemberProfiles(data);
                        return;
                    }
                }
            }
        } catch {
            // Cache read failed, continue with fresh fetch
        }

        const profiles: Record<string, { name: string; avatar?: string }> = {};
        for (const uid of memberIds) {
            if (uid === user?.uid) {
                profiles[uid] = { name: 'You', avatar: user?.photoURL || undefined };
                continue;
            }
            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    profiles[uid] = {
                        name: data.displayName || data.name || data.nickname || `User ${uid.slice(0, 4)}`,
                        avatar: data.photoURL || data.avatar
                    };
                } else {
                    profiles[uid] = { name: `User ${uid.slice(0, 4)}` };
                }
            } catch {
                profiles[uid] = { name: `User ${uid.slice(0, 4)}` };
            }
        }
        setMemberProfiles(profiles);

        // Save to cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: profiles, timestamp: Date.now() }));
        } catch {
            // Cache write failed, continue
        }
    };

    const loadCircles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await SuhbaService.getMyCircles(user.uid);
            setCircles(data);
            if (data.length > 0) setSelectedCircle(data[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCircle = async (name: string) => {
        if (!user) return;
        await SuhbaService.createCircle(user.uid, name, "A motivation circle", true);
        loadCircles();
    };

    const handleJoinCircle = async () => {
        if (!user || !joinCode.trim()) return;
        try {
            // Clean up the code - handle both raw codes and URLs
            let code = joinCode.trim();
            // If it's a URL, extract the code from the end
            if (code.includes('/')) {
                code = code.split('/').pop() || code;
            }
            // Ensure proper prefix for 6-character codes without prefix
            if (!code.startsWith('SUH-') && !code.startsWith('FAM-') && !code.startsWith('DUO-') && code.length === 6) {
                code = 'SUH-' + code;
            }
            code = code.toUpperCase();

            // Method 1: Try SuhbaService (checks groups.inviteCode field)
            try {
                await SuhbaService.joinViaInviteCode(code, user.uid);
                showToast('Successfully joined the circle!', 'success');
                setShowJoinModal(false);
                setJoinCode('');
                loadCircles();
                return;
            } catch (err: any) {
                // If "Invalid invite code", try InviteService next
                // Re-throw other errors like "Already a member"
                if (!err.message?.includes('Invalid invite code')) {
                    throw err;
                }
            }

            // Method 2: Try InviteService (checks invites collection)
            const invite = await InviteService.getInviteByCode(code);
            if (invite && invite.groupId && invite.type === 'suhba') {
                await SuhbaService.joinCircle(invite.groupId, user.uid);
                await InviteService.useInvite(code, user.uid); // Increment use count
                showToast('Successfully joined the circle!', 'success');
                setShowJoinModal(false);
                setJoinCode('');
                loadCircles();
                return;
            }

            // Neither method worked
            throw new Error("Invalid invite code or link. Please check and try again.");
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to join circle. Check the code and try again.', 'error');
        }
    };

    const handleBroadcast = async () => {
        if (!user || !selectedCircle || !broadcastMsg) return;
        try {
            await SuhbaService.sendBroadcast(selectedCircle.id, user.uid, broadcastMsg, broadcastType);
            showToast('Broadcast sent to all members!', 'success');
            setBroadcastMsg('');
        } catch (error) {
            console.error(error);
            showToast('Failed to send', 'error');
        }
    };

    const handleInviteSubmit = async () => {
        if (!user || !inviteUserId.trim() || !selectedCircle) return;
        try {
            await PartnerService.sendRequest(user.uid, inviteUserId, 'suhba', { groupId: selectedCircle.id });
            showToast('Invite sent!', 'success');
            setInviteModalOpen(false);
        } catch (e) {
            console.error(e);
            showToast('Failed to invite. Check ID or connection.', 'error');
        }
    };

    if (loading) return <div className="p-10 text-center text-brand-muted">Loading Circles...</div>;

    if (circles.length === 0) {
        return (
            <>
                <div className="text-center py-12 bg-brand-surface rounded-2xl border border-brand-border shadow-sm">
                    <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                        <Users size={36} className="text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-forest mb-2">No Circles Yet</h3>
                    <p className="text-brand-muted max-w-xs mx-auto mb-6 text-sm px-4">
                        Create a Suhba circle or join an existing one with an invite code.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center px-6">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Create Circle
                        </button>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="inline-flex items-center justify-center gap-2 bg-brand-surface border-2 border-brand-border text-brand-primary font-bold px-6 py-3 rounded-xl hover:bg-brand-subtle hover:border-brand-primary/30 transition-all active:scale-95"
                        >
                            <Users size={18} />
                            Join with Code
                        </button>
                    </div>
                </div>

                {/* Create Circle Modal */}
                <CreateGroupModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateCircle}
                    type="suhba"
                />

                {/* Join Circle Modal */}
                <AnimatePresence>
                    {showJoinModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-brand-surface w-full max-w-sm p-6 rounded-3xl shadow-xl border border-brand-border"
                            >
                                <h3 className="text-xl font-bold text-brand-forest mb-2">Join a Circle</h3>
                                <p className="text-sm text-brand-muted mb-6">
                                    Enter the invite code or paste the invite link shared with you.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-brand-muted uppercase tracking-wider ml-1 mb-1 block">Invite Code or Link</label>
                                        <input
                                            type="text"
                                            className="w-full bg-brand-subtle border border-brand-border p-3 rounded-xl text-sm text-brand-forest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                            placeholder="SUH-XXXXXX or paste link..."
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => { setShowJoinModal(false); setJoinCode(''); }}
                                            className="flex-1 py-3 bg-transparent border border-brand-border text-brand-muted rounded-xl font-bold hover:bg-brand-subtle transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleJoinCircle}
                                            disabled={!joinCode.trim()}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Join Circle
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {circles.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedCircle(c)}
                        className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-sm font-bold transition-all border ${selectedCircle?.id === c.id
                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                            : 'bg-brand-surface text-brand-muted hover:bg-brand-subtle border-brand-border hover:border-brand-primary/20'
                            }`}
                    >
                        {c.name}
                    </button>
                ))}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-10 h-10 rounded-xl bg-brand-surface text-brand-primary border border-brand-border hover:bg-brand-subtle flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Create Circle"
                >
                    <Plus size={20} />
                </button>
                <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors text-sm font-bold gap-1"
                    title="Join Circle"
                >
                    <Users size={16} />
                    Join
                </button>
            </div>

            {selectedCircle && (
                <div className="bg-brand-surface rounded-3xl p-6 shadow-sm border border-brand-border">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold font-outfit text-brand-forest">{selectedCircle.name}</h2>
                            <p className="text-xs text-brand-muted font-medium mt-1">{selectedCircle.description || 'Suhba Circle'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-brand-surface border border-brand-border text-brand-forest/70 px-3 py-1.5 rounded-full flex items-center gap-1">
                                <Users size={12} />
                                {selectedCircle.members.length}
                            </span>
                            {selectedCircle.adminId === user.uid && (
                                <>
                                    <button
                                        onClick={() => {
                                            setInviteUserId('');
                                            setInviteModalOpen(true);
                                        }}
                                        className="text-xs font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/10 px-3 py-1.5 rounded-full hover:bg-brand-primary/20 transition-colors"
                                    >
                                        + Invite
                                    </button>
                                    <button
                                        onClick={() => setShareLinkOpen(true)}
                                        className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                                    >
                                        <Share2 size={12} /> Share
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-subtle border border-brand-border rounded-2xl p-5 mb-6">
                        <h3 className="font-bold text-brand-forest mb-4 flex items-center gap-2 text-sm uppercase tracking-wider opacity-80">
                            <Zap size={16} className="text-amber-500" />
                            Broadcast to Circle
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setBroadcastType('custom')}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${broadcastType === 'custom'
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-brand-surface text-brand-muted border-brand-border hover:bg-brand-subtle'}`}
                            >
                                Message
                            </button>
                            <button
                                onClick={() => setBroadcastType('adhkar')}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${broadcastType === 'adhkar'
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-brand-surface text-brand-muted border-brand-border hover:bg-brand-subtle'}`}
                            >
                                <BookOpen size={14} /> Read Adhkar
                            </button>
                        </div>

                        <textarea
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder={broadcastType === 'adhkar' ? "Which surah/dhikr should we read?" : "Motivate your circle..."}
                            className="w-full bg-brand-surface border border-brand-border p-4 rounded-xl mb-3 text-sm h-24 text-brand-forest placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 transition-all resize-none"
                        />

                        <button
                            onClick={handleBroadcast}
                            disabled={!broadcastMsg}
                            className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all"
                        >
                            <Send size={18} /> Send Broadcast
                        </button>
                    </div>

                    <div className="mt-8">
                        <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4 px-1">Circle Members</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedCircle.members.map((m) => {
                                const isMe = m === user.uid;
                                const isAdmin = selectedCircle.adminId === user.uid;
                                const isMemberAdmin = m === selectedCircle.adminId;
                                const profile = memberProfiles[m];
                                const displayName = profile?.name || `User ${m.slice(0, 4)}`;
                                const initials = displayName === 'You'
                                    ? (user?.displayName?.slice(0, 2) || 'ME').toUpperCase()
                                    : displayName.slice(0, 2).toUpperCase();

                                return (
                                    <div key={m} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isMe ? 'bg-brand-primary/5 border-brand-primary/10' : 'bg-brand-surface border-brand-border hover:border-brand-primary/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? 'bg-brand-primary text-white' : 'bg-brand-subtle text-brand-muted'}`}>
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-brand-forest">
                                                    {displayName}
                                                </p>
                                                {isMemberAdmin && <span className="text-[10px] text-brand-primary font-bold">Admin</span>}
                                            </div>
                                        </div>

                                        {isAdmin && !isMe && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Kick this member?")) {
                                                        await SuhbaService.removeMember(selectedCircle.id, user.uid, m);
                                                        loadCircles(); // refresh
                                                    }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-500 font-medium px-2 py-1 hover:bg-red-500/5 rounded transition-colors"
                                            >
                                                Kick
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            <AnimatePresence>
                {inviteModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-brand-surface w-full max-w-sm p-6 rounded-3xl shadow-glass border border-brand-border"
                        >
                            <h3 className="text-xl font-bold font-outfit text-brand-forest mb-2">Invite Member</h3>
                            <p className="text-sm text-brand-muted mb-6">
                                Share this Circle ID or enter a User ID to send a request.
                            </p>

                            <div className="bg-brand-subtle p-4 rounded-xl border border-brand-border mb-6 flex justify-between items-center group cursor-pointer"
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedCircle?.id || '');
                                    showToast('ID Copied!', 'success');
                                }}
                            >
                                <div>
                                    <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Circle ID</p>
                                    <code className="text-sm font-mono text-brand-primary font-bold">{selectedCircle?.id}</code>
                                </div>
                                <span className="text-xs text-brand-primary/70 font-bold group-hover:text-brand-primary transition-colors">
                                    Copy
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-brand-border flex-1"></div>
                                <span className="text-xs text-brand-muted font-bold">OR</span>
                                <div className="h-px bg-brand-border flex-1"></div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider ml-1 mb-1 block">User ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-brand-subtle border border-brand-border p-3 rounded-xl text-sm text-brand-forest focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                        placeholder="Paste User ID here..."
                                        value={inviteUserId}
                                        onChange={(e) => setInviteUserId(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setInviteModalOpen(false)}
                                        className="flex-1 py-3 bg-transparent border border-brand-border text-brand-muted rounded-xl font-bold hover:bg-brand-subtle transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInviteSubmit}
                                        className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                                    >
                                        Send Invite
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Share Link Modal */}
            {selectedCircle && (
                <ShareInviteModal
                    isOpen={shareLinkOpen}
                    onClose={() => setShareLinkOpen(false)}
                    type="suhba"
                    groupId={selectedCircle.id}
                    groupName={selectedCircle.name}
                />
            )}

            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateCircle}
                type="suhba"
            />

            {/* Join Circle Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-brand-surface w-full max-w-sm p-6 rounded-3xl shadow-xl border border-brand-border"
                        >
                            <h3 className="text-xl font-bold text-brand-forest mb-2">Join a Circle</h3>
                            <p className="text-sm text-brand-muted mb-6">
                                Enter the invite code or paste the invite link shared with you.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider ml-1 mb-1 block">Invite Code or Link</label>
                                    <input
                                        type="text"
                                        className="w-full bg-brand-subtle border border-brand-border p-3 rounded-xl text-sm text-brand-forest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="SUH-XXXXXX or paste link..."
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowJoinModal(false); setJoinCode(''); }}
                                        className="flex-1 py-3 bg-transparent border border-brand-border text-brand-muted rounded-xl font-bold hover:bg-brand-subtle transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleJoinCircle}
                                        disabled={!joinCode.trim()}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Join Circle
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div >
    );
};
