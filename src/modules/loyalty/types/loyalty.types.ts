// ============================================
// Loyalty Types - أنواع نظام الولاء
// ============================================

// ==================== Enums ====================
export type LoyaltyTransactionType = 
  | 'EARN'
  | 'REDEEM'
  | 'EXPIRE'
  | 'BONUS'
  | 'ADJUST'
  | 'REFUND';

// ==================== Loyalty Tier ====================
export interface LoyaltyTier {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  
  discountPercent: number;
  pointsMultiplier: number;
  freeShipping: boolean;
  specialOffers: boolean;
  
  color: string;
  icon?: string;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Customer Loyalty ====================
export interface CustomerLoyalty {
  id: string;
  customerId: string;
  tierId?: string;
  
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  expiredPoints: number;
  
  totalPurchases: number;
  totalVisits: number;
  lastVisitAt?: Date;
  
  pointsExpiryAt?: Date;
  
  tier?: LoyaltyTier;
  transactions?: LoyaltyTransaction[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Loyalty Transaction ====================
export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  invoiceId?: string;
  
  type: LoyaltyTransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  
  description?: string;
  expiresAt?: Date;
  
  createdAt: Date;
}

// ==================== Loyalty Settings ====================
export interface LoyaltySetting {
  id: string;
  isEnabled: boolean;
  
  pointsPerCurrency: number;
  currencyPerPoint: number;
  
  minRedeemPoints: number;
  maxRedeemPercent: number;
  
  pointsValidityDays: number;
  
  welcomeBonusPoints: number;
  birthdayBonusPoints: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Form Data ====================
export interface LoyaltyTierFormData {
  name: string;
  nameAr: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  discountPercent: number;
  pointsMultiplier: number;
  freeShipping: boolean;
  specialOffers: boolean;
  color: string;
  icon?: string;
}

export interface RedeemPointsData {
  customerId: string;
  points: number;
  invoiceId?: string;
}

// ==================== Stats ====================
export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalRewardsGiven: number;
  tierDistribution: { tier: LoyaltyTier; count: number }[];
}

// ==================== Default Settings ====================
export const DEFAULT_LOYALTY_SETTINGS: LoyaltySetting = {
  id: 'default',
  isEnabled: false,
  pointsPerCurrency: 1,
  currencyPerPoint: 0.1,
  minRedeemPoints: 100,
  maxRedeemPercent: 50,
  pointsValidityDays: 365,
  welcomeBonusPoints: 0,
  birthdayBonusPoints: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ==================== Tier Labels ====================
export const TIER_COLORS = [
  { name: 'برونزي', color: '#CD7F32' },
  { name: 'فضي', color: '#C0C0C0' },
  { name: 'ذهبي', color: '#FFD700' },
  { name: 'بلاتيني', color: '#E5E4E2' },
  { name: 'ماسي', color: '#B9F2FF' },
];

export const TRANSACTION_TYPE_LABELS: Record<LoyaltyTransactionType, { label: string; color: string }> = {
  EARN: { label: 'كسب نقاط', color: 'text-emerald-600' },
  REDEEM: { label: 'استبدال نقاط', color: 'text-blue-600' },
  EXPIRE: { label: 'انتهاء صلاحية', color: 'text-red-600' },
  BONUS: { label: 'مكافأة', color: 'text-purple-600' },
  ADJUST: { label: 'تعديل', color: 'text-amber-600' },
  REFUND: { label: 'استرداد', color: 'text-cyan-600' },
};
