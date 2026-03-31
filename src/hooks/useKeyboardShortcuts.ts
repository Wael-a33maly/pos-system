'use client';

import { useEffect, useCallback, useRef } from 'react';

// ==================== الأنواع ====================
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
}

// ==================== الاختصارات الافتراضية ====================
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'F2', action: () => {}, description: 'نقطة البيع' },
  { key: 'F3', action: () => {}, description: 'المنتجات' },
  { key: 'F4', action: () => {}, description: 'الفواتير' },
  { key: 'F5', action: () => {}, description: 'العملاء' },
  { key: 'F6', action: () => {}, description: 'التقارير' },
  { key: 'F7', action: () => {}, description: 'الورديات' },
  { key: 'F8', action: () => {}, description: 'الإعدادات' },
  { key: 'p', ctrl: true, action: () => {}, description: 'طباعة' },
  { key: 's', ctrl: true, action: () => {}, description: 'حفظ' },
  { key: 'k', ctrl: true, action: () => {}, description: 'البحث الشامل' },
  { key: 'n', ctrl: true, action: () => {}, description: 'جديد' },
  { key: 'z', ctrl: true, action: () => {}, description: 'تراجع' },
  { key: 'y', ctrl: true, action: () => {}, description: 'إعادة' },
  { key: 'Escape', action: () => {}, description: 'إغلاق/إلغاء' },
  { key: 'Enter', action: () => {}, description: 'تأكيد' },
  { key: 'Delete', action: () => {}, description: 'حذف' },
  { key: '?', shift: true, action: () => {}, description: 'مساعدة الاختصارات' },
];

// ==================== Hook ====================
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions
): UseKeyboardShortcutsReturn {
  const { shortcuts, enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // تحديث المرجع عند تغيير الاختصارات
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // معالج أحداث لوحة المفاتيح
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // تجاهل إذا كان المستخدم يكتب في حقل إدخال
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // للاختصارات التي تحتوي على Ctrl، نسمح بالعمل حتى في حقول الإدخال
        const isShortcutWithModifier = shortcut.ctrl || shortcut.alt || shortcut.meta;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // إذا كان في حقل إدخال وليس اختصار مع مفتاح تعديل
          if (isInputField && !isShortcutWithModifier) {
            // السماح ببعض الاختصارات الأساسية
            if (shortcut.key === 'Escape') {
              target.blur();
              if (shortcut.preventDefault !== false) {
                event.preventDefault();
              }
              shortcut.action();
            }
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }

          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  // تسجيل معالج الأحداث
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return { shortcuts };
}

// ==================== Hook للاختصارات العامة ====================
export function useGlobalShortcuts(
  actions: {
    onPOS?: () => void;
    onProducts?: () => void;
    onInvoices?: () => void;
    onCustomers?: () => void;
    onReports?: () => void;
    onShifts?: () => void;
    onSettings?: () => void;
    onPrint?: () => void;
    onSave?: () => void;
    onSearch?: () => void;
    onNew?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onEscape?: () => void;
    onEnter?: () => void;
    onDelete?: () => void;
    onHelp?: () => void;
  },
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onPOS) {
    shortcuts.push({ key: 'F2', action: actions.onPOS, description: 'نقطة البيع' });
  }
  if (actions.onProducts) {
    shortcuts.push({ key: 'F3', action: actions.onProducts, description: 'المنتجات' });
  }
  if (actions.onInvoices) {
    shortcuts.push({ key: 'F4', action: actions.onInvoices, description: 'الفواتير' });
  }
  if (actions.onCustomers) {
    shortcuts.push({ key: 'F5', action: actions.onCustomers, description: 'العملاء' });
  }
  if (actions.onReports) {
    shortcuts.push({ key: 'F6', action: actions.onReports, description: 'التقارير' });
  }
  if (actions.onShifts) {
    shortcuts.push({ key: 'F7', action: actions.onShifts, description: 'الورديات' });
  }
  if (actions.onSettings) {
    shortcuts.push({ key: 'F8', action: actions.onSettings, description: 'الإعدادات' });
  }
  if (actions.onPrint) {
    shortcuts.push({ key: 'p', ctrl: true, action: actions.onPrint, description: 'طباعة' });
  }
  if (actions.onSave) {
    shortcuts.push({ key: 's', ctrl: true, action: actions.onSave, description: 'حفظ' });
  }
  if (actions.onSearch) {
    shortcuts.push({ key: 'k', ctrl: true, action: actions.onSearch, description: 'البحث الشامل' });
  }
  if (actions.onNew) {
    shortcuts.push({ key: 'n', ctrl: true, action: actions.onNew, description: 'جديد' });
  }
  if (actions.onUndo) {
    shortcuts.push({ key: 'z', ctrl: true, action: actions.onUndo, description: 'تراجع' });
  }
  if (actions.onRedo) {
    shortcuts.push({ key: 'y', ctrl: true, action: actions.onRedo, description: 'إعادة' });
  }
  if (actions.onEscape) {
    shortcuts.push({ key: 'Escape', action: actions.onEscape, description: 'إغلاق/إلغاء' });
  }
  if (actions.onEnter) {
    shortcuts.push({ key: 'Enter', action: actions.onEnter, description: 'تأكيد' });
  }
  if (actions.onDelete) {
    shortcuts.push({ key: 'Delete', action: actions.onDelete, description: 'حذف' });
  }
  if (actions.onHelp) {
    shortcuts.push({ key: '?', shift: true, action: actions.onHelp, description: 'مساعدة الاختصارات' });
  }

  return useKeyboardShortcuts({ shortcuts, enabled });
}

