'use client';

import { useState, useSyncExternalStore, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Database,
  CloudOff,
  Cloud
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Assume online on server
}

interface PendingData {
  invoices: number;
  products: number;
  customers: number;
}

// Helper functions defined outside component to avoid recreation
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pos-offline-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-invoices')) {
        db.createObjectStore('pending-invoices', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-products')) {
        db.createObjectStore('pending-products', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-customers')) {
        db.createObjectStore('pending-customers', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getDataCount(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch {
      resolve(0);
    }
  });
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showDetails, setShowDetails] = useState(false);
  const [pendingData, setPendingData] = useState<PendingData>({
    invoices: 0,
    products: 0,
    customers: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  
  // Use ref for isOnline in async operations
  const isOnlineRef = useRef(isOnline);
  
  // Update ref when isOnline changes
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Check pending data count
  useEffect(() => {
    let mounted = true;
    
    const checkPendingData = async () => {
      if ('indexedDB' in window) {
        try {
          const db = await openDatabase();
          const invoices = await getDataCount(db, 'pending-invoices');
          const products = await getDataCount(db, 'pending-products');
          const customers = await getDataCount(db, 'pending-customers');
          
          if (mounted) {
            setPendingData({ invoices, products, customers });
          }
        } catch (error) {
          console.error('Error checking pending data:', error);
        }
      }
    };

    checkPendingData();
    
    // Listen for sync messages from service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_SUCCESS') {
        checkPendingData();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    
    return () => {
      mounted = false;
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [isOnline]);

  const handleSync = useCallback(async () => {
    if (!isOnlineRef.current || syncing) return;
    
    setSyncing(true);
    setSyncProgress(0);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    // Trigger background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-invoices');
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }

    // Wait for sync to complete
    setTimeout(() => {
      clearInterval(interval);
      setSyncProgress(100);
      setSyncing(false);
      // Refresh pending data
      window.location.reload();
    }, 2000);
  }, [syncing]);

  const totalPending = pendingData.invoices + pendingData.products + pendingData.customers;

  // Don't show if online and no pending data
  if (isOnline && totalPending === 0 && !showDetails) {
    return null;
  }

  // Show sync notification when back online with pending data
  if (isOnline && totalPending > 0 && !dismissed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <Alert className="bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/25">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  عاد الاتصال - لديك {totalPending} عنصر ينتظر المزامنة
                </AlertDescription>
                
                {syncing && (
                  <div className="mt-2">
                    <Progress value={syncProgress} className="h-1 bg-blue-400" />
                    <p className="text-xs mt-1 opacity-80">جاري المزامنة...</p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className={`w-3 h-3 ml-1 ${syncing ? 'animate-spin' : ''}`} />
                    مزامنة الآن
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissed(true)}
                    className="text-white hover:bg-blue-600"
                  >
                    لاحقاً
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Offline indicator
  if (!isOnline) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
        >
          <Alert className="bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/25">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5" />
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  غير متصل بالإنترنت
                </AlertDescription>
                <p className="text-xs opacity-80 mt-0.5">
                  سيتم مزامنة البيانات عند عودة الاتصال
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="text-white hover:bg-orange-600 h-8 w-8 p-0"
              >
                <Database className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}

// Compact inline offline indicator
export function OfflineBadge() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
        <Wifi className="w-3 h-3" />
        <span className="text-xs font-medium">متصل</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
      <WifiOff className="w-3 h-3" />
      <span className="text-xs font-medium">غير متصل</span>
    </div>
  );
}

// Hook for offline status
export function useOfflineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  return {
    isOnline,
    isOffline: !isOnline,
  };
}
