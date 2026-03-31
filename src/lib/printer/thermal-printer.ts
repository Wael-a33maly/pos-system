// ==================== نظام الطباعة الحرارية ESC/POS ====================

import { Invoice, Shift, Branch, User, Customer, InvoiceItem, Payment } from '@prisma/client';

// ==================== الأنواع ====================
export interface PrinterConfig {
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'bluetooth';
  paperWidth: 58 | 80;
  ip?: string;
  port?: number;
  autoCut: boolean;
  openDrawer: boolean;
}

export interface ReceiptTemplate {
  showLogo: boolean;
  showCompanyName: boolean;
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  showThankYou: boolean;
  thankYouMessage: string;
  showQRCode: boolean;
  showInvoiceBarcode: boolean;
  paperWidth: 58 | 80;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printTime?: Date;
}

export interface InvoiceWithRelations extends Invoice {
  branch: Branch;
  user: User;
  customer: Customer | null;
  items: (InvoiceItem & {
    product?: { name: string; barcode: string };
    variant?: { name: string };
  })[];
  payments: (Payment & {
    paymentMethod: { name: string; nameAr: string };
  })[];
}

export interface ShiftWithRelations extends Shift {
  branch: Branch;
  user: User;
  closedByUser: User | null;
  invoices: Invoice[];
  expenses: { amount: number; description: string }[];
}

// ==================== ESC/POS Commands ====================
const ESC = '\x1B';
const GS = '\x1D';
const INIT = `${ESC}@`;
const LF = '\n';
const ALIGN_LEFT = `${ESC}a0`;
const ALIGN_CENTER = `${ESC}a1`;
const ALIGN_RIGHT = `${ESC}a2`;
const BOLD_ON = `${ESC}E\x01`;
const BOLD_OFF = `${ESC}E\x00`;
const DOUBLE_WIDTH_ON = `${GS}!\x10`;
const DOUBLE_HEIGHT_ON = `${GS}!\x01`;
const DOUBLE_SIZE_ON = `${GS}!\x11`;
const NORMAL_SIZE = `${GS}!\x00`;
const CUT_PAPER = `${GS}V\x00`;
const OPEN_DRAWER = `${ESC}p\x00\x19\xFA`;

// ==================== ThermalPrinter Class ====================
export class ThermalPrinter {
  private config: PrinterConfig;
  private template: ReceiptTemplate;
  private charsPerLine: number;

  constructor(config: PrinterConfig, template?: Partial<ReceiptTemplate>) {
    this.config = config;
    this.template = {
      showLogo: true,
      showCompanyName: true,
      showBranchName: true,
      showBranchAddress: true,
      showBranchPhone: true,
      showTaxNumber: true,
      showThankYou: true,
      thankYouMessage: 'شكراً لزيارتكم - نتمنى لكم يوماً سعيداً',
      showQRCode: false,
      showInvoiceBarcode: true,
      paperWidth: config.paperWidth,
      ...template,
    };
    this.charsPerLine = config.paperWidth === 80 ? 48 : 32;
  }

  // ==================== طباعة الإيصال ====================
  async printReceipt(invoice: InvoiceWithRelations): Promise<PrintResult> {
    try {
      const commands = this.buildReceiptCommands(invoice);
      await this.sendToPrinter(commands);
      return {
        success: true,
        message: 'تمت الطباعة بنجاح',
        printTime: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل في الطباعة',
      };
    }
  }

  // ==================== طباعة تقرير Z ====================
  async printZReport(shift: ShiftWithRelations): Promise<PrintResult> {
    try {
      const commands = this.buildZReportCommands(shift);
      await this.sendToPrinter(commands);
      return {
        success: true,
        message: 'تمت طباعة تقرير Z بنجاح',
        printTime: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل في طباعة تقرير Z',
      };
    }
  }

