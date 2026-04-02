// ============================================
// Currency Utilities - أدوات العملة
// ============================================

import { useAppStore } from '@/store';
import type { Currency } from '@/types';

// Default currency settings
export const DEFAULT_CURRENCY: Currency = {
  id: 'egp',
  name: 'Egyptian Pound',
  nameAr: 'جنيه مصري',
  code: 'EGP',
  symbol: 'ج.م',
  decimalPlaces: 2,
  isDefault: true,
  isActive: true,
};

// Currency cache
let cachedCurrency: Currency | null = null;
let currencyFetchPromise: Promise<Currency> | null = null;

/**
 * Fetch the default currency from settings API
 */
export async function fetchDefaultCurrency(): Promise<Currency> {
  // Return cached currency if available
  if (cachedCurrency) {
    return cachedCurrency;
  }

  // Return existing promise if fetch is in progress
  if (currencyFetchPromise) {
    return currencyFetchPromise;
  }

  currencyFetchPromise = (async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const result = await res.json();
        const settings = result.settings || {};
        
        // Try to get currencies from settings
        if (settings.currencies) {
          try {
            const currencies = typeof settings.currencies === 'string' 
              ? JSON.parse(settings.currencies) 
              : settings.currencies;
            
            // Find the default currency
            const defaultCurrency = currencies.find((c: Currency) => 
              c.isDefault || c.code === settings.defaultCurrency
            );
            
            if (defaultCurrency) {
              cachedCurrency = defaultCurrency;
              return defaultCurrency;
            }
          } catch (e) {
            console.error('Failed to parse currencies:', e);
          }
        }
        
        // If no currencies found, try defaultCurrency setting
        if (settings.defaultCurrency) {
          const currency = getCurrencyByCode(settings.defaultCurrency);
          if (currency) {
            cachedCurrency = currency;
            return currency;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch currency settings:', e);
    }
    
    // Return default currency if all else fails
    return DEFAULT_CURRENCY;
  })();

  const result = await currencyFetchPromise;
  currencyFetchPromise = null;
  return result;
}

/**
 * Get currency info by code
 */
export function getCurrencyByCode(code: string): Currency | null {
  const currencies: Record<string, Currency> = {
    'SAR': {
      id: 'sar',
      name: 'Saudi Riyal',
      nameAr: 'ريال سعودي',
      code: 'SAR',
      symbol: 'ر.س',
      decimalPlaces: 2,
      isDefault: false,
      isActive: true,
    },
    'EGP': {
      id: 'egp',
      name: 'Egyptian Pound',
      nameAr: 'جنيه مصري',
      code: 'EGP',
      symbol: 'ج.م',
      decimalPlaces: 2,
      isDefault: true,
      isActive: true,
    },
    'AED': {
      id: 'aed',
      name: 'UAE Dirham',
      nameAr: 'درهم إماراتي',
      code: 'AED',
      symbol: 'د.إ',
      decimalPlaces: 2,
      isDefault: false,
      isActive: true,
    },
    'USD': {
      id: 'usd',
      name: 'US Dollar',
      nameAr: 'دولار أمريكي',
      code: 'USD',
      symbol: '$',
      decimalPlaces: 2,
      isDefault: false,
      isActive: true,
    },
    'KWD': {
      id: 'kwd',
      name: 'Kuwaiti Dinar',
      nameAr: 'دينار كويتي',
      code: 'KWD',
      symbol: 'د.ك',
      decimalPlaces: 3,
      isDefault: false,
      isActive: true,
    },
    'QAR': {
      id: 'qar',
      name: 'Qatari Riyal',
      nameAr: 'ريال قطري',
      code: 'QAR',
      symbol: 'ر.ق',
      decimalPlaces: 2,
      isDefault: false,
      isActive: true,
    },
    'BHD': {
      id: 'bhd',
      name: 'Bahraini Dinar',
      nameAr: 'دينار بحريني',
      code: 'BHD',
      symbol: 'د.ب',
      decimalPlaces: 3,
      isDefault: false,
      isActive: true,
    },
    'OMR': {
      id: 'omr',
      name: 'Omani Rial',
      nameAr: 'ريال عماني',
      code: 'OMR',
      symbol: 'ر.ع',
      decimalPlaces: 3,
      isDefault: false,
      isActive: true,
    },
  };
  
  return currencies[code] || null;
}

/**
 * Format a number as currency
 * Uses the currency from store or the provided currency
 */
export function formatCurrency(
  amount: number, 
  currency?: Currency | null, 
  decimalPlaces?: number
): string {
  const curr = currency || useAppStore.getState().currency || DEFAULT_CURRENCY;
  const decimals = decimalPlaces ?? curr.decimalPlaces ?? 2;
  
  try {
    // Try to use Intl.NumberFormat for proper currency formatting
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: curr.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback to simple format if currency code is not supported
    const formatted = amount.toFixed(decimals);
    return `${formatted} ${curr.symbol}`;
  }
}

/**
 * Format a number as currency with explicit currency settings
 */
export function formatCurrencyWithSettings(
  amount: number,
  currencySettings: { code: string; symbol: string; decimalPlaces: number }
): string {
  const { code, symbol, decimalPlaces } = currencySettings;
  
  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  } catch {
    const formatted = amount.toFixed(decimalPlaces);
    return `${formatted} ${symbol}`;
  }
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse a formatted currency string back to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Clear the currency cache (useful when settings change)
 */
export function clearCurrencyCache(): void {
  cachedCurrency = null;
}

/**
 * Initialize currency in the store from settings
 */
export async function initializeCurrencyFromSettings(): Promise<void> {
  const currency = await fetchDefaultCurrency();
  useAppStore.getState().setCurrency(currency);
  useAppStore.getState().setDecimalPlaces(currency.decimalPlaces);
}
