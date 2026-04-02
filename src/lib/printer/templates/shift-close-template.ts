// ==================== قالب إغلاق الوردية ====================

import { ESC_POS, ShiftWithRelations } from '../thermal-printer';

// ==================== الأنواع ====================
export interface ShiftCloseTemplateConfig {
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
  headerAlignment: 'left' | 'center' | 'right';
  
  // معلومات الوردية
  showShiftNumber: boolean;
  showUserName: boolean;
  showClosedBy: boolean;
  showStartTime: boolean;
  showEndTime: boolean;
  showDuration: boolean;
  
  // ملخص الفواتير
  showInvoiceSummary: boolean;
  showTotalInvoices: boolean;
  showCompletedInvoices: boolean;
  showCancelledInvoices: boolean;
  showReturnInvoices: boolean;
  
  // تفصيل المبيعات
  showSalesBreakdown: boolean;
  showCashSales: boolean;
  showCardSales: boolean;
  showOtherSales: boolean;
  
  // الإجماليات
  showTotals: boolean;
  showTotalSales: boolean;
  showTotalReturns: boolean;
  showTotalDiscounts: boolean;
  showTotalExpenses: boolean;
  showNetTotal: boolean;
  
  // عد النقدية
  showCashCount: boolean;
  showOpeningCash: boolean;
  showExpectedCash: boolean;
  showActualCash: boolean;
  showVariance: boolean;
  varianceThreshold: number; // عتبة التنبيه
  
  // التوقيع
  showSignature: boolean;
  signatureLabel: string;
  showManagerSignature: boolean;
  managerSignatureLabel: string;
  
  // إضافي
  showSeparator: boolean;
  separatorChar: string;
  showTimestamp: boolean;
  notes?: string;
  
  // متقدم
  customFooter?: string;
  autoPrint: boolean;
}

// ==================== القالب الافتراضي ====================
export const DEFAULT_SHIFT_CLOSE_TEMPLATE: ShiftCloseTemplateConfig = {
  id: 'default-shift-close',
  name: 'Default Shift Close',
  nameAr: 'قالب إغلاق الوردية الافتراضي',
  isDefault: true,
  isActive: true,
  
  paperWidth: 80,
  
  showLogo: false,
  showCompanyName: true,
  showBranchName: true,
  headerAlignment: 'center',
  
  showShiftNumber: true,
  showUserName: true,
  showClosedBy: true,
  showStartTime: true,
  showEndTime: true,
  showDuration: true,
  
  showInvoiceSummary: true,
  showTotalInvoices: true,
  showCompletedInvoices: true,
  showCancelledInvoices: true,
  showReturnInvoices: true,
  
  showSalesBreakdown: true,
  showCashSales: true,
  showCardSales: true,
  showOtherSales: true,
  
  showTotals: true,
  showTotalSales: true,
  showTotalReturns: true,
  showTotalDiscounts: true,
  showTotalExpenses: true,
  showNetTotal: true,
  
  showCashCount: true,
  showOpeningCash: true,
  showExpectedCash: true,
  showActualCash: true,
  showVariance: true,
  varianceThreshold: 10,
  
  showSignature: true,
  signatureLabel: 'توقيع الكاشير',
  showManagerSignature: true,
  managerSignatureLabel: 'توقيع المشرف',
  
  showSeparator: true,
  separatorChar: '-',
  showTimestamp: true,
  
  autoPrint: true,
};

// ==================== قالب مختصر ====================
export const COMPACT_SHIFT_CLOSE_TEMPLATE: ShiftCloseTemplateConfig = {
  id: 'compact-shift-close',
  name: 'Compact Shift Close',
  nameAr: 'قالب إغلاق وردية مختصر',
  isDefault: false,
  isActive: true,
  
  paperWidth: 58,
  
  showLogo: false,
  showCompanyName: true,
  showBranchName: true,
  headerAlignment: 'center',
  
  showShiftNumber: true,
  showUserName: true,
  showClosedBy: false,
  showStartTime: true,
  showEndTime: true,
  showDuration: false,
  
  showInvoiceSummary: false,
  showTotalInvoices: true,
  showCompletedInvoices: false,
  showCancelledInvoices: false,
  showReturnInvoices: false,
  
  showSalesBreakdown: false,
  showCashSales: true,
  showCardSales: true,
  showOtherSales: false,
  
  showTotals: true,
  showTotalSales: true,
  showTotalReturns: true,
  showTotalDiscounts: false,
  showTotalExpenses: false,
  showNetTotal: true,
  
  showCashCount: true,
  showOpeningCash: true,
  showExpectedCash: true,
  showActualCash: true,
  showVariance: true,
  varianceThreshold: 5,
  
  showSignature: false,
  signatureLabel: '',
  showManagerSignature: false,
  managerSignatureLabel: '',
  
  showSeparator: true,
  separatorChar: '-',
  showTimestamp: true,
  
  autoPrint: true,
};

