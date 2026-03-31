// ==================== Print Engine - محرك الطباعة ====================

export interface PrintConfig {
  paperWidth: number; // 58, 80
  fontFamily: string;
  fontSizeSmall: number;
  fontSizeNormal: number;
  fontSizeLarge: number;
  fontSizeTitle: number;
  fontSizeTotal: number;
  fontBold: boolean;
  lineSpacing: number;
}

export interface ReceiptData {
  // Header
  companyName?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  taxNumber?: string;
  logo?: string;
  
  // Invoice Info
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  cashierName: string;
  customerName?: string;
  
  // Items
  items: ReceiptItem[];
  
  // Totals
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paid: number;
  change: number;
  
  // Payment
  paymentMethod: string;
  
  // Footer
  thankYouMessage?: string;
  returnPolicy?: string;
  
  // Options
  showQRCode?: boolean;
  showBarcode?: boolean;
}

export interface ReceiptItem {
  sku?: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

// توليد CSS للطباعة الحرارية
export function generateThermalCSS(config: PrintConfig): string {
  const width = config.paperWidth === 58 ? '56mm' : '78mm';
  
  return `
    @page {
      size: ${width} auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: '${config.fontFamily}', monospace;
      font-size: ${config.fontSizeNormal}px;
      line-height: ${config.lineSpacing};
      width: ${width};
      background: white;
      color: black;
    }
    
    .receipt {
      width: 100%;
      padding: 2mm;
    }
    
    .center { text-align: center; }
    .right { text-align: right; }
    .left { text-align: left; }
    
    .title {
      font-size: ${config.fontSizeTitle}px;
      font-weight: ${config.fontBold ? 'bold' : 'normal'};
    }
    
    .large {
      font-size: ${config.fontSizeLarge}px;
    }
    
    .small {
      font-size: ${config.fontSizeSmall}px;
    }
    
    .total {
      font-size: ${config.fontSizeTotal}px;
      font-weight: bold;
    }
    
    .bold { font-weight: bold; }
    
    .separator {
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      padding: 0.5mm 0;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .items-table td {
      padding: 0.5mm 0;
      vertical-align: top;
    }
    
    .item-name {
      word-wrap: break-word;
      max-width: 60%;
    }
    
    .item-qty {
      text-align: center;
      width: 15%;
    }
    
    .item-price {
      text-align: right;
      width: 25%;
    }
    
    .barcode {
      text-align: center;
      margin: 2mm 0;
    }
    
    .qr-code {
      text-align: center;
      margin: 2mm 0;
    }
    
    @media print {
      body { width: ${width}; }
      .no-print { display: none; }
    }
  `;
}

// توليد HTML للفاتورة
export function generateReceiptHTML(
  data: ReceiptData,
  template: Partial<{
    showLogo: boolean;
    showCompanyName: boolean;
    showBranchName: boolean;
    showBranchAddress: boolean;
    showBranchPhone: boolean;
    showTaxNumber: boolean;
    headerAlignment: string;
    showSku: boolean;
    showProductName: boolean;
    showVariant: boolean;
    showQuantity: boolean;
    showUnitPrice: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showLineTotal: boolean;
    showSubtotal: boolean;
    showDiscountTotal: boolean;
    showTaxTotal: boolean;
    showTotal: boolean;
    showPaid: boolean;
    showChange: boolean;
    totalsAlignment: string;
    showThankYou: boolean;
    thankYouMessage: string;
    showReturnPolicy: boolean;
    returnPolicyText: string;
    showQRCode: boolean;
    showInvoiceBarcode: boolean;
    showDateTime: boolean;
    showCashier: boolean;
    showInvoiceNumber: boolean;
    showSeparator: boolean;
    separatorChar: string;
  }>
): string {
  const align = template.headerAlignment || 'center';
  
  let html = '<div class="receipt">';
  
  // Header
  if (template.showLogo && data.logo) {
    html += `<div class="center" style="margin-bottom: 2mm;"><img src="${data.logo}" style="max-width: 50%; max-height: 20mm;"></div>`;
  }
  
  if (template.showCompanyName && data.companyName) {
    html += `<div class="title center">${data.companyName}</div>`;
  }
  
  if (template.showBranchName && data.branchName) {
    html += `<div class="large center">${data.branchName}</div>`;
  }
  
  if (template.showBranchAddress && data.branchAddress) {
    html += `<div class="small center">${data.branchAddress}</div>`;
  }
  
  if (template.showBranchPhone && data.branchPhone) {
    html += `<div class="small center">${data.branchPhone}</div>`;
  }
  
  if (template.showTaxNumber && data.taxNumber) {
    html += `<div class="small center">الرقم الضريبي: ${data.taxNumber}</div>`;
  }
  
  // Separator
  if (template.showSeparator) {
    html += '<div class="separator"></div>';
  }
  
  // Invoice Info
  if (template.showInvoiceNumber) {
    html += `<div class="row"><span>فاتورة رقم:</span><span>${data.invoiceNumber}</span></div>`;
  }
  
  if (template.showDateTime) {
    html += `<div class="row"><span>التاريخ:</span><span>${data.invoiceDate}</span></div>`;
    html += `<div class="row"><span>الوقت:</span><span>${data.invoiceTime}</span></div>`;
  }
  
  if (template.showCashier) {
    html += `<div class="row"><span>الكاشير:</span><span>${data.cashierName}</span></div>`;
  }
  
  if (data.customerName) {
    html += `<div class="row"><span>العميل:</span><span>${data.customerName}</span></div>`;
  }
  
  // Separator
  if (template.showSeparator) {
    html += '<div class="separator"></div>';
  }
  
  // Items
  html += '<table class="items-table">';
  html += '<tbody>';
  
  data.items.forEach(item => {
    html += '<tr>';
    
    // Name column
    html += '<td class="item-name">';
    if (template.showProductName !== false) {
      html += `<div class="bold">${item.name}</div>`;
    }
    if (template.showSku && item.sku) {
      html += `<div class="small">${item.sku}</div>`;
    }
    if (template.showVariant && item.variant) {
      html += `<div class="small">${item.variant}</div>`;
    }
    html += '</td>';
    
    // Quantity column
    if (template.showQuantity !== false) {
      html += `<td class="item-qty">${item.quantity}</td>`;
    }
    
    // Price column
    html += '<td class="item-price">';
    if (template.showUnitPrice !== false) {
      html += `<div>${item.unitPrice.toFixed(2)}</div>`;
    }
    if (template.showDiscount && item.discount > 0) {
      html += `<div class="small">خصم: ${item.discount.toFixed(2)}</div>`;
    }
    if (template.showLineTotal !== false) {
      html += `<div class="bold">${item.total.toFixed(2)}</div>`;
    }
    html += '</td>';
    
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  // Separator
  if (template.showSeparator) {
    html += '<div class="separator"></div>';
  }
  
  // Totals
  const totalsAlign = template.totalsAlignment || 'right';
  
  if (template.showSubtotal !== false) {
    html += `<div class="row"><span>المجموع الفرعي:</span><span>${data.subtotal.toFixed(2)}</span></div>`;
  }
  
  if (template.showDiscountTotal !== false && data.discountTotal > 0) {
    html += `<div class="row"><span>الخصم:</span><span>-${data.discountTotal.toFixed(2)}</span></div>`;
  }
  
  if (template.showTaxTotal !== false && data.taxTotal > 0) {
    html += `<div class="row"><span>الضريبة:</span><span>${data.taxTotal.toFixed(2)}</span></div>`;
  }
  
  if (template.showTotal !== false) {
    html += '<div class="separator"></div>';
    html += `<div class="row total"><span>الإجمالي:</span><span>${data.total.toFixed(2)}</span></div>`;
  }
  
  if (template.showPaid !== false) {
    html += `<div class="row"><span>المدفوع:</span><span>${data.paid.toFixed(2)}</span></div>`;
  }
  
  if (template.showChange !== false && data.change > 0) {
    html += `<div class="row large"><span>الباقي:</span><span>${data.change.toFixed(2)}</span></div>`;
  }
  
  // Separator
  if (template.showSeparator) {
    html += '<div class="separator"></div>';
  }
  
  // Payment Method
  html += `<div class="row"><span>طريقة الدفع:</span><span>${data.paymentMethod}</span></div>`;
  
  // Footer
  if (template.showThankYou !== false) {
    html += `<div class="center large" style="margin-top: 3mm;">${template.thankYouMessage || data.thankYouMessage || 'شكراً لزيارتكم'}</div>`;
  }
  
  if (template.showReturnPolicy && template.returnPolicyText) {
    html += `<div class="center small" style="margin-top: 2mm;">${template.returnPolicyText}</div>`;
  }
  
  // Barcode
  if (template.showInvoiceBarcode) {
    html += `<div class="barcode" style="margin-top: 2mm;">
      <svg id="barcode"></svg>
    </div>`;
  }
  
  // QR Code placeholder
  if (template.showQRCode) {
    html += `<div class="qr-code" style="margin-top: 2mm;">
      <div id="qrcode"></div>
    </div>`;
  }
  
  html += '</div>';
  
  return html;
}

// توليد HTML لتقرير إغلاق الوردية
export function generateShiftCloseHTML(data: {
  companyName: string;
  branchName: string;
  shiftNumber: number;
  userName: string;
  closedBy: string;
  startTime: string;
  endTime: string;
  duration: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  otherPayments: number;
  totalSales: number;
  totalReturns: number;
  totalDiscounts: number;
  totalExpenses: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  totalInvoices: number;
  completedInvoices: number;
  cancelledInvoices: number;
  returnInvoices: number;
}, config: PrintConfig): string {
  
  let html = '<div class="receipt">';
  
  // Header
  html += `<div class="title center">${data.companyName}</div>`;
  html += `<div class="large center">${data.branchName}</div>`;
  html += `<div class="center bold">تقرير إغلاق الوردية رقم: ${data.shiftNumber}</div>`;
  html += '<div class="separator"></div>';
  
  // Info
  html += `<div class="row"><span>المستخدم:</span><span>${data.userName}</span></div>`;
  html += `<div class="row"><span>أغلق بواسطة:</span><span>${data.closedBy}</span></div>`;
  html += `<div class="row"><span>وقت الفتح:</span><span>${data.startTime}</span></div>`;
  html += `<div class="row"><span>وقت الإغلاق:</span><span>${data.endTime}</span></div>`;
  html += `<div class="row"><span>المدة:</span><span>${data.duration}</span></div>`;
  html += '<div class="separator"></div>';
  
  // Summary
  html += '<div class="bold">ملخص الفواتير:</div>';
  html += `<div class="row"><span>إجمالي الفواتير:</span><span>${data.totalInvoices}</span></div>`;
  html += `<div class="row"><span>المكتملة:</span><span>${data.completedInvoices}</span></div>`;
  html += `<div class="row"><span>الملغاة:</span><span>${data.cancelledInvoices}</span></div>`;
  html += `<div class="row"><span>المرتجعات:</span><span>${data.returnInvoices}</span></div>`;
  html += '<div class="separator"></div>';
  
  // Payments
  html += '<div class="bold">تفصيل المدفوعات:</div>';
  html += `<div class="row"><span>نقدي:</span><span>${data.cashSales.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>بطاقة:</span><span>${data.cardSales.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>أخرى:</span><span>${data.otherPayments.toFixed(2)}</span></div>`;
  html += '<div class="separator"></div>';
  
  // Totals
  html += '<div class="bold">الإجماليات:</div>';
  html += `<div class="row"><span>إجمالي المبيعات:</span><span>${data.totalSales.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>المرتجعات:</span><span>${data.totalReturns.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>الخصومات:</span><span>${data.totalDiscounts.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>المصروفات:</span><span>${data.totalExpenses.toFixed(2)}</span></div>`;
  html += '<div class="separator"></div>';
  
  // Cash Count
  html += '<div class="bold">عد الصندوق:</div>';
  html += `<div class="row"><span>الافتتاحي:</span><span>${data.openingCash.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>المتوقع:</span><span>${data.expectedCash.toFixed(2)}</span></div>`;
  html += `<div class="row"><span>الفعلي:</span><span>${data.actualCash.toFixed(2)}</span></div>`;
  html += `<div class="row ${data.variance !== 0 ? 'bold' : ''}"><span>الفرق:</span><span>${data.variance.toFixed(2)}</span></div>`;
  
  html += '</div>';
  
  return html;
}

// فتح نافذة الطباعة
export function printReceipt(html: string, css: string, paperWidth: number = 80): void {
  const width = paperWidth === 58 ? 224 : 302; // pixels
  
  const printWindow = window.open('', '_blank', `width=${width},height=600`);
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة</title>
      <style>${css}</style>
    </head>
    <body>
      ${html}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

// ESC/POS Commands - أوامر الطابعة الحرارية
export const ESC_POS = {
  // Initialize printer
  INIT: '\x1B\x40',
  
  // Alignment
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Font styles
  FONT_NORMAL: '\x1B\x21\x00',
  FONT_BOLD: '\x1B\x21\x08',
  FONT_DOUBLE_HEIGHT: '\x1B\x21\x10',
  FONT_DOUBLE_WIDTH: '\x1B\x21\x20',
  FONT_BOLD_DOUBLE: '\x1B\x21\x18',
  
  // Paper control
  LINE_FEED: '\x0A',
  CUT_PAPER: '\x1D\x56\x00',
  PARTIAL_CUT: '\x1D\x56\x01',
  
  // Cash drawer
  OPEN_DRAWER: '\x1B\x70\x00\x19\xFA',
  
  // Barcode
  BARCODE_HEIGHT: (h: number) => `\x1D\x68${String.fromCharCode(h)}`,
  BARCODE_WIDTH: (w: number) => `\x1D\x77${String.fromCharCode(w)}`,
  BARCODE_PRINT: (data: string) => `\x1D\x6B\x04${String.fromCharCode(data.length)}${data}`,
  
  // QR Code
  QR_INIT: '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00',
  QR_SIZE: (size: number) => `\x1D\x28\x6B\x03\x00\x31\x43${String.fromCharCode(size)}`,
  QR_PRINT: (data: string) => {
    const len = data.length + 3;
    const pL = len & 0xFF;
    const pH = (len >> 8) & 0xFF;
    return `\x1D\x28\x6B${String.fromCharCode(pL)}${String.fromCharCode(pH)}\x31\x50\x30${data}\x1D\x28\x6B\x03\x00\x31\x51\x30`;
  }
};

// تحويل النص لـ ESC/POS
export function textToESCPOS(text: string, align: 'left' | 'center' | 'right' = 'right'): string {
  let commands = ESC_POS.INIT;
  
  switch (align) {
    case 'center': commands += ESC_POS.ALIGN_CENTER; break;
    case 'left': commands += ESC_POS.ALIGN_LEFT; break;
    case 'right': commands += ESC_POS.ALIGN_RIGHT; break;
  }
  
  commands += text;
  commands += ESC_POS.LINE_FEED;
  
  return commands;
}

// القالب الافتراضي
export const DEFAULT_TEMPLATE = {
  name: 'قالب افتراضي',
  nameAr: 'قالب افتراضي',
  type: 'invoice',
  paperWidth: 80,
  paperType: 'thermal',
  fontFamily: 'monospace',
  fontSizeSmall: 10,
  fontSizeNormal: 12,
  fontSizeLarge: 14,
  fontSizeTitle: 18,
  fontSizeTotal: 16,
  fontBold: true,
  showLogo: true,
  logoAlignment: 'center',
  showCompanyName: true,
  companyNameStyle: 'bold_large',
  showBranchName: true,
  showBranchAddress: true,
  showBranchPhone: true,
  showTaxNumber: true,
  headerAlignment: 'center',
  showSku: false,
  showProductName: true,
  showVariant: true,
  showQuantity: true,
  showUnitPrice: true,
  showDiscount: true,
  showTax: true,
  showLineTotal: true,
  showBarcode: false,
  showSubtotal: true,
  showDiscountTotal: true,
  showTaxTotal: true,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  showThankYou: true,
  thankYouMessage: 'شكراً لزيارتكم',
  showReturnPolicy: false,
  returnPolicyText: '',
  showQRCode: false,
  showInvoiceBarcode: true,
  showDateTime: true,
  showCashier: true,
  showInvoiceNumber: true,
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
  isDefault: true,
  isActive: true,
};
