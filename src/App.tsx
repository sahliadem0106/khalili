
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { PrayerCard } from './components/PrayerCard';
import { QuickActions } from './components/QuickActions';
import { PrayerList } from './components/PrayerList';
import { AnalyticsPage } from './components/AnalyticsPage';
import { BottomNav } from './components/BottomNav';
import { TasbihPage } from './components/TasbihPage';
import { QiblaFinder } from './components/QiblaFinder';
import { QadaTracker } from './components/QadaTracker';
import { LecturesPage } from './components/LecturesPage';
import { ProfilePage } from './components/ProfilePage';
import { DailyDuaWidget } from './components/DailyDuaWidget';
import { PrayerDetailModal } from './components/PrayerDetailModal';
import { PartnersPage } from './pages/PartnersPage';
import { DuaPage } from './components/DuaPage';
import { QuranReader } from './components/QuranReader';
import { GuidedTour, TourStep } from './components/GuidedTour';

import { NotificationPermission } from './components/NotificationPermission';
import { StudySpacePage } from './components/StudySpacePage';
import { HabitTrackerPage } from './components/HabitTrackerPage';
import { ContentHubPage } from './components/ContentHubPage';
import { ZakatCalculator } from './components/ZakatCalculator';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { INITIAL_PRAYERS } from './constants';
import { Prayer, PrayerStatus, ActionId, HeartCondition, User } from './types';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useQada } from './hooks/useQada';
import { useAuth } from './hooks/useAuth';
import { getDoc, doc, getDocFromServer } from 'firebase/firestore';
import { db } from './services/firebase';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useSyncManager } from './hooks/useSyncManager';
import { localStorageService } from './services/LocalStorageService';
import { dataSyncService } from './services/DataSyncService';
import { onboardingService } from './services/OnboardingService';
import { authService } from './services/AuthService';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AnimatePresence, motion } from 'framer-motion';
import { AdhanProvider, useAdhan } from './contexts/AdhanContext';
import { AdhanManager } from './components/AdhanManager';
import { AdhanOverlay } from './components/AdhanOverlay';
import { PartnerService } from './services/PartnerService';
import { BadgeToastProvider } from './components/BadgeToastProvider';
import { socialNotificationScheduler } from './services/SocialNotificationScheduler';
import { socialNotificationMigrationService } from './services/SocialNotificationMigrationService';

// User data from localStorage instead of mock
const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('khalil_user');
    if (saved) return JSON.parse(saved);
  } catch (e) { }
  return {
    name: 'Guest',
    avatar: '',
    streak: 0,
    level: 1,
    currentHeartState: 'mindful' as HeartCondition,
  };
};

