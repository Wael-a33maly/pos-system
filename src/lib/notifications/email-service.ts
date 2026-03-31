/**
 * Email Service - خدمة البريد الإلكتروني
 * تتعامل مع قوالب البريد والإرسال
 */

import { db } from '@/lib/db';

// إعدادات البريد الإلكتروني
interface EmailConfig {
  companyName: string;
  companyNameAr: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo?: string;
  primaryColor: string;
  secondaryColor: string;
}

// واجهة البريد الإلكتروني
interface EmailData {
  to: string | string[];
  subject: string;
  subjectAr?: string;
  html: string;
  text?: string;
}

// واجهة بيانات التقرير اليومي
interface DailyReportData {
  date: string;
  branchName: string;
  totalSales: number;
  totalInvoices: number;
  totalReturns: number;
  totalExpenses: number;
  netProfit: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

// واجهة بيانات تنبيه المخزون
interface StockAlertData {
  products: Array<{
    name: string;
    nameAr?: string;
    barcode: string;
    currentStock: number;
    minStock: number;
    category?: string;
  }>;
  branchName: string;
}

// واجهة بيانات الفاتورة للعميل
interface InvoiceEmailData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
}

/**
 * خدمة البريد الإلكتروني
 */
export class EmailService {
  
  private static config: EmailConfig = {
    companyName: 'POS System',
    companyNameAr: 'نظام نقاط البيع',
    companyEmail: 'noreply@pos-system.com',
    companyPhone: '+966 XX XXX XXXX',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
  };

