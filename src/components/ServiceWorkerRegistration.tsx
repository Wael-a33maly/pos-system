'use client';

import { useEffect, useCallback, useMemo } from 'react';

interface ServiceWorkerRegistrationProps {
  onUpdate?: () => void;
  onOfflineReady?: () => void;
}

export function ServiceWorkerRegistration({ 
  onUpdate,
  onOfflineReady 
}: ServiceWorkerRegistrationProps) {
  // Service Worker disabled in development/preview environment
  // to prevent interference with Next.js client-side navigation
  return null;
}

// Hook to check PWA features - uses memoized values instead of state
export function usePWAFeatures() {
  const features = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        serviceWorker: false,
        pushManager: false,
        backgroundSync: false,
        periodicSync: false,
        indexedDB: false,
        standalone: false,
      };
    }
    
    const swSupported = 'serviceWorker' in navigator;
    const pushSupported = swSupported && 'PushManager' in window;
    const syncSupported = swSupported && 'SyncManager' in window;
    const periodicSyncSupported = swSupported && 'PeriodicSyncManager' in window;
    const indexedDBSupported = 'indexedDB' in window;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (('standalone' in window.navigator) && 
       (window.navigator as Navigator & { standalone: boolean }).standalone);

    return {
      serviceWorker: swSupported,
      pushManager: pushSupported,
      backgroundSync: syncSupported,
      periodicSync: periodicSyncSupported,
      indexedDB: indexedDBSupported,
      standalone: isStandalone,
    };
  }, []);

  return features;
}

// Hook for background sync - uses memoized values
export function useBackgroundSync() {
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'SyncManager' in window;
  }, []);

  const registerSync = useCallback(async (tag: string): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[SW] Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { 
        sync: { register: (tag: string) => Promise<void> } 
      }).sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      return false;
    }
  }, [isSupported]);

  return { isSupported, registerSync };
}

// Hook for periodic sync - uses memoized values
export function usePeriodicSync() {
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PeriodicSyncManager' in window;
  }, []);

  const registerPeriodicSync = useCallback(async (
    tag: string, 
    minInterval: number
  ): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[SW] Periodic sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state === 'granted') {
        await (registration as ServiceWorkerRegistration & { 
          periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } 
        }).periodicSync.register(tag, { minInterval });
        console.log('[SW] Periodic sync registered:', tag);
        return true;
      }
    } catch (error) {
      console.error('[SW] Periodic sync registration failed:', error);
    }
    
    return false;
  }, [isSupported]);

  return { isSupported, registerPeriodicSync };
}

// Hook for listening to SW messages
export function useServiceWorkerMessages(
  onMessage: (event: MessageEvent) => void
) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', onMessage);
      };
    }
  }, [onMessage]);
}
