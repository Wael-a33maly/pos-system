// ============================================
// usePayment Hook - إدارة الدفع
// ============================================

import { useState, useCallback, useMemo } from 'react';
import type { PaymentEntry, PaymentMethod } from '../types/pos.types';
import { paymentMethods } from '../constants/defaults';

interface UsePaymentOptions {
  total: number;
  allowMultiPayment?: boolean;
}

interface UsePaymentReturn {
  // State
  selectedPaymentMethod: string;
  paidAmount: number;
  payments: PaymentEntry[];
  isMultiPayment: boolean;
  
  // Data
  paymentMethods: PaymentMethod[];
  
  // Computed
  totalPaid: number;
  remaining: number;
  change: number;
  isPaymentComplete: boolean;
  
  // Actions
  setSelectedPaymentMethod: (methodId: string) => void;
  setPaidAmount: (amount: number) => void;
  setIsMultiPayment: (isMulti: boolean) => void;
  addPaymentMethod: (methodId: string) => void;
  updatePaymentAmount: (id: string, amount: number) => void;
  removePayment: (id: string) => void;
  reset: () => void;
}

/**
 * Hook لإدارة عمليات الدفع الفردي والمتعدد
 */
export function usePayment(options: UsePaymentOptions): UsePaymentReturn {
  const { total, allowMultiPayment = true } = options;

  // State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [isMultiPayment, setIsMultiPayment] = useState(false);

  // Computed values
  const totalPaid = useMemo(() => 
    isMultiPayment 
      ? payments.reduce((sum, p) => sum + p.amount, 0)
      : paidAmount,
    [isMultiPayment, payments, paidAmount]
  );

  const remaining = useMemo(() => 
    Math.max(0, total - totalPaid),
    [total, totalPaid]
  );

  const change = useMemo(() => 
    Math.max(0, totalPaid - total),
    [totalPaid, total]
  );

  const isPaymentComplete = useMemo(() => 
    totalPaid >= total,
    [totalPaid, total]
  , [totalPaid, total]);

  // Actions
  const addPaymentMethod = useCallback((methodId: string) => {
    const remainingAmount = total - payments.reduce((sum, p) => sum + p.amount, 0);
    if (remainingAmount <= 0) return;
    
    setPayments(prev => [
      ...prev,
      { id: Date.now().toString(), methodId, amount: remainingAmount }
    ]);
  }, [total, payments]);

  const updatePaymentAmount = useCallback((id: string, amount: number) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, amount: Math.max(0, amount) } : p
    ));
  }, []);

  const removePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const reset = useCallback(() => {
    setPayments([]);
    setIsMultiPayment(false);
    setPaidAmount(0);
    setSelectedPaymentMethod('cash');
  }, []);

  return {
    // State
    selectedPaymentMethod,
    paidAmount,
    payments,
    isMultiPayment,
    
    // Data
    paymentMethods,
    
    // Computed
    totalPaid,
    remaining,
    change,
    isPaymentComplete,
    
    // Actions
    setSelectedPaymentMethod,
    setPaidAmount,
    setIsMultiPayment,
    addPaymentMethod,
    updatePaymentAmount,
    removePayment,
    reset,
  };
}
