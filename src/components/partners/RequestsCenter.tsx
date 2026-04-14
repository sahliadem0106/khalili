
import React, { useEffect, useState } from 'react';
import { PartnerService } from '../../services/PartnerService';
import { PartnerRequest } from '../../types/partner';
import { useAuth } from '../../hooks/useAuth';
import { Check, X, UserPlus, Users, Home, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface RequestsCenterProps {
    onRequestProcessed: () => void;
}

interface EnrichedRequest extends PartnerRequest {
    senderName?: string;
    senderAvatar?: string;
}

// Export hook for getting request count (for badge)
export const useRequestCount = () => {
    const { user } = useAuth();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setCount(0);
            return;
        }

        const loadCount = async () => {
            try {
                const requests = await PartnerService.getIncomingRequests(user.uid);
                setCount(requests.length);
            } catch (error) {
                console.error('Failed to load request count:', error);
            }
        };

        loadCount();
        // Poll every 30 seconds for updates
        const interval = setInterval(loadCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    return count;
};

export const RequestsCenter: React.FC<RequestsCenterProps> = ({ onRequestProcessed }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<EnrichedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast, showToast, clearToast } = useToast();

    useEffect(() => {
        if (user) {
            loadRequests();
        }
    }, [user]);

    const fetchUserProfile = async (userId: string): Promise<{ name: string; avatar?: string }> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    name: data.displayName || data.name || data.nickname || 'Unknown User',
                    avatar: data.photoURL || data.avatar,
                };
            }
            // Try partner_profiles collection as fallback
            const profileDoc = await getDoc(doc(db, 'partner_profiles', userId));
            if (profileDoc.exists()) {
                const data = profileDoc.data();
                return {
                    name: data.nickname || 'Unknown User',
                    avatar: data.avatar,
                };
            }
        } catch (e) {
            console.error('Failed to fetch user profile:', e);
        }
        return { name: 'Unknown User' };
    };

    const loadRequests = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await PartnerService.getIncomingRequests(user.uid);

            // Enrich with sender profiles
            const enriched: EnrichedRequest[] = await Promise.all(
                data.map(async (req) => {
                    const profile = await fetchUserProfile(req.fromUserId);
                    return {
                        ...req,
                        senderName: profile.name,
                        senderAvatar: profile.avatar,
                    };
                })
            );

            setRequests(enriched);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
        try {
            await PartnerService.respondToRequest(requestId, action);
            setRequests(prev => prev.filter(r => r.id !== requestId));
            if (action === 'accept') {
                onRequestProcessed();
            }
        } catch (error) {
            console.error(error);
            showToast('Request failed. Please check your connection and try again.', 'error');
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-400">Loading requests...</div>;

    if (requests.length === 0) {
        return (
            <div className="text-center py-10 bg-transparent rounded-2xl border border-dashed border-brand-border/40">
                <p className="text-brand-forest text-sm font-medium">No pending requests</p>
                <p className="text-brand-muted text-xs mt-1">Invites from friends will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-brand-forest px-1 flex items-center gap-2">
                Pending Requests
                <span className="bg-brand-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {requests.length}
                </span>
            </h3>
            {requests.map(req => (
                <div key={req.id} className="bg-brand-surface p-4 rounded-xl shadow-sm border border-brand-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        {req.senderAvatar ? (
                            <img
                                src={req.senderAvatar}
                                alt={req.senderName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-brand-primary/20"
                            />
                        ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${req.type === 'family' ? 'bg-brand-secondary' :
                                req.type === 'suhba' ? 'bg-brand-primary-dark' : 'bg-brand-primary'
                                }`}>
                                {req.senderName ? req.senderName.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-bold text-brand-forest text-sm truncate">
                                {req.senderName || 'Unknown User'}
                            </p>
                            <p className="text-xs text-brand-muted flex items-center gap-1 truncate">
                                {req.type === 'family' && <><Home size={12} className="text-brand-secondary" /> Family Invite</>}
                                {req.type === 'suhba' && <><Users size={12} className="text-brand-primary-dark" /> Circle Invite</>}
                                {req.type === 'duo' && <><UserPlus size={12} className="text-brand-primary" /> Partner Request</>}
                            </p>
                            {req.details?.groupName && (
                                <p className="text-xs text-brand-primary font-bold mt-0.5 truncate">"{req.details.groupName}"</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleAction(req.id, 'reject')}
                            className="w-9 h-9 rounded-full bg-brand-subtle text-brand-muted flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={() => handleAction(req.id, 'accept')}
                            className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary/20 transition-colors shadow-sm"
                        >
                            <Check size={18} />
                        </button>
                    </div>
                </div>
            ))}

            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div>
    );
};
