// ==================== Return Types ====================

export type ReturnReason = 
  | 'DEFECTIVE'      // تالف
  | 'WRONG_ITEM'     // منتج خاطئ
  | 'NOT_AS_DESCRIBED' // غير مطابق
  | 'CUSTOMER_CHANGE' // تغيير رأي
  | 'OTHER';         // أخرى

export type ReturnStatus = 
  | 'PENDING'    // قيد المراجعة
  | 'APPROVED'   // موافق عليه
  | 'REJECTED'   // مرفوض
  | 'COMPLETED'; // مكتمل

export type RefundMethod = 
  | 'CASH'       // نقداً
  | 'CREDIT'     // رصيد عميل
  | 'EXCHANGE';  // استبدال

// ==================== Return Item ====================
export interface ReturnItem {
  id: string;
  returnRequestId: string;
  productId?: string;
  variantId?: string;
  invoiceItemId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason?: ReturnReason;
  notes?: string;
  product?: import('./index').Product;
  variant?: import('./index').ProductVariant;
}

// ==================== Return Request ====================
export interface ReturnRequest {
  id: string;
  returnNumber: string;
  originalInvoiceId: string;
  customerId?: string;
  branchId: string;
  userId: string;
  items: ReturnItem[];
  reason: ReturnReason;
  status: ReturnStatus;
  totalAmount: number;
  refundMethod: RefundMethod;
  notes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  originalInvoice?: import('./index').Invoice;
  customer?: import('./index').Customer;
  branch?: import('./index').Branch;
  user?: import('./index').User;
  processedByUser?: import('./index').User;
}

// ==================== Helper Labels ====================
export const returnReasonLabels: Record<ReturnReason, { label: string; description: string }> = {
  DEFECTIVE: { label: 'تالف', description: 'المنتج تالف أو معيب' },
  WRONG_ITEM: { label: 'منتج خاطئ', description: 'تم استلام منتج مختلف' },
  NOT_AS_DESCRIBED: { label: 'غير مطابق', description: 'المنتج لا يطابق الوصف' },
  CUSTOMER_CHANGE: { label: 'تغيير رأي', description: 'العميل غير رأيه' },
  OTHER: { label: 'أخرى', description: 'سبب آخر' },
};

export const returnStatusLabels: Record<ReturnStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'قيد المراجعة', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  APPROVED: { label: 'موافق عليه', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
  REJECTED: { label: 'مرفوض', color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
  COMPLETED: { label: 'مكتمل', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
};

export const refundMethodLabels: Record<RefundMethod, { label: string; description: string }> = {
  CASH: { label: 'نقداً', description: 'استرداد المبلغ نقداً' },
  CREDIT: { label: 'رصيد عميل', description: 'إضافة المبلغ لرصيد العميل' },
  EXCHANGE: { label: 'استبدال', description: 'استبدال بمنتج آخر' },
};

// ==================== API Types ====================
export interface CreateReturnRequest {
  originalInvoiceId: string;
  customerId?: string;
  items: {
    invoiceItemId: string;
    productId?: string;
    variantId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    reason?: ReturnReason;
    notes?: string;
  }[];
  reason: ReturnReason;
  refundMethod: RefundMethod;
  notes?: string;
}

export interface UpdateReturnRequest {
  status?: ReturnStatus;
  processedBy?: string;
  notes?: string;
}

export interface ReturnFilters {
  status?: ReturnStatus;
  reason?: ReturnReason;
  refundMethod?: RefundMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// ==================== Statistics Types ====================
export interface ReturnsStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  totalAmount: number;
  pendingAmount: number;
}
