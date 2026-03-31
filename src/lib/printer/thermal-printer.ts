// ==================== نظام الطباعة الحرارية ESC/POS المحسن ====================

import { Invoice, Shift, Branch, User, Customer, InvoiceItem, Payment } from '@prisma/client';

// ==================== الأنواع ====================
export interface PrinterConfig {
  id?: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'bluetooth';
  paperWidth: 58 | 80;
  ip?: string;
  port?: number;
  autoCut: boolean;
  openDrawer: boolean;
  isDefault?: boolean;
  isConnected?: boolean;
  encoding?: 'arabic' | 'english';
  characterSet?: 'PC437' | 'PC850' | 'PC860' | 'PC863' | 'PC865' | 'WPC1252' | 'WPC1256';
}

export interface ReceiptTemplate {
  showLogo: boolean;
  logoData?: string;
  showCompanyName: boolean;
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  showThankYou: boolean;
  thankYouMessage: string;
  showQRCode: boolean;
  showInvoiceBarcode: boolean;
  showInvoiceBarcodeFormat: 'CODE128' | 'EAN13' | 'CODE39';
  paperWidth: 58 | 80;
  headerAlignment: 'left' | 'center' | 'right';
  itemsAlignment: 'left' | 'center' | 'right';
  totalsAlignment: 'left' | 'center' | 'right';
  footerAlignment: 'left' | 'center' | 'right';
  showSku: boolean;
  showVariant: boolean;
  showDiscount: boolean;
  showTax: boolean;
  returnPolicy?: string;
  customFooter?: string;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printTime?: Date;
  jobId?: string;
  error?: string;
}

