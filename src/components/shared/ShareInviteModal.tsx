
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Link2, Loader2 } from 'lucide-react';
import { InviteService, InviteType, Invite } from '../../services/InviteService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface ShareInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: InviteType;
    groupId: string;
    groupName: string;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
    isOpen,
    onClose,
    type,
    groupId,
    groupName
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareLink, setShareLink] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            generateInvite();
        }
    }, [isOpen, user]);

    const generateInvite = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const newInvite = await InviteService.createInvite(
                type,
                user.uid,
                user.displayName || 'A friend',
                {
                    groupId,
                    groupName,
                    expiresInDays: 7, // Expires in 7 days
                    maxUses: 50 // Max 50 uses per link
                }
            );
            setInvite(newInvite);
            setShareLink(InviteService.generateShareLink(type, newInvite.code));
        } catch (error) {
            console.error('Failed to generate invite:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t(`share_title_${type}` as any) || `Join my ${type}`,
                    text: t('share_text').replace('{groupName}', groupName),
                    url: shareLink
                });
            } catch (error) {
                // User cancelled or share failed
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback to copy
            handleCopy();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold font-outfit">{t('share_invite_link')}</h2>
                    <p className="text-emerald-100 text-sm mt-1">{groupName}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
                            <p className="text-gray-500">{t('generating_invite_link')}</p>
                        </div>
                    ) : invite ? (
                        <div className="space-y-4">
                            {/* Link Display */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    {t('invite_link')}
                                </p>
                                <p className="text-sm text-gray-800 font-mono break-all">
                                    {shareLink}
                                </p>
                            </div>

                            {/* Code Display */}
                            <div className="flex justify-center">
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-6 py-3">
                                    <p className="text-xs text-emerald-600 text-center uppercase font-bold mb-1">
                                        {t('invite_code')}
                                    </p>
                                    <p className="text-2xl font-mono font-bold text-emerald-800 tracking-wider">
                                        {invite.code}
                                    </p>
                                </div>
                            </div>

                            {/* Info */}
                            <p className="text-xs text-gray-400 text-center">
                                {t('invite_expires_text')}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={18} className="text-emerald-500" />
                                            {t('copied')}
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={18} />
                                            {t('copy')}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                >
                                    <Share2 size={18} />
                                    {t('share')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {t('failed_generate_invite')}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