// ==================== Hook لاختصارات نقطة البيع ====================
export function usePOSShortcuts(
  actions: {
    onAddProduct?: () => void;
    onRemoveProduct?: () => void;
    onIncreaseQuantity?: () => void;
    onDecreaseQuantity?: () => void;
    onClearCart?: () => void;
    onPayment?: () => void;
    onHold?: () => void;
    onRecall?: () => void;
    onDiscount?: () => void;
    onTaxExempt?: () => void;
  },
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onAddProduct) {
    shortcuts.push({ key: 'Insert', action: actions.onAddProduct, description: 'إضافة منتج' });
  }
  if (actions.onRemoveProduct) {
    shortcuts.push({ key: 'Delete', action: actions.onRemoveProduct, description: 'حذف منتج' });
  }
  if (actions.onIncreaseQuantity) {
    shortcuts.push({ key: '+', action: actions.onIncreaseQuantity, description: 'زيادة الكمية' });
  }
  if (actions.onDecreaseQuantity) {
    shortcuts.push({ key: '-', action: actions.onDecreaseQuantity, description: 'تقليل الكمية' });
  }
  if (actions.onClearCart) {
    shortcuts.push({ key: 'Delete', ctrl: true, action: actions.onClearCart, description: 'مسح السلة' });
  }
  if (actions.onPayment) {
    shortcuts.push({ key: 'F12', action: actions.onPayment, description: 'دفع' });
  }
  if (actions.onHold) {
    shortcuts.push({ key: 'F10', action: actions.onHold, description: 'تجميد الفاتورة' });
  }
  if (actions.onRecall) {
    shortcuts.push({ key: 'F11', action: actions.onRecall, description: 'استرجاع فاتورة' });
  }
  if (actions.onDiscount) {
    shortcuts.push({ key: 'd', ctrl: true, action: actions.onDiscount, description: 'خصم' });
  }
  if (actions.onTaxExempt) {
    shortcuts.push({ key: 't', ctrl: true, action: actions.onTaxExempt, description: 'إعفاء ضريبي' });
  }

  return useKeyboardShortcuts({ shortcuts, enabled });
}

// ==================== Hook لاختصارات التنقل ====================
export function useNavigationShortcuts(
  actions: {
    onNext?: () => void;
    onPrevious?: () => void;
    onFirst?: () => void;
    onLast?: () => void;
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
    onTab?: () => void;
    onShiftTab?: () => void;
  },
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onNext) {
    shortcuts.push({ key: 'PageDown', action: actions.onNext, description: 'التالي' });
  }
  if (actions.onPrevious) {
    shortcuts.push({ key: 'PageUp', action: actions.onPrevious, description: 'السابق' });
  }
  if (actions.onFirst) {
    shortcuts.push({ key: 'Home', action: actions.onFirst, description: 'الأول' });
  }
  if (actions.onLast) {
    shortcuts.push({ key: 'End', action: actions.onLast, description: 'الأخير' });
  }
  if (actions.onUp) {
    shortcuts.push({ key: 'ArrowUp', action: actions.onUp, description: 'أعلى' });
  }
  if (actions.onDown) {
    shortcuts.push({ key: 'ArrowDown', action: actions.onDown, description: 'أسفل' });
  }
  if (actions.onLeft) {
    shortcuts.push({ key: 'ArrowLeft', action: actions.onLeft, description: 'يسار' });
  }
  if (actions.onRight) {
    shortcuts.push({ key: 'ArrowRight', action: actions.onRight, description: 'يمين' });
  }
  if (actions.onTab) {
    shortcuts.push({ key: 'Tab', action: actions.onTab, description: 'التالي (Tab)' });
  }
  if (actions.onShiftTab) {
    shortcuts.push({ key: 'Tab', shift: true, action: actions.onShiftTab, description: 'السابق (Shift+Tab)' });
  }

  return useKeyboardShortcuts({ shortcuts, enabled });
}

// ==================== مساعد لعرض الاختصارات ====================
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push('Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  if (shortcut.meta) {
    parts.push('⌘');
  }

  // تحويل المفاتيح الخاصة
  let key = shortcut.key;
  switch (key.toLowerCase()) {
    case 'arrowup':
      key = '↑';
      break;
    case 'arrowdown':
      key = '↓';
      break;
    case 'arrowleft':
      key = '←';
      break;
    case 'arrowright':
      key = '→';
      break;
    case 'escape':
      key = 'Esc';
      break;
    case ' ':
      key = 'Space';
      break;
    default:
      if (key.length === 1) {
        key = key.toUpperCase();
      }
  }

  parts.push(key);

  return parts.join(' + ');
}

export default useKeyboardShortcuts;
