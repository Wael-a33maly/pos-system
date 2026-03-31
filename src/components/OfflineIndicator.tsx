'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <Alert className="bg-orange-500 text-white border-orange-600">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="mr-2">
          أنت غير متصل بالإنترنت. سيتم مزامنة البيانات عند عودة الاتصال.
        </AlertDescription>
      </Alert>
    </div>
  );
}
