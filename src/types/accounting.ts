// ==================== أنواع الحسابات ====================

export type AccountType = 
  | 'ASSET'       // أصول
  | 'LIABILITY'   // خصوم
  | 'EQUITY'      // حقوق الملكية
  | 'REVENUE'     // إيرادات
  | 'EXPENSE';    // مصروفات

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  parentId?: string;
  parent?: ChartOfAccount;
  balance: number;
  isActive: boolean;
  children?: ChartOfAccount[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== أنواع القيود المحاسبية ====================

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account?: ChartOfAccount;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== أنواع التقارير المالية ====================

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  asOfDate: Date;
}

export interface IncomeStatementItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  isHeader?: boolean;
  children?: IncomeStatementItem[];
}

export interface IncomeStatement {
  revenues: IncomeStatementItem[];
  totalRevenue: number;
  expenses: IncomeStatementItem[];
  totalExpenses: number;
  netIncome: number;
  fromDate: Date;
  toDate: Date;
}

export interface BalanceSheetItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  isHeader?: boolean;
  children?: BalanceSheetItem[];
}

export interface BalanceSheet {
  assets: BalanceSheetItem[];
  totalAssets: number;
  liabilities: BalanceSheetItem[];
  totalLiabilities: number;
  equity: BalanceSheetItem[];
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  asOfDate: Date;
}

export interface CashFlowItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  category: 'operating' | 'investing' | 'financing';
}

export interface CashFlowStatement {
  operatingActivities: CashFlowItem[];
  totalOperating: number;
  investingActivities: CashFlowItem[];
  totalInvesting: number;
  financingActivities: CashFlowItem[];
  totalFinancing: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  fromDate: Date;
  toDate: Date;
}

// ==================== تسميات الأنواع بالعربية ====================

export const accountTypeLabels: Record<AccountType, { label: string; labelEn: string; color: string }> = {
  ASSET: { label: 'أصول', labelEn: 'Assets', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  LIABILITY: { label: 'خصوم', labelEn: 'Liabilities', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  EQUITY: { label: 'حقوق الملكية', labelEn: 'Equity', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  REVENUE: { label: 'إيرادات', labelEn: 'Revenue', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  EXPENSE: { label: 'مصروفات', labelEn: 'Expenses', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
};

export const journalStatusLabels: Record<JournalEntryStatus, { label: string; color: string }> = {
  DRAFT: { label: 'مسودة', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  POSTED: { label: 'مرحل', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  REVERSED: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

// ==================== أنواع API ====================

export interface CreateAccountRequest {
  code: string;
  name: string;
  nameAr?: string;
  type: AccountType;
  parentId?: string;
  balance?: number;
}

export interface UpdateAccountRequest {
  code?: string;
  name?: string;
  nameAr?: string;
  type?: AccountType;
  parentId?: string;
  isActive?: boolean;
}

export interface CreateJournalEntryRequest {
  date: string;
  description: string;
  reference?: string;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
  status?: JournalEntryStatus;
}

export interface JournalEntryFilter {
  fromDate?: string;
  toDate?: string;
  status?: JournalEntryStatus;
  accountId?: string;
  search?: string;
}

// ==================== حسابات افتراضية ====================

export const defaultAccounts: Partial<ChartOfAccount>[] = [
  // الأصول
  { code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'ASSET' },
  { code: '1100', name: 'Current Assets', nameAr: 'الأصول المتداولة', type: 'ASSET' },
  { code: '1110', name: 'Cash', nameAr: 'النقدية', type: 'ASSET' },
  { code: '1120', name: 'Bank', nameAr: 'البنك', type: 'ASSET' },
  { code: '1130', name: 'Accounts Receivable', nameAr: 'الذمم المدينة', type: 'ASSET' },
  { code: '1140', name: 'Inventory', nameAr: 'المخزون', type: 'ASSET' },
  { code: '1200', name: 'Non-Current Assets', nameAr: 'الأصول الثابتة', type: 'ASSET' },
  { code: '1210', name: 'Property, Plant & Equipment', nameAr: 'الممتلكات والآلات والمعدات', type: 'ASSET' },
  
  // الخصوم
  { code: '2000', name: 'Liabilities', nameAr: 'الخصوم', type: 'LIABILITY' },
  { code: '2100', name: 'Current Liabilities', nameAr: 'الخصوم المتداولة', type: 'LIABILITY' },
  { code: '2110', name: 'Accounts Payable', nameAr: 'الذمم الدائنة', type: 'LIABILITY' },
  { code: '2120', name: 'Accrued Expenses', nameAr: 'المصروفات المستحقة', type: 'LIABILITY' },
  { code: '2200', name: 'Non-Current Liabilities', nameAr: 'الخصوم طويلة الأجل', type: 'LIABILITY' },
  { code: '2210', name: 'Long-term Loans', nameAr: 'القروض طويلة الأجل', type: 'LIABILITY' },
  
  // حقوق الملكية
  { code: '3000', name: 'Equity', nameAr: 'حقوق الملكية', type: 'EQUITY' },
  { code: '3100', name: 'Capital', nameAr: 'رأس المال', type: 'EQUITY' },
  { code: '3200', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: 'EQUITY' },
  { code: '3300', name: 'Current Year Earnings', nameAr: 'أرباح السنة الحالية', type: 'EQUITY' },
  
  // الإيرادات
  { code: '4000', name: 'Revenue', nameAr: 'الإيرادات', type: 'REVENUE' },
  { code: '4100', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'REVENUE' },
  { code: '4200', name: 'Other Revenue', nameAr: 'إيرادات أخرى', type: 'REVENUE' },
  { code: '4300', name: 'Discounts Received', nameAr: 'الخصومات المكتسبة', type: 'REVENUE' },
  
  // المصروفات
  { code: '5000', name: 'Expenses', nameAr: 'المصروفات', type: 'EXPENSE' },
  { code: '5100', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'EXPENSE' },
  { code: '5200', name: 'Operating Expenses', nameAr: 'مصروفات التشغيل', type: 'EXPENSE' },
  { code: '5210', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'EXPENSE' },
  { code: '5220', name: 'Rent Expense', nameAr: 'إيجار', type: 'EXPENSE' },
  { code: '5230', name: 'Utilities Expense', nameAr: 'مرافق', type: 'EXPENSE' },
  { code: '5240', name: 'Depreciation Expense', nameAr: 'إهلاك', type: 'EXPENSE' },
  { code: '5300', name: 'Other Expenses', nameAr: 'مصروفات أخرى', type: 'EXPENSE' },
];
