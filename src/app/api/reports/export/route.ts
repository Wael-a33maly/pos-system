import { NextRequest, NextResponse } from 'next/server';
import { 
  getSalesReportAdvanced, 
  getInventoryReport, 
  getCustomersReport,
  getProductsReportAdvanced,
  getDateRange,
  ReportFilters,
} from '@/lib/reports';
import { exporters, ExportColumn, ExportData, ExportFormat } from '@/lib/export';

// ==================== API التصدير ====================
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('reportType') || 'sales';
    const format = (searchParams.get('format') || 'csv') as ExportFormat;
    const period = searchParams.get('period') || 'today';
    const branchIds = searchParams.get('branchIds')?.split(',').filter(Boolean);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const { startDate, endDate } = getDateRange(period, startDateParam || undefined, endDateParam || undefined);

    const filters: ReportFilters = {
      startDate,
      endDate,
      branchIds,
    };

    // جلب البيانات حسب نوع التقرير
    let reportData: any;
    let columns: ExportColumn[];
    let title: string;
    let subtitle: string;

    switch (reportType) {
      case 'sales':
        reportData = await getSalesReportAdvanced(filters);
        columns = [
          { key: 'invoiceNumber', label: 'رقم الفاتورة', width: 20 },
          { key: 'total', label: 'الإجمالي', format: 'currency', width: 15 },
          { key: 'customer', label: 'العميل', width: 20 },
          { key: 'cashier', label: 'الكاشير', width: 15 },
          { key: 'branch', label: 'الفرع', width: 15 },
          { key: 'createdAt', label: 'التاريخ', format: 'date', width: 15 },
        ];
        title = 'تقرير المبيعات';
        subtitle = `من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}`;
        break;

      case 'inventory':
        reportData = await getInventoryReport({ ...filters, startDate, endDate });
        columns = [
          { key: 'barcode', label: 'الباركود', width: 15 },
          { key: 'productName', label: 'المنتج', width: 30 },
          { key: 'category', label: 'الفئة', width: 15 },
          { key: 'quantity', label: 'الكمية', format: 'number', width: 10 },
          { key: 'costPrice', label: 'سعر التكلفة', format: 'currency', width: 12 },
          { key: 'sellingPrice', label: 'سعر البيع', format: 'currency', width: 12 },
          { key: 'value', label: 'القيمة', format: 'currency', width: 15 },
          { key: 'status', label: 'الحالة', width: 12 },
        ];
        title = 'تقرير المخزون';
        subtitle = `تاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
        break;

      case 'customers':
        reportData = await getCustomersReport(filters);
        columns = [
          { key: 'customerName', label: 'العميل', width: 25 },
          { key: 'phone', label: 'الهاتف', width: 15 },
          { key: 'totalPurchases', label: 'إجمالي المشتريات', format: 'currency', width: 15 },
          { key: 'invoiceCount', label: 'عدد الفواتير', format: 'number', width: 12 },
          { key: 'avgPurchase', label: 'متوسط المشتريات', format: 'currency', width: 15 },
          { key: 'lastPurchase', label: 'آخر شراء', format: 'date', width: 15 },
        ];
        title = 'تقرير العملاء';
        subtitle = `من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}`;
        break;

      case 'products':
        reportData = await getProductsReportAdvanced({ ...filters, sortBy: 'sales', limit: 100 });
        columns = [
          { key: 'productBarcode', label: 'الباركود', width: 15 },
          { key: 'productName', label: 'المنتج', width: 30 },
          { key: 'category', label: 'الفئة', width: 15 },
          { key: 'quantity', label: 'الكمية', format: 'number', width: 10 },
          { key: 'sales', label: 'المبيعات', format: 'currency', width: 15 },
          { key: 'profit', label: 'الربح', format: 'currency', width: 15 },
          { key: 'profitMargin', label: 'هامش الربح', format: 'percent', width: 12 },
        ];
        title = 'تقرير المنتجات';
        subtitle = `من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}`;
        break;

      default:
        return NextResponse.json({ error: 'نوع التقرير غير معروف' }, { status: 400 });
    }

    if (!reportData.success) {
      return NextResponse.json({ error: reportData.error || 'فشل في جلب البيانات' }, { status: 500 });
    }

    // تحضير بيانات التصدير
    let rows: any[];
    
    switch (reportType) {
      case 'sales':
        rows = reportData.data.recentInvoices || [];
        break;
      case 'inventory':
        rows = reportData.data.products || [];
        break;
      case 'customers':
        rows = reportData.data.customers || [];
        break;
      case 'products':
        rows = reportData.data.products || [];
        break;
      default:
        rows = [];
    }

    const exportData: ExportData = {
      columns,
      rows,
      title,
      subtitle,
      metadata: {
        'تاريخ التصدير': new Date().toLocaleDateString('ar-SA'),
        'وقت التصدير': new Date().toLocaleTimeString('ar-SA'),
        'عدد السجلات': rows.length.toString(),
      },
    };

    // توليد الملف
    const exporter = exporters[format];
    if (!exporter) {
      return NextResponse.json({ error: 'صيغة التصدير غير مدعومة' }, { status: 400 });
    }

    const { content, mimeType, extension } = exporter(exportData);
    const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.${extension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء التصدير',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
