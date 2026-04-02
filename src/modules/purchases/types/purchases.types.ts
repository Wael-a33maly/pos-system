// ============================================
// Purchases Types - أنواع نظام المشتريات
// ============================================

// ==================== Enums ====================
export type PurchaseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
export type ReceiptStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CANCELLED';

// ==================== Purchase Order ====================
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  branchId?: string;
  
  status: PurchaseStatus;
  
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  
  notes?: string;
  supplierNotes?: string;
  internalNotes?: string;
  
  items?: PurchaseOrderItem[];
  payments?: PurchasePayment[];
  
  supplier?: { 
    id: string; 
    name: string; 
    nameAr?: string;
    phone?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId?: string;
  variationId?: string;
  
  productName: string;
  productBarcode?: string;
  sku?: string;
  
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  
  unitCost: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  totalAmount: number;
  
  expectedDate?: Date;
  notes?: string;
  
  product?: { 
    id: string; 
    name: string; 
    nameAr?: string;
    barcode: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchasePayment {
  id: string;
  orderId: string;
  paymentMethodId?: string;
  
  amount: number;
  reference?: string;
  notes?: string;
  paymentDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Goods Receipt ====================
export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId?: string;
  supplierId: string;
  branchId?: string;
  
  status: ReceiptStatus;
  
  receiptDate: Date;
  
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  
  receivedBy: string;
  approvedBy?: string;
  
  notes?: string;
  
  items?: GoodsReceiptItem[];
  
  purchaseOrder?: PurchaseOrder;
  supplier?: { 
    id: string; 
    name: string; 
    nameAr?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface GoodsReceiptItem {
  id: string;
  receiptId: string;
  productId?: string;
  variationId?: string;
  purchaseOrderItemId?: string;
  
  productName: string;
  productBarcode?: string;
  
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  
  rejectionReason?: string;
  
  unitCost: number;
  totalAmount: number;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Form Data ====================
export interface PurchaseOrderFormData {
  supplierId: string;
  branchId?: string;
  expectedDate?: string;
  notes?: string;
  supplierNotes?: string;
  internalNotes?: string;
  items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
  productId?: string;
  variationId?: string;
  productName: string;
  productBarcode?: string;
  sku?: string;
  orderedQty: number;
  unitCost: number;
  taxRate?: number;
  discountPercent?: number;
  expectedDate?: string;
  notes?: string;
}

export interface GoodsReceiptFormData {
  purchaseOrderId?: string;
  supplierId: string;
  branchId?: string;
  notes?: string;
  items: GoodsReceiptItemFormData[];
}

export interface GoodsReceiptItemFormData {
  productId?: string;
  variationId?: string;
  purchaseOrderItemId?: string;
  productName: string;
  productBarcode?: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty?: number;
  rejectionReason?: string;
  unitCost: number;
  notes?: string;
}

// ==================== Stats ====================
export interface PurchaseStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  overdueOrders: number;
}

// ==================== Labels ====================
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, { label: string; labelAr: string; color: string }> = {
  DRAFT: { label: 'Draft', labelAr: 'مسودة', color: 'bg-gray-500' },
  PENDING: { label: 'Pending', labelAr: 'في الانتظار', color: 'bg-amber-500' },
  APPROVED: { label: 'Approved', labelAr: 'معتمد', color: 'bg-blue-500' },
  ORDERED: { label: 'Ordered', labelAr: 'تم الطلب', color: 'bg-purple-500' },
  PARTIAL: { label: 'Partial Receipt', labelAr: 'استلام جزئي', color: 'bg-cyan-500' },
  RECEIVED: { label: 'Received', labelAr: 'تم الاستلام', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', labelAr: 'ملغي', color: 'bg-red-500' },
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, { label: string; labelAr: string; color: string }> = {
  DRAFT: { label: 'Draft', labelAr: 'مسودة', color: 'bg-gray-500' },
  PENDING: { label: 'Pending', labelAr: 'في الانتظار', color: 'bg-amber-500' },
  APPROVED: { label: 'Approved', labelAr: 'معتمد', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', labelAr: 'ملغي', color: 'bg-red-500' },
};
