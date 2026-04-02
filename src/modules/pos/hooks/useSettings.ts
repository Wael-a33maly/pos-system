// ============================================
// useSettings Hook - إدارة إعدادات نقطة البيع
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { POSSettings } from '../types/pos.types';
import { defaultSettings, SETTINGS_STORAGE_KEY } from '../constants/defaults';

interface UseSettingsReturn {
  settings: POSSettings;
  updateSettings: (newSettings: Partial<POSSettings>) => void;
  resetSettings: () => void;
}

/**
 * Hook لإدارة إعدادات نقطة البيع مع التخزين المحلي
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<POSSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // حفظ الإعدادات عند التغيير
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<POSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
