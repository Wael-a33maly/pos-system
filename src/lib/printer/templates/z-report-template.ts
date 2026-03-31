// ==================== قالب تقرير Z ====================

import { ESC_POS, PrinterConfig, ShiftWithRelations } from '../thermal-printer';

// ==================== الأنواع ====================
export interface ZReportTemplateConfig {
  id: string;
  name: string;
  nameAr: string;
  isDefault: boolean;
  isActive: boolean;
  
  // إعدادات الورق
  paperWidth: 58 | 80;
  
  // الهيدر
  showLogo: boolean;
  showCompanyName: boolean;
  showBranchName: boolean;
  showBranchAddress: boolean;
  headerAlignment: 'left' | 'center' | 'right';
  
  // معلومات الوردية
  showShiftId: boolean;
  showUserName: boolean;
  showStartTime: boolean;
  showEndTime: boolean;
  showDuration: boolean;
  
  // إحصائيات الفواتير
  showInvoiceStats: boolean;
  showInvoiceCounts: boolean;
  showReturnCounts: boolean;
  showCancelledCounts: boolean;
  
  // الملخص المالي
  showFinancialSummary: boolean;
  showOpeningCash: boolean;
  showTotalSales: boolean;
  showTotalReturns: boolean;
  showTotalExpenses: boolean;
  showTotalDiscounts: boolean;
  showNetSales: boolean;
  
  // تفصيل المدفوعات
  showPaymentBreakdown: boolean;
  showCashPayments: boolean;
  showCardPayments: boolean;
  showOtherPayments: boolean;
  
  // عد الصندوق
  showCashCount: boolean;
  showExpectedCash: boolean;
  showActualCash: boolean;
  showVariance: boolean;
  highlightVariance: boolean;
  
  // إضافي
  showSeparator: boolean;
  separatorChar: string;
  showTimestamp: boolean;
  showSignature: boolean;
  signatureLabel: string;
  
  // متقدم
  customFooter?: string;
  printTwoCopies: boolean;
}

// ==================== القالب الافتراضي ====================
export const DEFAULT_Z_REPORT_TEMPLATE: ZReportTemplateConfig = {
  id: 'default-z-report',
  name: 'Default Z Report',
  nameAr: 'قالب تقرير Z الافتراضي',
  isDefault: true,
  isActive: true,
  
  paperWidth: 80,
  
  showLogo: false,
  showCompanyName: true,
  showBranchName: true,
  showBranchAddress: true,
  headerAlignment: 'center',
  
  showShiftId: true,
  showUserName: true,
  showStartTime: true,
  showEndTime: true,
  showDuration: true,
  
  showInvoiceStats: true,
  showInvoiceCounts: true,
  showReturnCounts: true,
  showCancelledCounts: true,
  
  showFinancialSummary: true,
  showOpeningCash: true,
  showTotalSales: true,
  showTotalReturns: true,
  showTotalExpenses: true,
  showTotalDiscounts: true,
  showNetSales: true,
  
  showPaymentBreakdown: true,
  showCashPayments: true,
  showCardPayments: true,
  showOtherPayments: true,
  
  showCashCount: true,
  showExpectedCash: true,
  showActualCash: true,
  showVariance: true,
  highlightVariance: true,
  
  showSeparator: true,
  separatorChar: '=',
  showTimestamp: true,
  showSignature: false,
  signatureLabel: 'توقيع الكاشير',
  
  printTwoCopies: false,
};

