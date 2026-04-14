import React, { useState, useEffect } from 'react';
import { LostLambMarketplace } from '../components/partners/LostLambMarketplace';
import { FamilyDashboard } from '../components/family/FamilyDashboard';
import { PartnerConnect } from '../components/partners/PartnerConnect';
import { RequestsCenter, useRequestCount } from '../components/partners/RequestsCenter';
import { DuoDashboard } from '../components/partners/DuoDashboard';
import { PartnerService } from '../services/PartnerService';
import { Partnership } from '../types/partner';
import { useAuth } from '../hooks/useAuth';
import { SuhbaDashboard } from '../components/suhba/SuhbaDashboard';
import { Users, Heart, Home, QrCode, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PartnersPageProps {
    initialSection?: 'duo' | 'family' | 'suhba' | 'requests';
    onGlobalNavigate?: (tab: string) => void;
}

export const PartnersPage: React.FC<PartnersPageProps> = ({ initialSection = 'duo', onGlobalNavigate }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'duo' | 'family' | 'suhba' | 'requests'>(initialSection);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [activePartnership, setActivePartnership] = useState<Partnership | null>(null);
    const [loading, setLoading] = useState(true);
    const requestCount = useRequestCount();

    // Sync with external navigation
    useEffect(() => {
        if (initialSection) setActiveTab(initialSection);
    }, [initialSection]);

    useEffect(() => {
        if (user) {
            checkPartnership();
        }
    }, [user]);

    const checkPartnership = async () => {
        if (!user) return;
        try {
            const p = await PartnerService.getActivePartnership(user.uid);
            setActivePartnership(p);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-[85rem] mx-auto pb-28 pt-8 overflow-hidden">
            {/* Top Zone: Global Swiping (Home & Quran) */}
            <motion.div 
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                    const swipeThreshold = 50;
                    const isLTR = document.documentElement.dir !== 'rtl';
                    const isNextSwipe = isLTR ? offset.x < -swipeThreshold : offset.x > swipeThreshold;
                    const isPrevSwipe = isLTR ? offset.x > swipeThreshold : offset.x < -swipeThreshold;
                    
                    if (isNextSwipe) {
                        onGlobalNavigate?.('quran');
                    } else if (isPrevSwipe) {
                        onGlobalNavigate?.('home');
                    }
                }}
                className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 cursor-grab active:cursor-grabbing"
            >
                <div className="pointer-events-none">
                    <h1 className="text-4xl sm:text-5xl font-black text-brand-forest font-outfit tracking-tight mb-2">Community & Partners</h1>
                    <p className="text-base text-brand-muted font-medium">Manage partner, family, and suhba connections in one place.</p>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[180px]">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`w-full flex items-center justify-center gap-2 p-3 sm:py-3.5 rounded-2xl transition-all relative font-bold text-sm border ${activeTab === 'requests' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' : 'bg-brand-surface text-brand-forest border-black/5 hover:bg-brand-subtle shadow-sm'}`}
                    >
                        <Inbox size={20} />
                        Inbox
                        {/* Red notification badge */}
                        {requestCount > 0 && (
                            <span className="absolute top-2 right-2 min-w-[20px] h-[20px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in">
                                {requestCount > 9 ? '9+' : requestCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white px-5 py-3 sm:py-3.5 rounded-2xl font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 text-sm"
                    >
                        <QrCode size={20} />
                        <span>Scan / Code</span>
                    </button>
                </div>
            </motion.div>

            {/* Bottom Zone: Local Tab Swiping */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                    const swipeThreshold = 50;
                    const TABS = ['duo', 'family', 'suhba'] as const;
                    const currentIndex = TABS.indexOf(activeTab as any);
                    
                    // Do not allow swiping out of the Inbox/Requests view easily
                    if (currentIndex === -1) return;

                    const isLTR = document.documentElement.dir !== 'rtl';
                    const isNextSwipe = isLTR ? offset.x < -swipeThreshold : offset.x > swipeThreshold;
                    const isPrevSwipe = isLTR ? offset.x > swipeThreshold : offset.x < -swipeThreshold;

                    if (isNextSwipe && currentIndex < TABS.length - 1) {
                         setActiveTab(TABS[currentIndex + 1]);
                    } else if (isPrevSwipe && currentIndex > 0) {
                         setActiveTab(TABS[currentIndex - 1]);
                    }
                }}
                className="w-full flex-1 cursor-grab active:cursor-grabbing"
            >
                <div className="flex bg-brand-subtle rounded-3xl w-full md:w-fit mb-10 relative border border-black/5 shadow-inner p-1">
                {(['duo', 'family', 'suhba'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-[1_0_0] md:flex-none relative z-10 px-4 sm:px-8 py-3 rounded-3xl text-sm font-bold transition-colors flex items-center justify-center gap-2 
                                ${isActive ? 'text-white' : 'text-brand-muted hover:text-brand-forest hover:bg-black/5'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="partner-tab-indicator"
                                    className="absolute inset-0 bg-brand-primary rounded-3xl -z-10 shadow-md"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            {tab === 'duo' && <Heart size={16} className={isActive ? 'fill-current' : ''} />}
                            {tab === 'family' && <Home size={16} className={isActive ? 'fill-current' : ''} />}
                            {tab === 'suhba' && <Users size={16} className={isActive ? 'fill-current' : ''} />}
                            {tab === 'duo' ? (activePartnership ? 'My Partner' : 'Find Partner') : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'requests' && (
                        <RequestsCenter onRequestProcessed={() => {
                            checkPartnership(); // Refresh status on accept
                            setActiveTab('duo'); // Switch to duo tab to show the new partnership
                        }} />
                    )}

                    {activeTab === 'duo' && (
                        activePartnership ? (
                            <DuoDashboard partnership={activePartnership} />
                        ) : (
                            <LostLambMarketplace />
                        )
                    )}

                    {activeTab === 'family' && <FamilyDashboard />}

                    {activeTab === 'suhba' && <SuhbaDashboard />}
                </motion.div>
            </AnimatePresence>
            </motion.div>

            {showConnectModal && <PartnerConnect onClose={() => setShowConnectModal(false)} />}
        </div>
    );
};
