
import React, { useEffect, useState } from 'react';
// Simple URL hooks to replace react-router-dom
const useParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return { type: searchParams.get('type') || '', code: searchParams.get('code') || '' };
};
const useNavigate = () => {
    return (path: string) => { window.location.href = path; };
};
import { InviteService, InviteType } from '../services/InviteService';
import { FamilyService } from '../services/FamilyService';
import { SuhbaService } from '../services/SuhbaService';
import { PartnerService } from '../services/PartnerService';
import { useAuth } from '../hooks/useAuth';
import { Users, Home, Heart, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const JoinPage: React.FC = () => {
    const { type, code } = useParams();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [inviteDetails, setInviteDetails] = useState<{
        valid: boolean;
        groupName?: string;
        inviterName?: string;
        message?: string;
    } | null>(null);

    useEffect(() => {
        if (code) {
            loadInviteDetails();
        }
    }, [code]);

    useEffect(() => {
        // If user is logged in and there's a pending invite, process it
        if (user && inviteDetails?.valid && !success && !joining) {
            handleJoin();
        }
    }, [user, inviteDetails]);

    const loadInviteDetails = async () => {
        setLoading(true);
        try {
            const details = await InviteService.getInviteDetails(code!);
            setInviteDetails(details);
            if (!details.valid) {
                setError(details.message || 'Invalid invite link');
            }
        } catch (err) {
            setError('Failed to load invite details');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!user || !code || !type) return;

        setJoining(true);
        setError(null);

        try {
            // Use the invite
            const result = await InviteService.useInvite(code, user.uid);

            if (!result.success) {
                setError(result.message || 'Failed to process invite');
                setJoining(false);
                return;
            }

            // Join the appropriate group
            if (type === 'family' && result.groupId) {
                await FamilyService.joinFamily(result.groupId, user.uid);
            } else if (type === 'suhba' && result.groupId) {
                await SuhbaService.joinCircle(result.groupId, user.uid);
            } else if (type === 'duo' && result.groupId) {
                // For duo, the groupId is actually the partner's userId
                await PartnerService.sendRequest(user.uid, result.groupId);
            }

            // Clear any pending invite
            InviteService.clearPendingInvite();

            setSuccess(true);

            // Redirect to partners page after short delay
            setTimeout(() => {
                navigate('/partners');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    const handleOpenApp = () => {
        if (!user) {
            // Save pending invite and redirect to main app (will trigger auth)
            InviteService.savePendingInvite({
                type: type as InviteType,
                code: code!,
                groupName: inviteDetails?.groupName,
                inviterId: undefined,
                timestamp: Date.now()
            });
            navigate('/');
        } else {
            handleJoin();
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'family': return <Home size={48} className="text-amber-500" />;
            case 'suhba': return <Users size={48} className="text-blue-500" />;
            case 'duo': return <Heart size={48} className="text-emerald-500" />;
            default: return <Users size={48} className="text-gray-500" />;
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'family': return 'Family Group';
            case 'suhba': return 'Suhba Circle';
            case 'duo': return 'Accountability Partner';
            default: return 'Group';
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        {getIcon()}
                    </div>
                    <h1 className="text-2xl font-bold font-outfit mb-2">You're Invited!</h1>
                    <p className="text-emerald-100">Join a {getTypeLabel()}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                            <p className="text-gray-600">{error}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                            >
                                Go to App
                            </button>
                        </div>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="text-emerald-500" size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h2>
                            <p className="text-gray-600">You've successfully joined. Redirecting...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            {inviteDetails?.inviterName && (
                                <p className="text-gray-600 mb-2">
                                    <strong>{inviteDetails.inviterName}</strong> invited you
                                </p>
                            )}
                            {inviteDetails?.groupName && (
                                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-emerald-600 uppercase font-bold tracking-wide mb-1">
                                        {getTypeLabel()}
                                    </p>
                                    <p className="text-xl font-bold text-emerald-900">
                                        {inviteDetails.groupName}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleOpenApp}
                                disabled={joining}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {joining ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Joining...
                                    </>
                                ) : user ? (
                                    <>
                                        <CheckCircle size={20} />
                                        Join Now
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink size={20} />
                                        Open Khalil App
                                    </>
                                )}
                            </button>

                            {!user && (
                                <p className="text-xs text-gray-500 mt-4">
                                    You'll need to sign in or create an account to join
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
