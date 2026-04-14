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
            <div className="mb-6 rounded-2xl border border-brand-border bg-brand-surface/90 backdrop-blur-sm px-4 py-4 sm:px-5">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-brand-forest font-outfit">Community & Partners</h1>
                        <p className="text-sm text-brand-muted mt-1">Manage partner, family, and suhba connections in one place.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`p-2 rounded-xl transition-all relative border ${activeTab === 'requests' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' : 'bg-brand-surface text-brand-muted border-brand-border hover:bg-brand-subtle'}`}
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
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl font-bold hover:bg-brand-primary/20 transition-colors border border-brand-primary/20"
                    >
                        <QrCode size={20} />
                        <span className="hidden sm:inline">Scan / Code</span>
                    </button>
                </div>
            </div>
            </div>

            <div className="grid grid-cols-3 p-1 bg-brand-subtle rounded-2xl w-full md:w-fit mb-8 relative border border-brand-border">
                {(['duo', 'family', 'suhba'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 
                                ${isActive
                                    ? 'bg-brand-primary text-white shadow-md'
                                    : 'text-brand-muted hover:text-brand-forest hover:bg-brand-surface'}`}
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
