// ============================================
// Scheduled Reports Types
// ============================================

export type ScheduleType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ScheduledReport {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  reportType: string;
  scheduleType: ScheduleType;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  filters?: string;
  format: ReportFormat;
  recipients: string;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  id: string;
  scheduledReportId?: string;
  reportType: string;
  parameters?: string;
  status: ExecutionStatus;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
  executedBy?: string;
  createdAt: Date;
}

export const REPORT_TYPES = [
  { value: 'sales', label: 'تقرير المبيعات', icon: 'TrendingUp' },
  { value: 'products', label: 'تقرير المنتجات', icon: 'Package' },
  { value: 'inventory', label: 'تقرير المخزون', icon: 'Warehouse' },
  { value: 'shifts', label: 'تقرير الورديات', icon: 'Clock' },
  { value: 'expenses', label: 'تقرير المصروفات', icon: 'Receipt' },
  { value: 'customers', label: 'تقرير العملاء', icon: 'Users' },
];

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  DAILY: 'يومي',
  WEEKLY: 'أسبوعي',
  MONTHLY: 'شهري',
};

export const FORMAT_LABELS: Record<ReportFormat, string> = {
  PDF: 'PDF',
  EXCEL: 'Excel',
  CSV: 'CSV',
};