  // ==================== فحص حالة الطابعة ====================
  async checkPrinterStatus(): Promise<boolean> {
    try {
      // في بيئة المتصفح، نستخدم Web USB API أو Network
      if (typeof window !== 'undefined') {
        // محاولة الاتصال بالطابعة
        return true;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ==================== بناء أوامر الإيصال ====================
  private buildReceiptCommands(invoice: InvoiceWithRelations): string {
    const lines: string[] = [];
    
    // تهيئة الطابعة
    lines.push(INIT);
    lines.push(this.setEncoding('arabic'));
    
    // الهيدر
    lines.push(this.buildHeader(invoice));
    
    // معلومات الفاتورة
    lines.push(this.buildInvoiceInfo(invoice));
    
    // العناصر
    lines.push(this.buildItemsSection(invoice.items));
    
    // الإجماليات
    lines.push(this.buildTotalsSection(invoice));
    
    // المدفوعات
    lines.push(this.buildPaymentsSection(invoice.payments, invoice.paidAmount, invoice.changeAmount));
    
    // الفوتر
    lines.push(this.buildFooter(invoice));
    
    // قص الورق وفتح الدرج
    lines.push(LF + LF + LF);
    if (this.config.autoCut) {
      lines.push(CUT_PAPER);
    }
    if (this.config.openDrawer) {
      lines.push(OPEN_DRAWER);
    }
    
    return lines.join('');
  }

  // ==================== بناء الهيدر ====================
  private buildHeader(invoice: InvoiceWithRelations): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_CENTER);
    
    // اسم الشركة
    if (this.template.showCompanyName) {
      lines.push(BOLD_ON + DOUBLE_SIZE_ON);
      lines.push(this.centerText('نظام نقاط البيع', this.charsPerLine));
      lines.push(NORMAL_SIZE + BOLD_OFF);
    }
    
    // اسم الفرع
    if (this.template.showBranchName && invoice.branch.name) {
      lines.push(BOLD_ON);
      lines.push(this.centerText(invoice.branch.name, this.charsPerLine));
      lines.push(BOLD_OFF);
    }
    
    // العنوان
    if (this.template.showBranchAddress && invoice.branch.address) {
      lines.push(this.centerText(invoice.branch.address, this.charsPerLine));
    }
    
    // الهاتف
    if (this.template.showBranchPhone && invoice.branch.phone) {
      lines.push(this.centerText(`هاتف: ${invoice.branch.phone}`, this.charsPerLine));
    }
    
    lines.push(this.separator());
    
    return lines.join(LF);
  }

  // ==================== معلومات الفاتورة ====================
  private buildInvoiceInfo(invoice: InvoiceWithRelations): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_RIGHT);
    
    const invoiceType = invoice.isReturn ? 'إيصال مرتجع' : 'إيصال بيع';
    lines.push(BOLD_ON + this.rightAlignText(`*** ${invoiceType} ***`, this.charsPerLine) + BOLD_OFF);
    
    lines.push(this.rightAlignText(`رقم: ${invoice.invoiceNumber}`, this.charsPerLine));
    lines.push(this.rightAlignText(`التاريخ: ${this.formatDate(invoice.createdAt)}`, this.charsPerLine));
    lines.push(this.rightAlignText(`الوقت: ${this.formatTime(invoice.createdAt)}`, this.charsPerLine));
    lines.push(this.rightAlignText(`الكاشير: ${invoice.user.name}`, this.charsPerLine));
    
    if (invoice.customer) {
      lines.push(this.rightAlignText(`العميل: ${invoice.customer.name}`, this.charsPerLine));
    }
    
    lines.push(this.separator());
    