// ==================== قالب مختصر ====================
export const COMPACT_Z_REPORT_TEMPLATE: ZReportTemplateConfig = {
  id: 'compact-z-report',
  name: 'Compact Z Report',
  nameAr: 'قالب تقرير Z مختصر',
  isDefault: false,
  isActive: true,
  
  paperWidth: 58,
  
  showLogo: false,
  showCompanyName: true,
  showBranchName: true,
  showBranchAddress: false,
  headerAlignment: 'center',
  
  showShiftId: true,
  showUserName: true,
  showStartTime: true,
  showEndTime: true,
  showDuration: false,
  
  showInvoiceStats: false,
  showInvoiceCounts: true,
  showReturnCounts: false,
  showCancelledCounts: false,
  
  showFinancialSummary: true,
  showOpeningCash: true,
  showTotalSales: true,
  showTotalReturns: true,
  showTotalExpenses: false,
  showTotalDiscounts: false,
  showNetSales: true,
  
  showPaymentBreakdown: false,
  showCashPayments: true,
  showCardPayments: true,
  showOtherPayments: false,
  
  showCashCount: true,
  showExpectedCash: true,
  showActualCash: true,
  showVariance: true,
  highlightVariance: true,
  
  showSeparator: true,
  separatorChar: '-',
  showTimestamp: true,
  showSignature: false,
  signatureLabel: '',
  
  printTwoCopies: false,
};

// ==================== ZReportTemplateBuilder Class ====================
export class ZReportTemplateBuilder {
  private template: ZReportTemplateConfig;
  private commands: string[];
  private charsPerLine: number;

  constructor(templateConfig?: Partial<ZReportTemplateConfig>) {
    this.template = { ...DEFAULT_Z_REPORT_TEMPLATE, ...templateConfig };
    this.charsPerLine = this.template.paperWidth === 80 ? 48 : 32;
    this.commands = [];
  }

  // ==================== بناء التقرير ====================
  build(shift: ShiftWithRelations): string {
    this.commands = [];
    
    // تهيئة
    this.commands.push(ESC_POS.INIT);
    this.commands.push(ESC_POS.ENCODING_WPC1256);
    this.commands.push(ESC_POS.UTF_8_ON);
    this.commands.push(ESC_POS.UTF_8_MODE);
    
    // الهيدر
    this.buildHeader(shift);
    
    // معلومات الوردية
    this.buildShiftInfo(shift);
    
    // إحصائيات الفواتير
    if (this.template.showInvoiceStats) {
      this.buildInvoiceStats(shift);
    }
    
    // تفصيل المدفوعات
    if (this.template.showPaymentBreakdown) {
      this.buildPaymentBreakdown(shift);
    }
    
    // الملخص المالي
    this.buildFinancialSummary(shift);
    
    // عد الصندوق
    if (this.template.showCashCount) {
      this.buildCashCount(shift);
    }
    
    // التوقيع
    if (this.template.showSignature) {
      this.buildSignature();
    }
    
    // الخاتمة
    this.buildFooter();
    
    // القص
    this.commands.push(ESC_POS.LINE_FEED.repeat(3));
    this.commands.push(ESC_POS.CUT_PAPER);
    
    return this.commands.join('');
  }

  // ==================== بناء الهيدر ====================
  private buildHeader(shift: ShiftWithRelations): void {
    this.setAlignment(this.template.headerAlignment);
    
    // عنوان التقرير
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push(ESC_POS.SIZE_DOUBLE);
    this.commands.push('╔══════════════════╗\n');
    this.commands.push('║   تقرير Z   ║\n');
    this.commands.push('╚══════════════════╝\n');
    this.commands.push(ESC_POS.SIZE_NORMAL);
    this.commands.push(ESC_POS.BOLD_OFF);
    
    // اسم الشركة
    if (this.template.showCompanyName) {
      this.commands.push(ESC_POS.BOLD_ON);
      this.commands.push('نظام نقاط البيع\n');
      this.commands.push(ESC_POS.BOLD_OFF);
    }
    
    // اسم الفرع
    if (this.template.showBranchName && shift.branch.name) {
      this.commands.push(shift.branch.name + '\n');
    }
    
    // العنوان
    if (this.template.showBranchAddress && shift.branch.address) {
      this.commands.push(shift.branch.address + '\n');
    }
    
    this.addSeparator();
  }

