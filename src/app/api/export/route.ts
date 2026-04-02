import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, type, filters, columns, data } = body;

    // Validate required fields
    if (!format || !type) {
      return NextResponse.json({ error: 'التنسيق والنوع مطلوبان' }, { status: 400 });
    }

    let exportData: any[] = [];

    // Fetch data based on type
    if (type === 'sales') {
      const where: any = { status: 'COMPLETED' };
      if (filters?.startDate) where.createdAt = { gte: new Date(filters.startDate) };
      if (filters?.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
      if (filters?.branchId) where.branchId = filters.branchId;

      const invoices = await db.invoice.findMany({
        where,
        include: {
          items: true,
          payments: { include: { paymentMethod: true } },
          branch: true,
          user: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      exportData = invoices.map(inv => ({
        'رقم الفاتورة': inv.invoiceNumber,
        'التاريخ': new Date(inv.createdAt).toLocaleDateString('ar-SA'),
        'الوقت': new Date(inv.createdAt).toLocaleTimeString('ar-SA'),
        'الفرع': inv.branch?.name || '-',
        'الكاشير': inv.user?.name || '-',
        'العميل': inv.customer?.name || 'عميل نقدي',
        'المجموع الفرعي': inv.subtotal,
        'الخصم': inv.discountAmount,
        'الضريبة': inv.taxAmount,
        'الإجمالي': inv.totalAmount,
        'الحالة': inv.isReturn ? 'مرتجع' : 'بيع',
      }));
    } 
    else if (type === 'products') {
      const products = await db.product.findMany({
        include: {
          category: true,
          brand: true,
          inventory: true,
        },
      });

      exportData = products.map(p => ({
        'الباركود': p.barcode,
        'اسم المنتج': p.name,
        'الفئة': p.category?.name || '-',
        'البراند': p.brand?.name || '-',
        'سعر التكلفة': p.costPrice,
        'سعر البيع': p.sellingPrice,
        'المخزون': p.inventory.reduce((sum, i) => sum + i.quantity, 0),
        'الحالة': p.isActive ? 'نشط' : 'غير نشط',
      }));
    }
    else if (type === 'shifts') {
      const shiftWhere: any = { status: 'CLOSED' };
      if (filters?.branchId) shiftWhere.branchId = filters.branchId;

      const shifts = await db.shift.findMany({
        where: shiftWhere,
        include: {
          user: true,
          branch: true,
          invoices: true,
        },
        orderBy: { startTime: 'desc' },
      });

      exportData = shifts.map(s => ({
        'رقم الوردية': s.id.slice(-6),
        'الكاشير': s.user?.name || '-',
        'الفرع': s.branch?.name || '-',
        'وقت البدء': new Date(s.startTime).toLocaleString('ar-SA'),
        'وقت الإغلاق': s.endTime ? new Date(s.endTime).toLocaleString('ar-SA') : '-',
        'المبيعات': s.totalSales,
        'المرتجعات': s.totalReturns,
        'المصروفات': s.totalExpenses,
        'عدد الفواتير': s.invoices.length,
      }));
    }
    else if (type === 'customers') {
      const customers = await db.customer.findMany({
        include: {
          invoices: true,
        },
      });

      exportData = customers.map(c => ({
        'الاسم': c.name,
        'الهاتف': c.phone || '-',
        'البريد': c.email || '-',
        'عدد الفواتير': c.invoices.length,
        'إجمالي المشتريات': c.invoices.reduce((sum, i) => sum + i.totalAmount, 0),
        'الحالة': c.isActive ? 'نشط' : 'غير نشط',
      }));
    }
    else if (type === 'expenses') {
      const expenseWhere: any = {};
      if (filters?.branchId) expenseWhere.branchId = filters.branchId;
      if (filters?.startDate) expenseWhere.date = { gte: new Date(filters.startDate) };
      if (filters?.endDate) expenseWhere.date = { ...expenseWhere.date, lte: new Date(filters.endDate) };

      const expenses = await db.expense.findMany({
        where: expenseWhere,
        include: {
          category: true,
          branch: true,
        },
        orderBy: { date: 'desc' },
      });

      exportData = expenses.map(e => ({
        'التاريخ': new Date(e.date).toLocaleDateString('ar-SA'),
        'الفرع': e.branch?.name || '-',
        'الفئة': e.category?.name || '-',
        'المبلغ': e.amount,
        'الوصف': e.description || '-',
      }));
    }
    else if (type === 'custom' && data) {
      exportData = data;
    }

    if (format === 'csv') {
      // Generate CSV
      if (exportData.length === 0) {
        return NextResponse.json({ error: 'لا توجد بيانات للتصدير' }, { status: 400 });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(','), // Header row
        ...exportData.map(row => 
          headers.map(h => {
            const value = row[h];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ];

      const csvString = csvRows.join('\n');
      // Add BOM for Arabic support
      const bom = '\uFEFF';
      
      return new NextResponse(bom + csvString, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_export_${Date.now()}.csv"`,
        },
      });
    }
    else if (format === 'json') {
      return NextResponse.json(exportData);
    }
    else if (format === 'excel') {
      // For Excel, we'll return CSV with xlsx extension
      // In a real app, you'd use a library like xlsx
      if (exportData.length === 0) {
        return NextResponse.json({ error: 'لا توجد بيانات للتصدير' }, { status: 400 });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join('\t'), // Tab-separated for Excel
        ...exportData.map(row => 
          headers.map(h => {
            const value = row[h];
            if (typeof value === 'string' && (value.includes('\t') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join('\t')
        )
      ];

      const csvString = csvRows.join('\n');
      const bom = '\uFEFF';
      
      return new NextResponse(bom + csvString, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_export_${Date.now()}.xls"`,
        },
      });
    }

    return NextResponse.json({ error: 'تنسيق غير مدعوم' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التصدير' }, { status: 500 });
  }
}