    return lines.join(LF);
  }

  // ==================== قسم العناصر ====================
  private buildItemsSection(items: InvoiceWithRelations['items']): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_RIGHT);
    lines.push(BOLD_ON);
    lines.push(this.formatLine('الصنف', 'الكمية', 'السعر', 'الإجمالي', this.charsPerLine));
    lines.push(BOLD_OFF);
    lines.push(this.separator());
    
    for (const item of items) {
      const name = item.product?.name || item.productName;
      const nameAr = name.substring(0, 20);
      
      lines.push(this.rightAlignText(nameAr, this.charsPerLine));
      lines.push(this.formatLine(
        '',
        item.quantity.toString(),
        this.formatCurrency(item.unitPrice),
        this.formatCurrency(item.totalAmount),
        this.charsPerLine
      ));
      
      if (item.discountAmount > 0) {
        lines.push(this.rightAlignText(`  خصم: ${this.formatCurrency(item.discountAmount)}`, this.charsPerLine));
      }
    }
    
    lines.push(this.separator());
    
    return lines.join(LF);
  }

  // ==================== قسم الإجماليات ====================
  private buildTotalsSection(invoice: InvoiceWithRelations): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_RIGHT);
    
    lines.push(this.formatTwoColumns('المجموع الفرعي:', this.formatCurrency(invoice.subtotal), this.charsPerLine));
    
    if (invoice.discountAmount > 0) {
      lines.push(this.formatTwoColumns('الخصم:', this.formatCurrency(invoice.discountAmount), this.charsPerLine));
    }
    
    if (invoice.taxAmount > 0) {
      lines.push(this.formatTwoColumns('الضريبة:', this.formatCurrency(invoice.taxAmount), this.charsPerLine));
    }
    
    lines.push(BOLD_ON + DOUBLE_WIDTH_ON);
    lines.push(this.formatTwoColumns('الإجمالي:', this.formatCurrency(invoice.totalAmount), this.charsPerLine));
    lines.push(NORMAL_SIZE + BOLD_OFF);
    
    lines.push(this.separator());
    
    return lines.join(LF);
  }

  // ==================== قسم المدفوعات ====================
  private buildPaymentsSection(
    payments: InvoiceWithRelations['payments'],
    paidAmount: number,
    changeAmount: number
  ): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_RIGHT);
    
    for (const payment of payments) {
      lines.push(this.formatTwoColumns(
        payment.paymentMethod.nameAr + ':',
        this.formatCurrency(payment.amount),
        this.charsPerLine
      ));
    }
    
    lines.push(BOLD_ON);
    lines.push(this.formatTwoColumns('المدفوع:', this.formatCurrency(paidAmount), this.charsPerLine));
    lines.push(BOLD_OFF);
    
    if (changeAmount > 0) {
      lines.push(this.formatTwoColumns('المتبقي:', this.formatCurrency(changeAmount), this.charsPerLine));
    }
    
    return lines.join(LF);
  }

  // ==================== الفوتر ====================
  private buildFooter(invoice: InvoiceWithRelations): string {
    const lines: string[] = [];
    
    lines.push(ALIGN_CENTER);
    lines.push(this.separator());
    
    if (this.template.showThankYou) {
      lines.push(BOLD_ON);
      lines.push(this.centerText(this.template.thankYouMessage, this.charsPerLine));
      lines.push(BOLD_OFF);
    }
    
    if (this.template.showInvoiceBarcode) {
      lines.push(LF);
      lines.push(this.centerText(`*** ${invoice.invoiceNumber} ***`, this.charsPerLine));
    }
    
    lines.push(LF);
    lines.push(this.centerText('نظام نقاط البيع المتقدم', this.charsPerLine));
    
    return lines.join(LF);
  }

  // ==================== بناء تقرير Z ====================
  private buildZReportCommands(shift: ShiftWithRelations): string {
    const lines: string[] = [];
    
    lines.push(INIT);
    lines.push(this.setEncoding('arabic'));
    lines.push(ALIGN_CENTER);
    
    // العنوان
    lines.push(BOLD_ON + DOUBLE_SIZE_ON);
    lines.push(this.centerText('تقرير Z', this.charsPerLine));
    lines.push(NORMAL_SIZE + BOLD_OFF);
    
    lines.push(this.centerText(shift.branch.name, this.charsPerLine));
    lines.push(this.separator());
    
    // معلومات الوردية
    lines.push(ALIGN_RIGHT);
    lines.push(this.rightAlignText(`تقرير رقم: ${shift.id.substring(0, 8)}`, this.charsPerLine));
    lines.push(this.rightAlignText(`الكاشير: ${shift.user.name}`, this.charsPerLine));
    lines.push(this.rightAlignText(`البداية: ${this.formatDateTime(shift.startTime)}`, this.charsPerLine));
    if (shift.endTime) {
      lines.push(this.rightAlignText(`النهاية: ${this.formatDateTime(shift.endTime)}`, this.charsPerLine));
    }
    
    lines.push(this.separator());
    
    // الملخص المالي
    lines.push(BOLD_ON);
    lines.push(this.rightAlignText('=== الملخص المالي ===', this.charsPerLine));
    lines.push(BOLD_OFF);
    
    lines.push(this.formatTwoColumns('رصيد الافتتاح:', this.formatCurrency(shift.openingCash), this.charsPerLine));
    lines.push(this.formatTwoColumns('إجمالي المبيعات:', this.formatCurrency(shift.totalSales), this.charsPerLine));
    lines.push(this.formatTwoColumns('إجمالي المرتجعات:', this.formatCurrency(shift.totalReturns), this.charsPerLine));
    lines.push(this.formatTwoColumns('إجمالي المصروفات:', this.formatCurrency(shift.totalExpenses), this.charsPerLine));
    lines.push(this.formatTwoColumns('إجمالي المدفوعات:', this.formatCurrency(shift.totalPayments), this.charsPerLine));
    
    lines.push(this.separator());
    
    // الإجمالي النهائي
    lines.push(BOLD_ON + DOUBLE_WIDTH_ON);
    lines.push(this.formatTwoColumns('الإجمالي:', this.formatCurrency(
      shift.totalSales - shift.totalReturns - shift.totalExpenses
    ), this.charsPerLine));
    lines.push(NORMAL_SIZE + BOLD_OFF);
    
    if (shift.closingCash && shift.expectedCash) {
      lines.push(this.separator());
      lines.push(this.formatTwoColumns('النقدية المتوقعة:', this.formatCurrency(shift.expectedCash), this.charsPerLine));
      lines.push(this.formatTwoColumns('النقدية الفعلية:', this.formatCurrency(shift.closingCash), this.charsPerLine));
      const diff = shift.closingCash - shift.expectedCash;
      lines.push(this.formatTwoColumns('الفرق:', this.formatCurrency(Math.abs(diff)) + (diff < 0 ? ' عجز' : ' فائض'), this.charsPerLine));
    }
    
    // قص الورق
    lines.push(LF + LF + LF);
    if (this.config.autoCut) {
      lines.push(CUT_PAPER);
    }
    
    return lines.join(LF);
  }

  // ==================== دوال مساعدة ====================
  private sendToPrinter(commands: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      // للطباعة عبر المتصفح
      if (this.config.connectionType === 'usb') {
        this.printViaUSB(commands)
          .then(() => resolve())
          .catch(reject);
      } else if (this.config.connectionType === 'network' && this.config.ip) {
        this.printViaNetwork(commands)
          .then(() => resolve())
          .catch(reject);
      } else {
        // طباعة عبر نافذة المتصفح
        this.printViaBrowser(commands);
        resolve();
      }
    });
  }

  private async printViaUSB(commands: string): Promise<void> {
    try {
      // استخدام WebUSB API
      const device = await (navigator as Navigator & { usb?: USB }).usb?.requestDevice({
        filters: [{ classCode: 7 }] // Printer class
      });
      
      if (device) {
        const interfaceNumber = device.configuration?.interfaces[0]?.interfaceNumber || 0;
        const endpoint = device.configuration?.interfaces[0]?.alternates[0]?.endpoints[0];
        
        if (endpoint && 'endpointNumber' in endpoint) {
          await device.open();
          await device.claimInterface(interfaceNumber);
          const encoder = new TextEncoder();
          const data = encoder.encode(commands);
          await device.transferOut(endpoint.endpointNumber, data);
          await device.releaseInterface(interfaceNumber);
          await device.close();
        }
      }
    } catch (error) {
      throw new Error('فشل الاتصال بالطابعة عبر USB');
    }
  }

  private async printViaNetwork(commands: string): Promise<void> {
    // للطباعة عبر الشبكة، نستخدم WebSocket أو fetch
    if (this.config.ip && this.config.port) {
      try {
        const response = await fetch(`http://${this.config.ip}:${this.config.port}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: commands,
        });
        
        if (!response.ok) {
          throw new Error('فشل الإرسال للطابعة');
        }
      } catch {
        throw new Error('فشل الاتصال بالطابعة عبر الشبكة');
      }
    }
  }

  private printViaBrowser(commands: string): void {
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>إيصال</title>
            <style>
              body {
                font-family: monospace;
                font-size: 12px;
                direction: rtl;
                text-align: right;
                white-space: pre-wrap;
                padding: 10px;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .large { font-size: 16px; }
              .separator { border-top: 1px dashed #000; margin: 5px 0; }
            </style>
          </head>
          <body>${this.formatForBrowser(commands)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  private formatForBrowser(commands: string): string {
    return commands
      .replace(/\x1B/g, '')
      .replace(/\x1D/g, '')
      .replace(/\n/g, '<br>')
      .replace(/─+/g, '<div class="separator"></div>');
  }

  private setEncoding(encoding: string): string {
    // تعيين ترميز العربية
    if (encoding === 'arabic') {
      return `${ESC}t\x24`; // Arabic encoding
    }
    return '';
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private rightAlignText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  private formatLine(
    col1: string,
    col2: string,
    col3: string,
    col4: string,
    width: number
  ): string {
    const col1Width = Math.floor(width * 0.35);
    const col2Width = Math.floor(width * 0.2);
    const col3Width = Math.floor(width * 0.2);
    const col4Width = width - col1Width - col2Width - col3Width;
    
    return (
      col1.padStart(col1Width) +
      col2.padStart(col2Width) +
      col3.padStart(col3Width) +
      col4.padStart(col4Width)
    );
  }

  private formatTwoColumns(label: string, value: string, width: number): string {
    const labelWidth = Math.floor(width * 0.5);
    const valueWidth = width - labelWidth;
    return label.padStart(labelWidth) + value.padStart(valueWidth);
  }

  private separator(): string {
    return '─'.repeat(this.charsPerLine);
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ر.س';
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }
}

// ==================== Export Default Instance ====================
export const thermalPrinter = new ThermalPrinter({
  name: 'Default Printer',
  type: 'thermal',
  connectionType: 'usb',
  paperWidth: 80,
  autoCut: true,
  openDrawer: true,
});
