import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { ChevronRight, MapPin, Check, ArrowRight } from 'lucide-react';
import { onboardingService } from '../../services/OnboardingService';
import { locationService } from '../../services/LocationService';
import Lottie from 'lottie-react';
import Confetti from 'react-confetti';
import { localStorageService } from '../../services/LocalStorageService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { db } from '../../services/firebase';
import { useToast, Toast } from '../shared/Toast';

// --- VISUAL ASSETS ---
import welcomeAnim from '../../assets/animations/welcome.json';
import prayerAnim from '../../assets/animations/man_praying.json';
import quranAnim from '../../assets/animations/quran.json';
import studyAnim from '../../assets/animations/study.json';

// Features
import charityAnim from '../../assets/animations/charity.json';
import knowledgeAnim from '../../assets/animations/knowledge.json';
import tasbihAnim from '../../assets/animations/tasbih.json';
import compassAnim from '../../assets/animations/compass.json';

// Gender Specific
import braceletBlueAnim from '../../assets/animations/blue_bracelet.json';
import braceletPinkAnim from '../../assets/animations/pink_bracelet.json';
import womanGesturesAnim from '../../assets/animations/woman_gestures.json';
import girlRecitingAnim from '../../assets/animations/girl_reciting.json';
import manParkAnim from '../../assets/animations/man_park.json';
import manTelescopeAnim from '../../assets/animations/man_telescope.json';

// Ghost
import ghostAnim from '../../assets/animations/A Ghost.json';

// --- COMPONENTS ---

const FloatingLottie = ({ animationData, className, delay = 0, speed = 4, scale = 1 }: { animationData: any, className?: string, delay?: number, speed?: number, scale?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 * scale, y: 30 }}
            animate={{
                opacity: 1,
                scale: 1 * scale,
                y: [0, -10, 0],
            }}
            transition={{
                opacity: { duration: 0.8, delay },
                scale: { duration: 0.8, delay },
                y: { duration: speed, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
            }}
            className={className}
        >
            <Lottie animationData={animationData} loop={true} className="w-full h-full" />
        </motion.div>
    );
};

const SmoothText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const words = text.split(" ");
    const containerInfo = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: delay }
        })
    };
    const childInfo = {
        hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.4, ease: 'easeOut' } as Transition
        }
    };
    return (
        <motion.div variants={containerInfo} initial="hidden" animate="visible" className={className}>
            {words.map((word, index) => (
                <span key={index} className="inline-block whitespace-nowrap mr-[0.25em]">
                    {Array.from(word).map((char, charIndex) => (
                        <motion.span key={charIndex} variants={childInfo} className="inline-block">{char}</motion.span>
                    ))}
                </span>
            ))}
        </motion.div>
    );
};

