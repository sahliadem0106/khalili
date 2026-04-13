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
}

export const PartnersPage: React.FC<PartnersPageProps> = ({ initialSection = 'duo' }) => {
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
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-outfit">Community & Partners</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`p-2 rounded-xl transition-all relative ${activeTab === 'requests' ? 'bg-emerald-100 text-emerald-700' : 'bg-white dark:bg-emerald-900/50 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-emerald-800'}`}
                    >
                        <Inbox size={20} />
                        {/* Red notification badge */}
                        {requestCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in">
                                {requestCount > 9 ? '9+' : requestCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold hover:bg-emerald-200 transition-colors"
                    >
                        <QrCode size={20} />
                        <span className="hidden sm:inline">Scan / Code</span>
                    </button>
                </div>
            </div>

            <div className="flex p-1 bg-gray-100/80 dark:bg-emerald-900/30 rounded-2xl w-full md:w-fit mb-8 relative">
                {['duo', 'family', 'suhba'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 
                                ${isActive
                                    ? 'bg-brand-primary text-white shadow-md transform scale-105'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'}`}
                        >
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

            {showConnectModal && <PartnerConnect onClose={() => setShowConnectModal(false)} />}
        </div>
    );
};
