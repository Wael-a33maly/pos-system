// ============================================
// Inventory Types - أنواع الجرد الدوري
// ============================================

// ==================== Enums ====================
export type CountType = 'FULL' | 'PARTIAL' | 'CYCLE' | 'SPOT';
export type CountStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
export type ItemCountStatus = 'PENDING' | 'COUNTED' | 'VERIFIED' | 'ADJUSTED';
export type AdjustmentReason = 'INVENTORY_COUNT' | 'DAMAGE' | 'THEFT' | 'EXPIRY' | 'RETURN_TO_SUPPLIER' | 'SAMPLE' | 'INTERNAL_USE' | 'ERROR_CORRECTION' | 'OTHER';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// ==================== Inventory Count ====================
export interface InventoryCount {
  id: string;
  countNumber: string;
  branchId: string;
  
  countType: CountType;
  status: CountStatus;
  
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  createdBy: string;
  approvedBy?: string;
  completedBy?: string;
  
  totalItems: number;
  countedItems: number;
  discrepancyItems: number;
  totalValue: number;
  discrepancyValue: number;
  
  notes?: string;
  approvalNotes?: string;
  
  items?: InventoryCountItem[];
  branch?: { id: string; name: string; nameAr?: string };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCountItem {
  id: string;
  countId: string;
  productId: string;
  variationId?: string;
  
  systemQty: number;
  countedQty?: number;
  discrepancyQty?: number;
  
  unitCost: number;
  discrepancyValue: number;
  
  status: ItemCountStatus;
  
  countedBy?: string;
  countedAt?: Date;
  
  notes?: string;
  
  product?: { 
    id: string; 
    name: string; 
    nameAr?: string;
    barcode: string;
  };
  
  variation?: {
    id: string;
    name?: string;
    barcode: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Inventory Adjustment ====================
export interface InventoryAdjustment {
  id: string;
  adjustmentNumber: string;
  branchId: string;
  
  reason: AdjustmentReason;
  reference?: string;
  notes?: string;
  
  totalItems: number;
  totalValue: number;
  
  createdBy: string;
  approvedBy?: string;
  
  adjustmentDate: Date;
  approvedAt?: Date;
  
  status: AdjustmentStatus;
  
  items?: InventoryAdjustmentItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryAdjustmentItem {
  id: string;
  adjustmentId: string;
  productId: string;
  variationId?: string;
  
  previousQty: number;
  adjustmentQty: number;
  newQty: number;
  
  unitCost: number;
  adjustmentValue: number;
  
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

// ==================== Form Data ====================
export interface InventoryCountFormData {
  branchId: string;
  countType: CountType;
  scheduledDate?: string;
  notes?: string;
  productIds?: string[];  // للجرد الجزئي
}

export interface InventoryAdjustmentFormData {
  branchId: string;
  reason: AdjustmentReason;
  reference?: string;
  notes?: string;
  items: AdjustmentItemFormData[];
}

export interface AdjustmentItemFormData {
  productId: string;
  variationId?: string;
  adjustmentQty: number;
  notes?: string;
}

// ==================== Stats ====================
export interface InventoryStats {
  totalCounts: number;
  completedCounts: number;
  inProgressCounts: number;
  pendingReviewCounts: number;
  totalAdjustments: number;
  pendingAdjustments: number;
  totalAdjustmentValue: number;
}

// ==================== Labels ====================
export const COUNT_TYPE_LABELS: Record<CountType, { label: string; labelAr: string; color: string }> = {
  FULL: { label: 'Full Count', labelAr: 'جرد شامل', color: 'bg-blue-500' },
  PARTIAL: { label: 'Partial Count', labelAr: 'جرد جزئي', color: 'bg-purple-500' },
  CYCLE: { label: 'Cycle Count', labelAr: 'جرد دوري', color: 'bg-green-500' },
  SPOT: { label: 'Spot Count', labelAr: 'جرد مفاجئ', color: 'bg-amber-500' },
};

export const COUNT_STATUS_LABELS: Record<CountStatus, { label: string; labelAr: string; color: string }> = {
  DRAFT: { label: 'Draft', labelAr: 'مسودة', color: 'bg-gray-500' },
  SCHEDULED: { label: 'Scheduled', labelAr: 'مجدول', color: 'bg-blue-500' },
  IN_PROGRESS: { label: 'In Progress', labelAr: 'جاري', color: 'bg-amber-500' },
  PENDING_REVIEW: { label: 'Pending Review', labelAr: 'في انتظار المراجعة', color: 'bg-purple-500' },
  APPROVED: { label: 'Approved', labelAr: 'معتمد', color: 'bg-green-500' },
  COMPLETED: { label: 'Completed', labelAr: 'مكتمل', color: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', labelAr: 'ملغي', color: 'bg-red-500' },
};

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, { label: string; labelAr: string }> = {
  INVENTORY_COUNT: { label: 'Inventory Count', labelAr: 'جرد' },
  DAMAGE: { label: 'Damage', labelAr: 'تلف' },
  THEFT: { label: 'Theft', labelAr: 'سرقة' },
  EXPIRY: { label: 'Expiry', labelAr: 'انتهاء صلاحية' },
  RETURN_TO_SUPPLIER: { label: 'Return to Supplier', labelAr: 'إرجاع للمورد' },
  SAMPLE: { label: 'Sample', labelAr: 'عينات' },
  INTERNAL_USE: { label: 'Internal Use', labelAr: 'استخدام داخلي' },
  ERROR_CORRECTION: { label: 'Error Correction', labelAr: 'تصحيح خطأ' },
  OTHER: { label: 'Other', labelAr: 'أخرى' },
};