  // ==================== معلومات الوردية ====================
  private buildShiftInfo(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('━━━ معلومات الوردية ━━━\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showShiftId) {
      this.printTwoColumns('رقم الوردية:', shift.id.substring(0, 8));
    }
    
    if (this.template.showUserName) {
      this.printTwoColumns('الكاشير:', shift.user.name);
    }
    
    if (this.template.showStartTime) {
      this.printTwoColumns('وقت الفتح:', this.formatDateTime(shift.startTime));
    }
    
    if (this.template.showEndTime && shift.endTime) {
      this.printTwoColumns('وقت الإغلاق:', this.formatDateTime(shift.endTime));
    }
    
    if (this.template.showDuration && shift.endTime) {
      const duration = this.calculateDuration(shift.startTime, shift.endTime);
      this.printTwoColumns('المدة:', duration);
    }
    
    this.addSeparator();
  }

  // ==================== إحصائيات الفواتير ====================
  private buildInvoiceStats(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('━━━ إحصائيات الفواتير ━━━\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    // حساب الإحصائيات
    const invoices = shift.invoices || [];
    const completed = invoices.filter(i => i.status === 'COMPLETED').length;
    const cancelled = invoices.filter(i => i.status === 'CANCELLED').length;
    const returns = invoices.filter(i => i.isReturn).length;
    
    if (this.template.showInvoiceCounts) {
      this.printTwoColumns('إجمالي الفواتير:', invoices.length.toString());
      this.printTwoColumns('المكتملة:', completed.toString());
    }
    
    if (this.template.showCancelledCounts) {
      this.printTwoColumns('الملغاة:', cancelled.toString());
    }
    
    if (this.template.showReturnCounts) {
      this.printTwoColumns('المرتجعات:', returns.toString());
    }
    
    this.addSeparator();
  }

  // ==================== تفصيل المدفوعات ====================
  private buildPaymentBreakdown(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('━━━ تفصيل المدفوعات ━━━\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    // حساب المدفوعات من الفواتير
    // هذه قيم تقريبية - يجب حسابها من البيانات الفعلية
    const cashPayments = shift.totalPayments; // افتراضي
    const cardPayments = 0; // يحتاج لحساب فعلي
    const otherPayments = 0; // يحتاج لحساب فعلي
    
    if (this.template.showCashPayments) {
      this.printTwoColumns('نقدي:', this.formatCurrency(cashPayments));
    }
    
    if (this.template.showCardPayments) {
      this.printTwoColumns('بطاقة:', this.formatCurrency(cardPayments));
    }
    
    if (this.template.showOtherPayments) {
      this.printTwoColumns('أخرى:', this.formatCurrency(otherPayments));
    }
    
    this.addSeparator();
  }

  // ==================== الملخص المالي ====================
  private buildFinancialSummary(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('━━━ الملخص المالي ━━━\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showOpeningCash) {
      this.printTwoColumns('رصيد الافتتاح:', this.formatCurrency(shift.openingCash));
    }
    
    if (this.template.showTotalSales) {
      this.printTwoColumns('إجمالي المبيعات:', this.formatCurrency(shift.totalSales));
    }
    
    if (this.template.showTotalReturns) {
      this.printTwoColumns('إجمالي المرتجعات:', this.formatCurrency(shift.totalReturns));
    }
    
    if (this.template.showTotalDiscounts) {
      this.printTwoColumns('إجمالي الخصومات:', this.formatCurrency(0)); // يحتاج لحساب
    }
    
    if (this.template.showTotalExpenses) {
      this.printTwoColumns('إجمالي المصروفات:', this.formatCurrency(shift.totalExpenses));
    }
    
    this.addSeparator();
    
    // صافي المبيعات
    if (this.template.showNetSales) {
      const netSales = shift.totalSales - shift.totalReturns - shift.totalExpenses;
      
      this.commands.push(ESC_POS.BOLD_ON);
      this.commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
      this.printTwoColumns('صافي المبيعات:', this.formatCurrency(netSales));
      this.commands.push(ESC_POS.SIZE_NORMAL);
      this.commands.push(ESC_POS.BOLD_OFF);
    }
    
    this.addSeparator();
  }

  // ==================== عد الصندوق ====================
  private buildCashCount(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('━━━ عد الصندوق ━━━\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showExpectedCash && shift.expectedCash !== null) {
      this.printTwoColumns('النقدية المتوقعة:', this.formatCurrency(shift.expectedCash));
    }
    
    if (this.template.showActualCash && shift.closingCash !== null) {
      this.printTwoColumns('النقدية الفعلية:', this.formatCurrency(shift.closingCash));
    }
    
    if (this.template.showVariance && shift.expectedCash !== null && shift.closingCash !== null) {
      const variance = shift.closingCash - shift.expectedCash;
      const varianceText = this.formatCurrency(Math.abs(variance));
      const status = variance < 0 ? ' عجز' : variance > 0 ? ' فائض' : '';
      
      if (this.template.highlightVariance && variance !== 0) {
        this.commands.push(ESC_POS.BOLD_ON);
        this.commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
      }
      
      this.printTwoColumns('الفرق:', varianceText + status);
      
      if (this.template.highlightVariance && variance !== 0) {
        this.commands.push(ESC_POS.SIZE_NORMAL);
        this.commands.push(ESC_POS.BOLD_OFF);
      }
    }
    
    this.addSeparator();
  }

  // ==================== التوقيع ====================
  private buildSignature(): void {
    this.newLine(2);
    this.commands.push(this.template.separatorChar.repeat(30) + '\n');
    this.commands.push(this.template.signatureLabel + '\n');
    this.newLine(1);
  }

  // ==================== الخاتمة ====================
  private buildFooter(): void {
    this.setAlignment('center');
    
    if (this.template.showTimestamp) {
      this.commands.push(`تم الطباعة: ${this.formatDateTime(new Date())}\n`);
    }
    
    if (this.template.customFooter) {
      this.commands.push(this.template.customFooter + '\n');
    }
    
    this.newLine(2);
  }

  // ==================== دوال مساعدة ====================
  
  private setAlignment(align: 'left' | 'center' | 'right'): void {
    switch (align) {
      case 'left':
        this.commands.push(ESC_POS.ALIGN_LEFT);
        break;
      case 'center':
        this.commands.push(ESC_POS.ALIGN_CENTER);
        break;
      case 'right':
        this.commands.push(ESC_POS.ALIGN_RIGHT);
        break;
    }
  }

  private addSeparator(): void {
    if (this.template.showSeparator) {
      this.commands.push(this.template.separatorChar.repeat(this.charsPerLine) + '\n');
    }
  }

  private newLine(count: number = 1): void {
    this.commands.push(ESC_POS.LINE_FEED.repeat(count));
  }

  private printTwoColumns(label: string, value: string): void {
    const labelWidth = Math.floor(this.charsPerLine * 0.5);
    const valueWidth = this.charsPerLine - labelWidth;
    this.commands.push(label.padStart(labelWidth) + value.padStart(valueWidth) + '\n');
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ر.س';
  }

  private formatDateTime(date: Date): string {
    const d = new Date(date);
    return `${d.toLocaleDateString('ar-SA')} ${d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private calculateDuration(start: Date, end: Date): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} ساعة ${minutes} دقيقة`;
  }

  // ==================== الحصول على القوالب المتاحة ====================
  static getAvailableTemplates(): ZReportTemplateConfig[] {
    return [
      DEFAULT_Z_REPORT_TEMPLATE,
      COMPACT_Z_REPORT_TEMPLATE,
    ];
  }
}

// ==================== Export ====================
export const zReportTemplates = {
  default: DEFAULT_Z_REPORT_TEMPLATE,
  compact: COMPACT_Z_REPORT_TEMPLATE,
};
