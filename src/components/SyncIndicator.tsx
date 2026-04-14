/**
 * SyncIndicator - Shows sync status in header/footer
 */

import React from 'react';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { SyncStatus } from '../hooks/useSyncManager';

interface SyncIndicatorProps {
    status: SyncStatus;
    isOnline: boolean;
    pendingChanges: boolean;
    onPress?: () => void;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
    status,
    isOnline,
    pendingChanges,
    onPress,
}) => {
    const getIcon = () => {
        if (!isOnline) {
            return <CloudOff size={16} className="text-neutral-500" />;
        }

        switch (status) {
            case 'syncing':
            case 'migrating':
                return <Loader2 size={16} className="text-brand-primary animate-spin" />;
            case 'synced':
                return <Check size={16} className="text-brand-primary" />;
            case 'error':
                return <AlertCircle size={16} className="text-red-400" />;
            case 'offline':
                return <CloudOff size={16} className="text-brand-muted" />;
            default:
                if (pendingChanges) {
                    return (
                        <div className="relative">
                            <Cloud size={16} className="text-brand-muted" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full" />
                        </div>
                    );
                }
                return <Cloud size={16} className="text-brand-muted" />;
        }
    };

    const getLabel = () => {
        if (!isOnline) return 'Offline';
        switch (status) {
            case 'syncing': return 'Syncing...';
            case 'migrating': return 'Migrating data...';
            case 'synced': return 'Synced';
            case 'error': return 'Sync failed';
            default:
                if (pendingChanges) return 'Pending';
                return '';
        }
    };

    const label = getLabel();

    return (
        <button
            onClick={onPress}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all
        ${status === 'error' ? 'bg-red-500/10 text-red-400' :
                    status === 'synced' ? 'bg-brand-primary/10 text-brand-primary' :
                        'bg-brand-subtle text-brand-muted border border-brand-border hover:bg-brand-surface'}`}
            title={isOnline ? 'Cloud sync status' : 'Offline mode'}
        >
            {getIcon()}
            {label && <span className="hidden sm:inline">{label}</span>}
        </button>
    );
};
