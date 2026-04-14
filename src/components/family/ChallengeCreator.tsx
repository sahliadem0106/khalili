
import React, { useState } from 'react';
import { FamilyService } from '../../services/FamilyService';
import { Timestamp } from 'firebase/firestore';
import { X, Award, Clock, Users, User, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({ value, placeholder, options, onChange }: { value: string, placeholder: string, options: { value: string, label: string }[], onChange: (val: string) => void }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full bg-white border border-gray-100 rounded-3xl p-3.5 text-sm font-bold flex items-center justify-between focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all"
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-400 font-medium'}>{selected?.label || placeholder}</span>
                <ChevronDown size={18} className={`transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-xl border border-black/5 z-50 overflow-hidden py-2"
                        >
                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                {options.map(o => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => { onChange(o.value); setOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${value === o.value ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-700 hover:bg-neutral-50'}`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

interface ChallengeCreatorProps {
    familyId: string;
    familyMembers: string[];
    onClose: () => void;
    onCreated: () => void;
}

export const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({ familyId, familyMembers, onClose, onCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [daysToComplete, setDaysToComplete] = useState(7);
    const [assignType, setAssignType] = useState<'all' | 'child' | 'parent' | 'specific'>('all');
    const [specificUserId, setSpecificUserId] = useState('');
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
                assignedToType: assignType === 'all' ? 'all' : assignType === 'specific' ? 'specific' : 'role',
                assignedTo: assignType === 'all' ? ['all'] : assignType === 'specific' ? [specificUserId.trim()] : [assignType],
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
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                    onClick={onClose} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                >
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50/50 bg-gradient-to-br from-emerald-50/50 to-white">
                    <h3 className="font-extrabold text-xl text-emerald-900 tracking-tight">New Challenge</h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Challenge Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Master Surah Al-Mulk"
                            className="w-full bg-white border border-gray-100 p-3.5 rounded-3xl text-sm font-bold text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 shadow-sm transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Explain what needs to be done..."
                            className="w-full bg-white border border-gray-100 p-3.5 rounded-3xl h-24 text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 shadow-sm transition-all outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reward</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 bg-amber-100 text-amber-600 p-1 rounded-full">
                                    <Award size={14} />
                                </span>
                                <input
                                    type="text"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                    placeholder="e.g. Pizza Night"
                                    className="w-full bg-white border border-gray-100 pl-11 p-3.5 rounded-3xl text-sm font-bold text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Duration (Days)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-600 p-1 rounded-full">
                                    <Clock size={14} />
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={daysToComplete}
                                    onChange={(e) => setDaysToComplete(parseInt(e.target.value))}
                                    className="w-full bg-white border border-gray-100 pl-11 p-3.5 rounded-3xl text-sm font-bold text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Assign To</label>
                        <div className="flex gap-2">
                            {(['all', 'child', 'parent', 'specific'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setAssignType(type)}
                                    className={`flex-1 py-2.5 rounded-2xl text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border ${
                                        assignType === type 
                                            ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500/10' 
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                                    }`}
                                >
                                    {type === 'all' && <Users size={14} className={assignType === type ? 'text-emerald-500' : ''} />}
                                    {type === 'child' && <User size={14} className={assignType === type ? 'text-emerald-500' : ''} />}
                                    {type === 'parent' && <Shield size={14} className={assignType === type ? 'text-emerald-500' : ''} />}
                                    {type === 'specific' && <User size={14} className={assignType === type ? 'text-emerald-500' : ''} />}
                                    <span className="capitalize">{type === 'all' ? 'Family' : type === 'child' ? 'Kids' : type === 'parent' ? 'Parents' : 'One User'}</span>
                                </button>
                            ))}
                        </div>
                        <AnimatePresence>
                            {assignType === 'specific' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="overflow-visible"
                                >
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Member</label>
                                    <CustomDropdown
                                        value={specificUserId}
                                        placeholder="Choose member ID..."
                                        options={familyMembers.map(m => ({ value: m, label: m }))}
                                        onChange={setSpecificUserId}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || (assignType === 'specific' && !specificUserId.trim())}
                            className="w-full py-4 mt-2 bg-emerald-600 text-white rounded-[1.25rem] font-extrabold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all focus:ring-4 focus:ring-emerald-500/20 outline-none"
                        >
                            {loading ? 'Creating...' : 'Launch Challenge'}
                        </button>
                    </div>
                </form>
            </motion.div>
            </div>
            {toast && <Toast {...toast} onDismiss={clearToast} />}
        </AnimatePresence>
    );
};