const AppContent: React.FC = () => {
  // Auth for Firebase user ID
  const { user: firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // State management - Use unified LocalStorageService
  const [prayers, setPrayers] = useState<Prayer[]>(() => {
    const stored = localStorageService.getPrayers();
    return stored.length > 0 ? stored : INITIAL_PRAYERS;
  });

  const [user, setUser] = useState<User>(() => {
    const stored = localStorageService.getUser();
    return {
      ...stored,
      location: stored.location || '',
      hijriDate: stored.hijriDate || '',
    };
  });

  useEffect(() => {
    if (!firebaseUser) return;
    const genderFallbackAvatar =
      firebaseUser.gender === 'female'
        ? '/womenicon.png'
        : firebaseUser.gender === 'male'
          ? '/manicon.png'
          : '';
    setUser(prev => ({
      ...prev,
      name: prev.name || firebaseUser.displayName || 'User',
      avatar: prev.avatar || genderFallbackAvatar || firebaseUser.photoURL || '',
    }));
  }, [firebaseUser?.uid, firebaseUser?.displayName, firebaseUser?.photoURL]);

  const { state: adhanState, dismissAdhan, triggerTestAdhan } = useAdhan();

  // Sync manager for offline-first operation
  const { syncState, syncToCloud, isAuthenticated: syncAuthenticated } = useSyncManager();

  // Persist user data to unified storage
  useEffect(() => {
    localStorageService.setUser(user);
  }, [user]);

  // Handler for Adhan reminder
  const handleAdhanRemind = async (target: 'partner' | 'family' | 'circle') => {
    dismissAdhan(); // Close immediately for better UX

    // Must be authenticated to send real reminders
    const currentUserId = firebaseUser?.uid;
    if (!currentUserId) {
      console.log(`[App] User not authenticated. Simulating reminder to ${target}.`);
      return;
    }

    let recipientIds: string[] = [];

    if (target === 'partner') {
      try {
        const partnership = await PartnerService.getActivePartnership(currentUserId);
        if (partnership) {
          const partnerId = partnership.users.find((u: string) => u !== currentUserId);
          if (partnerId) recipientIds.push(partnerId);
        }
      } catch (e) {
        console.error("[App] Failed to fetch partner:", e);
      }
    } else {
      // Family or Circle lookup
      try {
        const typeMapping = target === 'family' ? 'family' : 'suhba';
        const group = await PartnerService.getUserGroup(currentUserId, typeMapping) as any;
        if (group && group.members) {
            // Remove the current user from the blast
            recipientIds = group.members.filter((id: string) => id !== currentUserId);
        }
      } catch (e) {
         console.error(`[App] Failed to fetch ${target} group:`, e);
      }
    }

    if (recipientIds.length > 0) {
      await PartnerService.sendAdhanReminder(currentUserId, recipientIds, adhanState.prayerName);
      console.log(`[App] Reminder sent to ${recipientIds.length} recipients in ${target}.`);
    } else {
      console.log(`[App] No active ${target} members found to send reminder.`);
    }

    // Redirect to relevant section
    const section = target === 'partner' ? 'duo' : target === 'family' ? 'family' : 'suhba';
    setPartnersSection(section);
    setActiveTab('partners');
  };

  // UI State

  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Debounced sync ref for batching prayer updates
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  // Initialize onboarding state based on saved progress
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const data = onboardingService.getOnboardingData();
    // If fully completed AND profile is complete, don't show onboarding
    if (data?.completed && onboardingService.isProfileComplete()) return false;
    // Otherwise show (new user, incomplete onboarding, or incomplete profile)
    return true;
  });

  // Determine initial step for returning users
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const data = onboardingService.getOnboardingData();
    // If profile completed but missing required fields, restart at gender step
    if (data?.completed && !onboardingService.isProfileComplete()) {
      return 7; // Gender selection step
    }
    // If Google is linked but no gender selected, start at gender step (7)
    if (data?.isGoogleLinked && !data?.gender) {
      return 7;
    }
    // If gender selected but form not completed, start at form (9)
    if (data?.gender && !data?.completed) {
      return 9;
    }
    // New user - start from beginning
    return 0;
  });

  const [partnersSection, setPartnersSection] = useState<'duo' | 'family' | 'suhba' | 'requests'>('duo');

  const [showSetup, setShowSetup] = useState(false);

  // Persistence Hooks
  const { stats: qadaStats, recordMissed, recordMadeUp, undoMissed, undoMadeUp } = useQada();

  // Firebase Authentication (uses firebaseUser and isAuthenticated from line 60)

  // Sync user ID to services when authenticated
  // Sync user ID to services when authenticated
  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated || !firebaseUser) return;

    try {
      // Force server fetch to bypass stale cache from Guest mode
      const snap = await getDocFromServer(doc(db, 'users', firebaseUser.uid));

      if (snap.exists()) {
        const data = snap.data();
        console.log('[App Debug] Firestore User Data:', data);

        // STRICT SYNC: If Firestore has data, it is the source of truth.
        // If data.gender is missing, it means the profile is incomplete on the server.
        const remoteGender = data.gender; // May be null
        const isRemoteProfileComplete = !!remoteGender;

        const fullNameFromForm = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const resolvedName =
          fullNameFromForm ||
          data.displayName ||
          data.nickname ||
          firebaseUser.displayName ||
          'User';
        const genderFallbackAvatar =
          data.gender === 'female'
            ? '/womenicon.png'
            : data.gender === 'male'
              ? '/manicon.png'
              : '';

        setUser(prev => ({
          ...prev,
          name: resolvedName,
          avatar: data.photoURL || genderFallbackAvatar || firebaseUser.photoURL || '',
          streak: data.streak || firebaseUser.stats?.currentStreak || 0,
          level: data.level || 1,
          gender: remoteGender || prev.gender, // We still populate 'user' state nicely for UI
          currentHeartState: data.currentHeartState || prev.currentHeartState,
          location: data.location || prev.location,
        }));

        // CRITICAL CHECK: If remote profile is incomplete (no gender), FORCE onboarding
        // BUT: Respect ghost mode - if user already completed onboarding locally, don't force them back
        const localOnboardingComplete = onboardingService.isOnboardingComplete();
        if (!isRemoteProfileComplete && !localOnboardingComplete) {
          console.log('[App] Remote profile incomplete (no gender) AND local not complete. Forcing onboarding.');
          onboardingService.resetProfileCompletion();
          setShowOnboarding(true);
          setOnboardingStep(7); // Jump to Gender selection
        } else if (!isRemoteProfileComplete && localOnboardingComplete) {
          console.log('[App] Remote profile incomplete but local onboarding complete (ghost mode). Respecting local state.');
        }
      } else {
        console.warn('[App] User authenticated but no Firestore profile found. Treating as new user.');
        // If no profile exists, we MUST show onboarding
        onboardingService.resetProfileCompletion();
        setShowOnboarding(true);
        setOnboardingStep(7);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Don't update user state on error to prevent flickering
    }
  }, [isAuthenticated, firebaseUser, user.gender]);

  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      dataSyncService.setUserId(firebaseUser.uid);
      fetchUserData();
      (async () => {
        await socialNotificationMigrationService.migrateLegacyNotifications(firebaseUser.uid);
        socialNotificationScheduler.startAutoRefresh(firebaseUser.uid);
      })().catch(console.error);

      // Register for push notifications (async, non-blocking)
      import('./services/PushNotificationService').then(({ pushNotificationService }) => {
        pushNotificationService.register(firebaseUser.uid).catch(console.error);
      });
    } else {
      dataSyncService.setUserId(null);
      socialNotificationScheduler.stopAutoRefresh();
      socialNotificationScheduler.clearAllScheduled().catch(console.error);
    }
  }, [isAuthenticated, firebaseUser, fetchUserData]);

  // Comprehensive profile data checker - runs on app load and auth state changes
  // This ensures no user slips through without completing their profile
  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    const checkProfileCompleteness = async () => {
      const isComplete = onboardingService.isOnboardingComplete();
      const localProfileComplete = onboardingService.isProfileComplete();
      const hasGender = !!onboardingService.getGender();

      // Guard: Don't interfere if user is already in the middle of onboarding
      // (e.g., they just signed in with Google at step 5 and should continue to step 7)
      if (showOnboarding && onboardingStep > 0) {
        console.log('[ProfileChecker] Skipping - already in active onboarding at step', onboardingStep);
        return;
      }

      // Case 1: First time user - show full onboarding
      if (!isComplete) {
        console.log('[ProfileChecker] New user - starting onboarding');
        setShowOnboarding(true);
        setOnboardingStep(0);
        return;
      }

      // Case 2: For authenticated users, also check Firestore for complete data
      if (isAuthenticated && firebaseUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const firestoreData = userDoc.exists() ? userDoc.data() : null;

          // Check both local and Firestore for required fields
          const hasFirestoreGender = !!firestoreData?.gender;
          const hasFirestoreFirstName = !!firestoreData?.firstName?.trim();
          const hasFirestoreLastName = !!firestoreData?.lastName?.trim();
          const hasFirestoreNickname = !!firestoreData?.nickname?.trim();
          const hasFirestoreAge = !!(firestoreData?.age && firestoreData.age > 0);
          const hasFirestoreLocation = !!(firestoreData?.location?.trim() || firestoreData?.city?.trim());
          const hasFirestoreSocialLinks = !!(firestoreData?.socialLinks && firestoreData.socialLinks.length > 0);

          const firestoreComplete = hasFirestoreGender && hasFirestoreFirstName && hasFirestoreLastName &&
            hasFirestoreNickname && hasFirestoreAge && hasFirestoreLocation && hasFirestoreSocialLinks;

          console.log('[ProfileChecker] Validation results:', {
            uid: firebaseUser.uid,
            localComplete: localProfileComplete,
            firestoreComplete,
            hasGender: hasGender || hasFirestoreGender,
            details: {
              gender: firestoreData?.gender,
              firstName: firestoreData?.firstName,
              lastName: firestoreData?.lastName,
              nickname: firestoreData?.nickname,
              age: firestoreData?.age,
              location: firestoreData?.location,
              socialLinks: firestoreData?.socialLinks?.length || 0
            }
          });

          // If either local OR Firestore is incomplete, trigger onboarding
          if (!localProfileComplete || !firestoreComplete) {
            const genderExists = hasGender || hasFirestoreGender;
            setShowOnboarding(true);
            setOnboardingStep(genderExists ? 9 : 7); // Go to form if gender exists, else gender step
            return;
          }
        } catch (error) {
          console.error('[ProfileChecker] Error checking Firestore:', error);
          // On error, fall back to local check only
          if (!localProfileComplete) {
            setShowOnboarding(true);
            setOnboardingStep(hasGender ? 9 : 7);
            return;
          }
        }
      }
      // Case 3: Not authenticated - check local profile only
      else if (!localProfileComplete) {
        console.log('[ProfileChecker] Local profile incomplete for guest user');
        setShowOnboarding(true);
        setOnboardingStep(hasGender ? 9 : 7);
        return;
      }

      console.log('[ProfileChecker] Profile complete - no action needed');
    };

    checkProfileCompleteness();
  }, [isAuthenticated, authLoading, firebaseUser?.uid]);

  const { t, dir } = useLanguage();

  // Swipe Navigation Refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchEndRef = useRef<{ x: number, y: number } | null>(null);
  const MAIN_TABS = ['home', 'partners', 'quran', 'stats', 'profile']; // Removed 'lectures' from main nav flow if handled elsewhere, or keep if consistent

  // References for scrolling
  const qadaRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Reset scroll on tab change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Persistence - Save prayers to unified storage
  useEffect(() => {
    localStorageService.setPrayers(prayers);
  }, [prayers]);

  // Handlers
  const updatePrayer = (id: string, updates: Partial<Prayer>) => {
    const prayer = prayers.find(p => p.id === id);
    if (prayer && updates.status && updates.status !== prayer.status) {
      const oldStatus = prayer.status;
      const newStatus = updates.status;

      if (newStatus === PrayerStatus.Missed) {
        recordMissed();
      } else if (newStatus === PrayerStatus.QadaDone) {
        recordMadeUp();
      }

      if (oldStatus === PrayerStatus.Missed && newStatus !== PrayerStatus.Missed && newStatus !== PrayerStatus.QadaDone) {
        undoMissed();
      }
      if (oldStatus === PrayerStatus.QadaDone && newStatus !== PrayerStatus.QadaDone) {
        undoMadeUp();
      }
    }

    setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    // Debounced sync: batch updates instead of syncing after each change
    if (isAuthenticated) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        const updatedPrayers = prayers.map(p => p.id === id ? { ...p, ...updates } : p);
        dataSyncService.syncToCloud(updatedPrayers).catch(err => {
          console.error('Failed to sync prayer to cloud:', err);
        });
      }, 30000); // Sync after 30s of no changes (batches multiple updates)
    }
  };

  const handleHeartStateSelect = (state: HeartCondition) => {
    setUser({ ...user, currentHeartState: state });
  };

  const handleTabChange = (newTab: string) => {
    const currentIndex = MAIN_TABS.indexOf(activeTab);
    const newIndex = MAIN_TABS.indexOf(newTab);

    // If tabs are in main list, determine direction
    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    } else {
      setDirection(0); // Default or transition from sub-page
    }
    setActiveTab(newTab);
  };

  const handleQuickAction = (id: ActionId) => {
    switch (id) {
      case 'tasbih': handleTabChange('tasbih'); break;
      case 'qibla': setIsQiblaOpen(true); break;
      case 'dua': handleTabChange('dua'); break;
      case 'partners': handleTabChange('partners'); break;
      case 'qada':
        if (activeTab === 'home') {
          qadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setActiveTab('home');
          setTimeout(() => qadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
        break;
      case 'settings': handleTabChange('profile'); break;
      case 'goals': handleTabChange('stats'); break;
      case 'lectures': handleTabChange('quran'); break; // Mapping lectures to quran tab for now or create new
      case 'study': handleTabChange('study'); break;
      case 'habits': handleTabChange('habits'); break;
      case 'content': handleTabChange('content'); break;
      case 'zakat': handleTabChange('zakat'); break;
      default: break;
    }
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    const minDistance = 50;

    if (isHorizontal && Math.abs(distanceX) > minDistance) {
      // Logic for Main Tabs Swipe
      const currentIndex = MAIN_TABS.indexOf(activeTab);

      // If we are on a Sub-Page (not in MAIN_TABS), swipe right (distanceX < 0) should go back
      if (currentIndex === -1) {
        if (distanceX < 0) { // Swipe Right -> Back
          handleTabChange('home');
        }
        return;
      }

      // Normal Tab Navigation
      const isLeftSwipe = distanceX > 0;
      const isRightSwipe = distanceX < 0;

      if (dir === 'rtl') {
        // RTL Logic inverted
        if (isRightSwipe && currentIndex < MAIN_TABS.length - 1) {
          handleTabChange(MAIN_TABS[currentIndex + 1]);
        } else if (isLeftSwipe && currentIndex > 0) {
          handleTabChange(MAIN_TABS[currentIndex - 1]);
        }
      } else {
        if (isLeftSwipe && currentIndex < MAIN_TABS.length - 1) {
          handleTabChange(MAIN_TABS[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
          handleTabChange(MAIN_TABS[currentIndex - 1]);
        }
      }
    }
  };

  // TOUR CONFIGURATION
  const currentTourSteps: TourStep[] = useMemo(() => {
    // ... (Keep existing tour config logic)
    const tours: Record<string, TourStep[]> = {
      'home': [
        { targetId: 'app-header', title: t('tour_home_profile_title'), content: t('tour_home_profile_content') },
        { targetId: 'hero-section', title: t('tour_home_hero_title'), content: t('tour_home_hero_content') },
        { targetId: 'next-prayer-card', title: t('tour_home_next_title'), content: t('tour_home_next_content') },
        { targetId: 'quick-actions', title: t('tour_home_quick_title'), content: t('tour_home_quick_content') },
        { targetId: 'prayer-list', title: t('tour_home_list_title'), content: t('tour_home_list_content') },
        { targetId: 'bottom-nav', title: t('tour_home_nav_title'), content: t('tour_home_nav_content') },
      ],
      'dua': [
        { targetId: 'dua-search', title: t('tour_dua_search_title'), content: t('tour_dua_search_content') },
        { targetId: 'dua-category-first', title: t('tour_dua_cat_title'), content: t('tour_dua_cat_content') },
      ],
      'partners': [
        { targetId: 'partner-add-btn', title: t('tour_partners_add_title'), content: t('tour_partners_add_content') },
        { targetId: 'partner-groups', title: t('tour_partners_group_title'), content: t('tour_partners_group_content') },
      ],
      'stats': [
        { targetId: 'analytics-streak', title: t('tour_stats_streak_title'), content: t('tour_stats_streak_content') },
        { targetId: 'analytics-weakness', title: t('tour_stats_insights_title'), content: t('tour_stats_insights_content') },
      ],
      'lectures': [
        { targetId: 'lectures-featured', title: t('tour_lectures_featured_title'), content: t('tour_lectures_featured_content') },
        { targetId: 'lecture-card-first', title: t('tour_lectures_lib_title'), content: t('tour_lectures_lib_content') },
      ],
      'profile': [
        { targetId: 'profile-user-card', title: t('tour_profile_id_title'), content: t('tour_profile_id_content') },
        { targetId: 'profile-settings-first', title: t('tour_profile_settings_title'), content: t('tour_profile_settings_content') },
      ]
    };
    return tours[activeTab] || [];
  }, [activeTab, t]);

  // Page Transitions Variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case 'dua': content = <DuaPage onBack={() => setActiveTab('home')} onHelp={() => setIsTourOpen(true)} />; break;
      case 'quran': content = <QuranReader />; break;
      case 'partners': content = <PartnersPage initialSection={partnersSection} />; break;
      case 'tasbih': content = <TasbihPage onBack={() => setActiveTab('home')} />; break;
      case 'lectures': content = <LecturesPage />; break;
      case 'profile': content = <ProfilePage user={user} onTestAdhan={triggerTestAdhan} onRequestOnboarding={() => { setShowOnboarding(true); setOnboardingStep(7); }} />; break;
      case 'stats': content = <AnalyticsPage prayers={prayers} />; break;
      case 'study': content = <StudySpacePage onBack={() => setActiveTab('home')} />; break;
      case 'habits': content = <HabitTrackerPage onBack={() => setActiveTab('home')} />; break;
      case 'content': content = <ContentHubPage onBack={() => setActiveTab('home')} />; break;
      case 'zakat': content = <div className="flex flex-col animate-in fade-in"><button onClick={() => setActiveTab('home')} className="self-start mb-4 p-2 bg-neutral-100 rounded-full dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600 dark:text-neutral-400"><path d="m15 18-6-6 6-6"/></svg></button><ZakatCalculator /></div>; break;
      case 'home':
      default:
        content = (
          <div className="space-y-6 px-5 md:px-8 pt-4 pb-20">
            <PrayerCard prayerData={prayerData} />
            <DailyDuaWidget />
            <QuickActions onActionClick={handleQuickAction} />
            <PrayerList
              prayers={prayers}
              onPrayerClick={(p) => setSelectedPrayer(p)}
            />
            <div ref={qadaRef}>
              <QadaTracker stats={qadaStats} />
            </div>
          </div>
        );
    }
    return content;
  };

  // Sync user location from prayerData
  const prayerData = usePrayerTimes();
  useEffect(() => {
    if (prayerData.location) {
      const parts = [prayerData.location.city, prayerData.location.country].filter(Boolean);
      const locationString = parts.join(', ');

      // Only update if changed to avoid loops and only if we have a valid string
      if (locationString && user.location !== locationString) {
        setUser(prev => ({ ...prev, location: locationString }));
      }
    }
  }, [prayerData.location]);

  return (
    <div
      className="min-h-screen bg-brand-background bg-gradient-mesh font-sans text-brand-forest overflow-hidden flex flex-col"
      dir={dir}
    >
      <AdhanManager />
      <AdhanOverlay
        isOpen={adhanState.isActive}
        prayerName={adhanState.prayerName}
        prayerNameAr={adhanState.prayerNameAr}
        shouldPlaySound={adhanState.shouldPlaySound}
        onClose={() => { dismissAdhan(); setActiveTab('home'); }}
        onRemind={handleAdhanRemind}
      />
      {/* Splash Screen Layer */}


      {/* OnboardingFlow - Shows after splash for first-time users or after auth */}
      <AnimatePresence mode="wait">
        {showOnboarding && (
          <OnboardingFlow
            onComplete={() => {
              setShowOnboarding(false);
              fetchUserData();
            }}
            initialStep={onboardingStep}
          />
        )}
        {!showOnboarding && showSetup && (
          <OnboardingFlow
            initialStep={7}
            onComplete={() => {
              setShowSetup(false);
              // Force reload user to pick up new gender/profile
              const updated = localStorageService.getUser();
              setUser(prev => ({ ...prev, ...updated }));

              // CRITICAL: Fetch from Firestore to ensure we have the full profile (including what was just saved)
              fetchUserData();
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full h-[100dvh] relative bg-brand-surface/90 backdrop-blur-2xl overflow-hidden flex flex-col mx-auto max-w-xl border-x border-brand-border/50 shadow-2xl">

        {/* Header Area - Only on Home */}
        {activeTab === 'home' && (
          <div className="px-5 md:px-8 pt-safe-top z-20 sticky top-0 bg-brand-surface/95 backdrop-blur-xl border-b border-brand-border/50 transition-all duration-300">
            <div className="min-h-[60px] flex items-center">
              <div className="w-full pb-2">
                <Header
                  user={user}
                  locationName={prayerData.location?.city}
                  onRefreshLocation={prayerData.refreshLocation}
                  isLocationLoading={prayerData.locationLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <main ref={mainRef} className="flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth relative px-0">
          {/* Swipeable Container */}
          <motion.div
            key={activeTab}
            drag={MAIN_TABS.includes(activeTab) ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={MAIN_TABS.includes(activeTab) ? (e, { offset, velocity }) => {
              const swipeThreshold = 50;
              const currentIndex = MAIN_TABS.indexOf(activeTab);

              const isLTR = dir === 'ltr';
              const isNextSwipe = isLTR ? offset.x < -swipeThreshold : offset.x > swipeThreshold;
              const isPrevSwipe = isLTR ? offset.x > swipeThreshold : offset.x < -swipeThreshold;

              if (isNextSwipe && currentIndex < MAIN_TABS.length - 1) {
                handleTabChange(MAIN_TABS[currentIndex + 1]);
              } else if (isPrevSwipe && currentIndex > 0) {
                handleTabChange(MAIN_TABS[currentIndex - 1]);
              }
            } : undefined}
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Global Floating Help Button */}
        {/* Global Floating Help Button Removed */}
        {/*
        {activeTab !== 'quran' && (
          <button
            onClick={() => setIsTourOpen(true)}
            className="fixed bottom-24 right-5 z-40 w-12 h-12 rounded-full bg-brand-secondary text-white shadow-lg shadow-brand-secondary/30 flex items-center justify-center hover:scale-105 active:scale-90 transition-all rtl:right-auto rtl:left-5"
            aria-label="Start Tour"
          >
            <Sparkles size={22} />
          </button>
        )}
        */}


        <QiblaFinder isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />

        <PrayerDetailModal
          isOpen={!!selectedPrayer}
          prayer={selectedPrayer}
          onClose={() => setSelectedPrayer(null)}
          onSave={updatePrayer}
        />

        <GuidedTour
          isOpen={isTourOpen}
          steps={currentTourSteps}
          onClose={() => setIsTourOpen(false)}
        />

        {showNotificationPrompt && (
          <NotificationPermission onComplete={() => setShowNotificationPrompt(false)} />
        )}

      </div>
    </div>
  );
};

import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdhanProvider>
          <BadgeToastProvider />
          <AppContent />
        </AdhanProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
