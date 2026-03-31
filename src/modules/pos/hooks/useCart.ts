// ============================================
// useCart Hook - إدارة سلة المشتريات
// ============================================

import { useState, useCallback, useMemo } from 'react';
import type { CartItem, CartState } from '../types/pos.types';
import type { Product } from '@/types';

const initialState: CartState = {
  items: [],
  customer: null,
  discountAmount: 0,
  notes: '',
};

export function useCart() {
  const [state, setState] = useState<CartState>(initialState);

  // إضافة منتج للسلة
  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setState((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingIndex >= 0) {
        // تحديث الكمية إذا كان موجوداً
        const updatedItems = [...prev.items];
        const existing = updatedItems[existingIndex];
        updatedItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + quantity,
          totalAmount: (existing.quantity + quantity) * existing.unitPrice,
        };
        return { ...prev, items: updatedItems };
      }

      // إضافة عنصر جديد
      const newItem: CartItem = {
        id: `${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discountAmount: 0,
        totalAmount: quantity * product.sellingPrice,
        product,
      };

      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  // تحديث كمية عنصر
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setState((prev) => {
      if (quantity <= 0) {
        return { ...prev, items: prev.items.filter((item) => item.id !== itemId) };
      }

      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, totalAmount: quantity * item.unitPrice }
            : item
        ),
      };
    });
  }, []);

  // حذف عنصر
  const removeItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  // تحديث خصم عنصر
  const updateItemDiscount = useCallback((itemId: string, discount: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discountAmount: discount,
              totalAmount: item.quantity * item.unitPrice - discount,
            }
          : item
      ),
    }));
  }, []);

  // تحديث خصم عام
  const setDiscount = useCallback((discount: number) => {
    setState((prev) => ({ ...prev, discountAmount: discount }));
  }, []);

  // تحديث العميل
  const setCustomer = useCallback((customer: CartState['customer']) => {
    setState((prev) => ({ ...prev, customer }));
  }, []);

  // تحديث الملاحظات
  const setNotes = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, notes }));
  }, []);

  // تفريغ السلة
  const clearCart = useCallback(() => {
    setState(initialState);
  }, []);

  // حساب المجاميع - useMemo للأداء
  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.totalAmount, 0);
    const itemsDiscount = state.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalDiscount = itemsDiscount + state.discountAmount;
    const total = subtotal - totalDiscount;
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const profit = state.items.reduce(
      (sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity,
      0
    );

    return {
      subtotal,
      itemsDiscount,
      totalDiscount,
      total,
      itemCount,
      profit,
    };
  }, [state.items, state.discountAmount]);

  return {
    // State
    items: state.items,
    customer: state.customer,
    discountAmount: state.discountAmount,
    notes: state.notes,
    totals,

    // Actions
    addItem,
    updateQuantity,
    removeItem,
    updateItemDiscount,
    setDiscount,
    setCustomer,
    setNotes,
    clearCart,
  };
}
