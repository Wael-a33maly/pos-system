/**
 * IndexedDB Storage for Offline Data
 * Provides a robust API for storing and managing offline data
 */

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 2;

// Store names
export const STORES = {
  PENDING_INVOICES: 'pending-invoices',
  PENDING_PRODUCTS: 'pending-products',
  PENDING_CUSTOMERS: 'pending-customers',
  CACHED_PRODUCTS: 'cached-products',
  CACHED_CUSTOMERS: 'cached-customers',
  CACHED_CATEGORIES: 'cached-categories',
  SYNC_QUEUE: 'sync-queue',
  USER_DATA: 'user-data',
} as const;

// Types for stored data
export interface PendingInvoice {
  id?: number;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  syncAttempts: number;
  lastSyncAttempt?: Date;
}

export interface PendingProduct {
  id?: number;
  data: Record<string, unknown>;
  action: 'create' | 'update' | 'delete';
  createdAt: Date;
}

export interface PendingCustomer {
  id?: number;
  data: Record<string, unknown>;
  action: 'create' | 'update' | 'delete';
  createdAt: Date;
}

export interface CachedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  barcode?: string;
  image?: string;
  updatedAt: Date;
}

export interface CachedCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance?: number;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  type: 'invoice' | 'product' | 'customer';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  priority: number;
  createdAt: Date;
  attempts: number;
}

// Database instance cache
let dbInstance: IDBDatabase | null = null;
let dbOpening = false;
const dbOpenCallbacks: Array<(db: IDBDatabase | null, error?: Error) => void> = [];

/**
 * Open or get the IndexedDB database
 */
export async function openDatabase(): Promise<IDBDatabase> {
  // Return cached instance
  if (dbInstance) {
    return dbInstance;
  }

  // Wait for ongoing open operation
  if (dbOpening) {
    return new Promise((resolve, reject) => {
      dbOpenCallbacks.push((db, error) => {
        if (error) reject(error);
        else resolve(db!);
      });
    });
  }

  dbOpening = true;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbOpening = false;
      const error = new Error(`Failed to open database: ${request.error?.message}`);
      dbOpenCallbacks.forEach(cb => cb(null, error));
      dbOpenCallbacks.length = 0;
      reject(error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbOpening = false;
      dbOpenCallbacks.forEach(cb => cb(dbInstance));
      dbOpenCallbacks.length = 0;
      resolve(dbInstance);

      // Handle unexpected close
      dbInstance.onclose = () => {
        dbInstance = null;
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      const storeConfigs: Array<[string, IDBObjectStoreParameters | undefined]> = [
        [STORES.PENDING_INVOICES, { keyPath: 'id', autoIncrement: true }],
        [STORES.PENDING_PRODUCTS, { keyPath: 'id', autoIncrement: true }],
        [STORES.PENDING_CUSTOMERS, { keyPath: 'id', autoIncrement: true }],
        [STORES.CACHED_PRODUCTS, { keyPath: 'id' }],
        [STORES.CACHED_CUSTOMERS, { keyPath: 'id' }],
        [STORES.CACHED_CATEGORIES, { keyPath: 'id' }],
        [STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true }],
        [STORES.USER_DATA, { keyPath: 'key' }],
      ];

      for (const [storeName, options] of storeConfigs) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, options);
          
          // Add indexes
          if (storeName === STORES.CACHED_PRODUCTS) {
            store.createIndex('categoryId', 'categoryId', { unique: false });
            store.createIndex('barcode', 'barcode', { unique: false });
          }
          if (storeName === STORES.PENDING_INVOICES) {
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
          if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('priority', 'priority', { unique: false });
          }
        }
      }
    };
  });
}

/**
 * Generic function to get all items from a store
 */
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get items: ${request.error?.message}`));
  });
}

/**
 * Generic function to get item by key
 */
export async function getByKey<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get item: ${request.error?.message}`));
  });
}

/**
 * Generic function to add item
 */
export async function add<T extends { id?: IDBValidKey }>(storeName: string, item: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to add item: ${request.error?.message}`));
  });
}

/**
 * Generic function to put (add or update) item
 */
export async function put<T>(storeName: string, item: T): Promise<IDBValidKey> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to put item: ${request.error?.message}`));
  });
}

/**
 * Generic function to delete item
 */
export async function remove(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete item: ${request.error?.message}`));
  });
}

/**
 * Clear all items from a store
 */
export async function clear(storeName: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message}`));
  });
}

/**
 * Get count of items in a store
 */
