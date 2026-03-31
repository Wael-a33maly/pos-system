'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Share2, 
  Plus, 
  MonitorSmartphone,
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  showAfterDelay?: number; // milliseconds
  showOnMobileOnly?: boolean;
}

export function PWAInstallPrompt({ 
  showAfterDelay = 5000,
  showOnMobileOnly = false 
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // Use ref to track isInstalled in setTimeout
  const isInstalledRef = useRef(isInstalled);
  
  // Update ref when isInstalled changes
  useEffect(() => {
    isInstalledRef.current = isInstalled;
  }, [isInstalled]);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = ('standalone' in window.navigator) && 
      (window.navigator as Navigator & { standalone: boolean }).standalone;
    const initiallyInstalled = isStandalone || !!isInWebAppiOS;
    
    // Set initial states using queueMicrotask to avoid sync setState warning
    if (initiallyInstalled) {
      queueMicrotask(() => setIsInstalled(true));
    }
    
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOSDevice) {
      queueMicrotask(() => setIsIOS(true));
    }

    // Listen for beforeinstallprompt event (non-iOS)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after delay
      setTimeout(() => {
        if (!isInstalledRef.current && !sessionStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, showAfterDelay);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show instructions after delay
    if (isIOSDevice && !initiallyInstalled) {
      setTimeout(() => {
        if (!sessionStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, showAfterDelay);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showAfterDelay, showOnMobileOnly]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // iOS - show instructions
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  }, []);

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-xl">
            <CardContent className="p-4">
              {!showIOSInstructions ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                      <MonitorSmartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">
                        تثبيت التطبيق
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        ثبّت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      onClick={handleDismiss}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {isIOS && !deferredPrompt ? (
                      <Button
                        onClick={handleShowIOSInstructions}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        كيفية التثبيت
                      </Button>
                    ) : (
                      <Button
                        onClick={handleInstall}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تثبيت الآن
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      className="border-green-200 dark:border-green-800"
                    >
                      لاحقاً
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { icon: Smartphone, text: 'يعمل Offline' },
                      { icon: CheckCircle, text: 'سريع' },
                      { icon: MonitorSmartphone, text: 'تجربة أصلية' },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <feature.icon className="w-3 h-3" />
                        {feature.text}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // iOS Instructions
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      تثبيت على iOS
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDismiss}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                        1
                      </div>
                      <div className="flex items-center gap-2">
                        <span>اضغط على زر المشاركة</span>
                        <Share2 className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                        2
                      </div>
                      <div className="flex items-center gap-2">
                        <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
                        <Plus className="w-5 h-5 text-green-500" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                        3
                      </div>
                      <span>اضغط "إضافة" في الأعلى</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowIOSInstructions(false)}
                    className="w-full"
                  >
                    حسناً، فهمت
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for programmatic install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed synchronously
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      // Use queueMicrotask to avoid synchronous setState warning
      queueMicrotask(() => setIsInstalled(true));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    install,
  };
}