interface OnboardingFlowProps {
    onComplete: () => void;
    initialStep?: number;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, initialStep = 0 }) => {
    const { signInWithGoogle, user } = useAuth();
    const { t } = useLanguage();
    const [step, setStep] = useState(initialStep);
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [showNext, setShowNext] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        age: 18,
        field: '',
        hobbies: [] as string[],
        bio: '',
        location: { city: '', country: '' },
        termsAccepted: false,
        socialLinks: [] as Array<{ platform: string; handle: string }>,
    });
    const [hobbyInput, setHobbyInput] = useState('');
    const [socialInput, setSocialInput] = useState({ platform: 'WhatsApp', handle: '' });
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const { toast, showToast, clearToast } = useToast();
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setShowNext(false);
        // Form (9) and Gender (7) and Auth (5) have custom triggers
        if (step !== 5 && step !== 6 && step !== 7 && step !== 9 && step !== 10) {
            const timer = setTimeout(() => setShowNext(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const next = () => {
        setStep(s => s + 1);
        setShowNext(false);
    };

    const detectLocation = async () => {
        setIsDetectingLocation(true);
        try {
            // Use centralized locationService for GPS (auto-saves to localStorage)
            const loc = await locationService.getCurrentPosition();
            setFormData(prev => ({
                ...prev,
                location: {
                    city: loc.city || '',
                    country: loc.country || '',
                }
            }));
        } catch { /* ignore */ } finally {
            setIsDetectingLocation(false);
        }
    };

    const addHobby = () => {
        if (hobbyInput.trim() && formData.hobbies.length < 5) {
            setFormData(prev => ({ ...prev, hobbies: [...prev.hobbies, hobbyInput.trim()] }));
            setHobbyInput('');
        }
    };

    const addSocialLink = () => {
        if (socialInput.handle.trim() && formData.socialLinks.length < 3) {
            setFormData(prev => ({
                ...prev,
                socialLinks: [...prev.socialLinks, { platform: socialInput.platform, handle: socialInput.handle.trim() }]
            }));
            setSocialInput({ platform: 'WhatsApp', handle: '' });
        }
    };

    // --- LOGIC: Auth Redirect ---
    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            onboardingService.markGoogleLinked();

            // Fetch firestore profile to verify completeness directly
            if (auth.currentUser?.uid || user) {
                const { getDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                const uid = auth.currentUser?.uid || user?.uid;
                if (uid) {
                    const userDoc = await getDoc(doc(db, 'users', uid));

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (data.gender && data.firstName && data.onboardingCompleted) {
                            console.log('[OnboardingFlow] Existing user found in Firestore - skipping onboarding');
                            
                            // Sync local storage so it bypasses checks
                            onboardingService.saveGender(data.gender);
                            onboardingService.completeOnboarding();
                            
                            onComplete();
                            return;
                        }
                    }
                }
            }

            // AuthService auto-completes onboarding for existing users
            // Check if that happened (means user already has a Firestore profile locally synced)
            if (onboardingService.isOnboardingComplete()) {
                console.log('[OnboardingFlow] Existing user - redirecting to home');
                onComplete();
                return;
            }

            // New user - continue to gender selection (Step 7)
            setStep(7);
        } catch (error) {
            console.error(error);
            showToast(t('onboard_login_failed') as string, 'error');
        }
    };

    const finish = async () => {
        // Ghost Mode (No Gender)
        if (!gender) {
            onboardingService.completeOnboarding();
            onComplete();
            return;
        }

        // Show loading state if needed (optional optimization)

        onboardingService.saveGender(gender);
        onboardingService.saveProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            nickname: formData.nickname,
            age: formData.age,
            hobbies: formData.hobbies,
            bio: formData.bio,
            location: formData.location,
            socialLinks: formData.socialLinks,
        });

        // NEW: Sync to LocalStorage & Firestore
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();

        // 1. Update Local Storage with ALL profile data for useSyncManager
        const avatarPath = gender === 'female' ? '/womenicon.png' : '/manicon.png';
        localStorageService.setUser({
            name: fullName || 'User',
            firstName: formData.firstName,
            lastName: formData.lastName,
            nickname: formData.nickname,
            gender: gender,
            age: formData.age,
            bio: formData.bio,
            hobbies: formData.hobbies,
            location: formData.location.city,
            avatar: avatarPath,
            socialLinks: formData.socialLinks,
        });

        // 2. Update Firestore (if authenticated)
        // We use auth.currentUser directly to ensure we have the latest auth state, 
        // avoiding any stale closure issues with the 'user' object from the hook.
        const currentUser = user || auth.currentUser;

        if (currentUser) {
            console.log('[OnboardingFlowDebug] Saving profile for user:', currentUser.uid);
            const avatarPath = gender === 'female' ? '/womenicon.png' : '/manicon.png';

            try {
                // 2. Update Firestore and WAIT
                await setDoc(doc(db, 'users', currentUser.uid), {
                    displayName: fullName,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    nickname: formData.nickname,
                    gender: gender,
                    photoURL: avatarPath, // FORCE AVATAR UPDATE
                    age: formData.age,
                    hobbies: formData.hobbies,
                    bio: formData.bio,
                    location: formData.location.city,
                    country: formData.location.country,
                    socialLinks: formData.socialLinks, // NEW: Save social links
                    onboardingCompleted: true,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                // 3. Update Firebase Auth Profile (Syncs immediately to header)
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, {
                        displayName: fullName,
                        photoURL: avatarPath
                    });
                }
            } catch (e: any) {
                console.error("Error syncing profile:", e);
                showToast('Error saving profile: ' + e.message, 'error');
                // Ensure we don't complete if save failed? 
                // No, better to let them in and try again than block them forever.
            }
        }

        onboardingService.completeOnboarding();
        onComplete();
    };

    const getStepColor = () => {
        switch (step) {
            case 0: return 'bg-sky-50';
            case 1: return 'bg-indigo-50';
            case 2: return 'bg-amber-50';
            case 3: return 'bg-blue-50';
            case 4: return 'bg-purple-50';
            case 5: return 'bg-white'; // Auth
            case 6: return 'bg-slate-50'; // Warning
            case 7: return 'bg-white'; // Gender
            default: // Branching
                if (!gender) return 'bg-slate-50';
                return gender === 'female' ? 'bg-pink-50' : 'bg-cyan-50';
        }
    };

    const getAccentColor = () => {
        switch (step) {
            case 0: return 'text-sky-600';
            case 1: return 'text-indigo-700';
            case 2: return 'text-amber-700';
            case 3: return 'text-blue-700';
            case 4: return 'text-purple-700';
            case 5: return 'text-slate-800';
            case 6: return 'text-red-600';
            default: return gender === 'female' ? 'text-pink-600' : 'text-cyan-700';
        }
    };

    const renderStep = () => {
        const accent = getAccentColor();

        switch (step) {
            case 0: // WELCOME (Big, Bottom)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-between text-center px-8 pt-16 relative">
                        {/* Text at top/center */}
                        <div className="z-10 bg-sky-50/80 p-4 rounded-3xl backdrop-blur-sm">
                            <SmoothText text={t('onboard_welcome') as string} className={`text-6xl font-bold font-outfit mb-6 ${accent}`} />
                            <SmoothText
                                delay={0.5}
                                text={t('onboard_welcome_sub') as string}
                                className="text-xl text-slate-600 font-medium leading-loose"
                            />
                            <SmoothText
                                delay={1.5}
                                text={t('onboard_welcome_sub2') as string}
                                className="text-lg text-slate-500 font-light mt-2"
                            />
                        </div>

                        {/* Animation at bottom, scaled up significantly to fill space */}
                        {/* TEACHING MOMENT: To position this, adjust 'bottom-0' (anchors to bottom) or 'translate-y' (moves up/down) */}
                        <motion.div
                            initial={{ y: 300, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute bottom-[0%] w-full left-0 right-0 flex justify-center items-end pointer-events-none"
                        >
                            {/* Using inline style to force size beyond 100% reliably. rendererSettings 'slice' forces it to zoom/crop. */}
                            <div className="h-auto max-w-none" style={{ width: '250%' }}>
                                <Lottie
                                    animationData={welcomeAnim}
                                    loop={true}
                                    className="w-full h-full"
                                    rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
                                />
                            </div>
                        </motion.div>
                    </div>
                );

            case 1: // PRAYER
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        <FloatingLottie animationData={prayerAnim} className="w-80 h-80 mb-12" delay={0.2} />
                        <SmoothText
                            text={t('onboard_prayer') as string}
                            className="text-2xl text-slate-700 font-light leading-loose max-w-md"
                        />
                    </div>
                );

            case 2: // QURAN
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        <FloatingLottie animationData={quranAnim} className="w-80 h-80 mb-12" delay={0.2} />
                        <SmoothText
                            text={t('onboard_quran') as string}
                            className="text-2xl text-slate-700 font-light leading-loose max-w-md"
                        />
                    </div>
                );

            case 3: // STUDY
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        <FloatingLottie animationData={studyAnim} className="w-80 h-80 mb-12" delay={0.2} />
                        <SmoothText
                            text={t('onboard_study') as string}
                            className="text-2xl text-slate-700 font-light leading-loose max-w-lg"
                        />
                    </div>
                );

            case 4: // FEATURES GRID
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
                        {/* Shiny Text */}
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-4xl font-bold mb-16 bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                        >
                            {t('onboard_features')}
                        </motion.h2>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-12 w-full max-w-md">
                            {/* Misbaha */}
                            <motion.div className="flex flex-col items-center gap-3">
                                <FloatingLottie animationData={tasbihAnim} className="w-28 h-28 bg-amber-100/50 rounded-[2rem] shadow-sm p-4 backdrop-blur-sm" delay={0.2} speed={3} />
                                <span className="text-slate-600 font-bold text-lg">{t('onboard_misbaha')}</span>
                            </motion.div>

                            {/* Knowledge - Bigger */}
                            <motion.div className="flex flex-col items-center gap-3 mt-8">
                                <FloatingLottie animationData={knowledgeAnim} className="w-36 h-36 bg-blue-100/50 rounded-[2rem] shadow-sm p-4 backdrop-blur-sm" delay={0.4} speed={4} scale={1.2} />
                                <span className="text-slate-600 font-bold text-lg">{t('onboard_knowledge')}</span>
                            </motion.div>

                            {/* Qibla Finder */}
                            <motion.div className="flex flex-col items-center gap-3 -mt-8">
                                <FloatingLottie animationData={compassAnim} className="w-28 h-28 bg-emerald-100/50 rounded-[2rem] shadow-sm p-4 backdrop-blur-sm" delay={0.6} speed={3.5} />
                                <span className="text-slate-600 font-bold text-lg">{t('qibla')}</span>
                            </motion.div>

                            {/* Sadaqa */}
                            <motion.div className="flex flex-col items-center gap-3">
                                <FloatingLottie animationData={charityAnim} className="w-28 h-28 bg-rose-100/50 rounded-[2rem] shadow-sm p-4 backdrop-blur-sm" delay={0.8} speed={4.5} />
                                <span className="text-slate-600 font-bold text-lg">{t('onboard_sadaqa')}</span>
                            </motion.div>
                        </div>
                    </div>
                );

            case 5: // AUTH GATE (New)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        <SmoothText text={t('onboard_auth_title') as string} className="text-4xl font-bold font-outfit text-slate-800 mb-4" />
                        <SmoothText text={t('onboard_auth_sub') as string} className="text-xl text-slate-500 font-light mb-12 max-w-sm mx-auto" delay={0.3} />

                        <div className="w-full max-w-sm space-y-4">
                            <button onClick={handleGoogleLogin} className="w-full py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-colors">
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                                <span className="font-bold text-slate-700">{t('auth_google')}</span>
                            </button>

                            <button onClick={() => setStep(6)} className="w-full py-4 rounded-2xl text-slate-400 font-medium hover:text-slate-600 transition-colors">
                                {t('skip_for_now')}
                            </button>
                        </div>
                    </div>
                );

            case 6: // GHOST WARNING (New)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        {/* New Ghost Animation */}
                        <FloatingLottie animationData={ghostAnim} className="w-64 h-64 mb-6" delay={0} speed={6} />

                        <SmoothText text={t('onboard_ghost_title') as string} className="text-4xl font-bold font-outfit text-slate-800 mb-4" />

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-10 max-w-sm mx-auto">
                            <p className="text-amber-800 font-medium mb-2">⚠️ {t('onboard_ghost_warning')}</p>
                            <p className="text-amber-700/80 text-sm">
                                {t('onboard_ghost_desc')}
                            </p>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                            <button onClick={() => setStep(5)} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200">
                                {t('onboard_ghost_signin')}
                            </button>
                            <button onClick={finish} className="w-full py-4 rounded-2xl text-slate-400 font-medium hover:text-slate-600 transition-colors">
                                {t('onboard_ghost_skip')}
                            </button>
                        </div>
                    </div>
                );

            case 7: // GENDER SELECTION (Previously 5)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
                        <SmoothText text={t('onboard_bracelet') as string} className="text-4xl font-bold font-outfit text-slate-800 mb-4" />
                        <SmoothText text={t('onboard_bracelet_sub') as string} className="text-xl text-slate-500 font-light mb-12 max-w-xs mx-auto" delay={0.5} />

                        <div className="flex flex-row gap-6 items-center justify-center">
                            {/* Smaller, safe from borders */}
                            <button onClick={() => { setGender('male'); next(); }} className="group flex flex-col items-center gap-6 transition-transform hover:scale-105 active:scale-95">
                                <FloatingLottie animationData={braceletBlueAnim} className="w-36 h-36 drop-shadow-md" delay={0.2} />
                                <span className="text-white bg-cyan-500 font-bold tracking-widest text-sm px-6 py-2 rounded-full shadow-lg shadow-cyan-200">{t('onboard_brother')}</span>
                            </button>

                            <button onClick={() => { setGender('female'); next(); }} className="group flex flex-col items-center gap-6 transition-transform hover:scale-105 active:scale-95">
                                <FloatingLottie animationData={braceletPinkAnim} className="w-36 h-36 drop-shadow-md" delay={0.4} />
                                <span className="text-white bg-pink-500 font-bold tracking-widest text-sm px-6 py-2 rounded-full shadow-lg shadow-pink-200">{t('onboard_sister')}</span>
                            </button>
                        </div>
                    </div>
                );

            case 8: // BRANCHED INTRO
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        {gender === 'female' ? (
                            <>
                                <FloatingLottie animationData={womanGesturesAnim} className="w-80 h-80 mb-8" delay={0.2} />
                                <SmoothText
                                    text={t('onboard_hi_sister') as string}
                                    className="text-3xl font-bold text-pink-600 mb-6"
                                />
                                <p className="text-slate-500 mb-8">{t('onboard_hi_sister_sub')}</p>
                            </>
                        ) : (
                            <>
                                <FloatingLottie animationData={manParkAnim} className="w-80 h-80 mb-8" delay={0.2} />
                                <SmoothText
                                    text={t('onboard_hi_brother') as string}
                                    className="text-3xl font-bold text-cyan-700 mb-6"
                                />
                                <p className="text-slate-500 mb-8">{t('onboard_hi_brother_sub')}</p>
                            </>
                        )}

                        {/* Clear continue button */}
                        <button
                            onClick={next}
                            className={`px-8 py-3 rounded-full font-bold text-white shadow-lg ${gender === 'female' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                        >
                            {t('onboard_continue_profile')}
                        </button>
                    </div>
                );

            case 9: // FORM (Info Request)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-start max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10 overflow-y-auto max-h-[90vh]">
                        <SmoothText text={t('onboard_tell_us') as string} className={`text-3xl font-bold mb-10 font-outfit ${accent}`} />

                        <div className="w-full space-y-6 pb-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder={t('onboard_first_name') as string} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current transition-colors shadow-sm" style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }} />
                                <input placeholder={t('onboard_last_name') as string} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current transition-colors shadow-sm" style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="number" min={5} max={120} placeholder={t('onboard_age') as string} value={formData.age} onChange={e => { const val = parseInt(e.target.value) || 0; setFormData({ ...formData, age: Math.min(120, Math.max(0, val)) }); }} className="bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current transition-colors shadow-sm" style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }} />
                                <input placeholder={t('onboard_nickname') as string} value={formData.nickname} onChange={e => setFormData({ ...formData, nickname: e.target.value })} className="bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current transition-colors shadow-sm" style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }} />
                            </div>

                            {/* Hobbies - Restored */}
                            <div>
                                <div className="flex gap-2 mb-2 items-stretch">
                                    <input
                                        placeholder={t('onboard_add_hobby') as string}
                                        value={hobbyInput}
                                        onChange={e => setHobbyInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addHobby()}
                                        className="flex-1 bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current shadow-sm"
                                        style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }}
                                    />
                                    <button onClick={addHobby} className={`w-14 h-14 flex-shrink-0 rounded-2xl font-bold text-white text-2xl flex items-center justify-center transition-colors ${gender === 'female' ? 'bg-pink-400 hover:bg-pink-500' : 'bg-cyan-500 hover:bg-cyan-600'}`}>+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.hobbies.map(h => (
                                        <span key={h} className="bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">{h}</span>
                                    ))}
                                </div>
                            </div>

                            {/* About Yourself */}
                            <div>
                                <label className="text-sm text-slate-500 mb-1 block">{t('onboard_about')}</label>
                                <textarea
                                    placeholder={t('onboard_about_placeholder') as string}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    maxLength={200}
                                    className="w-full bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current shadow-sm resize-none"
                                    style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }}
                                />
                                <p className="text-xs text-slate-400 text-right">{formData.bio.length}/200</p>
                            </div>

                            {/* Social Media (Private - Only visible to partner) */}
                            <div>
                                <label className="text-sm text-slate-500 mb-1 block">{t('onboard_social_label')} <span className="text-red-400">*</span> {t('onboard_social_required')}</label>
                                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                    <select
                                        value={socialInput.platform}
                                        onChange={e => setSocialInput({ ...socialInput, platform: e.target.value })}
                                        className="w-full sm:w-auto bg-white border-2 border-slate-100 text-slate-800 rounded-2xl p-4 outline-none focus:border-current shadow-sm"
                                        style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }}
                                    >
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Telegram">Telegram</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="X">X (Twitter)</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <input
                                        placeholder={t('onboard_social_placeholder') as string}
                                        value={socialInput.handle}
                                        onChange={e => setSocialInput({ ...socialInput, handle: e.target.value })}
                                        className="flex-1 bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current shadow-sm"
                                        style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }}
                                    />
                                    <button onClick={addSocialLink} className={`w-full sm:w-14 h-14 flex-shrink-0 rounded-2xl font-bold text-white text-2xl flex items-center justify-center transition-colors ${gender === 'female' ? 'bg-pink-400 hover:bg-pink-500' : 'bg-cyan-500 hover:bg-cyan-600'}`}>+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.socialLinks.map((s, i) => (
                                        <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm text-slate-600 border border-slate-200">{s.platform}: {s.handle}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Location - Restored */}
                            <div className="flex gap-2 items-stretch">
                                <input
                                    placeholder={t('onboard_city') as string}
                                    value={formData.location.city}
                                    onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                    className="flex-1 bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 rounded-2xl p-4 outline-none focus:border-current shadow-sm"
                                    style={{ borderColor: gender === 'female' ? '#fce7f3' : '#cffafe' }}
                                />
                                <button onClick={detectLocation} disabled={isDetectingLocation} className="bg-white border-2 border-slate-100 px-4 sm:px-5 rounded-2xl text-slate-400 hover:bg-slate-50 transition-colors">
                                    {isDetectingLocation ? <div className="animate-spin">↻</div> : <MapPin size={24} />}
                                </button>
                            </div>

                            <label className="flex items-center gap-3 mt-4 cursor-pointer group justify-center">
                                <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-200" />
                                <span className="text-slate-500 group-hover:text-slate-700">{t('onboard_terms')}</span>
                            </label>
                        </div>

                        <div className="w-full pt-12">
                            <button
                                onClick={next}
                                disabled={
                                    !formData.termsAccepted ||
                                    !formData.firstName.trim() ||
                                    !formData.lastName.trim() ||
                                    !formData.nickname.trim() ||
                                    !formData.age || formData.age < 5 || formData.age > 120 ||
                                    !formData.location.city.trim() ||
                                    formData.socialLinks.length < 1
                                }
                                className={`w-full py-4 rounded-2xl font-bold font-outfit text-white shadow-xl ${gender === 'female' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-cyan-600 hover:bg-cyan-700'} disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95`}
                            >
                                {t('continue_text')}
                            </button>
                            {(!formData.firstName.trim() || !formData.lastName.trim() || !formData.nickname.trim() || !formData.age || !formData.location.city.trim() || formData.socialLinks.length < 1) && (
                                <p className="text-xs text-red-400 text-center mt-2">{t('onboard_fill_required')}</p>
                            )}
                        </div>
                    </div>
                );

            case 10: // FINAL MESSAGE (Branched)
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />

                        {gender === 'female' ? (
                            <>
                                <FloatingLottie animationData={girlRecitingAnim} className="w-80 h-80 mb-8" delay={0.2} />
                                <SmoothText
                                    text={t('onboard_final_female') as string}
                                    className="text-2xl font-medium text-pink-700 leading-loose max-w-md"
                                />
                            </>
                        ) : (
                            <>
                                <FloatingLottie animationData={manTelescopeAnim} className="w-80 h-80 mb-8" delay={0.2} />
                                <SmoothText
                                    text={t('onboard_final_male') as string}
                                    className="text-2xl font-medium text-cyan-800 leading-loose max-w-md"
                                />
                            </>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2 }}
                            className="mt-12"
                        >
                            <button
                                onClick={finish}
                                className={`px-10 py-4 rounded-full font-bold shadow-xl text-white ${gender === 'female' ? 'bg-pink-500' : 'bg-emerald-600'} hover:scale-105 transition-transform`}
                            >
                                {t('onboard_start')}
                            </button>
                        </motion.div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <>
        <motion.div
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`fixed inset-0 z-[100] overflow-hidden transition-colors duration-[2000ms] ease-in-out ${getStepColor()}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>

            {/* Next Button (For non-form pages) */}
            {step < 5 && (
                <div className="absolute bottom-10 right-6 z-50">
                    <button onClick={next} className="p-4 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-md shadow-lg transition-all text-slate-700">
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {/* Back Button */}
            {step > 0 && step !== 10 && (
                <button
                    onClick={() => setStep(s => s - 1)}
                    className="absolute top-6 left-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors z-50"
                >
                    <ArrowRight className="rotate-180" size={24} />
                </button>
            )}

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                <motion.div
                    className={`h-full ${gender === 'female' ? 'bg-pink-400' : gender === 'male' ? 'bg-cyan-500' : 'bg-emerald-500'}`}
                    animate={{ width: `${((step + 1) / 11) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </motion.div>

        <AnimatePresence>
            {toast && <Toast {...toast} onDismiss={clearToast} />}
        </AnimatePresence>
        </>
    );
};