export interface InvoiceWithRelations extends Invoice {
  branch: Branch;
  user: User;
  customer: Customer | null;
  items: (InvoiceItem & {
    product?: { name: string; barcode: string; sku?: string };
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

export interface BarcodeOptions {
  type: 'CODE128' | 'EAN13' | 'CODE39' | 'UPC_A' | 'EAN8' | 'CODE93' | 'CODABAR';
  width: number; // 2-6
  height: number; // 1-255
  text: boolean; // show text below barcode
}

export interface QRCodeOptions {
  size: number; // 1-16
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}

export interface FontOptions {
  size: 'normal' | 'double-width' | 'double-height' | 'double';
  bold: boolean;
  underline: boolean;
  italic: boolean;
}

export interface TableOptions {
  columns: { width: number; align: 'left' | 'center' | 'right' }[];
  hasHeader: boolean;
  borderStyle: 'none' | 'line' | 'dashed';
}

// ==================== ESC/POS Commands الكاملة ====================
export const ESC_POS = {
  // الأساسيات
  ESC: '\x1B',
  GS: '\x1D',
  LF: '\x0A',
  NUL: '\x00',
  
  // تهيئة الطابعة
  INIT: '\x1B\x40',
  
  // المحاذاة
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // أنماط الخط
  FONT_NORMAL: '\x1B\x21\x00',
  FONT_BOLD: '\x1B\x21\x08',
  FONT_DOUBLE_HEIGHT: '\x1B\x21\x10',
  FONT_DOUBLE_WIDTH: '\x1B\x21\x20',
  FONT_BOLD_DOUBLE: '\x1B\x21\x30',
  FONT_UNDERLINE: '\x1B\x21\x80',
  FONT_BOLD_UNDERLINE: '\x1B\x21\x88',
  
  // التحكم بالخط
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  DOUBLE_STRIKE_ON: '\x1B\x47\x01',
  DOUBLE_STRIKE_OFF: '\x1B\x47\x00',
  
  // أحجام الخطوط (GS !)
  SIZE_NORMAL: '\x1D\x21\x00',
  SIZE_DOUBLE_WIDTH: '\x1D\x21\x10',
  SIZE_DOUBLE_HEIGHT: '\x1D\x21\x01',
  SIZE_DOUBLE: '\x1D\x21\x11',
  SIZE_TRIPLE_WIDTH: '\x1D\x21\x20',
  SIZE_TRIPLE_HEIGHT: '\x1D\x21\x02',
  SIZE_QUADRUPLE: '\x1D\x21\x22',
  
  // التحكم بالورق
  LINE_FEED: '\x0A',
  LINE_FEED_N: (n: number) => `\x1B\x64${String.fromCharCode(n)}`,
  REVERSE_FEED_N: (n: number) => `\x1B\x65${String.fromCharCode(n)}`,
  CUT_PAPER: '\x1D\x56\x00',
  PARTIAL_CUT: '\x1D\x56\x01',
  FEED_AND_CUT: (n: number) => `\x1D\x56${String.fromCharCode(n)}`,
  
  // درج النقدية
  OPEN_DRAWER_PIN2: '\x1B\x70\x00\x19\xFA',
  OPEN_DRAWER_PIN5: '\x1B\x70\x01\x19\xFA',
  
  // الترميز واللغة
  ENCODING_PC437: '\x1B\x74\x00',
  ENCODING_PC850: '\x1B\x74\x02',
  ENCODING_PC860: '\x1B\x74\x03',
  ENCODING_PC863: '\x1B\x74\x04',
  ENCODING_PC865: '\x1B\x74\x05',
  ENCODING_WPC1252: '\x1B\x74\x10',
  ENCODING_WPC1256: '\x1B\x74\x24', // Arabic
  
  // Unicode
  UTF_8_ON: '\x1C\x26', // Enable UTF-8
  UTF_8_OFF: '\x1C\x2E', // Disable UTF-8
  UTF_8_MODE: '\x1C\x43\x01', // Set UTF-8 mode
  
  // RTL للم العربية
  RTL_ON: '\x1B\x74\x24', // Arabic encoding
  RTL_RIGHT_TO_LEFT: '\x1B\x74\x24',
  
  // الباركود
  BARCODE_HEIGHT: (h: number) => `\x1D\x68${String.fromCharCode(Math.min(255, Math.max(1, h)))}`,
  BARCODE_WIDTH: (w: number) => `\x1D\x77${String.fromCharCode(Math.min(6, Math.max(2, w)))}`,
  BARCODE_TEXT_POSITION_BELOW: '\x1D\x48\x02',
  BARCODE_TEXT_POSITION_NONE: '\x1D\x48\x00',
  BARCODE_TEXT_POSITION_ABOVE: '\x1D\x48\x01',
  BARCODE_TEXT_POSITION_BOTH: '\x1D\x48\x03',
  
  // أنواع الباركود
  BARCODE_UPC_A: (data: string) => {
    const len = Math.min(11, data.length);
    return `\x1D\x6B\x00${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_UPC_E: (data: string) => {
    const len = Math.min(6, data.length);
    return `\x1D\x6B\x01${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_EAN13: (data: string) => {
    const len = Math.min(12, data.length);
    return `\x1D\x6B\x02${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_EAN8: (data: string) => {
    const len = Math.min(7, data.length);
    return `\x1D\x6B\x03${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_CODE39: (data: string) => {
    const len = Math.min(255, data.length);
    return `\x1D\x6B\x04${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_CODE128: (data: string) => {
    const len = Math.min(255, data.length);
    return `\x1D\x6B\x49${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  BARCODE_CODABAR: (data: string) => {
    const len = Math.min(255, data.length);
    return `\x1D\x6B\x06${String.fromCharCode(len)}${data.substring(0, len)}`;
  },
  
  // QR Code
  QR_MODEL: (model: 1 | 2) => `\x1D\x28\x6B\x04\x00\x31\x41${String.fromCharCode(model === 1 ? 49 : 50)}`,
  QR_SIZE: (size: number) => `\x1D\x28\x6B\x03\x00\x31\x43${String.fromCharCode(Math.min(16, Math.max(1, size)))}`,
  QR_ERROR_CORRECTION: (level: 'L' | 'M' | 'Q' | 'H') => {
    const levels = { L: 48, M: 49, Q: 50, H: 51 };
    return `\x1D\x28\x6B\x03\x00\x31\x45${String.fromCharCode(levels[level])}`;
  },
  QR_DATA: (data: string) => {
    const len = data.length + 3;
    const pL = len & 0xFF;
    const pH = (len >> 8) & 0xFF;
    return `\x1D\x28\x6B${String.fromCharCode(pL)}${String.fromCharCode(pH)}\x31\x50\x30${data}`;
  },
  QR_PRINT: '\x1D\x28\x6B\x03\x00\x31\x51\x30',
  
  // الصور (شعارات)
  IMAGE_MODE: '\x1D\x76\x30\x00',
  
  // الألوان (للطابعات التي تدعمها)
  COLOR_BLACK: '\x1B\x72\x00',
  COLOR_RED: '\x1B\x72\x01',
  
  // المسافات
  LINE_SPACING_DEFAULT: '\x1B\x32',
  LINE_SPACING_N: (n: number) => `\x1B\x33${String.fromCharCode(n)}`,
  
  // الهوامش
  LEFT_MARGIN: (n: number) => `\x1D\x4C${String.fromCharCode(n & 0xFF)}${String.fromCharCode((n >> 8) & 0xFF)}`,
  PRINT_WIDTH: (n: number) => `\x1D\x57${String.fromCharCode(n & 0xFF)}${String.fromCharCode((n >> 8) & 0xFF)}`,
};

// ==================== ThermalPrinter Class المحسن ====================
export class ThermalPrinter {
  private config: PrinterConfig;
  private template: ReceiptTemplate;
  private charsPerLine: number;
  private commands: string[];

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
      showInvoiceBarcodeFormat: 'CODE128',
      paperWidth: config.paperWidth,
      headerAlignment: 'center',
      itemsAlignment: 'right',
      totalsAlignment: 'right',
      footerAlignment: 'center',
      showSku: false,
      showVariant: true,
      showDiscount: true,
      showTax: true,
      ...template,
    };
    this.charsPerLine = config.paperWidth === 80 ? 48 : 32;
    this.commands = [];
  }

  // ==================== دوال البناء الأساسية ====================
  
  // إضافة أوامر
  private addCommand(command: string): void {
    this.commands.push(command);
  }

  // إضافة نص
  addText(text: string): this {
    this.addCommand(text);
    return this;
  }

  // إضافة سطر جديد
  newLine(count: number = 1): this {
    this.addCommand(ESC_POS.LINE_FEED.repeat(count));
    return this;
  }

  // ==================== دوال المحاذاة ====================
  
  setAlign(align: 'left' | 'center' | 'right'): this {
    switch (align) {
      case 'left':
        this.addCommand(ESC_POS.ALIGN_LEFT);
        break;
      case 'center':
        this.addCommand(ESC_POS.ALIGN_CENTER);
        break;
      case 'right':
        this.addCommand(ESC_POS.ALIGN_RIGHT);
        break;
    }
    return this;
  }

  // ==================== دوال الخط ====================
  
  setFont(options: Partial<FontOptions>): this {
    let command = '';
    
    // الحجم
    if (options.size) {
      switch (options.size) {
        case 'normal':
          command += ESC_POS.SIZE_NORMAL;
          break;
        case 'double-width':
          command += ESC_POS.SIZE_DOUBLE_WIDTH;
          break;
        case 'double-height':
          command += ESC_POS.SIZE_DOUBLE_HEIGHT;
          break;
        case 'double':
          command += ESC_POS.SIZE_DOUBLE;
          break;
      }
    }
    
    // عريض
    if (options.bold !== undefined) {
      command += options.bold ? ESC_POS.BOLD_ON : ESC_POS.BOLD_OFF;
    }
    
    // تسطير
    if (options.underline !== undefined) {
      command += options.underline ? ESC_POS.UNDERLINE_ON : ESC_POS.UNDERLINE_OFF;
    }
    
    this.addCommand(command);
    return this;
  }

  bold(on: boolean = true): this {
    this.addCommand(on ? ESC_POS.BOLD_ON : ESC_POS.BOLD_OFF);
    return this;
  }

  underline(on: boolean = true): this {
    this.addCommand(on ? ESC_POS.UNDERLINE_ON : ESC_POS.UNDERLINE_OFF);
    return this;
  }

  setSize(size: 'normal' | 'double-width' | 'double-height' | 'double'): this {
    switch (size) {
      case 'normal':
        this.addCommand(ESC_POS.SIZE_NORMAL);
        break;
      case 'double-width':
        this.addCommand(ESC_POS.SIZE_DOUBLE_WIDTH);
        break;
      case 'double-height':
        this.addCommand(ESC_POS.SIZE_DOUBLE_HEIGHT);
        break;
      case 'double':
        this.addCommand(ESC_POS.SIZE_DOUBLE);
        break;
    }
    return this;
  }

  // ==================== دوال الباركود ====================
  
  setBarcodeHeight(height: number): this {
    this.addCommand(ESC_POS.BARCODE_HEIGHT(height));
    return this;
  }

  setBarcodeWidth(width: number): this {
    this.addCommand(ESC_POS.BARCODE_WIDTH(width));
    return this;
  }

  printBarcode(data: string, type: 'CODE128' | 'EAN13' | 'CODE39' | 'UPC_A' | 'EAN8' = 'CODE128', showText: boolean = true): this {
    // عرض النص أسفل الباركود
    this.addCommand(showText ? ESC_POS.BARCODE_TEXT_POSITION_BELOW : ESC_POS.BARCODE_TEXT_POSITION_NONE);
    
    // ارتفاع وعرض افتراضي
    this.setBarcodeHeight(60);
    this.setBarcodeWidth(3);
    
    // طباعة الباركود حسب النوع
    switch (type) {
      case 'CODE128':
        this.addCommand(ESC_POS.BARCODE_CODE128(data));
        break;
      case 'EAN13':
        this.addCommand(ESC_POS.BARCODE_EAN13(data));
        break;
      case 'CODE39':
        this.addCommand(ESC_POS.BARCODE_CODE39(data));
        break;
      case 'UPC_A':
        this.addCommand(ESC_POS.BARCODE_UPC_A(data));
        break;
      case 'EAN8':
        this.addCommand(ESC_POS.BARCODE_EAN8(data));
        break;
    }
    
    return this;
  }

  // ==================== دوال QR Code ====================
  
  printQRCode(data: string, options?: Partial<QRCodeOptions>): this {
    const size = options?.size || 6;
    const errorLevel = options?.errorCorrection || 'M';
    
    // تعيين نموذج QR
    this.addCommand(ESC_POS.QR_MODEL(2));
    // تعيين الحجم
    this.addCommand(ESC_POS.QR_SIZE(size));
    // تعيين مستوى التصحيح
    this.addCommand(ESC_POS.QR_ERROR_CORRECTION(errorLevel));
    // إضافة البيانات
    this.addCommand(ESC_POS.QR_DATA(data));
    // طباعة
    this.addCommand(ESC_POS.QR_PRINT);
    
    return this;
  }

  // ==================== دوال الجداول ====================
  
  printTableRow(columns: string[], widths: number[], alignments: ('left' | 'center' | 'right')[]): this {
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const scale = this.charsPerLine / totalWidth;
    
    let row = '';
    columns.forEach((col, i) => {
      const width = Math.floor(widths[i] * scale);
      const text = col.substring(0, width);
      
      switch (alignments[i]) {
        case 'left':
          row += text.padEnd(width);
          break;
        case 'center':
          const padding = Math.floor((width - text.length) / 2);
          row += ' '.repeat(Math.max(0, padding)) + text + ' '.repeat(Math.max(0, width - text.length - padding));
          break;
        case 'right':
          row += text.padStart(width);
          break;
      }
    });
    
    this.addCommand(row);
    return this;
  }

  printSeparator(char: string = '─'): this {
    this.addCommand(char.repeat(this.charsPerLine));
    return this;
  }

  // ==================== دوال العربية ====================
  
  setArabicMode(): this {
    // تعيين ترميز العربية
    this.addCommand(ESC_POS.ENCODING_WPC1256);
    // تفعيل UTF-8
    this.addCommand(ESC_POS.UTF_8_ON);
    this.addCommand(ESC_POS.UTF_8_MODE);
    return this;
  }

  // عكس النص العربي للعرض الصحيح
  private reverseArabicText(text: string): string {
    // فحص إذا كان النص يحتوي على عربية
    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(text)) return text;
    
    // عكس النص للعرض الصحيح على الطابعة
    return text.split('').reverse().join('');
  }

  // تنسيق النص العربي
  formatArabicText(text: string, width: number, align: 'left' | 'center' | 'right' = 'right'): string {
    const reversed = this.reverseArabicText(text);
    const padding = width - text.length;
    
    switch (align) {
      case 'left':
        return reversed + ' '.repeat(Math.max(0, padding));
      case 'center':
        const leftPad = Math.floor(padding / 2);
        return ' '.repeat(Math.max(0, leftPad)) + reversed + ' '.repeat(Math.max(0, padding - leftPad));
      case 'right':
        return ' '.repeat(Math.max(0, padding)) + reversed;
    }
  }

  // ==================== دوال الطباعة ====================
  
  initialize(): this {
    this.addCommand(ESC_POS.INIT);
    this.setArabicMode();
    return this;
  }

  cutPaper(partial: boolean = false): this {
    this.newLine(3);
    this.addCommand(partial ? ESC_POS.PARTIAL_CUT : ESC_POS.CUT_PAPER);
    return this;
  }

  openDrawer(): this {
    this.addCommand(ESC_POS.OPEN_DRAWER_PIN2);
    return this;
  }

  setLineSpacing(n: number): this {
    if (n === 0) {
      this.addCommand(ESC_POS.LINE_SPACING_DEFAULT);
    } else {
      this.addCommand(ESC_POS.LINE_SPACING_N(n));
    }
    return this;
  }

  // ==================== طباعة الإيصال ====================
  async printReceipt(invoice: InvoiceWithRelations): Promise<PrintResult> {
    try {
      this.commands = [];
      
      // تهيئة الطابعة
      this.initialize();
      
      // الهيدر
      this.buildHeader(invoice);
      
      // معلومات الفاتورة
      this.buildInvoiceInfo(invoice);
      
      // العناصر
      this.buildItemsSection(invoice.items);
      
      // الإجماليات
      this.buildTotalsSection(invoice);
      
      // المدفوعات
      this.buildPaymentsSection(invoice.payments, invoice.paidAmount, invoice.changeAmount);
      
      // الفوتر
      this.buildFooter(invoice);
      
      // قص وفتح الدرج
      this.newLine(3);
      if (this.config.autoCut) {
        this.cutPaper();
      }
      if (this.config.openDrawer) {
        this.openDrawer();
      }
      
      await this.sendToPrinter(this.commands.join(''));
      
      return {
        success: true,
        message: 'تمت الطباعة بنجاح',
        printTime: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل في الطباعة',
        error: error instanceof Error ? error.stack : undefined,
      };
    }
  }

  // ==================== طباعة تقرير Z ====================
  async printZReport(shift: ShiftWithRelations): Promise<PrintResult> {
    try {
      this.commands = [];
      
      this.initialize();
      
      // العنوان
      this.setAlign('center')
        .setSize('double')
        .bold(true)
        .addText('══════ تقرير Z ══════\n')
        .setSize('normal')
        .bold(false);
      
      this.addText(shift.branch.name + '\n');
      this.printSeparator();
      
      // معلومات الوردية
      this.setAlign('right');
      this.addText(`تقرير رقم: ${shift.id.substring(0, 8)}\n`);
      this.addText(`الكاشير: ${shift.user.name}\n`);
      this.addText(`البداية: ${this.formatDateTime(shift.startTime)}\n`);
      if (shift.endTime) {
        this.addText(`النهاية: ${this.formatDateTime(shift.endTime)}\n`);
      }
      
      this.printSeparator();
      
      // الملخص المالي
      this.bold(true).addText('=== الملخص المالي ===\n').bold(false);
      
      this.printTwoColumns('رصيد الافتتاح:', this.formatCurrency(shift.openingCash));
      this.printTwoColumns('إجمالي المبيعات:', this.formatCurrency(shift.totalSales));
      this.printTwoColumns('إجمالي المرتجعات:', this.formatCurrency(shift.totalReturns));
      this.printTwoColumns('إجمالي المصروفات:', this.formatCurrency(shift.totalExpenses));
      this.printTwoColumns('إجمالي المدفوعات:', this.formatCurrency(shift.totalPayments));
      
      this.printSeparator();
      
      // الإجمالي النهائي
      this.setSize('double-width')
        .bold(true);
      this.printTwoColumns('الإجمالي:', this.formatCurrency(
        shift.totalSales - shift.totalReturns - shift.totalExpenses
      ));
      this.setSize('normal').bold(false);
      
      if (shift.closingCash && shift.expectedCash) {
        this.printSeparator();
        this.printTwoColumns('النقدية المتوقعة:', this.formatCurrency(shift.expectedCash));
        this.printTwoColumns('النقدية الفعلية:', this.formatCurrency(shift.closingCash));
        const diff = shift.closingCash - shift.expectedCash;
        this.printTwoColumns('الفرق:', this.formatCurrency(Math.abs(diff)) + (diff < 0 ? ' عجز' : ' فائض'));
      }
      
      this.newLine(3);
      if (this.config.autoCut) {
        this.cutPaper();
      }
      
      await this.sendToPrinter(this.commands.join(''));
      
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

  // ==================== طباعة إغلاق وردية ====================
  async printShiftClose(shift: ShiftWithRelations): Promise<PrintResult> {
    try {
      this.commands = [];
      
      this.initialize();
      
      // العنوان
      this.setAlign('center')
        .setSize('double')
        .bold(true)
        .addText('═══ إغلاق الوردية ═══\n')
        .setSize('normal')
        .bold(false);
      
      this.addText(shift.branch.name + '\n');
      this.printSeparator();
      
      // معلومات الوردية
      this.setAlign('right');
      this.addText(`الكاشير: ${shift.user.name}\n`);
      if (shift.closedByUser) {
        this.addText(`أغلق بواسطة: ${shift.closedByUser.name}\n`);
      }
      this.addText(`البداية: ${this.formatDateTime(shift.startTime)}\n`);
      if (shift.endTime) {
        this.addText(`النهاية: ${this.formatDateTime(shift.endTime)}\n`);
      }
      
      this.printSeparator();
      
      // الملخص
      this.bold(true).addText('=== ملخص الوردية ===\n').bold(false);
      
      this.printTwoColumns('رصيد الافتتاح:', this.formatCurrency(shift.openingCash));
      this.printTwoColumns('إجمالي المبيعات:', this.formatCurrency(shift.totalSales));
      this.printTwoColumns('إجمالي المرتجعات:', this.formatCurrency(shift.totalReturns));
      this.printTwoColumns('إجمالي المصروفات:', this.formatCurrency(shift.totalExpenses));
      
      this.printSeparator();
      
      // الفرق
      if (shift.closingCash && shift.expectedCash) {
        this.bold(true);
        this.printTwoColumns('النقدية المتوقعة:', this.formatCurrency(shift.expectedCash));
        this.printTwoColumns('النقدية الفعلية:', this.formatCurrency(shift.closingCash));
        const diff = shift.closingCash - shift.expectedCash;
        this.printTwoColumns('الفرق:', this.formatCurrency(Math.abs(diff)) + (diff < 0 ? ' عجز' : ' فائض'));
        this.bold(false);
      }
      
      this.newLine(3);
      if (this.config.autoCut) {
        this.cutPaper();
      }
      
      await this.sendToPrinter(this.commands.join(''));
      
      return {
        success: true,
        message: 'تمت طباعة تقرير إغلاق الوردية بنجاح',
        printTime: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل في طباعة تقرير إغلاق الوردية',
      };
    }
  }

  // ==================== طباعة شعار (Logo) ====================
  async printLogo(logoData: string): Promise<this> {
    // تحويل base64 إلى بيانات ثنائية للطابعة
    // هذا يتطلب تحويل الصورة إلى صيغة ESC/POS
    // للتبسيط، سنستخدم نص بديل
    this.setAlign('center');
    this.addText(logoData); // placeholder
    this.newLine();
    return this;
  }

  // ==================== دوال بناء الإيصال ====================
  
  private buildHeader(invoice: InvoiceWithRelations): void {
    this.setAlign(this.template.headerAlignment);
    
    // اسم الشركة
    if (this.template.showCompanyName) {
      this.setSize('double')
        .bold(true)
        .addText('نظام نقاط البيع\n')
        .setSize('normal')
        .bold(false);
    }
    
    // اسم الفرع
    if (this.template.showBranchName && invoice.branch.name) {
      this.bold(true)
        .addText(invoice.branch.name + '\n')
        .bold(false);
    }
    
    // العنوان
    if (this.template.showBranchAddress && invoice.branch.address) {
      this.addText(invoice.branch.address + '\n');
    }
    
    // الهاتف
    if (this.template.showBranchPhone && invoice.branch.phone) {
      this.addText('هاتف: ' + invoice.branch.phone + '\n');
    }
    
    this.printSeparator();
  }

  private buildInvoiceInfo(invoice: InvoiceWithRelations): void {
    this.setAlign('right');
    
    const invoiceType = invoice.isReturn ? 'إيصال مرتجع' : 'إيصال بيع';
    this.bold(true).addText(`*** ${invoiceType} ***\n`).bold(false);
    
    this.addText(`رقم: ${invoice.invoiceNumber}\n`);
    this.addText(`التاريخ: ${this.formatDate(invoice.createdAt)}\n`);
    this.addText(`الوقت: ${this.formatTime(invoice.createdAt)}\n`);
    this.addText(`الكاشير: ${invoice.user.name}\n`);
    
    if (invoice.customer) {
      this.addText(`العميل: ${invoice.customer.name}\n`);
    }
    
    this.printSeparator();
  }

  private buildItemsSection(items: InvoiceWithRelations['items']): void {
    this.setAlign('right');
    
    // العنوان
    this.bold(true);
    this.printTableRow(
      ['الصنف', 'الكمية', 'السعر', 'الإجمالي'],
      [35, 15, 20, 30],
      ['right', 'center', 'left', 'left']
    );
    this.bold(false);
    this.printSeparator();
    
    // العناصر
    for (const item of items) {
      const name = item.product?.name || item.productName;
      const nameAr = name.substring(0, 20);
      
      this.addText(nameAr + '\n');
      this.printTableRow(
        ['', item.quantity.toString(), this.formatCurrency(item.unitPrice), this.formatCurrency(item.totalAmount)],
        [35, 15, 20, 30],
        ['right', 'center', 'left', 'left']
      );
      
      if (item.discountAmount > 0) {
        this.addText(`  خصم: ${this.formatCurrency(item.discountAmount)}\n`);
      }
    }
    
    this.printSeparator();
  }

  private buildTotalsSection(invoice: InvoiceWithRelations): void {
    this.setAlign('right');
    
    this.printTwoColumns('المجموع الفرعي:', this.formatCurrency(invoice.subtotal));
    
    if (invoice.discountAmount > 0) {
      this.printTwoColumns('الخصم:', this.formatCurrency(invoice.discountAmount));
    }
    
    if (invoice.taxAmount > 0) {
      this.printTwoColumns('الضريبة:', this.formatCurrency(invoice.taxAmount));
    }
    
    this.setSize('double-width').bold(true);
    this.printTwoColumns('الإجمالي:', this.formatCurrency(invoice.totalAmount));
    this.setSize('normal').bold(false);
    
    this.printSeparator();
  }

  private buildPaymentsSection(
    payments: InvoiceWithRelations['payments'],
    paidAmount: number,
    changeAmount: number
  ): void {
    this.setAlign('right');
    
    for (const payment of payments) {
      this.printTwoColumns(payment.paymentMethod.nameAr + ':', this.formatCurrency(payment.amount));
    }
    
    this.bold(true);
    this.printTwoColumns('المدفوع:', this.formatCurrency(paidAmount));
    this.bold(false);
    
    if (changeAmount > 0) {
      this.printTwoColumns('المتبقي:', this.formatCurrency(changeAmount));
    }
  }

  private buildFooter(invoice: InvoiceWithRelations): void {
    this.setAlign(this.template.footerAlignment);
    this.printSeparator();
    
    if (this.template.showThankYou) {
      this.bold(true)
        .addText(this.template.thankYouMessage + '\n')
        .bold(false);
    }
    
    if (this.template.showInvoiceBarcode) {
      this.newLine();
      this.setAlign('center');
      this.printBarcode(invoice.invoiceNumber, this.template.showInvoiceBarcodeFormat, true);
    }
    
    if (this.template.showQRCode) {
      this.newLine();
      this.setAlign('center');
      this.printQRCode(`Invoice:${invoice.invoiceNumber}|Total:${invoice.totalAmount}|Date:${invoice.createdAt}`);
    }
    
    this.newLine();
    this.setAlign('center');
    this.addText('نظام نقاط البيع المتقدم\n');
  }

  // ==================== دوال مساعدة ====================
  
  private printTwoColumns(label: string, value: string): void {
    const labelWidth = Math.floor(this.charsPerLine * 0.5);
    const valueWidth = this.charsPerLine - labelWidth;
    
    this.addCommand(
      label.padStart(labelWidth) + value.padStart(valueWidth) + '\n'
    );
  }

  private sendToPrinter(commands: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      if (this.config.connectionType === 'usb') {
        this.printViaUSB(commands)
          .then(() => resolve())
          .catch(reject);
      } else if (this.config.connectionType === 'network' && this.config.ip) {
        this.printViaNetwork(commands)
          .then(() => resolve())
          .catch(reject);
      } else {
        this.printViaBrowser(commands);
        resolve();
      }
    });
  }

  private async printViaUSB(commands: string): Promise<void> {
    try {
      const device = await (navigator as Navigator & { usb?: USB }).usb?.requestDevice({
        filters: [{ classCode: 7 }]
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
    } catch {
      throw new Error('فشل الاتصال بالطابعة عبر USB');
    }
  }

  private async printViaNetwork(commands: string): Promise<void> {
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

  // ==================== فحص حالة الطابعة ====================
  async checkPrinterStatus(): Promise<{
    isOnline: boolean;
    paperStatus: 'ok' | 'low' | 'empty';
    coverStatus: 'closed' | 'open';
    error?: string;
  }> {
    try {
      if (typeof window !== 'undefined') {
        // محاولة فحص حالة الطابعة
        if (this.config.connectionType === 'usb') {
          // فحص USB
          return { isOnline: true, paperStatus: 'ok', coverStatus: 'closed' };
        } else if (this.config.connectionType === 'network' && this.config.ip) {
          // فحص الشبكة
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`http://${this.config.ip}:${this.config.port || 9100}/status`, {
              method: 'GET',
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return { isOnline: response.ok, paperStatus: 'ok', coverStatus: 'closed' };
          } catch {
            return { isOnline: false, paperStatus: 'ok', coverStatus: 'closed', error: 'لا يمكن الوصول للطابعة' };
          }
        }
      }
      return { isOnline: true, paperStatus: 'ok', coverStatus: 'closed' };
    } catch (error) {
      return { 
        isOnline: false, 
        paperStatus: 'ok', 
        coverStatus: 'closed', 
        error: error instanceof Error ? error.message : 'خطأ غير معروف' 
      };
    }
  }

  // ==================== الحصول على الأوامر ====================
  getCommands(): string {
    return this.commands.join('');
  }

  // ==================== مسح الأوامر ====================
  clearCommands(): void {
    this.commands = [];
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