export async function count(storeName: string): Promise<number> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to count items: ${request.error?.message}`));
  });
}

// ============================================================================
// Specialized functions for invoices
// ============================================================================

/**
 * Add pending invoice for offline sync
 */
export async function addPendingInvoice(invoiceData: Record<string, unknown>): Promise<number> {
  const invoice: PendingInvoice = {
    data: invoiceData,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncAttempts: 0,
  };
  
  const id = await add(STORES.PENDING_INVOICES, invoice);
  
  // Also add to sync queue
  await addToSyncQueue({
    type: 'invoice',
    action: 'create',
    data: invoiceData,
    priority: 1,
    createdAt: new Date(),
    attempts: 0,
  });
  
  return id as number;
}

/**
 * Get all pending invoices
 */
export async function getPendingInvoices(): Promise<PendingInvoice[]> {
  return getAll<PendingInvoice>(STORES.PENDING_INVOICES);
}

/**
 * Remove pending invoice after successful sync
 */
export async function removePendingInvoice(id: number): Promise<void> {
  await remove(STORES.PENDING_INVOICES, id);
}

/**
 * Update sync attempt for invoice
 */
export async function updateInvoiceSyncAttempt(id: number, success: boolean): Promise<void> {
  const invoice = await getByKey<PendingInvoice>(STORES.PENDING_INVOICES, id);
  if (invoice) {
    invoice.syncAttempts += 1;
    invoice.lastSyncAttempt = new Date();
    invoice.updatedAt = new Date();
    
    if (success) {
      await removePendingInvoice(id);
    } else {
      await put(STORES.PENDING_INVOICES, invoice);
    }
  }
}

// ============================================================================
// Specialized functions for products
// ============================================================================

/**
 * Cache products for offline use
 */
export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CACHED_PRODUCTS, 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_PRODUCTS);
    
    let completed = 0;
    
    for (const product of products) {
      const request = store.put({
        ...product,
        updatedAt: new Date(),
      });
      
      request.onsuccess = () => {
        completed++;
        if (completed === products.length) {
          resolve();
        }
      };
      
      request.onerror = () => {
        console.error('Failed to cache product:', product.id);
      };
    }
    
    if (products.length === 0) {
      resolve();
    }
  });
}

/**
 * Get cached products
 */
export async function getCachedProducts(): Promise<CachedProduct[]> {
  return getAll<CachedProduct>(STORES.CACHED_PRODUCTS);
}

/**
 * Get cached product by ID
 */
export async function getCachedProduct(id: string): Promise<CachedProduct | undefined> {
  return getByKey<CachedProduct>(STORES.CACHED_PRODUCTS, id);
}

/**
 * Search cached products
 */
export async function searchCachedProducts(query: string): Promise<CachedProduct[]> {
  const products = await getCachedProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.barcode?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// Specialized functions for customers
// ============================================================================

/**
 * Cache customers for offline use
 */
export async function cacheCustomers(customers: CachedCustomer[]): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CACHED_CUSTOMERS, 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_CUSTOMERS);
    
    let completed = 0;
    
    for (const customer of customers) {
      const request = store.put({
        ...customer,
        updatedAt: new Date(),
      });
      
      request.onsuccess = () => {
        completed++;
        if (completed === customers.length) {
          resolve();
        }
      };
    }
    
    if (customers.length === 0) {
      resolve();
    }
  });
}

/**
 * Get cached customers
 */
export async function getCachedCustomers(): Promise<CachedCustomer[]> {
  return getAll<CachedCustomer>(STORES.CACHED_CUSTOMERS);
}

// ============================================================================
// Sync Queue
// ============================================================================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
  const id = await add(STORES.SYNC_QUEUE, item as SyncQueueItem);
  return id as number;
}

/**
 * Get sync queue items sorted by priority
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const items = await getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  return items.sort((a, b) => a.priority - b.priority);
}

/**
 * Remove from sync queue
 */
export async function removeFromSyncQueue(id: number): Promise<void> {
  await remove(STORES.SYNC_QUEUE, id);
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  pendingInvoices: number;
  pendingProducts: number;
  pendingCustomers: number;
  cachedProducts: number;
  cachedCustomers: number;
  syncQueue: number;
}> {
  return {
    pendingInvoices: await count(STORES.PENDING_INVOICES),
    pendingProducts: await count(STORES.PENDING_PRODUCTS),
    pendingCustomers: await count(STORES.PENDING_CUSTOMERS),
    cachedProducts: await count(STORES.CACHED_PRODUCTS),
    cachedCustomers: await count(STORES.CACHED_CUSTOMERS),
    syncQueue: await count(STORES.SYNC_QUEUE),
  };
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  await Promise.all([
    clear(STORES.PENDING_INVOICES),
    clear(STORES.PENDING_PRODUCTS),
    clear(STORES.PENDING_CUSTOMERS),
    clear(STORES.SYNC_QUEUE),
  ]);
}

/**
 * Clear cached data (keep pending)
 */
export async function clearCachedData(): Promise<void> {
  await Promise.all([
    clear(STORES.CACHED_PRODUCTS),
    clear(STORES.CACHED_CUSTOMERS),
    clear(STORES.CACHED_CATEGORIES),
  ]);
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<{
  pendingInvoices: PendingInvoice[];
  pendingProducts: PendingProduct[];
  pendingCustomers: PendingCustomer[];
  cachedProducts: CachedProduct[];
  cachedCustomers: CachedCustomer[];
}> {
  return {
    pendingInvoices: await getPendingInvoices(),
    pendingProducts: await getAll<PendingProduct>(STORES.PENDING_PRODUCTS),
    pendingCustomers: await getAll<PendingCustomer>(STORES.PENDING_CUSTOMERS),
    cachedProducts: await getCachedProducts(),
    cachedCustomers: await getCachedCustomers(),
  };
}
