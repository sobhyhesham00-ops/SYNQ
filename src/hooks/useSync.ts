import { useState, useEffect, useCallback } from 'react';
import { SyncEngine } from '../lib/syncEngine';

// Instantiate sync engine as a singleton
const syncEngineInstance = new SyncEngine(
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
);

export function useSync() {
  const [syncStatus, setSyncStatus] = useState(() => syncEngineInstance.getSyncStatus());
  const [isPending, setIsPending] = useState(() => syncEngineInstance.getQueueSize() > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleQueueUpdated = (status: any) => {
      setSyncStatus(status);
      setIsPending(syncEngineInstance.getQueueSize() > 0);
    };

    const handleSyncStart = () => {
      setIsPending(true);
    };

    const handleSyncSuccess = () => {
      setError(null);
    };

    const handleSyncFailure = (err: any) => {
      setError(err?.error || 'Synchronization failed');
    };

    syncEngineInstance.on('queueUpdated', handleQueueUpdated);
    syncEngineInstance.on('syncStart', handleSyncStart);
    syncEngineInstance.on('syncSuccess', handleSyncSuccess);
    syncEngineInstance.on('syncFailure', handleSyncFailure);

    return () => {
      syncEngineInstance.off('queueUpdated', handleQueueUpdated);
      syncEngineInstance.off('syncStart', handleSyncStart);
      syncEngineInstance.off('syncSuccess', handleSyncSuccess);
      syncEngineInstance.off('syncFailure', handleSyncFailure);
    };
  }, []);

  const addSync = useCallback((type: 'schedule' | 'profile', action: 'create' | 'update' | 'delete', data: any) => {
    return syncEngineInstance.addToQueue(type, action, data);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addSync,
    syncStatus,
    isPending,
    error,
    clearError,
    syncEngine: syncEngineInstance
  };
}
