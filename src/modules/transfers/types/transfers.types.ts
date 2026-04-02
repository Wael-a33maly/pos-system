// ============================================
// Transfers Types - أنواع التحويلات
// ============================================

// ==================== Enums ====================
export type StockTransferStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'PARTIAL'
  | 'CANCELLED';

// ==================== Transfer Item ====================
export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  variationId?: string;
  
  requestedQty: number;
  approvedQty?: number;
  shippedQty?: number;
  receivedQty?: number;
  
  unitCost: number;
  totalCost: number;
  
  notes?: string;
  discrepancyQty?: number;
  discrepancyReason?: string;
  
  product?: {
    id: string;
    name: string;
    barcode: string;
    unit: string;
  };
  variation?: {
    id: string;
    name?: string;
    barcode: string;
    price: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Stock Transfer ====================
export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  status: StockTransferStatus;
  
  notes?: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  
  requestedAt: Date;
  approvedAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  
  requestedBy: string;
  approvedBy?: string;
  shippedBy?: string;
  receivedBy?: string;
  
  rejectionReason?: string;
  cancellationReason?: string;
  
  items?: StockTransferItem[];
  
  fromBranch?: {
    id: string;
    name: string;
  };
  toBranch?: {
    id: string;
    name: string;
  };
  
  requestedByUser?: {
    id: string;
    name: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Form Data ====================
export interface TransferFormData {
  toBranchId: string;
  notes?: string;
  items: TransferItemFormData[];
}

export interface TransferItemFormData {
  productId: string;
  variationId?: string;
  requestedQty: number;
  unitCost: number;
  notes?: string;
}

// ==================== Stats ====================
export interface TransferStats {
  totalTransfers: number;
  pendingTransfers: number;
  inTransitTransfers: number;
  completedTransfers: number;
  totalValue: number;
}

// ==================== Status Labels ====================
export const STATUS_LABELS: Record<StockTransferStatus, { label: string; color: string }> = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-amber-500' },
  APPROVED: { label: 'تم الاعتماد', color: 'bg-blue-500' },
  REJECTED: { label: 'مرفوض', color: 'bg-red-500' },
  IN_TRANSIT: { label: 'قيد النقل', color: 'bg-purple-500' },
  RECEIVED: { label: 'تم الاستلام', color: 'bg-emerald-500' },
  PARTIAL: { label: 'استلام جزئي', color: 'bg-orange-500' },
  CANCELLED: { label: 'ملغي', color: 'bg-gray-500' },
};
