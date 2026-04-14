import React, { useState } from 'react';
import { X, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface JoinGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (inviteCode: string) => Promise<void>;
    type: 'family' | 'suhba';
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    type
}) => {
    const { t } = useLanguage();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!inviteCode.trim()) {
            setError(t('please_enter_invite'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(inviteCode.trim().toUpperCase());
            setInviteCode('');
            onClose();
        } catch (err: any) {
            setError(err.message || t('invalid_invite_code'));
        } finally {
            setLoading(false);
        }
    };

    const groupLabel = type === 'family' ? 'Family' : 'Suhba Circle';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-outfit text-emerald-950">
                                {t('join_group_label').replace('{group}', groupLabel)}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            {t('enter_invite_desc').replace('{group}', groupLabel.toLowerCase())}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('invite_code')}
                                </label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => {
                                        setInviteCode(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    placeholder={type === 'family' ? 'FAM-XXXXXX' : 'SHB-XXXXXX'}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-center text-xl font-mono tracking-widest uppercase"
                                    maxLength={12}
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !inviteCode.trim()}
                                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>{t('join_group_label').replace('{group}', groupLabel)}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
