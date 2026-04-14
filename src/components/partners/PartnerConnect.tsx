
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Copy, Check, Camera, Share2 } from 'lucide-react';
import { PartnerService } from '../../services/PartnerService';
import { useAuth } from '../../hooks/useAuth';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface PartnerConnectProps {
    onClose: () => void;
}

export const PartnerConnect: React.FC<PartnerConnectProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'my-code' | 'scan'>('my-code');
    const [copied, setCopied] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const { toast, showToast, clearToast } = useToast();

    // Clean up scanner on unmount or tab change
    const [manualId, setManualId] = useState('');

    // Clean up scanner on unmount or tab change
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'scan' && !scanResult) {
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    false
                );
                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        handleScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // console.log(errorMessage); 
                    }
                );
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, scanResult]);

    const handleScanSuccess = async (decodedText: string) => {
        if (scannerRef.current) {
            await scannerRef.current.clear();
        }

        // Supports: 
        // 1. Raw ID
        // 2. Custom Scheme: khalil:partner:ID
        // 3. URL: https://app.khalil.com/partner/ID

        let userId = decodedText;
        if (decodedText.startsWith('khalil:partner:')) {
            userId = decodedText.replace('khalil:partner:', '');
        } else if (decodedText.includes('/partner/')) {
            userId = decodedText.split('/partner/')[1];
        }

        setScanResult(userId);
    };

    const handleSendRequest = async (targetId?: string) => {
        const idToSend = targetId || scanResult;
        if (!user || !idToSend) return;
        try {
            await PartnerService.sendRequest(user.uid, idToSend);
            showToast('Partner request sent successfully!', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to send request.', 'error');
        }
    };

    const copyToClipboard = () => {
        if (user) {
            navigator.clipboard.writeText(user.uid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!user) return null;

    // Use a URL-like format so it's "real" for future deep linking
    const qrData = `https://app.khalil.com/partner/${user.uid}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-brand-surface rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-brand-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-brand-border">
                    <h3 className="font-bold text-lg text-brand-forest">Connect Partner</h3>
                    <button onClick={onClose} className="p-2 hover:bg-brand-subtle rounded-full text-brand-muted">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-brand-subtle">
                    <button
                        onClick={() => setActiveTab('my-code')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'my-code' ? 'bg-brand-surface shadow text-brand-primary' : 'text-brand-muted hover:text-brand-forest'}`}
                    >
                        My Code
                    </button>
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'scan' ? 'bg-brand-surface shadow text-brand-primary' : 'text-brand-muted hover:text-brand-forest'}`}
                    >
                        Scan QR
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'my-code' ? (
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="bg-brand-surface p-4 rounded-2xl shadow-inner border border-brand-border">
                                <QRCode value={qrData} size={200} fgColor="#047857" />
                            </div>

                            <div className="text-brand-muted text-sm">
                                <p className="mb-2">Scan this code to connect instantly</p>
                                <div className="flex items-center justify-center gap-2 bg-brand-subtle py-2 px-3 rounded-lg max-w-full overflow-hidden border border-brand-border">
                                    <span className="truncate font-mono text-xs">{user.uid}</span>
                                    <button onClick={copyToClipboard} className="text-brand-primary">
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button className="flex items-center gap-2 text-brand-primary font-bold hover:underline">
                                <Share2 size={18} /> Share Link
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {!scanResult ? (
                                <div className="w-full space-y-4">
                                    <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden relative">
                                        <div id="reader" className="w-full h-full"></div>
                                        <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm pointer-events-none z-10">
                                            Point camera at partner's QR code
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center w-full">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">QR Code Scanned!</h4>
                                    <p className="text-gray-500 text-sm mb-6 break-all">ID: {scanResult}</p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setScanResult(null)}
                                            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                                        >
                                            Scan Again
                                        </button>
                                        <button
                                            onClick={() => handleSendRequest(scanResult)}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                        >
                                            Send Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div>
    );
};
