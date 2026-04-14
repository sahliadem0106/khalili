
import React, { useState } from 'react';
import { FamilyService } from '../../services/FamilyService';
import { Timestamp } from 'firebase/firestore';
import { X, Award, Clock, Users, User, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface ChallengeCreatorProps {
    familyId: string;
    onClose: () => void;
    onCreated: () => void;
}

export const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({ familyId, onClose, onCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [daysToComplete, setDaysToComplete] = useState(7);
    const [assignType, setAssignType] = useState<'all' | 'child' | 'parent'>('all');
    const [loading, setLoading] = useState(false);
    const { toast, showToast, clearToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + daysToComplete);

            await FamilyService.createChallenge({
                groupId: familyId,
                createdBy: user.uid,
                createdAt: Timestamp.now(),
                title,
                description,
                deadline: Timestamp.fromDate(deadline),
                reward,
                assignedToType: assignType === 'all' ? 'all' : 'role',
                assignedTo: assignType === 'all' ? ['all'] : [assignType],
                // Note: The service will handle converting 'role' to specific user IDs if needed, 
                // or we can store it as dynamic role assignment.
            }, user.uid);
            onCreated();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to create challenge', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-emerald-900">New Challenge</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Challenge Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Master Surah Al-Mulk"
                            className="w-full glass-input p-3 rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Explain what needs to be done..."
                            className="w-full glass-input p-3 rounded-xl h-24"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reward</label>
                            <div className="relative">
                                <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                                <input
                                    type="text"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                    placeholder="e.g. Pizza Night"
                                    className="w-full glass-input pl-10 p-2 rounded-xl"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={daysToComplete}
                                    onChange={(e) => setDaysToComplete(parseInt(e.target.value))}
                                    className="w-full glass-input pl-10 p-2 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign To</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setAssignType('all')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${assignType === 'all' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <Users size={14} /> Family
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignType('child')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${assignType === 'child' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <User size={14} /> Kids
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignType('parent')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border-2 transition-all ${assignType === 'parent' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <Shield size={14} /> Parents
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Creating...' : 'Launch Challenge'}
                        </button>
                    </div>
                </form>
            </div>

            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div>
    );
};