// ==================== ShiftCloseTemplateBuilder Class ====================
export class ShiftCloseTemplateBuilder {
  private template: ShiftCloseTemplateConfig;
  private commands: string[];
  private charsPerLine: number;

  constructor(templateConfig?: Partial<ShiftCloseTemplateConfig>) {
    this.template = { ...DEFAULT_SHIFT_CLOSE_TEMPLATE, ...templateConfig };
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
    
    // ملخص الفواتير
    if (this.template.showInvoiceSummary) {
      this.buildInvoiceSummary(shift);
    }
    
    // تفصيل المبيعات
    if (this.template.showSalesBreakdown) {
      this.buildSalesBreakdown(shift);
    }
    
    // الإجماليات
    this.buildTotals(shift);
    
    // عد النقدية
    if (this.template.showCashCount) {
      this.buildCashCount(shift);
    }
    
    // التوقيعات
    if (this.template.showSignature || this.template.showManagerSignature) {
      this.buildSignatures();
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
    this.commands.push('══════════════════\n');
    this.commands.push('  إغلاق الوردية\n');
    this.commands.push('══════════════════\n');
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
    
    this.addSeparator();
  }

  // ==================== معلومات الوردية ====================
  private buildShiftInfo(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('>>> معلومات الوردية <<<\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showShiftNumber) {
      this.printTwoColumns('رقم الوردية:', `#${shift.id.substring(0, 6)}`);
    }
    
    if (this.template.showUserName) {
      this.printTwoColumns('الكاشير:', shift.user.name);
    }
    
    if (this.template.showClosedBy && shift.closedByUser) {
      this.printTwoColumns('أغلق بواسطة:', shift.closedByUser.name);
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

  // ==================== ملخص الفواتير ====================
  private buildInvoiceSummary(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('>>> ملخص الفواتير <<<\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    const invoices = shift.invoices || [];
    const completed = invoices.filter(i => i.status === 'COMPLETED').length;
    const cancelled = invoices.filter(i => i.status === 'CANCELLED').length;
    const returns = invoices.filter(i => i.isReturn).length;
    
    if (this.template.showTotalInvoices) {
      this.printTwoColumns('إجمالي الفواتير:', invoices.length.toString());
    }
    
    if (this.template.showCompletedInvoices) {
      this.printTwoColumns('المكتملة:', completed.toString());
    }
    
    if (this.template.showCancelledInvoices) {
      this.printTwoColumns('الملغاة:', cancelled.toString());
    }
    
    if (this.template.showReturnInvoices) {
      this.printTwoColumns('المرتجعات:', returns.toString());
    }
    
    this.addSeparator();
  }

  // ==================== تفصيل المبيعات ====================
  private buildSalesBreakdown(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('>>> تفصيل المبيعات <<<\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    // حساب المبيعات حسب طريقة الدفع
    // هذه قيم تقريبية - يجب حسابها من البيانات الفعلية
    const cashSales = shift.totalPayments; // افتراضي
    const cardSales = 0;
    const otherSales = 0;
    
    if (this.template.showCashSales) {
      this.printTwoColumns('نقدي:', this.formatCurrency(cashSales));
    }
    
    if (this.template.showCardSales) {
      this.printTwoColumns('بطاقة:', this.formatCurrency(cardSales));
    }
    
    if (this.template.showOtherSales) {
      this.printTwoColumns('أخرى:', this.formatCurrency(otherSales));
    }
    
    this.addSeparator();
  }

  // ==================== الإجماليات ====================
  private buildTotals(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('>>> الإجماليات <<<\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showTotalSales) {
      this.printTwoColumns('إجمالي المبيعات:', this.formatCurrency(shift.totalSales));
    }
    
    if (this.template.showTotalReturns) {
      this.printTwoColumns('المرتجعات:', this.formatCurrency(shift.totalReturns));
    }
    
    if (this.template.showTotalDiscounts) {
      this.printTwoColumns('الخصومات:', this.formatCurrency(0)); // يحتاج لحساب
    }
    
    if (this.template.showTotalExpenses) {
      this.printTwoColumns('المصروفات:', this.formatCurrency(shift.totalExpenses));
    }
    
    this.addSeparator();
    
    // صافي الإجمالي
    if (this.template.showNetTotal) {
      const netTotal = shift.totalSales - shift.totalReturns - shift.totalExpenses;
      
      this.commands.push(ESC_POS.BOLD_ON);
      this.commands.push(ESC_POS.SIZE_DOUBLE);
      this.printTwoColumns('الصافي:', this.formatCurrency(netTotal));
      this.commands.push(ESC_POS.SIZE_NORMAL);
      this.commands.push(ESC_POS.BOLD_OFF);
    }
    
    this.addSeparator();
  }

  // ==================== عد النقدية ====================
  private buildCashCount(shift: ShiftWithRelations): void {
    this.setAlignment('right');
    
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push('>>> عد النقدية <<<\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showOpeningCash) {
      this.printTwoColumns('الافتتاحي:', this.formatCurrency(shift.openingCash));
    }
    
    if (this.template.showExpectedCash && shift.expectedCash !== null) {
      this.printTwoColumns('المتوقع:', this.formatCurrency(shift.expectedCash));
    }
    
    if (this.template.showActualCash && shift.closingCash !== null) {
      this.printTwoColumns('الفعلي:', this.formatCurrency(shift.closingCash));
    }
    
    // الفرق
    if (this.template.showVariance && shift.expectedCash !== null && shift.closingCash !== null) {
      const variance = shift.closingCash - shift.expectedCash;
      const absVariance = Math.abs(variance);
      const varianceText = this.formatCurrency(absVariance);
      
      let status = '';
      if (variance < 0) {
        status = ' عجز ⚠️';
      } else if (variance > 0) {
        status = ' فائض';
      }
      
      // تمييز الفرق إذا تجاوز العتبة
      const isWarning = absVariance > this.template.varianceThreshold;
      
      if (isWarning) {
        this.commands.push(ESC_POS.BOLD_ON);
        this.commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
        // إضافة رمز تنبيه للعجز الكبير
        if (variance < 0) {
          this.commands.push('*** تنبيه: عجز كبير ***\n');
        }
      }
      
      this.printTwoColumns('الفرق:', varianceText + status);
      
      if (isWarning) {
        this.commands.push(ESC_POS.SIZE_NORMAL);
        this.commands.push(ESC_POS.BOLD_OFF);
      }
    }
    
    this.addSeparator();
  }

  // ==================== التوقيعات ====================
  private buildSignatures(): void {
    this.newLine(2);
    
    if (this.template.showSignature) {
      this.commands.push(this.template.separatorChar.repeat(25) + '\n');
      this.commands.push(this.template.signatureLabel + '\n');
      this.newLine(2);
    }
    
    if (this.template.showManagerSignature) {
      this.commands.push(this.template.separatorChar.repeat(25) + '\n');
      this.commands.push(this.template.managerSignatureLabel + '\n');
      this.newLine(1);
    }
  }

  // ==================== الخاتمة ====================
  private buildFooter(): void {
    this.setAlignment('center');
    
    // ملاحظات
    if (this.template.notes) {
      this.commands.push('ملاحظة: ' + this.template.notes + '\n');
    }
    
    // الطابع الزمني
    if (this.template.showTimestamp) {
      this.commands.push(`تم الطباعة: ${this.formatDateTime(new Date())}\n`);
    }
    
    // فوتر مخصص
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
    
    return `${hours} س ${minutes} د`;
  }

  // ==================== الحصول على القوالب المتاحة ====================
  static getAvailableTemplates(): ShiftCloseTemplateConfig[] {
    return [
      DEFAULT_SHIFT_CLOSE_TEMPLATE,
      COMPACT_SHIFT_CLOSE_TEMPLATE,
    ];
  }
}

// ==================== Export ====================
export const shiftCloseTemplates = {
  default: DEFAULT_SHIFT_CLOSE_TEMPLATE,
  compact: COMPACT_SHIFT_CLOSE_TEMPLATE,
};