  /**
   * تحديث إعدادات البريد
   */
  static updateConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * الحصول على الإعدادات من قاعدة البيانات
   */
  static async loadConfigFromDB(): Promise<void> {
    try {
      const settings = await db.setting.findMany({
        where: {
          key: {
            in: ['companyName', 'companyNameAr', 'companyEmail', 'companyPhone', 'companyAddress', 'companyLogo']
          }
        }
      });

      settings.forEach(setting => {
        switch (setting.key) {
          case 'companyName':
            this.config.companyName = setting.value;
            break;
          case 'companyNameAr':
            this.config.companyNameAr = setting.value;
            break;
          case 'companyEmail':
            this.config.companyEmail = setting.value;
            break;
          case 'companyPhone':
            this.config.companyPhone = setting.value;
            break;
          case 'companyAddress':
            this.config.companyAddress = setting.value;
            break;
          case 'companyLogo':
            this.config.companyLogo = setting.value;
            break;
        }
      });
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  }

  /**
   * إرسال بريد إلكتروني
   */
  static async send(emailData: EmailData): Promise<{ success: boolean; message?: string }> {
    try {
      // في بيئة الإنتاج، يمكن استخدام خدمات مثل:
      // - SendGrid
      // - Mailgun
      // - AWS SES
      // - z-ai-web-dev-sdk للإشعارات الخارجية
      
      console.log('Sending email:', {
        to: emailData.to,
        subject: emailData.subject,
      });

      // محاكاة الإرسال - في الإنتاج يتم استبدالها بالخدمة الفعلية
      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * إنشاء قالب HTML الأساسي
   */
  private static getBaseTemplate(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor}); padding: 30px; text-align: center; color: white; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { font-size: 12px; color: #6b7280; }
          .btn { display: inline-block; padding: 12px 24px; background-color: ${this.config.primaryColor}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
          .table th { background-color: #f8f9fa; font-weight: 600; }
          .alert { padding: 15px; border-radius: 8px; margin: 15px 0; }
          .alert-warning { background-color: #fef3cd; border: 1px solid #ffc107; color: #856404; }
          .alert-danger { background-color: #f8d7da; border: 1px solid #dc3545; color: #721c24; }
          .alert-success { background-color: #d4edda; border: 1px solid #28a745; color: #155724; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .mb-4 { margin-bottom: 16px; }
          .mt-4 { margin-top: 16px; }
          .total-row { background-color: #f8f9fa; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${this.config.companyLogo ? `<img src="${this.config.companyLogo}" alt="Logo" style="max-width: 100px; margin-bottom: 15px;">` : ''}
            <h1>${this.config.companyNameAr}</h1>
            <p>${this.config.companyName}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>${this.config.companyNameAr} - ${this.config.companyAddress}</p>
            <p>📞 ${this.config.companyPhone} | ✉️ ${this.config.companyEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * إرسال التقرير اليومي
   */
  static async sendDailyReport(email: string, data: DailyReportData): Promise<{ success: boolean }> {
    const content = `
      <h2 class="mb-4">📊 التقرير اليومي - ${data.date}</h2>
      <p class="mb-4">فرع: ${data.branchName}</p>
      
      <div class="alert alert-success">
        <h3>ملخص المبيعات</h3>
        <table class="table">
          <tr>
            <td>إجمالي المبيعات</td>
            <td class="font-bold">${data.totalSales.toFixed(2)} ر.س</td>
          </tr>
          <tr>
            <td>عدد الفواتير</td>
            <td class="font-bold">${data.totalInvoices}</td>
          </tr>
          <tr>
            <td>المرتجعات</td>
            <td>${data.totalReturns.toFixed(2)} ر.س</td>
          </tr>
          <tr>
            <td>المصروفات</td>
            <td>${data.totalExpenses.toFixed(2)} ر.س</td>
          </tr>
          <tr class="total-row">
            <td>صافي الربح</td>
            <td>${data.netProfit.toFixed(2)} ر.س</td>
          </tr>
        </table>
      </div>

      ${data.topProducts.length > 0 ? `
      <h3 class="mt-4">🏆 أكثر المنتجات مبيعاً</h3>
      <table class="table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          ${data.topProducts.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.quantity}</td>
              <td>${p.revenue.toFixed(2)} ر.س</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${data.paymentMethods.length > 0 ? `
      <h3 class="mt-4">💳 طرق الدفع</h3>
      <table class="table">
        <thead>
          <tr>
            <th>الطريقة</th>
            <th>المبلغ</th>
            <th>العدد</th>
          </tr>
        </thead>
        <tbody>
          ${data.paymentMethods.map(m => `
            <tr>
              <td>${m.method}</td>
              <td>${m.amount.toFixed(2)} ر.س</td>
              <td>${m.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
    `;

    const html = this.getBaseTemplate(content, `التقرير اليومي - ${data.date}`);
    
    return this.send({
      to: email,
      subject: `التقرير اليومي - ${data.date}`,
      subjectAr: `التقرير اليومي - ${data.date}`,
      html,
    });
  }

  /**
   * إرسال تنبيه المخزون
   */
  static async sendStockAlert(email: string, data: StockAlertData): Promise<{ success: boolean }> {
    const content = `
      <h2 class="mb-4">⚠️ تنبيه المخزون</h2>
      <p class="mb-4">فرع: ${data.branchName}</p>
      
      <div class="alert alert-warning">
        <p>المنتجات التالية تحتاج إلى إعادة طلب:</p>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الباركود</th>
            <th>المخزون الحالي</th>
            <th>الحد الأدنى</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${data.products.map(p => `
            <tr>
              <td>${p.nameAr || p.name}</td>
              <td>${p.barcode}</td>
              <td>${p.currentStock}</td>
              <td>${p.minStock}</td>
              <td>${p.currentStock === 0 ? '🔴 نفذ' : '🟡 منخفض'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p class="mt-4 text-center">
        <a href="#" class="btn">إدارة المخزون</a>
      </p>
    `;

    const html = this.getBaseTemplate(content, 'تنبيه المخزون');
    
    return this.send({
      to: email,
      subject: '⚠️ تنبيه المخزون',
      subjectAr: 'تنبيه المخزون',
      html,
    });
  }

  /**
   * إرسال فاتورة للعميل
   */
  static async sendInvoiceEmail(email: string, data: InvoiceEmailData): Promise<{ success: boolean }> {
    const content = `
      <h2 class="mb-4">🧾 فاتورة رقم ${data.invoiceNumber}</h2>
      <p class="mb-4">التاريخ: ${data.date}</p>
      <p class="mb-4">العميل: ${data.customerName}</p>
      <p class="mb-4">الفرع: ${data.branchName}</p>
      
      <table class="table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toFixed(2)} ر.س</td>
              <td>${item.total.toFixed(2)} ر.س</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <table class="table">
        <tr>
          <td>المجموع الفرعي</td>
          <td>${data.subtotal.toFixed(2)} ر.س</td>
        </tr>
        ${data.discount > 0 ? `
        <tr>
          <td>الخصم</td>
          <td>-${data.discount.toFixed(2)} ر.س</td>
        </tr>
        ` : ''}
        ${data.tax > 0 ? `
        <tr>
          <td>الضريبة (15%)</td>
          <td>${data.tax.toFixed(2)} ر.س</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td>الإجمالي</td>
          <td>${data.total.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>المدفوع</td>
          <td>${data.paid.toFixed(2)} ر.س</td>
        </tr>
        ${data.change > 0 ? `
        <tr>
          <td>الباقي</td>
          <td>${data.change.toFixed(2)} ر.س</td>
        </tr>
        ` : ''}
      </table>
      
      <div class="alert alert-success mt-4">
        <p class="text-center">✅ طريقة الدفع: ${data.paymentMethod}</p>
      </div>
      
      <p class="text-center mt-4">
        شكراً لتعاملكم معنا!
      </p>
      
      ${data.branchAddress ? `<p class="text-center">${data.branchAddress}</p>` : ''}
      ${data.branchPhone ? `<p class="text-center">📞 ${data.branchPhone}</p>` : ''}
    `;

    const html = this.getBaseTemplate(content, `فاتورة رقم ${data.invoiceNumber}`);
    
    return this.send({
      to: email,
      subject: `فاتورة رقم ${data.invoiceNumber}`,
      subjectAr: `فاتورة رقم ${data.invoiceNumber}`,
      html,
    });
  }

  /**
   * إرسال تقرير Z (إغلاق الوردية)
   */
  static async sendZReport(email: string, data: {
    shiftNumber: string;
    date: string;
    branchName: string;
    userName: string;
    openingCash: number;
    cashSales: number;
    cardSales: number;
    otherPayments: number;
    totalSales: number;
    totalReturns: number;
    totalExpenses: number;
    expectedCash: number;
    actualCash: number;
    difference: number;
    totalInvoices: number;
  }): Promise<{ success: boolean }> {
    const content = `
      <h2 class="mb-4">📋 تقرير Z - ${data.shiftNumber}</h2>
      <p class="mb-4">التاريخ: ${data.date}</p>
      <p class="mb-4">الفرع: ${data.branchName}</p>
      <p class="mb-4">الموظف: ${data.userName}</p>
      
      <table class="table">
        <tr>
          <td>النقدية الافتتاحية</td>
          <td>${data.openingCash.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>مبيعات نقدية</td>
          <td>${data.cashSales.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>مبيعات بطاقة</td>
          <td>${data.cardSales.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>طرق دفع أخرى</td>
          <td>${data.otherPayments.toFixed(2)} ر.س</td>
        </tr>
        <tr class="total-row">
          <td>إجمالي المبيعات</td>
          <td>${data.totalSales.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>المرتجعات</td>
          <td>-${data.totalReturns.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>المصروفات</td>
          <td>-${data.totalExpenses.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>النقدية المتوقعة</td>
          <td>${data.expectedCash.toFixed(2)} ر.س</td>
        </tr>
        <tr>
          <td>النقدية الفعلية</td>
          <td>${data.actualCash.toFixed(2)} ر.س</td>
        </tr>
        <tr class="${Math.abs(data.difference) > 0 ? 'alert-danger' : 'alert-success'}">
          <td>الفرق</td>
          <td>${data.difference.toFixed(2)} ر.س</td>
        </tr>
      </table>
      
      <div class="alert alert-info mt-4">
        <p class="text-center">عدد الفواتير: ${data.totalInvoices}</p>
      </div>
    `;

    const html = this.getBaseTemplate(content, `تقرير Z - ${data.shiftNumber}`);
    
    return this.send({
      to: email,
      subject: `تقرير Z - ${data.shiftNumber}`,
      subjectAr: `تقرير Z - ${data.shiftNumber}`,
      html,
    });
  }

  /**
   * إرسال إشعار مخصص
   */
  static async sendCustomNotification(
    email: string | string[],
    title: string,
    titleAr: string,
    message: string,
    messageAr: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<{ success: boolean }> {
    const content = `
      <h2 class="mb-4">${titleAr}</h2>
      <p class="mb-4">${messageAr}</p>
      
      ${actionUrl && actionText ? `
      <p class="text-center mt-4">
        <a href="${actionUrl}" class="btn">${actionText}</a>
      </p>
      ` : ''}
    `;

    const html = this.getBaseTemplate(content, titleAr);
    
    return this.send({
      to: email,
      subject: title,
      subjectAr: titleAr,
      html,
    });
  }
}

export default EmailService;
