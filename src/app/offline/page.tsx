'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  CloudOff,
  Database,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [cachedData, setCachedData] = useState({
    products: false,
    customers: false,
    invoices: false,
  });

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check cached data
    checkCachedData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkCachedData = async () => {
    if ('indexedDB' in window) {
      try {
        const db = await openDatabase();
        const products = await getDataCount(db, 'cached-products');
        const customers = await getDataCount(db, 'cached-customers');
        const invoices = await getDataCount(db, 'pending-invoices');
        
        setCachedData({
          products: products > 0,
          customers: customers > 0,
          invoices: invoices > 0,
        });
      } catch (error) {
        console.error('Error checking cached data:', error);
      }
    }
  };

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('pos-offline-db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cached-products')) {
          db.createObjectStore('cached-products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached-customers')) {
          db.createObjectStore('cached-customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending-invoices')) {
          db.createObjectStore('pending-invoices', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const getDataCount = (db: IDBDatabase, storeName: string): Promise<number> => {
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
  };

  const handleRetry = async () => {
    setRetrying(true);
    
    // Try to reconnect
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-store' 
      });
      
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Still offline:', error);
    } finally {
      setTimeout(() => setRetrying(false), 1000);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg w-full"
      >
        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-dashed border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="mx-auto mb-4"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center">
                    <WifiOff className="w-12 h-12 text-orange-500" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-orange-300 dark:border-orange-700"
                  />
                </div>
              </motion.div>
              
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                غير متصل بالإنترنت
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                يبدو أنك غير متصل بالإنترنت. لا تقلق، يمكنك الاستمرار في العمل!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Message */}
              <motion.div
                variants={itemVariants}
                className={`p-4 rounded-lg ${
                  isOnline 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        عاد الاتصال! يمكنك المتابعة الآن
                      </span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-5 h-5 text-orange-500" />
                      <span className="text-orange-700 dark:text-orange-400 font-medium">
                        جاري العمل في وضع عدم الاتصال
                      </span>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Cached Data Info */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    البيانات المحفوظة محلياً
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-lg text-center transition-all ${
                    cachedData.products 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                  }`}>
                    <div className={`text-xs font-medium ${
                      cachedData.products ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                    }`}>
                      المنتجات
                    </div>
                    {cachedData.products ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 mx-auto mt-1" />
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg text-center transition-all ${
                    cachedData.customers 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                  }`}>
                    <div className={`text-xs font-medium ${
                      cachedData.customers ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                    }`}>
                      العملاء
                    </div>
                    {cachedData.customers ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 mx-auto mt-1" />
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg text-center transition-all ${
                    cachedData.invoices 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                  }`}>
                    <div className={`text-xs font-medium ${
                      cachedData.invoices ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}>
                      فواتير معلقة
                    </div>
                    {cachedData.invoices ? (
                      <span className="text-xs text-blue-500">جاهزة للمزامنة</span>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-slate-400 mx-auto mt-1" />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Info Box */}
              <motion.div 
                variants={itemVariants}
                className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">يمكنك الاستمرار في العمل!</p>
                    <p className="text-blue-600 dark:text-blue-400">
                      سيتم مزامنة جميع البيانات تلقائياً عند عودة الاتصال بالإنترنت.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      جاري المحاولة...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      إعادة المحاولة
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="flex-1 border-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  العودة للرئيسية
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400"
        >
          <p>نظام نقاط البيع - يعمل في وضع Offline</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
