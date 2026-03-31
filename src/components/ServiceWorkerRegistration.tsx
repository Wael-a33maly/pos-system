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
  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] Service Worker registered:', reg.scope);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, show refresh prompt
                  console.log('[SW] New content available, please refresh.');
                  onUpdate?.();
                } else {
                  // Content cached for offline use
                  console.log('[SW] Content cached for offline use.');
                  onOfflineReady?.();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change (after skip waiting)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading...');
        window.location.reload();
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        
        switch (type) {
          case 'SYNC_SUCCESS':
            console.log('[SW] Sync success:', payload);
            // Dispatch custom event for components to listen
            window.dispatchEvent(new CustomEvent('sw-sync-success', { detail: payload }));
            break;
            
          case 'SYNC_ERROR':
            console.error('[SW] Sync error:', payload);
            window.dispatchEvent(new CustomEvent('sw-sync-error', { detail: payload }));
            break;
            
          case 'CACHE_UPDATED':
            console.log('[SW] Cache updated:', payload);
            break;
        }
      });

      // Periodic update check (every hour)
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update();
        });
      }, 60 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [onUpdate, onOfflineReady]);

  // Expose update function globally
  useEffect(() => {
    (window as Window & { updateServiceWorker?: () => void }).updateServiceWorker = updateServiceWorker;
    return () => {
      delete (window as Window & { updateServiceWorker?: () => void }).updateServiceWorker;
    };
  }, [updateServiceWorker]);

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
