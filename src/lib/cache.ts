// ==================== خدمة التخزين المؤقت (Caching Service) ====================

// ==================== الأنواع ====================
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

interface CacheOptions {
  ttl?: number; // Time to live بالمللي ثانية
  tags?: string[]; // لتجميع العناصر
}

// ==================== إعدادات افتراضية ====================
const DEFAULT_TTL = 5 * 60 * 1000; // 5 دقائق
const MAX_CACHE_SIZE = 1000; // أقصى عدد من العناصر

// ==================== Cache Store ====================
class CacheStore {
  private store: Map<string, CacheItem<unknown>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * جلب عنصر من الكاش
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // التحقق من انتهاء الصلاحية
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * تخزين عنصر في الكاش
   */
  set<T>(key: string, value: T, ttl: number = DEFAULT_TTL, tags?: string[]): void {
    // تنظيف الكاش إذا تجاوز الحد الأقصى
    if (this.store.size >= MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      tags,
    });
  }

  /**
   * حذف عنصر من الكاش
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * التحقق من وجود عنصر
   */
  has(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * مسح جميع العناصر التي تطابق نمط معين
   */
  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * مسح العناصر حسب الوسوم
   */
  invalidateByTag(tag: string): number {
    let count = 0;

    for (const [key, item] of this.store.entries()) {
      if (item.tags?.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * مسح جميع العناصر
   */
  clear(): void {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * تنظيف العناصر المنتهية الصلاحية
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * إحصائيات الكاش
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * جلب جميع المفاتيح
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

// ==================== إنشاء مثيل واحد (Singleton) ====================
const cacheStore = new CacheStore();

// ==================== واجهة Cache ====================
export const cache = {
  /**
   * جلب عنصر من الكاش
   */
  get: <T>(key: string): T | null => {
    return cacheStore.get<T>(key);
  },

  /**
   * تخزين عنصر في الكاش
   */
  set: <T>(key: string, value: T, ttl?: number, tags?: string[]): void => {
    cacheStore.set(key, value, ttl, tags);
  },

  /**
   * حذف عنصر من الكاش
   */
  delete: (key: string): boolean => {
    return cacheStore.delete(key);
  },

  /**
   * التحقق من وجود عنصر
   */
  has: (key: string): boolean => {
    return cacheStore.has(key);
  },

  /**
   * مسح العناصر حسب النمط
   */
  invalidate: (pattern: string): number => {
    return cacheStore.invalidate(pattern);
  },

  /**
   * مسح العناصر حسب الوسم
   */
  invalidateByTag: (tag: string): number => {
    return cacheStore.invalidateByTag(tag);
  },

  /**
   * مسح جميع العناصر
   */
  clear: (): void => {
    cacheStore.clear();
  },

  /**
   * تنظيف العناصر المنتهية
   */
  cleanup: (): number => {
    return cacheStore.cleanup();
  },

  /**
   * إحصائيات الكاش
   */
  getStats: (): CacheStats => {
    return cacheStore.getStats();
  },

  /**
   * جلب أو تعيين (Get or Set)
   * إذا كان العنصر موجوداً يعيده، وإلا ينفذ الدالة ويخزن النتيجة
   */
  getOrSet: async <T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    const cached = cacheStore.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    cacheStore.set(key, value, options?.ttl, options?.tags);
    return value;
  },

  /**
   * تذكر دالة (Memoize)
   * لتخزين نتائج الدوال تلقائياً
   */
  memoize: <T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ): T => {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      return cache.getOrSet(key, () => fn(...args), options);
    }) as T;
  },
};

// ==================== مفاتيح الكاش القياسية ====================
export const CacheKeys = {
  // المنتجات
  products: {
    list: (branchId?: string) => `products:list:${branchId || 'all'}`,
    detail: (id: string) => `products:detail:${id}`,
    byCategory: (categoryId: string) => `products:category:${categoryId}`,
    byBarcode: (barcode: string) => `products:barcode:${barcode}`,
  },
  
  // الفواتير
  invoices: {
    list: (branchId?: string) => `invoices:list:${branchId || 'all'}`,
    detail: (id: string) => `invoices:detail:${id}`,
    stats: (branchId: string, period: string) => `invoices:stats:${branchId}:${period}`,
  },
  
  // العملاء
  customers: {
    list: (branchId?: string) => `customers:list:${branchId || 'all'}`,
    detail: (id: string) => `customers:detail:${id}`,
    search: (query: string) => `customers:search:${query}`,
  },
  
  // الفروع
  branches: {
    list: () => 'branches:list',
    detail: (id: string) => `branches:detail:${id}`,
  },
  
  // الورديات
  shifts: {
    active: (branchId: string) => `shifts:active:${branchId}`,
    detail: (id: string) => `shifts:detail:${id}`,
    stats: (id: string) => `shifts:stats:${id}`,
  },
  
  // التقارير
  reports: {
    sales: (branchId: string, from: string, to: string) => `reports:sales:${branchId}:${from}:${to}`,
    products: (branchId: string, from: string, to: string) => `reports:products:${branchId}:${from}:${to}`,
    profits: (branchId: string, from: string, to: string) => `reports:profits:${branchId}:${from}:${to}`,
  },
  
  // Dashboard
  dashboard: {
    stats: (branchId?: string) => `dashboard:stats:${branchId || 'all'}`,
    charts: (branchId: string, period: string) => `dashboard:charts:${branchId}:${period}`,
  },
  
  // الإعدادات
  settings: {
    all: () => 'settings:all',
    pos: (userId: string) => `settings:pos:${userId}`,
    print: (branchId: string) => `settings:print:${branchId}`,
  },
};

// ==================== وسوم الكاش ====================
export const CacheTags = {
  PRODUCTS: 'products',
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  BRANCHES: 'branches',
  SHIFTS: 'shifts',
  REPORTS: 'reports',
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
};

// ==================== أوقات TTL القياسية ====================
export const CacheTTL = {
  SHORT: 60 * 1000, // دقيقة واحدة
  MEDIUM: 5 * 60 * 1000, // 5 دقائق
  LONG: 30 * 60 * 1000, // 30 دقيقة
  HOUR: 60 * 60 * 1000, // ساعة واحدة
  DAY: 24 * 60 * 60 * 1000, // يوم واحد
};

// ==================== تنظيف دوري ====================
if (typeof window === 'undefined') {
  // تشغيل التنظيف كل 5 دقائق
  setInterval(() => {
    const cleaned = cache.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired items`);
    }
  }, 5 * 60 * 1000);
}

// تصدير الـ store للاختبار
export { CacheStore };
