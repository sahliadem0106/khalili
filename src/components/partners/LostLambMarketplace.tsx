
import React, { useState, useEffect } from 'react';
import { PartnerService } from '../../services/PartnerService';
import { PartnerProfile } from '../../types/partner';
import { User, MapPin, Heart, Edit3, Shield, Info, QrCode, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService } from '../../services/OnboardingService';
import { Toast } from '../shared/Toast';

// Initialize user location from localStorage eagerly to avoid race condition
function getInitialUserLocation(): { lat: number; lon: number } | null {
    try {
        const saved = localStorage.getItem('khalil_saved_location');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.latitude && parsed.longitude) {
                return { lat: parsed.latitude, lon: parsed.longitude };
            }
        }
    } catch { /* ignore */ }
    return null;
}

export const LostLambMarketplace: React.FC = () => {
    const { user: authUser } = useAuth();
    const [profiles, setProfiles] = useState<PartnerProfile[]>([]);
    const [myProfile, setMyProfile] = useState<PartnerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingProfile, setCheckingProfile] = useState(true); // Added to prevent flash
    const [genderFilter, setGenderFilter] = useState<'male' | 'female'>('male');
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [nearbyOnly, setNearbyOnly] = useState(false);
    // FIX: Initialize from localStorage to avoid race condition with nearbyOnly filter
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(getInitialUserLocation);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });

    // Form State
    const [formData, setFormData] = useState<Partial<PartnerProfile>>({
        nickname: '',
        age: 18,
        gender: 'male',
        location: { city: '', country: '' },
        hobbies: [],
        bio: '',
        isPublic: true
    });
    const [tempHobby, setTempHobby] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (authUser) {
            loadMyProfile();
        } else {
            setLoading(false);
            setCheckingProfile(false);
        }
    }, [authUser]);

    useEffect(() => {
        if (myProfile) {
            setGenderFilter(myProfile.gender);
            loadProfiles(myProfile.gender);
        } else {
            // Fallback load if no profile yet, maybe load both or just defaults
            loadProfiles('male');
        }
    }, [myProfile]);

    // Reload when nearbyOnly filter changes
    useEffect(() => {
        if (myProfile) {
            loadProfiles(myProfile.gender);
        } else {
            loadProfiles(genderFilter);
        }
    }, [nearbyOnly]);

    const loadMyProfile = async () => {
        if (!authUser) return;
        try {
            let profile = await PartnerService.getProfile(authUser.uid);

            // If no profile exists but onboarding is complete, auto-create from onboarding data
            if (!profile && onboardingService.isOnboardingComplete()) {
                const onboardingData = onboardingService.getOnboardingData();
                if (onboardingData?.profile && onboardingData?.gender) {
                    const newProfileData: Partial<PartnerProfile> = {
                        nickname: onboardingData.profile.nickname || onboardingData.profile.firstName,
                        age: onboardingData.profile.age || 18,
                        gender: onboardingData.gender,
                        location: onboardingData.profile.location || { city: '', country: '' },
                        hobbies: onboardingData.profile.hobbies || [],
                        bio: onboardingData.profile.bio || '',
                        isPublic: true,
                    };
                    await PartnerService.createOrUpdateProfile(authUser.uid, newProfileData);
                    profile = await PartnerService.getProfile(authUser.uid);
                }
            }

            setMyProfile(profile);
            if (profile) {
                setFormData(profile);
            }
        } catch (error) {
            console.error("Failed to load my profile", error);
        } finally {
            setCheckingProfile(false);
        }
    };

    const loadProfiles = async (gender: 'male' | 'female') => {
        setLoading(true);
        try {
            // Load user location from localStorage if not already set
            if (!userLocation) {
                const savedLocation = localStorage.getItem('khalil_saved_location');
                if (savedLocation) {
                    const parsed = JSON.parse(savedLocation);
                    if (parsed.latitude && parsed.longitude) {
                        setUserLocation({ lat: parsed.latitude, lon: parsed.longitude });
                    }
                }
            }

            const filters: Parameters<typeof PartnerService.searchPublicProfiles>[0] = { gender };

            // Apply 5km filter if enabled and we have location
            if (nearbyOnly && userLocation) {
                filters.maxDistanceKm = 5;
                filters.userLocation = userLocation;
            }

            const results = await PartnerService.searchPublicProfiles(filters);
            // Filter out self
            setProfiles(results.filter(p => p.userId !== authUser?.uid));
        } catch (error) {
            console.error("Failed to load profiles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (profileId: string) => {
        if (!authUser) return;
        // Profile is auto-created from onboarding, so this check is simpler now
        if (!myProfile) {
            showToast('Your profile is being set up. Please try again in a moment.', 'info');
            await loadMyProfile(); // Attempt to sync from onboarding
            return;
        }
        await PartnerService.sendRequest(authUser.uid, profileId);
        showToast('Request sent! ✨', 'success');
    };

    const handleSaveProfile = async () => {
        if (!authUser) return;
        try {
            await PartnerService.createOrUpdateProfile(authUser.uid, formData);
            await loadMyProfile();
            setShowProfileForm(false);
            setShowSuccess(true);
        } catch (e) {
            console.error(e);
            showToast('Failed to save profile. Please try again.', 'error');
        }
    };

    const handleAddHobby = () => {
        if (tempHobby && !formData.hobbies?.includes(tempHobby)) {
            setFormData(prev => ({
                ...prev,
                hobbies: [...(prev.hobbies || []), tempHobby]
            }));
            setTempHobby('');
        }
    };

    const handleRemoveHobby = (tag: string) => {
        setFormData(prev => ({ ...prev, hobbies: prev.hobbies?.filter(h => h !== tag) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSaveProfile();
    };

    if (!authUser) {
        return <div className="p-8 text-center text-brand-muted">Please sign in to find a partner.</div>;
    }

    if (checkingProfile) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4">

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header / My Status */}
            <div className="glass-panel p-6 bg-brand-surface border border-brand-border">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-forest font-outfit mb-2">
                            {myProfile ? 'You\'re in the Marketplace!' : 'Find a Partner'}
                        </h2>
                        <p className="text-brand-muted text-sm max-w-md">
                            {myProfile
                                ? 'Wait for us to match you with someone, or connect directly using QR codes or sending requests below.'
                                : 'Connect with a partner for daily prayer accountability.'
                            }
                        </p>
                    </div>
                    {/* Removed Edit Button */}
                </div>

                {/* Status Cards for matched users */}
                {myProfile && (
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-brand-secondary/10 text-brand-secondary px-4 py-2 rounded-xl text-sm font-medium">
                            <Clock size={16} />
                            Waiting for match...
                        </div>
                        <div className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-sm font-medium">
                            <QrCode size={16} />
                            Use QR Code or send requests below
                        </div>
                    </div>
                )}

                {/* Nearby Filter Toggle */}
                <div className="flex items-center justify-between mt-5 p-4 bg-brand-subtle rounded-2xl shadow-sm border border-brand-border transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full transition-colors ${nearbyOnly ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-subtle text-brand-muted'}`}>
                            <MapPin size={20} />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-brand-forest">Nearby Muslims</span>
                            <span className="text-xs text-brand-muted">Filter within 5km radius</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setNearbyOnly(!nearbyOnly)}
                        className={`w-14 h-8 rounded-full transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${nearbyOnly ? 'bg-brand-primary shadow-lg shadow-brand-primary/30' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${nearbyOnly ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* Join button only if no profile */}
                {!myProfile && (
                    <button
                        onClick={() => setShowProfileForm(true)}
                        className="btn btn-primary mt-4"
                    >
                        <User size={18} />
                        Join Marketplace
                    </button>
                )}
            </div>

            {/* Success Message */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel p-6 bg-brand-surface border-2 border-brand-primary/20"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center">
                                <Heart className="text-brand-primary" size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-brand-forest text-lg font-outfit">Profile Submitted!</h3>
                                <p className="text-brand-muted text-sm">
                                    Wait for a match or connect directly using the <strong>QR Code</strong> button above.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="text-brand-primary hover:text-brand-primary-dark text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Creation / Edit Form Removed */}
            {/*
            <AnimatePresence>
                {showProfileForm && (
                   ... removed ...
                )}
            </AnimatePresence>
            */}

            {
                loading ? (
                    <div className="text-center py-20" >
                        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-brand-muted">Finding compatible partners...</p>
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-20 px-6 bg-brand-surface/50 backdrop-blur-sm rounded-3xl border border-dashed border-brand-primary/20">
                        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <User size={32} className="text-brand-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-forest mb-2">No active profiles found</h3>
                        <p className="text-brand-muted text-sm mb-6 max-w-xs mx-auto">
                            {nearbyOnly ? "No one matches your filters nearby. Try expanding your search!" : "Be the first to join the marketplace and find your partner."}
                        </p>
                        {!myProfile && (
                            <button
                                onClick={() => setShowProfileForm(true)}
                                className="btn btn-primary"
                            >
                                Create your profile
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profiles.map(profile => (
                            <motion.div
                                key={profile.userId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="bg-brand-surface rounded-2xl shadow-sm hover:shadow-xl border border-brand-border overflow-hidden transition-all duration-300 group relative h-full"
                            >
                                {/* Decorative Gradient Bar */}
                                <div className="h-1.5 w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center space-x-3.5">
                                            <div className="w-14 h-14 bg-brand-surface rounded-full flex items-center justify-center text-brand-primary font-outfit font-bold text-xl shadow-md border border-brand-border group-hover:scale-110 transition-transform duration-300">
                                                {profile.nickname[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-brand-forest text-lg leading-tight group-hover:text-brand-primary transition-colors">{profile.nickname}</h3>
                                                <div className="flex items-center text-xs text-brand-muted space-x-1 mt-1">
                                                    <MapPin size={11} className="text-brand-primary" />
                                                    <span>{profile.location.city}, {profile.location.country}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="bg-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full">
                                                Age {profile.age}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6 flex-1">
                                        {profile.bio && (
                                            <div className="relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/30 rounded-full" />
                                                <p className="text-sm text-brand-muted italic pl-3 line-clamp-2 leading-relaxed">
                                                    "{profile.bio}"
                                                </p>
                                            </div>
                                        )}

                                        {profile.hobbies && profile.hobbies.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.hobbies.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] bg-brand-subtle text-brand-forest px-2.5 py-1 rounded-md border border-brand-border font-medium">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {profile.hobbies.length > 3 && (
                                                    <span className="text-[10px] text-brand-muted px-1 py-1">+ {profile.hobbies.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleConnect(profile.userId)}
                                        className="btn btn-secondary w-full group-hover:border-brand-primary mt-auto"
                                    >
                                        <User size={18} />
                                        <span>Connect</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
        </div >
    );
};
